"use client";

import MatchCard from "@/components/MatchCard";
import { Status } from "@/components/ui";
import { useEventData } from "@/lib/data";
import { computeMatch } from "@/lib/scoring";

export default function ScoresPage() {
  const d = useEventData();
  const rounds = [...d.rounds].reverse(); // latest round first
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl gilt">Enter Scores</h1>
        <p className="text-sm text-muted">Pick your match, then tap who won each hole.</p>
      </div>
      <Status loading={d.loading} error={d.error} />
      {!d.loading && d.matches.length === 0 && <p className="text-muted">No matches set up yet.</p>}
      {rounds.map((r) => {
        const course = d.coursesById[r.courseId];
        const list = d.matches.filter((m) => m.roundId === r.id);
        if (!course || list.length === 0) return null;
        return (
          <section key={r.id} className="space-y-2">
            <h2 className="font-display text-xl">
              {r.name} <span className="text-sm font-sans font-normal text-muted">· {course.name}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {list.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  state={computeMatch(m, course, d.playersById, d.rules, m.results ?? {})}
                  players={d.playersById}
                  teams={d.teamsById}
                  href={`/scores/${m.id}`}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
