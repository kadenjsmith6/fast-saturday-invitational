import { isTeamFormat, matchStrokes, SEGMENT_HOLES, strokesByHole } from "./handicap";
import type { Course, HandicapRules, Match, MatchScores, Player, Side } from "./types";

export interface HoleResult {
  number: number;
  /** Net score that counts for each side on this hole. */
  net: Record<Side, number>;
  winner: Side | null; // null = halved
  /** Running margin after this hole: positive = side A up. */
  margin: number;
}

export interface MatchState {
  strokes: Record<string, number>;
  /** Strokes received on each hole, per player (individual formats) or side (team formats). */
  holeStrokes: Record<string, Record<number, number>>;
  holes: HoleResult[];
  thru: number;
  holesInMatch: number;
  margin: number; // positive = A up
  final: boolean;
  result: Side | "halved" | null;
  /** e.g. "2 UP", "3 & 2", "All Square", "Halved", "1 UP (final)" */
  label: string;
  /** Points earned once the match is final. */
  points: Record<Side, number>;
  /** Points each side would earn if the match ended now. */
  projected: Record<Side, number>;
  missing: string[];
}

export function unitsFor(match: Match, side: Side): string[] {
  return isTeamFormat(match.format) ? [side] : match.sides[side].playerIds;
}

function award(match: Match, result: Side | "halved" | null): Record<Side, number> {
  if (result === "A") return { A: match.points, B: 0 };
  if (result === "B") return { A: 0, B: match.points };
  if (result === "halved") return { A: match.points / 2, B: match.points / 2 };
  return { A: 0, B: 0 };
}

export function computeMatch(
  match: Match,
  course: Course,
  players: Record<string, Player>,
  rules: HandicapRules,
  scores: MatchScores,
): MatchState {
  const { strokes, missing } = matchStrokes(match, players, rules);
  const holeStrokes = Object.fromEntries(
    Object.entries(strokes).map(([unit, s]) => [unit, strokesByHole(s, course, match.segment)]),
  );
  const order = SEGMENT_HOLES[match.segment];
  const holes: HoleResult[] = [];
  let margin = 0;
  let closedOut = false;

  for (let i = 0; i < order.length; i++) {
    const n = order[i];
    const sideNet = (side: Side): number | null => {
      const nets: number[] = [];
      for (const unit of unitsFor(match, side)) {
        const gross = scores[unit]?.[n];
        if (gross === undefined || gross === null) return null; // hole not finished
        nets.push(gross - (holeStrokes[unit]?.[n] ?? 0));
      }
      return Math.min(...nets);
    };
    const a = sideNet("A");
    const b = sideNet("B");
    if (a === null || b === null) break; // stop at the first unfinished hole
    const winner: Side | null = a < b ? "A" : b < a ? "B" : null;
    margin += winner === "A" ? 1 : winner === "B" ? -1 : 0;
    holes.push({ number: n, net: { A: a, B: b }, winner, margin });
    const remaining = order.length - (i + 1);
    if (Math.abs(margin) > remaining) {
      closedOut = true;
      break;
    }
  }

  const thru = holes.length;
  const remaining = order.length - thru;
  const final = closedOut || thru === order.length;
  const leader: Side | null = margin > 0 ? "A" : margin < 0 ? "B" : null;
  const result: MatchState["result"] = final ? (leader ?? "halved") : null;
  const up = Math.abs(margin);

  let label: string;
  if (thru === 0) label = "Not started";
  else if (final && result === "halved") label = "Halved";
  else if (final && remaining > 0) label = `${up} & ${remaining}`;
  else if (final) label = `${up} UP`;
  else if (up === 0) label = "All Square";
  else if (up === remaining) label = `${up} UP (dormie)`;
  else label = `${up} UP`;

  return {
    strokes,
    holeStrokes,
    holes,
    thru,
    holesInMatch: order.length,
    margin,
    final,
    result,
    label,
    points: award(match, result),
    projected: thru === 0 ? { A: 0, B: 0 } : award(match, leader ?? "halved"),
    missing,
  };
}
