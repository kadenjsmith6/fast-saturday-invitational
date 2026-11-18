import type { MatchState } from "./match";
import type { Match, Player, Side } from "./types";

export interface Standing {
  id: string;
  points: number;
  projected: number;
  wins: number;
  losses: number;
  halves: number;
}

const blank = (id: string): Standing => ({ id, points: 0, projected: 0, wins: 0, losses: 0, halves: 0 });

function tally(
  table: Map<string, Standing>,
  id: string,
  side: Side,
  share: number,
  state: MatchState,
) {
  const row = table.get(id) ?? blank(id);
  row.points += state.points[side] * share;
  row.projected += (state.final ? state.points[side] : state.projected[side]) * share;
  if (state.final) {
    if (state.result === "halved") row.halves++;
    else if (state.result === side) row.wins++;
    else row.losses++;
  }
  table.set(id, row);
}

/** Team points across any number of teams. Sorted by points, then projected. */
export function teamStandings(
  teamIds: string[],
  matches: { match: Match; state: MatchState }[],
): Standing[] {
  const table = new Map(teamIds.map((id) => [id, blank(id)]));
  for (const { match, state } of matches) {
    for (const side of ["A", "B"] as Side[]) tally(table, match.sides[side].teamId, side, 1, state);
  }
  return [...table.values()].sort((a, b) => b.points - a.points || b.projected - a.projected);
}

/**
 * Individual points: a side's points are split evenly among its players
 * (2v2 win worth 2 = 1 each; a halve = 0.5 each), same as the league.
 */
export function individualStandings(matches: { match: Match; state: MatchState }[]): Standing[] {
  const table = new Map<string, Standing>();
  for (const { match, state } of matches) {
    for (const side of ["A", "B"] as Side[]) {
      const ids = match.sides[side].playerIds;
      for (const id of ids) tally(table, id, side, 1 / ids.length, state);
    }
  }
  return [...table.values()].sort((a, b) => b.points - a.points || b.projected - a.projected);
}

export interface StrokePlayRow {
  playerId: string;
  gross: number;
  net: number;
  thru: number;
  position: number;
  points: number;
}

/**
 * Individual net stroke play with placement points.
 * Ties share the average of the points for the places they cover.
 * Only players who finished all 18 holes earn points.
 */
export function strokePlayLeaderboard(
  players: Player[],
  courseId: string,
  scores: Record<string, Record<number, number>>,
  placementPoints: number[],
): StrokePlayRow[] {
  const rows = players.map((p) => {
    const card = scores[p.id] ?? {};
    const entered = Object.values(card).filter((v) => typeof v === "number");
    const gross = entered.reduce((s, v) => s + v, 0);
    const ch = p.courseHandicaps[courseId] ?? 0;
    const thru = entered.length;
    // Net prorates the handicap over holes played so the live board is fair mid-round.
    const net = gross - (ch * thru) / 18;
    return { playerId: p.id, gross, net, thru, position: 0, points: 0 };
  });
  rows.sort((a, b) => (b.thru > 0 ? 1 : 0) - (a.thru > 0 ? 1 : 0) || a.net - b.net);

  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].net === rows[i].net && rows[j + 1].thru > 0) j++;
    const finished = rows.slice(i, j + 1).every((r) => r.thru === 18);
    const pts = placementPoints.slice(i, j + 1);
    const avg = pts.length ? pts.reduce((s, v) => s + v, 0) / (j - i + 1) : 0;
    for (let k = i; k <= j; k++) {
      rows[k].position = i + 1;
      rows[k].points = finished ? avg : 0;
    }
    i = j + 1;
  }
  return rows;
}
