import type { Round, StoredMatch } from "@/lib/data";
import type { Course, Player, Team } from "@/lib/scoring";

type Item = { name: "teams" | "players" | "courses" | "rounds" | "matches"; item: { id: string } };

/** Made-up data for trying the site. Every id starts with "test-" so it can be cleared cleanly. */
export function buildTestData(): Item[] {
  const course: Course = {
    id: "test-course",
    name: "Test Course",
    holes: [7, 3, 15, 1, 11, 5, 17, 9, 13, 8, 2, 16, 4, 12, 18, 6, 14, 10].map((hcp, i) => ({
      number: i + 1,
      par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 5, 3, 4, 4, 3, 4, 4, 5][i],
      hcp,
    })),
  };
  const teams: Team[] = [
    { id: "test-team-1", name: "Test Team Sage" },
    { id: "test-team-2", name: "Test Team Mesa" },
    { id: "test-team-3", name: "Test Team Dune" },
  ];
  const hcps = [[4, 12, 18, 26], [6, 11, 19, 24], [8, 14, 17, 28]];
  const players: Player[] = teams.flatMap((t, ti) =>
    hcps[ti].map((ch, pi) => ({
      id: `test-p${ti + 1}${pi + 1}`,
      name: `Test ${["Sage", "Mesa", "Dune"][ti]} ${pi + 1}`,
      teamId: t.id,
      courseHandicaps: { [course.id]: ch },
    })),
  );
  const round: Round = { id: "test-round", name: "Test Round", courseId: course.id, order: 0 };
  const pid = (t: number, p: number) => `test-p${t}${p}`;
  const base = { roundId: round.id, courseId: course.id, results: {} };
  const matches: StoredMatch[] = [
    {
      ...base,
      id: "test-m1",
      order: 1,
      format: "bestBall",
      segment: "front",
      points: 2,
      sides: {
        A: { teamId: teams[0].id, playerIds: [pid(1, 1), pid(1, 4)] },
        B: { teamId: teams[1].id, playerIds: [pid(2, 1), pid(2, 4)] },
      },
    },
    {
      ...base,
      id: "test-m2",
      order: 2,
      format: "singles",
      segment: "back",
      points: 1,
      sides: { A: { teamId: teams[0].id, playerIds: [pid(1, 1)] }, B: { teamId: teams[1].id, playerIds: [pid(2, 1)] } },
    },
    {
      ...base,
      id: "test-m3",
      order: 3,
      format: "singles",
      segment: "back",
      points: 1,
      sides: { A: { teamId: teams[0].id, playerIds: [pid(1, 4)] }, B: { teamId: teams[1].id, playerIds: [pid(2, 4)] } },
    },
    {
      ...base,
      id: "test-m4",
      order: 4,
      format: "scramble",
      segment: "front",
      points: 2,
      sides: {
        A: { teamId: teams[2].id, playerIds: [pid(3, 1), pid(3, 3)] },
        B: { teamId: teams[1].id, playerIds: [pid(2, 2), pid(2, 3)] },
      },
    },
    {
      ...base,
      id: "test-m5",
      order: 5,
      format: "pinehurst",
      segment: "front",
      points: 2,
      sides: {
        A: { teamId: teams[2].id, playerIds: [pid(3, 2), pid(3, 4)] },
        B: { teamId: teams[0].id, playerIds: [pid(1, 2), pid(1, 3)] },
      },
    },
  ];
  return [
    { name: "courses", item: course },
    ...teams.map((item) => ({ name: "teams" as const, item })),
    ...players.map((item) => ({ name: "players" as const, item })),
    { name: "rounds", item: round },
    ...matches.map((item) => ({ name: "matches" as const, item })),
  ];
}
