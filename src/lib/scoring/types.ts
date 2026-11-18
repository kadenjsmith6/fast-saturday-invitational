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

/** Each player plays his own ball and gets his own strokes. */
export type IndividualFormat = "singles" | "bestBall" | "shamble";
/** The side plays one ball and gets one set of strokes. */
export type TeamFormat = "scramble" | "pinehurst";
export type MatchFormat = IndividualFormat | TeamFormat;

export const FORMAT_LABELS: Record<MatchFormat, string> = {
  singles: "1v1 Match Play",
  bestBall: "2-Man Best Ball",
  shamble: "2-Man Shamble",
  scramble: "2-Man Scramble",
  pinehurst: "Pinehurst",
};

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

/** What happened on each hole. Only the result is recorded, not the scores. */
export type HoleOutcome = Side | "push";
export type MatchResults = Record<number, HoleOutcome>;

/** How strokes are figured for each format. All of these are editable settings. */
export interface HandicapRules {
  /** % of course handicap in 1v1 match play. */
  singlesPct: number;
  /** % of each player's course handicap in best ball, off the low man of the foursome. */
  bestBallPct: number;
  /** % of each player's course handicap in a shamble, off the low man of the foursome. */
  shamblePct: number;
  /** 2-man scramble team handicap: [lower player %, higher player %]. */
  scrambleWeights: [number, number];
  /** Pinehurst team handicap: [lower player %, higher player %]. */
  pinehurstWeights: [number, number];
  /** "half" allows half strokes (league style), "whole" rounds to whole strokes. */
  rounding: "half" | "whole";
}

export const DEFAULT_RULES: HandicapRules = {
  singlesPct: 1.0,
  bestBallPct: 0.9,
  shamblePct: 0.75,
  scrambleWeights: [0.35, 0.15], // USGA
  pinehurstWeights: [0.6, 0.4],
  rounding: "half",
};
