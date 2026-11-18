// Core data types for the Fast Saturday Invitational.
// Nothing here assumes a team count: teams are just a list.

export type Side = "A" | "B";

export interface Hole {
  number: number; // 1-18
  par: number;
  hcp: number; // stroke index, 1 = hardest
}

export interface Course {
  id: string;
  name: string;
  holes: Hole[]; // 18 holes
}

export interface Team {
  id: string;
  name: string;
  color?: string;
}

export interface Player {
  id: string;
  name: string;
  teamId?: string;
  /** Handicap index, for reference only. */
  index?: number;
  /** Course handicap per course id, coded in by the admin (already set for the player's tees). */
  courseHandicaps: Record<string, number>;
  bio?: string;
  photoUrl?: string;
}

/** Formats where each player plays his own ball and gets his own strokes. */
export type IndividualFormat = "singles" | "bestBall" | "shamble";
/** Formats where the side plays one ball and gets one set of strokes. */
export type TeamFormat = "altShot" | "scramble";
export type MatchFormat = IndividualFormat | TeamFormat;

export type Segment = "front" | "back" | "full";

export interface MatchSide {
  teamId: string;
  playerIds: string[];
}

export interface Match {
  id: string;
  roundId: string;
  courseId: string;
  format: MatchFormat;
  segment: Segment;
  /** Points awarded for winning the match (a halve splits them). */
  points: number;
  sides: Record<Side, MatchSide>;
}

/**
 * Gross scores entered for a match, keyed by hole number.
 * Individual formats key by player id; team formats key by side ("A" / "B").
 */
export type MatchScores = Record<string, Record<number, number>>;

/** How strokes are figured for each format. All of these are editable settings. */
export interface HandicapRules {
  /** Percentage of course handicap used in singles. */
  singlesPct: number;
  /** Percentage of each player's course handicap in best ball, played off the low man of the foursome. */
  bestBallPct: number;
  /** Percentage of each player's course handicap in a shamble, played off the low man. */
  shamblePct: number;
  /** Percentage of the difference in combined course handicaps in alternate shot. */
  altShotPct: number;
  /** Team handicap weights for scrambles, lowest player first (e.g. [0.5, 0.25] for a 2-man). */
  scrambleWeights: Record<number, number[]>;
  /** "half" allows half strokes (league style), "whole" rounds to whole strokes. */
  rounding: "half" | "whole";
}

export const DEFAULT_RULES: HandicapRules = {
  singlesPct: 1.0,
  bestBallPct: 0.9,
  shamblePct: 0.75,
  altShotPct: 0.5, // trip house rule (USGA allowance)
  scrambleWeights: {
    2: [0.5, 0.25],
    4: [0.25, 0.2, 0.15, 0.1],
  },
  rounding: "half",
};
