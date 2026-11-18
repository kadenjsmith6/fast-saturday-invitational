import { describe, expect, it } from "vitest";
import {
  computeMatch,
  DEFAULT_RULES,
  individualStandings,
  matchStrokes,
  strokesByHole,
  teamStandings,
  type Course,
  type Match,
  type MatchResults,
  type Player,
} from "./index";

// A placeholder course: odd stroke indexes on the front, even on the back.
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
  [
    p("payton", 9, "t1"),
    p("kaden", 27, "t1"),
    p("spencer", 10, "t2"),
    p("austin", 24, "t2"),
    p("tanner", 6, "t3"),
    p("alex", 32, "t3"),
  ].map((x) => [x.id, x]),
);

const match = (over: Partial<Match> & Pick<Match, "format" | "sides">): Match => ({
  id: "m",
  roundId: "r1",
  courseId: "test",
  segment: "front",
  points: 1,
  ...over,
});

const twoVtwo = {
  A: { teamId: "t1", playerIds: ["payton", "kaden"] },
  B: { teamId: "t2", playerIds: ["spencer", "austin"] },
};

describe("strokes by format (nine-hole matches get half)", () => {
  it("1v1: 100% of the difference", () => {
    const m = match({
      format: "singles",
      segment: "back",
      sides: { A: { teamId: "t1", playerIds: ["kaden"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
    });
    // (27 - 10) / 2 = 8.5
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ kaden: 8.5, spencer: 0 });
  });

  it("1v1 over 18 holes gets the full difference", () => {
    const m = match({
      format: "singles",
      segment: "full",
      sides: { A: { teamId: "t1", playerIds: ["kaden"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
    });
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes.kaden).toBe(17);
  });

  it("best ball: 90% of each player off the low man", () => {
    const m = match({ format: "bestBall", sides: twoVtwo });
    // 8.1, 24.3, 9, 21.6 → off 8.1 → halved
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({
      payton: 0,
      kaden: 8,
      spencer: 0.5,
      austin: 7,
    });
  });

  it("shamble: 75% of each player off the low man", () => {
    const m = match({ format: "shamble", sides: twoVtwo });
    // 6.75, 20.25, 7.5, 18 → off 6.75 → halved
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({
      payton: 0,
      kaden: 7,
      spencer: 0.5,
      austin: 5.5,
    });
  });

  it("2-man scramble: 35% low + 15% high", () => {
    const m = match({
      format: "scramble",
      sides: {
        A: { teamId: "t1", playerIds: ["kaden", "payton"] },
        B: { teamId: "t3", playerIds: ["spencer", "tanner"] },
      },
    });
    // A: 3.15 + 4.05 = 7.2, B: 2.1 + 1.5 = 3.6 → 3.6 / 2 = 1.8 → 2
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ A: 2, B: 0 });
  });

  it("Pinehurst: 60% low + 40% high", () => {
    const m = match({
      format: "pinehurst",
      sides: {
        A: { teamId: "t1", playerIds: ["payton", "kaden"] },
        B: { teamId: "t3", playerIds: ["tanner", "spencer"] },
      },
    });
    // A: 5.4 + 10.8 = 16.2, B: 3.6 + 4 = 7.6 → 8.6 / 2 = 4.3 → 4.5
    expect(matchStrokes(m, players, DEFAULT_RULES).strokes).toEqual({ A: 4.5, B: 0 });
  });

  it("flags a player with no course handicap for this course", () => {
    const m = match({
      format: "singles",
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
  });

  it("wraps around when someone gets more than nine strokes on a nine", () => {
    const byHole = strokesByHole(11, course, "back");
    expect(byHole[11]).toBe(2); // hcp 2
    expect(byHole[13]).toBe(2); // hcp 4
    expect(byHole[17]).toBe(1); // hcp 6
  });
});

describe("match play from win / lose / push", () => {
  const singles = match({
    format: "singles",
    sides: { A: { teamId: "t1", playerIds: ["payton"] }, B: { teamId: "t2", playerIds: ["spencer"] } },
  });

  it("closes out a match early", () => {
    const s = computeMatch(singles, course, players, DEFAULT_RULES, { 1: "A", 2: "A", 3: "A", 4: "A", 5: "A" });
    expect(s.final).toBe(true);
    expect(s.label).toBe("5 & 4");
    expect(s.points).toEqual({ A: 1, B: 0 });
  });

  it("shows dormie", () => {
    const s = computeMatch(singles, course, players, DEFAULT_RULES, {
      1: "A",
      2: "A",
      3: "A",
      4: "push",
      5: "push",
      6: "push",
    });
    expect(s.label).toBe("3 UP (dormie)");
    expect(s.final).toBe(false);
  });

  it("stops at the first hole without a result and projects points", () => {
    const s = computeMatch(singles, course, players, DEFAULT_RULES, { 1: "A", 3: "B" });
    expect(s.thru).toBe(1);
    expect(s.label).toBe("1 UP");
    expect(s.points).toEqual({ A: 0, B: 0 });
    expect(s.projected).toEqual({ A: 1, B: 0 });
  });

  it("all nine pushed is a halve", () => {
    const s = computeMatch(
      singles,
      course,
      players,
      DEFAULT_RULES,
      Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, "push"])) as MatchResults,
    );
    expect(s.label).toBe("Halved");
    expect(s.points).toEqual({ A: 0.5, B: 0.5 });
  });
});

describe("standings work for any number of teams", () => {
  it("splits a halved 2-point 2v2 as 0.5 per player and totals by team", () => {
    const m1 = match({ id: "m1", format: "bestBall", points: 2, sides: twoVtwo });
    const m2 = match({
      id: "m2",
      format: "singles",
      segment: "back",
      sides: { A: { teamId: "t3", playerIds: ["tanner"] }, B: { teamId: "t1", playerIds: ["payton"] } },
    });
    const halved = computeMatch(
      m1,
      course,
      players,
      DEFAULT_RULES,
      Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => [h, "push"])) as MatchResults,
    );
    const tannerWins = computeMatch(m2, course, players, DEFAULT_RULES, {
      10: "A",
      11: "A",
      12: "A",
      13: "A",
      14: "A",
    });
    const all = [
      { match: m1, state: halved },
      { match: m2, state: tannerWins },
    ];
    const teams = teamStandings(["t1", "t2", "t3"], all);
    expect(Object.fromEntries(teams.map((t) => [t.id, t.points]))).toEqual({ t1: 1, t2: 1, t3: 1 });
    expect(teams.find((t) => t.id === "t3")?.wins).toBe(1);
    const ind = Object.fromEntries(individualStandings(all).map((r) => [r.id, r.points]));
    expect(ind).toMatchObject({ payton: 0.5, kaden: 0.5, spencer: 0.5, austin: 0.5, tanner: 1 });
  });
});
