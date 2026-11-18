"use client";

import { useMemo, useState } from "react";
import { Button, Card, Field, Input, Select, strokeLabel } from "@/components/ui";
import { newId, remove, removeMany, save, saveMany, saveRules, useEventData, type Round, type StoredMatch } from "@/lib/data";
import {
  computeMatch,
  DEFAULT_RULES,
  FORMAT_LABELS,
  isTeamFormat,
  matchStrokes,
  type Course,
  type HandicapRules,
  type Match,
  type MatchFormat,
  type Player,
  type Segment,
  type Side,
  type Team,
} from "@/lib/scoring";
import { buildTestData } from "./testData";

type Data = ReturnType<typeof useEventData>;

const SEGMENT_LABELS: Record<Segment, string> = { front: "Front 9", back: "Back 9", full: "18 holes" };

function useBusy() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg(ok);
    } catch (e) {
      setMsg(`Didn't save: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return { busy, msg, run };
}

const Msg = ({ msg }: { msg: string | null }) =>
  msg ? <p className={`text-sm ${msg.startsWith("Didn't") ? "text-loss" : "text-win"}`}>{msg}</p> : null;

// ───────────────────────────── Matches ─────────────────────────────

export function MatchesSection({ data }: { data: Data }) {
  const { rounds, matches, teams, playersById, teamsById, coursesById, rules } = data;
  const { busy, msg, run } = useBusy();

  return (
    <div className="space-y-4">
      <NewMatchForm data={data} />
      {rounds.length === 0 && <p className="text-sm text-muted">Add a round first (Rounds tab).</p>}
      {rounds.map((r) => {
        const list = matches.filter((m) => m.roundId === r.id);
        const course = coursesById[r.courseId];
        return (
          <Card key={r.id}>
            <h3 className="font-display text-lg font-bold">
              {r.name} <span className="text-sm font-sans font-normal text-muted">· {course?.name ?? "No course"}</span>
            </h3>
            {list.length === 0 && <p className="text-sm text-muted mt-1">No matches yet.</p>}
            <ul className="divide-y divide-line mt-2">
              {list.map((m) => {
                const state = course ? computeMatch(m, course, playersById, rules, m.results ?? {}) : null;
                const names = (s: Side) => m.sides[s].playerIds.map((id) => playersById[id]?.name ?? "?").join(" & ");
                return (
                  <li key={m.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {names("A")} <span className="text-muted">vs</span> {names("B")}
                      </div>
                      <div className="text-muted">
                        {FORMAT_LABELS[m.format]} · {SEGMENT_LABELS[m.segment]} · {m.points} pt
                        {m.points === 1 ? "" : "s"} · {teamsById[m.sides.A.teamId]?.name} v{" "}
                        {teamsById[m.sides.B.teamId]?.name} · {state?.label}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          if (confirm("Clear every hole result in this match?"))
                            run(() => save("matches", { ...m, results: {} }), "Results cleared.");
                        }}
                      >
                        Clear results
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (confirm("Delete this match?")) run(() => remove("matches", m.id), "Match deleted.");
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
      <Msg msg={msg} />
      {teams.length === 0 && <p className="text-sm text-muted">Tip: Settings → Load test data to try it out.</p>}
    </div>
  );
}

function NewMatchForm({ data }: { data: Data }) {
  const { rounds, teams, players, playersById, coursesById, rules } = data;
  const [roundId, setRoundId] = useState("");
  const [format, setFormat] = useState<MatchFormat>("bestBall");
  const [segment, setSegment] = useState<Segment>("front");
  const [points, setPoints] = useState(2);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [pa, setPa] = useState<string[]>(["", ""]);
  const [pb, setPb] = useState<string[]>(["", ""]);
  const { busy, msg, run } = useBusy();

  const round = rounds.find((r) => r.id === (roundId || rounds[0]?.id));
  const perSide = format === "singles" ? 1 : 2;
  const sideA = pa.slice(0, perSide);
  const sideB = pb.slice(0, perSide);
  const chosen = [...sideA, ...sideB];
  const complete =
    !!round && !!teamA && !!teamB && teamA !== teamB && chosen.every(Boolean) && new Set(chosen).size === chosen.length;

  const draft: Match | null = complete
    ? {
        id: "draft",
        roundId: round!.id,
        courseId: round!.courseId,
        format,
        segment,
        points,
        sides: { A: { teamId: teamA, playerIds: sideA }, B: { teamId: teamB, playerIds: sideB } },
      }
    : null;
  const preview = draft ? matchStrokes(draft, playersById, rules) : null;

  const pickFormat = (f: MatchFormat) => {
    setFormat(f);
    setPoints(f === "singles" ? 1 : 2);
  };

  const roster = (teamId: string) => players.filter((p) => p.teamId === teamId).sort((a, b) => a.name.localeCompare(b.name));

  const sidePicker = (
    label: string,
    team: string,
    setTeam: (v: string) => void,
    picks: string[],
    setPicks: (v: string[]) => void,
  ) => (
    <div className="space-y-2">
      <Field label={label}>
        <Select
          value={team}
          onChange={(e) => {
            setTeam(e.target.value);
            setPicks(["", ""]);
          }}
        >
          <option value="">Pick a team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      {Array.from({ length: perSide }).map((_, i) => (
        <Select
          key={i}
          value={picks[i]}
          disabled={!team}
          onChange={(e) => {
            const next = [...picks];
            next[i] = e.target.value;
            setPicks(next);
          }}
        >
          <option value="">Player {i + 1}…</option>
          {roster(team).map((p) => (
            <option key={p.id} value={p.id} disabled={chosen.includes(p.id) && picks[i] !== p.id}>
              {p.name}
              {round && p.courseHandicaps?.[round.courseId] !== undefined
                ? ` (${p.courseHandicaps[round.courseId]})`
                : " (no course hcp)"}
            </option>
          ))}
        </Select>
      ))}
    </div>
  );

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-xl font-bold">New match</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Round">
          <Select value={round?.id ?? ""} onChange={(e) => setRoundId(e.target.value)}>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Format">
          <Select value={format} onChange={(e) => pickFormat(e.target.value as MatchFormat)}>
            {(Object.keys(FORMAT_LABELS) as MatchFormat[]).map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Holes">
          <Select value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
            {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Points">
          <Input type="number" step="0.5" min="0" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {sidePicker("Side A", teamA, setTeamA, pa, setPa)}
        {sidePicker("Side B", teamB, setTeamB, pb, setPb)}
      </div>
      {teamA && teamA === teamB && <p className="text-sm text-loss">Pick two different teams.</p>}

      {preview && (
        <div className="rounded-lg bg-sand-2/60 p-3 text-sm">
          <div className="font-semibold mb-1">Strokes ({SEGMENT_LABELS[segment]})</div>
          {isTeamFormat(format) ? (
            <div className="flex gap-6">
              {(["A", "B"] as Side[]).map((s) => (
                <span key={s}>
                  {(s === "A" ? sideA : sideB).map((id) => playersById[id]?.name).join(" & ")}:{" "}
                  <b>{strokeLabel(preview.strokes[s])}</b>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {chosen.map((id) => (
                <span key={id}>
                  {playersById[id]?.name}: <b>{strokeLabel(preview.strokes[id])}</b>
                </span>
              ))}
            </div>
          )}
          {preview.missing.length > 0 && (
            <p className="text-loss mt-1">
              No course handicap for {preview.missing.map((id) => playersById[id]?.name).join(", ")} at{" "}
              {coursesById[round!.courseId]?.name}. They&apos;re counted as 0 until you add one (Players tab).
            </p>
          )}
        </div>
      )}

      <Button
        disabled={!complete || busy}
        onClick={() =>
          run(async () => {
            await save("matches", { ...draft!, id: newId(), results: {}, order: Date.now() } as StoredMatch);
            setPa(["", ""]);
            setPb(["", ""]);
          }, "Match added — it's live on Enter Scores and the leaderboard.")
        }
      >
        Add match
      </Button>
      <Msg msg={msg} />
    </Card>
  );
}

// ───────────────────────────── Players ─────────────────────────────

export function PlayersSection({ data }: { data: Data }) {
  const { players, teams, courses } = data;
  const sorted = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name)), [players]);
  return (
    <div className="space-y-3">
      <PlayerEditor key="new" teams={teams} courses={courses} />
      {sorted.map((p) => (
        <PlayerEditor key={p.id} player={p} teams={teams} courses={courses} />
      ))}
    </div>
  );
}

function PlayerEditor({ player, teams, courses }: { player?: Player; teams: Team[]; courses: Course[] }) {
  const blank: Player = { id: "", name: "", teamId: "", courseHandicaps: {} };
  const [p, setP] = useState<Player>(player ?? blank);
  const { busy, msg, run } = useBusy();
  const isNew = !player;
  const dirty = JSON.stringify(p) !== JSON.stringify(player ?? blank);

  return (
    <Card className="space-y-3">
      {isNew && <h2 className="font-display text-xl font-bold">Add player</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Name">
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </Field>
        <Field label="Team">
          <Select value={p.teamId ?? ""} onChange={(e) => setP({ ...p, teamId: e.target.value })}>
            <option value="">No team yet</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Index (reference)">
          <Input
            type="number"
            step="0.1"
            value={p.index ?? ""}
            onChange={(e) => setP({ ...p, index: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </Field>
      </div>
      {courses.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Course handicap</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {courses.map((c) => (
              <Field key={c.id} label={c.name}>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={p.courseHandicaps?.[c.id] ?? ""}
                  onChange={(e) => {
                    const next = { ...p.courseHandicaps };
                    if (e.target.value === "") delete next[c.id];
                    else next[c.id] = Number(e.target.value);
                    setP({ ...p, courseHandicaps: next });
                  }}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          disabled={!p.name.trim() || !dirty || busy}
          onClick={() =>
            run(
              async () => {
                await save("players", { ...p, name: p.name.trim(), id: p.id || newId() });
                if (isNew) setP(blank);
              },
              isNew ? "Player added." : "Saved.",
            )
          }
        >
          {isNew ? "Add player" : "Save"}
        </Button>
        {!isNew && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (confirm(`Remove ${player.name}?`)) run(() => remove("players", player.id));
            }}
          >
            Remove
          </Button>
        )}
      </div>
      <Msg msg={msg} />
    </Card>
  );
}

// ───────────────────────────── Teams ─────────────────────────────

export function TeamsSection({ data }: { data: Data }) {
  const { teams, players } = data;
  const [name, setName] = useState("");
  const { busy, msg, run } = useBusy();
  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Teams</h2>
        <p className="text-sm text-muted">Add as many as you need — 2, 3, 4 or 6 all work the same.</p>
        <div className="flex gap-2">
          <Input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            disabled={!name.trim() || busy}
            onClick={() =>
              run(async () => {
                await save("teams", { id: newId(), name: name.trim() });
                setName("");
              })
            }
          >
            Add
          </Button>
        </div>
        <Msg msg={msg} />
      </Card>
      {teams.map((t) => (
        <TeamRow key={t.id} team={t} count={players.filter((p) => p.teamId === t.id).length} />
      ))}
    </div>
  );
}

function TeamRow({ team, count }: { team: Team; count: number }) {
  const [name, setName] = useState(team.name);
  const { busy, msg, run } = useBusy();
  return (
    <Card className="flex flex-wrap items-center gap-2">
      <Input className="flex-1 min-w-40" value={name} onChange={(e) => setName(e.target.value)} />
      <span className="text-sm text-muted">{count} players</span>
      <Button disabled={name === team.name || busy} onClick={() => run(() => save("teams", { ...team, name }), "Saved.")}>
        Save
      </Button>
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => {
          if (confirm(`Delete ${team.name}? Its players stay but lose their team.`)) run(() => remove("teams", team.id));
        }}
      >
        Delete
      </Button>
      <Msg msg={msg} />
    </Card>
  );
}

// ───────────────────────────── Rounds ─────────────────────────────

export function RoundsSection({ data }: { data: Data }) {
  const { rounds, courses } = data;
  const [r, setR] = useState<Omit<Round, "id" | "order">>({ name: "", date: "", courseId: "" });
  const { busy, msg, run } = useBusy();
  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Add round</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name">
            <Input placeholder="Round 1" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} />
          </Field>
          <Field label="Course">
            <Select value={r.courseId} onChange={(e) => setR({ ...r, courseId: e.target.value })}>
              <option value="">Pick a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button
          disabled={!r.name.trim() || !r.courseId || busy}
          onClick={() =>
            run(async () => {
              await save("rounds", { ...r, id: newId(), order: rounds.length + 1 });
              setR({ name: "", date: "", courseId: "" });
            }, "Round added.")
          }
        >
          Add round
        </Button>
        {courses.length === 0 && <p className="text-sm text-muted">Add a course first (Courses tab).</p>}
        <Msg msg={msg} />
      </Card>
      {rounds.map((round) => (
        <Card key={round.id} className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">{round.name}</div>
            <div className="text-sm text-muted">
              {round.date || "No date"} · {courses.find((c) => c.id === round.courseId)?.name ?? "No course"}
            </div>
          </div>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (confirm(`Delete ${round.name}? Its matches will be hidden.`)) run(() => remove("rounds", round.id));
            }}
          >
            Delete
          </Button>
        </Card>
      ))}
    </div>
  );
}

// ───────────────────────────── Courses ─────────────────────────────

const blankHoles = () => Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4, hcp: 0 }));

export function CoursesSection({ data }: { data: Data }) {
  return (
    <div className="space-y-3">
      <CourseEditor key="new" />
      {data.courses.map((c) => (
        <CourseEditor key={c.id} course={c} />
      ))}
    </div>
  );
}

function CourseEditor({ course }: { course?: Course }) {
  const [c, setC] = useState<Course>(course ?? { id: "", name: "", holes: blankHoles() });
  const [open, setOpen] = useState(!course);
  const { busy, msg, run } = useBusy();
  const hcps = c.holes.map((h) => h.hcp);
  const hcpOk = [...hcps].sort((a, b) => a - b).every((v, i) => v === i + 1);
  const isNew = !course;

  if (!open)
    return (
      <Card className="flex items-center justify-between">
        <div className="font-semibold">{c.name}</div>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </Card>
    );

  const setHole = (i: number, key: "par" | "hcp", v: string) => {
    const holes = c.holes.map((h, j) => (j === i ? { ...h, [key]: Number(v) } : h));
    setC({ ...c, holes });
  };

  return (
    <Card className="space-y-3">
      {isNew && <h2 className="font-display text-xl font-bold">Add course</h2>}
      <Field label="Course name">
        <Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
      </Field>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <tbody>
            {(["Hole", "Par", "Hcp"] as const).map((row) => (
              <tr key={row}>
                <th className="pr-2 text-left text-muted font-semibold">{row}</th>
                {c.holes.map((h, i) => (
                  <td key={h.number} className="p-0.5">
                    {row === "Hole" ? (
                      <div className="w-11 text-center font-semibold">{h.number}</div>
                    ) : (
                      <input
                        className="w-11 border border-line rounded px-1 py-1 text-center bg-white"
                        inputMode="numeric"
                        value={(row === "Par" ? h.par : h.hcp) || ""}
                        onChange={(e) => setHole(i, row === "Par" ? "par" : "hcp", e.target.value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hcpOk && <p className="text-sm text-muted">Hole handicaps need to use each number 1–18 once.</p>}
      <div className="flex gap-2">
        <Button
          disabled={!c.name.trim() || !hcpOk || busy}
          onClick={() =>
            run(
              async () => {
                await save("courses", { ...c, id: c.id || newId() });
                if (isNew) setC({ id: "", name: "", holes: blankHoles() });
                else setOpen(false);
              },
              isNew ? "Course added." : "Saved.",
            )
          }
        >
          {isNew ? "Add course" : "Save"}
        </Button>
        {!isNew && (
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (confirm(`Delete ${course.name}?`)) run(() => remove("courses", course.id));
              }}
            >
              Delete
            </Button>
          </>
        )}
      </div>
      <Msg msg={msg} />
    </Card>
  );
}

// ───────────────────────────── Settings ─────────────────────────────

export function SettingsSection({ data }: { data: Data }) {
  const [r, setR] = useState<HandicapRules>(data.rules);
  const { busy, msg, run } = useBusy();
  const pct = (v: number) => Math.round(v * 1000) / 10;
  const num = (label: string, value: number, set: (v: number) => void) => (
    <Field label={label}>
      <Input type="number" step="1" value={pct(value)} onChange={(e) => set(Number(e.target.value) / 100)} />
    </Field>
  );
  const testIds = buildTestData().map(({ name, item }) => ({ name, id: item.id }));
  const hasTest = data.players.some((p) => p.id.startsWith("test-"));

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <h2 className="font-display text-xl font-bold">Handicap allowances</h2>
        <p className="text-sm text-muted">Percentages of course handicap. Nine-hole matches automatically get half.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {num("1v1 match play %", r.singlesPct, (v) => setR({ ...r, singlesPct: v }))}
          {num("Best ball %", r.bestBallPct, (v) => setR({ ...r, bestBallPct: v }))}
          {num("Shamble %", r.shamblePct, (v) => setR({ ...r, shamblePct: v }))}
          {num("Scramble – lower %", r.scrambleWeights[0], (v) => setR({ ...r, scrambleWeights: [v, r.scrambleWeights[1]] }))}
          {num("Scramble – higher %", r.scrambleWeights[1], (v) => setR({ ...r, scrambleWeights: [r.scrambleWeights[0], v] }))}
          {num("Pinehurst – lower %", r.pinehurstWeights[0], (v) => setR({ ...r, pinehurstWeights: [v, r.pinehurstWeights[1]] }))}
          {num("Pinehurst – higher %", r.pinehurstWeights[1], (v) =>
            setR({ ...r, pinehurstWeights: [r.pinehurstWeights[0], v] }),
          )}
          <Field label="Half strokes">
            <Select value={r.rounding} onChange={(e) => setR({ ...r, rounding: e.target.value as HandicapRules["rounding"] })}>
              <option value="half">Allowed</option>
              <option value="whole">Round to whole strokes</option>
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => run(() => saveRules(r), "Saved.")}>
            Save
          </Button>
          <Button variant="ghost" onClick={() => setR(DEFAULT_RULES)}>
            Reset to defaults
          </Button>
        </div>
        <Msg msg={msg} />
      </Card>

      <Card className="space-y-2">
        <h2 className="font-display text-xl font-bold">Test data</h2>
        <p className="text-sm text-muted">
          Loads 3 made-up teams of 4, a test course, a round and a few matches so you can try entering scores. Clear
          it before the trip — it only removes the test records.
        </p>
        <div className="flex gap-2">
          <Button disabled={busy || hasTest} onClick={() => run(() => saveMany(buildTestData()), "Test data loaded.")}>
            Load test data
          </Button>
          <Button
            variant="danger"
            disabled={busy || !hasTest}
            onClick={() => {
              if (confirm("Remove all test data?")) run(() => removeMany(testIds), "Test data cleared.");
            }}
          >
            Clear test data
          </Button>
        </div>
      </Card>
    </div>
  );
}
