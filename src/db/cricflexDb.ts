import Dexie, { type Table } from 'dexie';
import type { MatchRecord, TournamentRecord } from '../types/cricket';

export class CricFlexDB extends Dexie {
  matches!: Table<MatchRecord, string>;
  tournaments!: Table<TournamentRecord, string>;

  constructor() {
    super('CricFlexDB');
    this.version(1).stores({
      matches: 'id, tournamentId, status, createdAt, updatedAt',
      tournaments: 'id, status, createdAt, updatedAt'
    });
  }
}

export const db = new CricFlexDB();

export const DEFAULT_RULES = {
  BOX_GULLY: {
    totalOvers: 6,
    ballsPerOver: 4,
    playersPerTeam: 6,
    maxOversPerBowler: 2,
    lastManStanding: true,
    wideRuns: 1,
    noBallRuns: 1,
    reBallWide: true,
    reBallNoBall: true,
  },
  T20: {
    totalOvers: 20,
    ballsPerOver: 6,
    playersPerTeam: 11,
    maxOversPerBowler: 4,
    lastManStanding: false,
    wideRuns: 1,
    noBallRuns: 1,
    reBallWide: true,
    reBallNoBall: true,
  },
  ODI: {
    totalOvers: 50,
    ballsPerOver: 6,
    playersPerTeam: 11,
    maxOversPerBowler: 10,
    lastManStanding: false,
    wideRuns: 1,
    noBallRuns: 1,
    reBallWide: true,
    reBallNoBall: true,
  },
  TEST: {
    totalOvers: 200, // Open overs for 2-innings match
    ballsPerOver: 6,
    playersPerTeam: 11,
    maxOversPerBowler: 99, // Unlimited bowler overs in test matches
    lastManStanding: false,
    wideRuns: 1,
    noBallRuns: 1,
    reBallWide: true,
    reBallNoBall: true,
  },
  CUSTOM: {
    totalOvers: 8,
    ballsPerOver: 6,
    playersPerTeam: 8,
    maxOversPerBowler: 2,
    lastManStanding: false,
    wideRuns: 1,
    noBallRuns: 1,
    reBallWide: true,
    reBallNoBall: true,
  },
} as const;
