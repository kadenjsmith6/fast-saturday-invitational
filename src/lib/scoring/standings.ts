import type { MatchState } from "./match";
import type { Match, Side } from "./types";

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
