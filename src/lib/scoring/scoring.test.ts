import { describe, expect, it } from "vitest";
import {
  computeMatch,
  DEFAULT_RULES,
  individualStandings,
  matchStrokes,
  strokePlayLeaderboard,
  strokesByHole,
  teamStandings,
  type Course,
  type Match,
  type Player,
} from "./index";

// A placeholder course: par 4s, odd stroke indexes on the front, even on the back.
const course: Course = {
  id: "test",
  name: "Test Course",
  holes: [7, 3, 15, 1, 11, 5, 17, 9, 13, 8, 2, 16, 4, 12, 18, 6, 14, 10].map((hcp, i) => ({
    number: i + 1,
    par: 4,
    hcp,
  })),
};

const p = (id: string, ch: number, teamId: string): Player => ({
  id,
  name: id,
  teamId,
  courseHandicaps: { test: ch },
});
const players: Record<string, Player> = Object.fromEntries(
  [p("payton", 9, "t1"), p("kaden", 27, "t1"), p("spencer", 10, "t2"), p("austin", 24, "t2"), p("tanner", 6, "t3"), p("alex", 32, "t3")].map(
    (x) => [x.id, x],
  ),
);

const match = (over: Partial<Match> & Pick<Match, "format" | "segment" | "sides">): Match => ({
  id: "m",
  roundId: "r1",
  courseId: "test",
  points: 1,
  ...over,
});

describe("strokes by format", () => {
  it("singles on a nine gets half the difference, with half strokes", () => {
    const m = match({
      format: "singles",
      segment: "back",
      sides: { A: { teamId: "t1", playerIds: ["kaden"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
    });
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ kaden: 8.5, spencer: 0 });
  });

  it("best ball uses 90% of each player off the low man", () => {
    const m = match({
      format: "bestBall",
      segment: "front",
      sides: {
        A: { teamId: "t1", playerIds: ["payton", "kaden"] },
        B: { teamId: "t2", playerIds: ["spencer", "austin"] },
      },
    });
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({
      payton: 0,
      kaden: 8,
      spencer: 0.5,
      austin: 7,
    });
  });

  it("alternate shot uses 50% of the combined difference", () => {
    const m = match({
      format: "altShot",
      segment: "full",
      sides: {
        A: { teamId: "t1", playerIds: ["payton", "kaden"] },
        B: { teamId: "t2", playerIds: ["spencer", "austin"] },
      },
    });
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ A: 1, B: 0 });
  });

  it("2-man scramble uses 50% low + 25% high", () => {
    const m = match({
      format: "scramble",
      segment: "full",
      sides: {
        A: { teamId: "t1", playerIds: ["kaden", "payton"] },
        B: { teamId: "t3", playerIds: ["tanner", "alex"] },
      },
    });
    // A: 4.5 + 6.75 = 11.25, B: 3 + 8 = 11 → 0.25 → rounds to 0.5
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ A: 0.5, B: 0 });
  });

  it("flags a player with no course handicap for this course", () => {
    const m = match({
      format: "singles",
      segment: "full",
      courseId: "elsewhere",
      sides: { A: { teamId: "t1", playerIds: ["kaden"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
    });
    expect(matchStrokes(m, players, DEFAULT_RULES).missing).toEqual(["kaden", "spencer"]);
  });

  it("puts strokes on the hardest holes first, half stroke last", () => {
    const byHole = strokesByHole(2.5, course, "front");
    expect(byHole[4]).toBe(1); // hcp 1
    expect(byHole[2]).toBe(1); // hcp 3
    expect(byHole[6]).toBe(0.5); // hcp 5
    expect(Object.values(byHole).reduce((s, v) => s + v, 0)).toBe(2.5);
  });

  it("wraps around when a player gets more than nine strokes on a nine", () => {
    const byHole = strokesByHole(11, course, "back");
    expect(byHole[11]).toBe(2); // hcp 2
    expect(byHole[13]).toBe(2); // hcp 4
    expect(byHole[17]).toBe(1); // hcp 6
  });
});

describe("match play", () => {
  const singles = match({
    format: "singles",
    segment: "front",
    sides: { A: { teamId: "t1", playerIds: ["payton"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
  });

  it("closes out a match early", () => {
    // Payton (0 strokes) wins the first five holes; Spencer gets 0.5 on hole 4.
    const scores = {
      payton: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
      spencer: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 },
    };
    const s = computeMatch(singles, course, players, DEFAULT_RULES, scores);
    expect(s.final).toBe(true);
    expect(s.label).toBe("5 & 4");
    expect(s.points).toEqual({ A: 1, B: 0 });
  });

  it("stops at the first unfinished hole and projects points", () => {
    const s = computeMatch(singles, course, players, DEFAULT_RULES, {
      payton: { 1: 4, 2: 5 },
      spencer: { 1: 5 },
    });
    expect(s.thru).toBe(1);
    expect(s.label).toBe("1 UP");
    expect(s.points).toEqual({ A: 0, B: 0 });
    expect(s.projected).toEqual({ A: 1, B: 0 });
  });

  it("a half stroke wins a tied hole", () => {
    // Spencer gets 0.5 on hole 4 (hardest on the front).
    const s = computeMatch(singles, course, players, DEFAULT_RULES, {
      payton: { 1: 4, 2: 4, 3: 4, 4: 4 },
      spencer: { 1: 4, 2: 4, 3: 4, 4: 4 },
    });
    expect(s.holes[3].winner).toBe("B");
    expect(s.label).toBe("1 UP");
  });
});

describe("standings work for any number of teams", () => {
  it("splits a halved 2-point 2v2 as 0.5 per player and totals by team", () => {
    const m1 = match({
      id: "m1",
      format: "bestBall",
      segment: "front",
      points: 2,
      sides: {
        A: { teamId: "t1", playerIds: ["payton", "kaden"] },
        B: { teamId: "t2", playerIds: ["spencer", "austin"] },
      },
    });
    const m2 = match({
      id: "m2",
      format: "singles",
      segment: "back",
      sides: { A: { teamId: "t3", playerIds: ["tanner"] }, B: { teamId: "t1", playerIds: ["payton"] } },
    });
    const halved = computeMatch(m1, course, players, DEFAULT_RULES, {
      payton: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 4])),
      kaden: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 9])),
      spencer: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 4])),
      austin: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 9])),
    });
    // Spencer's half stroke wins hole 4; Payton birdies 4, Spencer birdies 5 → level.
    const level = computeMatch(m1, course, players, DEFAULT_RULES, {
      payton: { ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 4])), 4: 3 },
      kaden: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 9])),
      spencer: { ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 4])), 5: 3 },
      austin: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, 9])),
    });
    expect(halved.result).toBe("B");
    expect(level.result).toBe("halved");

    const tannerWins = computeMatch(m2, course, players, DEFAULT_RULES, {
      tanner: Object.fromEntries([10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => [h, 3])),
      payton: Object.fromEntries([10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => [h, 5])),
    });

    const all = [
      { match: m1, state: level },
      { match: m2, state: tannerWins },
    ];
    const teams = teamStandings(["t1", "t2", "t3"], all);
    expect(Object.fromEntries(teams.map((t) => [t.id, t.points]))).toEqual({ t1: 1, t2: 1, t3: 1 });
    expect(teams.find((t) => t.id === "t3")?.wins).toBe(1);
    const ind = Object.fromEntries(individualStandings(all).map((r) => [r.id, r.points]));
    expect(ind).toMatchObject({ payton: 0.5, kaden: 0.5, spencer: 0.5, austin: 0.5, tanner: 1 });
  });
});

describe("stroke play", () => {
  it("ties share placement points", () => {
    const card = (n: number) => Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, n]));
    const rows = strokePlayLeaderboard(
      [players.payton, players.spencer, players.kaden],
      "test",
      // nets: payton 77-9=68, spencer 78-10=68, kaden 108-27=81
      { payton: { ...card(4), 1: 13 - 4 }, spencer: { ...card(4), 1: 14 - 4 }, kaden: card(6) },
      [5, 3, 1],
    );
    expect(rows.map((r) => [r.playerId, r.position, r.points])).toEqual([
      ["payton", 1, 4],
      ["spencer", 1, 4],
      ["kaden", 3, 1],
    ]);
  });
});
