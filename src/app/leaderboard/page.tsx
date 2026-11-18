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
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted">Updates live as holes are posted.</p>
      </div>
      <Status loading={d.loading} error={d.error} />

      <div className="flex gap-1">
        {(["teams", "players"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-full text-sm ${view === v ? "bg-pine text-sand font-semibold" : "bg-sand-2"}`}
          >
            {v === "teams" ? "Teams" : "Individual"}
          </button>
        ))}
      </div>

      {view === "teams" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, i) => (
            <Card key={t.id} className={i === 0 && t.points > 0 ? "border-gold border-2" : ""}>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-muted">#{i + 1}</div>
                  <div className="font-display text-xl font-bold">{d.teamsById[t.id]?.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl font-bold">{fmt(t.points)}</div>
                  {anyLive && t.projected !== t.points && (
                    <div className="text-xs text-muted">projected {fmt(t.projected)}</div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted mt-2">
                {t.wins}W · {t.losses}L · {t.halves}H
              </div>
            </Card>
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
            <h2 className="font-display text-xl font-bold">
              {r.name}{" "}
              <span className="text-sm font-sans font-normal text-muted">· {d.coursesById[r.courseId]?.name}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
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
