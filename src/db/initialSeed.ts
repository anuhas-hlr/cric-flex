import { db } from './cricflexDb';
import type { MatchRecord, TournamentRecord } from '../types/cricket';

/**
 * Seed initial showcase matches (including a classic Test Match, Box cricket tournament, and a live scoring match)
 * when the app is launched with an empty IndexedDB database.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const matchCount = await db.matches.count();
    const tournCount = await db.tournaments.count();

    if (matchCount > 0 || tournCount > 0) {
      return; // Already has data, do not overwrite
    }

    const now = Date.now();

    // 1. Classic Test Match Showcase (India vs Australia)
    const testMatch: MatchRecord = {
      id: 'test_match_showcase',
      matchType: 'TEST',
      rules: {
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
      teamA: {
        name: 'India',
        players: ['Rohit S.', 'Yashasvi J.', 'Shubman G.', 'Virat K.', 'Rishabh P.', 'Ravindra J.', 'Ravichandran A.', 'Jasprit B.', 'Mohammed S.', 'Mohammed S.', 'Akash D.'],
      },
      teamB: {
        name: 'Australia',
        players: ['Usman K.', 'Steven S.', 'Marnus L.', 'Travis H.', 'Mitchell M.', 'Alex C.', 'Pat C.', 'Mitchell S.', 'Nathan L.', 'Josh H.', 'Scott B.'],
      },
      tossWinner: 'India',
      tossDecision: 'BAT',
      currentInningsIndex: 4,
      innings1: {
        teamName: 'India',
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        totalRuns: 286,
        wicketsLost: 10,
        legalBallsBowled: 506, // 84.2 overs
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Rohit S.': { name: 'Rohit S.', runs: 85, balls: 142, fours: 9, sixes: 2, isOut: true, dismissalInfo: 'c Smith b Cummins', strikeRate: 59.8 },
          'Yashasvi J.': { name: 'Yashasvi J.', runs: 32, balls: 54, fours: 4, sixes: 0, isOut: true, dismissalInfo: 'c Carey b Starc', strikeRate: 59.3 },
          'Virat K.': { name: 'Virat K.', runs: 102, balls: 168, fours: 11, sixes: 1, isOut: true, dismissalInfo: 'c Labuschagne b Hazlewood', strikeRate: 60.7 },
          'Rishabh P.': { name: 'Rishabh P.', runs: 44, balls: 38, fours: 5, sixes: 2, isOut: true, dismissalInfo: 'c Carey b Lyon', strikeRate: 115.8 },
          'Ravindra J.': { name: 'Ravindra J.', runs: 15, balls: 32, fours: 1, sixes: 0, isOut: true, dismissalInfo: 'b Cummins', strikeRate: 46.9 },
        },
        bowlers: {
          'Pat C.': { name: 'Pat C.', overs: 24, balls: 2, maidens: 5, runs: 72, wickets: 4, economy: 2.96, wides: 2, noBalls: 1 },
          'Mitchell S.': { name: 'Mitchell S.', overs: 20, balls: 0, maidens: 3, runs: 68, wickets: 2, economy: 3.4, wides: 1, noBalls: 2 },
          'Josh H.': { name: 'Josh H.', overs: 22, balls: 0, maidens: 6, runs: 58, wickets: 2, economy: 2.64, wides: 0, noBalls: 0 },
          'Nathan L.': { name: 'Nathan L.', overs: 18, balls: 0, maidens: 2, runs: 76, wickets: 2, economy: 4.22, wides: 0, noBalls: 0 },
        },
        strikerName: 'Jasprit B.',
        nonStrikerName: 'Mohammed S.',
        currentBowlerName: 'Pat C.',
        extras: { wides: 3, noBalls: 3, byes: 1, legByes: 1, penalties: 0, total: 8 },
        fallOfWickets: [
          { wicketNumber: 1, score: 64, over: '16.2', playerOut: 'Yashasvi J.' },
          { wicketNumber: 2, score: 180, over: '51.4', playerOut: 'Rohit S.' },
          { wicketNumber: 3, score: 248, over: '72.1', playerOut: 'Rishabh P.' },
          { wicketNumber: 4, score: 270, over: '79.3', playerOut: 'Virat K.' },
        ],
        isCompleted: true,
      },
      innings2: {
        teamName: 'Australia',
        battingTeam: 'Australia',
        bowlingTeam: 'India',
        totalRuns: 242,
        wicketsLost: 10,
        legalBallsBowled: 472, // 78.4 overs
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Usman K.': { name: 'Usman K.', runs: 38, balls: 92, fours: 4, sixes: 0, isOut: true, dismissalInfo: 'c Pant b Shami', strikeRate: 41.3 },
          'Steven S.': { name: 'Steven S.', runs: 91, balls: 164, fours: 10, sixes: 1, isOut: true, dismissalInfo: 'lbw b Bumrah', strikeRate: 55.5 },
          'Marnus L.': { name: 'Marnus L.', runs: 42, balls: 88, fours: 5, sixes: 0, isOut: true, dismissalInfo: 'c Rahul b Jadeja', strikeRate: 47.7 },
          'Travis H.': { name: 'Travis H.', runs: 28, balls: 31, fours: 3, sixes: 1, isOut: true, dismissalInfo: 'b Bumrah', strikeRate: 90.3 },
          'Pat C.': { name: 'Pat C.', runs: 16, balls: 24, fours: 2, sixes: 0, isOut: true, dismissalInfo: 'c Kohli b Bumrah', strikeRate: 66.7 },
        },
        bowlers: {
          'Jasprit B.': { name: 'Jasprit B.', overs: 22, balls: 4, maidens: 7, runs: 48, wickets: 5, economy: 2.12, wides: 1, noBalls: 0 },
          'Mohammed S.': { name: 'Mohammed S.', overs: 20, balls: 0, maidens: 4, runs: 64, wickets: 2, economy: 3.2, wides: 0, noBalls: 1 },
          'Ravindra J.': { name: 'Ravindra J.', overs: 18, balls: 0, maidens: 3, runs: 52, wickets: 2, economy: 2.88, wides: 0, noBalls: 0 },
          'Ravichandran A.': { name: 'Ravichandran A.', overs: 18, balls: 0, maidens: 2, runs: 68, wickets: 1, economy: 3.77, wides: 0, noBalls: 0 },
        },
        strikerName: 'Josh H.',
        nonStrikerName: 'Scott B.',
        currentBowlerName: 'Jasprit B.',
        extras: { wides: 1, noBalls: 1, byes: 4, legByes: 4, penalties: 0, total: 10 },
        fallOfWickets: [
          { wicketNumber: 1, score: 58, over: '21.3', playerOut: 'Usman K.' },
          { wicketNumber: 2, score: 142, over: '46.1', playerOut: 'Marnus L.' },
          { wicketNumber: 3, score: 185, over: '61.4', playerOut: 'Travis H.' },
          { wicketNumber: 4, score: 212, over: '70.2', playerOut: 'Steven S.' },
        ],
        isCompleted: true,
      },
      innings3: {
        teamName: 'India',
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        totalRuns: 214,
        wicketsLost: 10,
        legalBallsBowled: 399, // 66.3 overs
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Rohit S.': { name: 'Rohit S.', runs: 52, balls: 88, fours: 6, sixes: 1, isOut: true, dismissalInfo: 'c Smith b Cummins', strikeRate: 59.1 },
          'Yashasvi J.': { name: 'Yashasvi J.', runs: 24, balls: 36, fours: 3, sixes: 0, isOut: true, dismissalInfo: 'c Carey b Starc', strikeRate: 66.7 },
          'Virat K.': { name: 'Virat K.', runs: 35, balls: 64, fours: 4, sixes: 0, isOut: true, dismissalInfo: 'lbw b Lyon', strikeRate: 54.7 },
          'Rishabh P.': { name: 'Rishabh P.', runs: 68, balls: 72, fours: 8, sixes: 3, isOut: true, dismissalInfo: 'c Head b Cummins', strikeRate: 94.4 },
          'Ravindra J.': { name: 'Ravindra J.', runs: 22, balls: 45, fours: 2, sixes: 0, isOut: true, dismissalInfo: 'b Hazlewood', strikeRate: 48.9 },
        },
        bowlers: {
          'Pat C.': { name: 'Pat C.', overs: 18, balls: 3, maidens: 4, runs: 56, wickets: 4, economy: 3.03, wides: 1, noBalls: 0 },
          'Mitchell S.': { name: 'Mitchell S.', overs: 16, balls: 0, maidens: 2, runs: 48, wickets: 3, economy: 3.0, wides: 0, noBalls: 1 },
          'Josh H.': { name: 'Josh H.', overs: 16, balls: 0, maidens: 3, runs: 52, wickets: 2, economy: 3.25, wides: 0, noBalls: 0 },
          'Nathan L.': { name: 'Nathan L.', overs: 16, balls: 0, maidens: 1, runs: 54, wickets: 1, economy: 3.38, wides: 0, noBalls: 0 },
        },
        strikerName: 'Jasprit B.',
        nonStrikerName: 'Mohammed S.',
        currentBowlerName: 'Pat C.',
        extras: { wides: 2, noBalls: 2, byes: 5, legByes: 4, penalties: 0, total: 13 },
        fallOfWickets: [
          { wicketNumber: 1, score: 36, over: '9.2', playerOut: 'Yashasvi J.' },
          { wicketNumber: 2, score: 98, over: '29.4', playerOut: 'Rohit S.' },
          { wicketNumber: 3, score: 145, over: '44.1', playerOut: 'Virat K.' },
          { wicketNumber: 4, score: 198, over: '61.3', playerOut: 'Rishabh P.' },
        ],
        isCompleted: true,
      },
      innings4: {
        teamName: 'Australia',
        battingTeam: 'Australia',
        bowlingTeam: 'India',
        totalRuns: 204,
        wicketsLost: 10,
        legalBallsBowled: 373, // 62.1 overs
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Usman K.': { name: 'Usman K.', runs: 24, balls: 52, fours: 3, sixes: 0, isOut: true, dismissalInfo: 'c Pant b Shami', strikeRate: 46.2 },
          'Steven S.': { name: 'Steven S.', runs: 64, balls: 118, fours: 7, sixes: 1, isOut: true, dismissalInfo: 'b Bumrah', strikeRate: 54.2 },
          'Marnus L.': { name: 'Marnus L.', runs: 18, balls: 42, fours: 2, sixes: 0, isOut: true, dismissalInfo: 'lbw b Ashwin', strikeRate: 42.9 },
          'Travis H.': { name: 'Travis H.', runs: 55, balls: 68, fours: 6, sixes: 2, isOut: true, dismissalInfo: 'c Kohli b Bumrah', strikeRate: 80.9 },
          'Pat C.': { name: 'Pat C.', runs: 12, balls: 20, fours: 1, sixes: 0, isOut: true, dismissalInfo: 'b Bumrah', strikeRate: 60.0 },
        },
        bowlers: {
          'Jasprit B.': { name: 'Jasprit B.', overs: 18, balls: 1, maidens: 5, runs: 52, wickets: 6, economy: 2.86, wides: 0, noBalls: 0 },
          'Mohammed S.': { name: 'Mohammed S.', overs: 16, balls: 0, maidens: 3, runs: 61, wickets: 3, economy: 3.81, wides: 1, noBalls: 1 },
          'Ravindra J.': { name: 'Ravindra J.', overs: 14, balls: 0, maidens: 2, runs: 42, wickets: 0, economy: 3.0, wides: 0, noBalls: 0 },
          'Ravichandran A.': { name: 'Ravichandran A.', overs: 14, balls: 0, maidens: 2, runs: 45, wickets: 1, economy: 3.21, wides: 0, noBalls: 0 },
        },
        strikerName: 'Josh H.',
        nonStrikerName: 'Scott B.',
        currentBowlerName: 'Jasprit B.',
        extras: { wides: 1, noBalls: 1, byes: 2, legByes: 0, penalties: 0, total: 4 },
        fallOfWickets: [
          { wicketNumber: 1, score: 32, over: '12.1', playerOut: 'Usman K.' },
          { wicketNumber: 2, score: 76, over: '25.3', playerOut: 'Marnus L.' },
          { wicketNumber: 3, score: 154, over: '48.2', playerOut: 'Travis H.' },
          { wicketNumber: 4, score: 188, over: '57.4', playerOut: 'Steven S.' },
        ],
        isCompleted: true,
      },
      targetRuns: 259,
      status: 'COMPLETED',
      winner: 'India',
      resultText: 'India won by 54 runs in a 4-innings Test Match classic!',
      aiSummary: {
        potm: 'Jasprit B.',
        potmReason: 'Match-defining haul of 11 wickets (5/48 & 6/52) that broke Australian resistance across both innings',
        bestBatter: 'Virat K.',
        bestBatterReason: 'Superb 102 in the first innings followed by a crucial 35 in the second',
        bestBowler: 'Jasprit B.',
        bestBowlerReason: '11 wickets in the match with an economy under 2.50',
        bestFielder: 'Rishabh P.',
        bestFielderReason: '6 catches behind the stumps across both innings',
        narrative: 'In an epic 4-innings Test encounter, India posted 286 and 214 to set Australia a 4th innings target of 259. Jasprit Bumrah proved the hero with 11 wickets in the match, sealing a memorable 54-run Test triumph.',
        generatedAt: now - 7200000,
      },
      createdAt: now - 86400000,
      updatedAt: now - 7200000,
    };

    // 2. Tournament Showcase with pre-calculated Points Table & NRR
    const tournId = 'tourn_gpl_2026';
    const tournTeams = ['Spartans', 'Strikers', 'Titans', 'Knights'];
    const tournrules = {
      totalOvers: 6,
      ballsPerOver: 4,
      playersPerTeam: 6,
      maxOversPerBowler: 2,
      lastManStanding: true,
      wideRuns: 1,
      noBallRuns: 1,
      reBallWide: true,
      reBallNoBall: true,
    };

    const tournMatch1: MatchRecord = {
      id: 'tourn_match_1',
      tournamentId: tournId,
      matchType: 'BOX_GULLY',
      rules: tournrules,
      teamA: {
        name: 'Spartans',
        players: ['Sameer K.', 'Rahul V.', 'Amit S.', 'Vikram P.', 'Rohit M.', 'Deepak T.'],
      },
      teamB: {
        name: 'Strikers',
        players: ['Kunal D.', 'Sunny G.', 'Fahad B.', 'Zayd R.', 'Tanmay N.', 'Arjun B.'],
      },
      tossWinner: 'Spartans',
      tossDecision: 'BAT',
      currentInningsIndex: 2,
      innings1: {
        teamName: 'Spartans',
        battingTeam: 'Spartans',
        bowlingTeam: 'Strikers',
        totalRuns: 42,
        wicketsLost: 3,
        legalBallsBowled: 24,
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Sameer K.': { name: 'Sameer K.', runs: 28, balls: 11, fours: 3, sixes: 2, isOut: true, strikeRate: 254.5 },
          'Rahul V.': { name: 'Rahul V.', runs: 12, balls: 8, fours: 1, sixes: 1, isOut: true, strikeRate: 150 },
        },
        bowlers: {
          'Kunal D.': { name: 'Kunal D.', overs: 2, balls: 0, maidens: 0, runs: 18, wickets: 2, economy: 9.0, wides: 1, noBalls: 0 },
          'Sunny G.': { name: 'Sunny G.', overs: 2, balls: 0, maidens: 0, runs: 14, wickets: 1, economy: 7.0, wides: 0, noBalls: 0 },
        },
        strikerName: 'Amit S.',
        nonStrikerName: 'Vikram P.',
        currentBowlerName: 'Sunny G.',
        extras: { wides: 2, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 2 },
        fallOfWickets: [
          { wicketNumber: 1, score: 22, over: '2.3', playerOut: 'Rahul V.' },
          { wicketNumber: 2, score: 38, over: '5.1', playerOut: 'Sameer K.' },
        ],
        isCompleted: true,
      },
      innings2: {
        teamName: 'Strikers',
        battingTeam: 'Strikers',
        bowlingTeam: 'Spartans',
        totalRuns: 36,
        wicketsLost: 4,
        legalBallsBowled: 24,
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Kunal D.': { name: 'Kunal D.', runs: 20, balls: 10, fours: 2, sixes: 1, isOut: true, strikeRate: 200 },
          'Sunny G.': { name: 'Sunny G.', runs: 11, balls: 8, fours: 1, sixes: 0, isOut: false, strikeRate: 137.5 },
        },
        bowlers: {
          'Rohit M.': { name: 'Rohit M.', overs: 2, balls: 0, maidens: 0, runs: 12, wickets: 2, economy: 6.0, wides: 1, noBalls: 0 },
          'Sameer K.': { name: 'Sameer K.', overs: 2, balls: 0, maidens: 0, runs: 16, wickets: 1, economy: 8.0, wides: 0, noBalls: 0 },
        },
        strikerName: 'Sunny G.',
        nonStrikerName: 'Fahad B.',
        currentBowlerName: 'Rohit M.',
        extras: { wides: 1, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 1 },
        fallOfWickets: [
          { wicketNumber: 1, score: 14, over: '1.4', playerOut: 'Kunal D.' },
        ],
        isCompleted: true,
      },
      targetRuns: 43,
      status: 'COMPLETED',
      winner: 'Spartans',
      resultText: 'Spartans won by 6 runs in a tense box cricket opener!',
      aiSummary: {
        potm: 'Sameer K.',
        potmReason: 'All-round blitz: Smashed 28 off 11 balls and picked up 1 key wicket',
        bestBatter: 'Sameer K.',
        bestBatterReason: 'Top score of 28 (11b) setting a formidable target',
        bestBowler: 'Rohit M.',
        bestBowlerReason: '2 wickets for 12 runs in 2 crucial overs',
        bestFielder: 'Amit S.',
        bestFielderReason: 'Sensational direct-hit run out',
        narrative: 'Spartans defended 42 successfully as Rohit M. bowled a disciplined final spell to deny the Strikers by 6 runs.',
        generatedAt: now - 3600000,
      },
      createdAt: now - 7200000,
      updatedAt: now - 3600000,
    };

    const tournament: TournamentRecord = {
      id: tournId,
      name: 'Gully Premier League 2026',
      format: 'ROUND_ROBIN',
      rules: tournrules,
      teams: tournTeams,
      fixtures: [
        {
          id: 'fix_1',
          roundName: 'League Match 1',
          teamA: 'Spartans',
          teamB: 'Strikers',
          matchId: 'tourn_match_1',
          winner: 'Spartans',
          isCompleted: true,
        },
        {
          id: 'fix_2',
          roundName: 'League Match 2',
          teamA: 'Titans',
          teamB: 'Knights',
          isCompleted: false,
        },
        {
          id: 'fix_3',
          roundName: 'League Match 3',
          teamA: 'Spartans',
          teamB: 'Titans',
          isCompleted: false,
        },
        {
          id: 'fix_4',
          roundName: 'League Match 4',
          teamA: 'Strikers',
          teamB: 'Knights',
          isCompleted: false,
        },
        {
          id: 'fix_5',
          roundName: 'League Match 5',
          teamA: 'Spartans',
          teamB: 'Knights',
          isCompleted: false,
        },
        {
          id: 'fix_6',
          roundName: 'League Match 6',
          teamA: 'Strikers',
          teamB: 'Titans',
          isCompleted: false,
        },
      ],
      standings: [
        {
          teamName: 'Spartans',
          played: 1,
          won: 1,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 2,
          runsScored: 42,
          oversFaced: 6,
          runsConceded: 36,
          oversBowled: 6,
          nrr: 1.0,
        },
        {
          teamName: 'Titans',
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          nrr: 0,
        },
        {
          teamName: 'Knights',
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsScored: 0,
          oversFaced: 0,
          runsConceded: 0,
          oversBowled: 0,
          nrr: 0,
        },
        {
          teamName: 'Strikers',
          played: 1,
          won: 0,
          lost: 1,
          tied: 0,
          noResult: 0,
          points: 0,
          runsScored: 36,
          oversFaced: 6,
          runsConceded: 42,
          oversBowled: 6,
          nrr: -1.0,
        },
      ],
      orangeCap: {
        playerName: 'Sameer K.',
        teamName: 'Spartans',
        value: 28,
      },
      purpleCap: {
        playerName: 'Rohit M.',
        teamName: 'Spartans',
        value: 2,
      },
      status: 'ONGOING',
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    };

    // Save initial showcase records
    await db.matches.bulkPut([testMatch, tournMatch1]);
    await db.tournaments.put(tournament);

    console.log('✅ CricFlex initial showcase matches and tournament seeded successfully.');
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}
