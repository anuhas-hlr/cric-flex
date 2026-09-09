export type MatchType = 'CUSTOM' | 'BOX_GULLY' | 'T20' | 'ODI' | 'TEST';

export interface MatchRules {
  totalOvers: number;
  ballsPerOver: number;        // e.g. 4 for box/gully cricket, 6 for standard
  playersPerTeam: number;      // e.g. 6, 8, 11
  maxOversPerBowler: number;   // e.g. 2 in 8-over box cricket, 4 in T20
  lastManStanding: boolean;    // If true, last batter can bat solo
  wideRuns: number;            // Default 1
  noBallRuns: number;          // Default 1
  reBallWide: boolean;         // If false, wide run added but no re-ball (gully cricket variant)
  reBallNoBall: boolean;       // If false, no-ball run added but no re-ball
}

export type DismissalType =
  | 'BOWLED'
  | 'CAUGHT'
  | 'LBW'
  | 'RUN_OUT'
  | 'STUMPED'
  | 'HIT_WICKET'
  | 'RETIRED_HURT'
  | 'TIMED_OUT';

export interface WicketDetail {
  type: DismissalType;
  playerOut: string;           // Name of the dismissed batsman
  bowlerName: string;          // Bowler credited (null for run-out/retired)
  fielderName?: string;        // Catcher / run-out fielder / stumper
  runsCompleted?: number;      // On run out
}

export type ExtraType = 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';

export interface BallEvent {
  ballId: string;
  overIndex: number;           // 0-indexed over
  legalBallNumber: number;     // 1 to ballsPerOver for legal balls
  isLegal: boolean;            // false for Wide / No-Ball (unless rules don't re-ball)
  runsOffBat: number;
  extraType: ExtraType;
  extraRuns: number;
  totalRuns: number;           // runsOffBat + extraRuns
  striker: string;
  nonStriker: string;
  bowler: string;
  wicket?: WicketDetail;
  commentary?: string;
  timestamp: number;
}

export interface BatterStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalInfo?: string;
  strikeRate: number;
}

export interface BowlerStats {
  name: string;
  overs: number;               // Full overs completed
  balls: number;               // Balls in current over (0 to ballsPerOver - 1)
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  over: string;                // e.g. "4.2"
  playerOut: string;
}

export interface InningsState {
  teamName: string;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  wicketsLost: number;
  legalBallsBowled: number;     // Total legal balls bowled
  currentOverBalls: BallEvent[];
  allBalls: BallEvent[];
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  strikerName: string;
  nonStrikerName: string;
  currentBowlerName: string;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalties: number;
    total: number;
  };
  fallOfWickets: FallOfWicket[];
  isCompleted: boolean;
}

export interface TeamInfo {
  name: string;
  players: string[];
}

export interface AISummary {
  potm: string;
  potmReason: string;
  bestBatter: string;
  bestBatterReason: string;
  bestBowler: string;
  bestBowlerReason: string;
  bestFielder: string;
  bestFielderReason: string;
  narrative: string;
  generatedAt: number;
}

export interface MatchRecord {
  id: string;
  tournamentId?: string;
  matchType: MatchType;
  rules: MatchRules;
  teamA: TeamInfo;
  teamB: TeamInfo;
  tossWinner: string;
  tossDecision: 'BAT' | 'BOWL';
  currentInningsIndex: 1 | 2 | 3 | 4;
  innings1: InningsState;
  innings2?: InningsState;
  innings3?: InningsState;
  innings4?: InningsState;
  targetRuns?: number;
  status: 'LIVE' | 'COMPLETED';
  winner?: string;             // Winning team name, or 'TIE', or 'DRAW'
  resultText?: string;         // e.g. "Mumbai Indians won by 14 runs"
  aiSummary?: AISummary;
  undoStack?: InningsState[];  // Snapshot history for live undo
  createdAt: number;
  updatedAt: number;
}

export interface TournamentTeamStats {
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsScored: number;
  oversFaced: number;          // Stored as decimal or fractional overs
  runsConceded: number;
  oversBowled: number;
  nrr: number;                 // Net Run Rate
}

export interface TournamentLeader {
  playerName: string;
  teamName: string;
  value: number;               // runs or wickets
}

export interface TournamentFixture {
  id: string;
  roundName: string;           // e.g. "League Match 1", "Semi-Final 1", "Final"
  teamA: string;
  teamB: string;
  matchId?: string;            // Linked MatchRecord id once played
  winner?: string;
  isCompleted: boolean;
}

export interface TournamentRecord {
  id: string;
  name: string;
  format: 'ROUND_ROBIN' | 'KNOCKOUT';
  rules: MatchRules;
  teams: string[];
  fixtures: TournamentFixture[];
  standings: TournamentTeamStats[];
  orangeCap?: TournamentLeader;
  purpleCap?: TournamentLeader;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  winner?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  geminiApiKey: string;
  defaultRulesPreset: MatchType;
  enableSound: boolean;
}
