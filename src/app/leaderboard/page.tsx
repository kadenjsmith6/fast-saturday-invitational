"use client";

import { useState } from "react";
import MatchCard from "@/components/MatchCard";
import { Card, Status } from "@/components/ui";
import { useEventData } from "@/lib/data";
import { computeMatch, individualStandings, teamStandings } from "@/lib/scoring";

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export default function LeaderboardPage() {
  const d = useEventData();
  const [view, setView] = useState<"teams" | "players">("teams");

  const computed = d.matches
    .map((m) => {
      const course = d.coursesById[m.courseId];
      return course ? { match: m, state: computeMatch(m, course, d.playersById, d.rules, m.results ?? {}) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const teams = teamStandings(
    d.teams.map((t) => t.id),
    computed,
  );
  const players = individualStandings(computed);
  const anyLive = computed.some((c) => c.state.thru > 0 && !c.state.final);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl gilt">Leaderboard</h1>
        <p className="text-sm text-muted">Updates live as holes are posted.</p>
      </div>
      <Status loading={d.loading} error={d.error} />

      <div className="flex gap-1">
        {(["teams", "players"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md font-semibold ${view === v ? "bg-gold text-card" : "bg-sand-2 text-ink"}`}
          >
            {v === "teams" ? "Teams" : "Individual"}
          </button>
        ))}
      </div>

      {view === "teams" ? (
        <div className="led-board p-4 sm:p-5">
          <div className="flex items-baseline justify-between led led-dim text-lg border-b border-[#2b2b2b] pb-1 mb-2">
            <span>Team</span>
            <span className="flex gap-6 sm:gap-10">
              <span className="hidden sm:inline">W-L-H</span>
              {anyLive && <span>Proj</span>}
              <span>Pts</span>
            </span>
          </div>
          {teams.length === 0 && <div className="led text-2xl py-2">No teams posted yet</div>}
          {teams.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="led text-[28px] sm:text-4xl leading-none truncate min-w-0">
                <span className="led-dim mr-3">{i + 1}</span>
                {d.teamsById[t.id]?.name}
              </div>
              <div className="flex items-center gap-4 sm:gap-10 shrink-0 led">
                <span className="hidden sm:inline text-2xl led-dim">
                  {t.wins}-{t.losses}-{t.halves}
                </span>
                {anyLive && <span className="text-2xl led-dim w-10 text-right">{fmt(t.projected)}</span>}
                <span className="text-5xl sm:text-6xl leading-none w-12 sm:w-14 text-right">{fmt(t.points)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 text-right">W-L-H</th>
                <th className="px-3 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const player = d.playersById[p.id];
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold">{player?.name ?? "?"}</td>
                    <td className="px-3 py-2 text-muted">{d.teamsById[player?.teamId ?? ""]?.name}</td>
                    <td className="px-3 py-2 text-right text-muted">
                      {p.wins}-{p.losses}-{p.halves}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(p.points)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {[...d.rounds].reverse().map((r) => {
        const list = computed.filter((c) => c.match.roundId === r.id);
        if (list.length === 0) return null;
        return (
          <section key={r.id} className="space-y-2">
            <h2 className="font-display text-xl">
              {r.name}{" "}
              <span className="text-sm font-sans font-normal text-muted">· {d.coursesById[r.courseId]?.name}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {list.map(({ match, state }) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  state={state}
                  players={d.playersById}
                  teams={d.teamsById}
                  href={`/scores/${match.id}`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
