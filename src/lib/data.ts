"use client";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, ensureSignedIn } from "./firebase";
import {
  DEFAULT_RULES,
  type Course,
  type HandicapRules,
  type HoleOutcome,
  type Match,
  type MatchResults,
  type Player,
  type Team,
} from "./scoring";

export interface Round {
  id: string;
  name: string; // e.g. "Round 1"
  date?: string; // yyyy-mm-dd
  courseId: string;
  order: number;
}

export interface StoredMatch extends Match {
  results: MatchResults;
  order: number;
}

export interface EventSettings {
  rules: HandicapRules;
}

/** Live connection state for a collection or doc. */
export interface Live<T> {
  data: T;
  loading: boolean;
  error: string | null;
  /** True while this phone has changes the server hasn't confirmed yet (e.g. no signal). */
  pending: boolean;
}

function useLiveCollection<T extends { id: string }>(name: string): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: true, error: null, pending: false });
  useEffect(
    () =>
      onSnapshot(
        collection(db, name),
        { includeMetadataChanges: true },
        (snap) =>
          setState({
            data: snap.docs.map((d) => ({ ...(d.data() as Omit<T, "id">), id: d.id }) as T),
            loading: false,
            error: null,
            pending: snap.metadata.hasPendingWrites,
          }),
        // Never replace good data with nothing on an error: keep what we have and say so.
        (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
      ),
    [name],
  );
  return state;
}

export const useTeams = () => useLiveCollection<Team>("teams");
export const usePlayers = () => useLiveCollection<Player>("players");
export const useCourses = () => useLiveCollection<Course>("courses");
export const useRounds = () => useLiveCollection<Round>("rounds");
export const useMatches = () => useLiveCollection<StoredMatch>("matches");

export function useSettings(): Live<EventSettings> {
  const [state, setState] = useState<Live<EventSettings>>({
    data: { rules: DEFAULT_RULES },
    loading: true,
    error: null,
    pending: false,
  });
  useEffect(
    () =>
      onSnapshot(
        doc(db, "config", "event"),
        (snap) =>
          setState({
            data: { rules: { ...DEFAULT_RULES, ...(snap.data()?.rules ?? {}) } },
            loading: false,
            error: null,
            pending: snap.metadata.hasPendingWrites,
          }),
        (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
      ),
    [],
  );
  return state;
}

/** Everything the leaderboard and score pages need, in one hook. */
export function useEventData() {
  const teams = useTeams();
  const players = usePlayers();
  const courses = useCourses();
  const rounds = useRounds();
  const matches = useMatches();
  const settings = useSettings();
  const all = [teams, players, courses, rounds, matches, settings];
  return {
    teams: teams.data,
    players: players.data,
    playersById: Object.fromEntries(players.data.map((p) => [p.id, p])) as Record<string, Player>,
    teamsById: Object.fromEntries(teams.data.map((t) => [t.id, t])) as Record<string, Team>,
    courses: courses.data,
    coursesById: Object.fromEntries(courses.data.map((c) => [c.id, c])) as Record<string, Course>,
    rounds: [...rounds.data].sort((a, b) => a.order - b.order),
    matches: [...matches.data].sort((a, b) => a.order - b.order),
    rules: settings.data.rules,
    loading: all.some((x) => x.loading),
    error: all.find((x) => x.error)?.error ?? null,
    pending: matches.pending,
  };
}

export const newId = () => Math.random().toString(36).slice(2, 10);

const strip = <T extends { id: string }>(x: T) => {
  const { id, ...rest } = x;
  return { id, rest: JSON.parse(JSON.stringify(rest)) };
};

/** Create or replace a record. */
export async function save<T extends { id: string }>(
  name: "teams" | "players" | "courses" | "rounds" | "matches",
  item: T,
) {
  await ensureSignedIn();
  const { id, rest } = strip(item);
  await setDoc(doc(db, name, id), rest);
}

export async function remove(name: "teams" | "players" | "courses" | "rounds" | "matches", id: string) {
  await ensureSignedIn();
  await deleteDoc(doc(db, name, id));
}

export async function saveRules(rules: HandicapRules) {
  await ensureSignedIn();
  await setDoc(doc(db, "config", "event"), { rules }, { merge: true });
}

/**
 * Record one hole. Only that hole's field is touched, so two phones
 * posting different holes can never overwrite each other.
 * Pass null to clear the hole.
 */
export async function setHoleResult(matchId: string, hole: number, outcome: HoleOutcome | null) {
  await ensureSignedIn();
  // Don't await the server: with the offline cache the write lands on the phone
  // immediately and syncs when there is signal. The page shows "waiting to sync" until then.
  void updateDoc(doc(db, "matches", matchId), {
    [`results.${hole}`]: outcome ?? deleteField(),
  });
}

/** Write many records at once (used by the test data loader). */
export async function saveMany(
  items: { name: "teams" | "players" | "courses" | "rounds" | "matches"; item: { id: string } }[],
) {
  await ensureSignedIn();
  const batch = writeBatch(db);
  for (const { name, item } of items) {
    const { id, rest } = strip(item);
    batch.set(doc(db, name, id), rest);
  }
  await batch.commit();
}

export async function removeMany(items: { name: string; id: string }[]) {
  await ensureSignedIn();
  const batch = writeBatch(db);
  for (const { name, id } of items) batch.delete(doc(db, name, id));
  await batch.commit();
}
