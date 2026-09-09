import type {
  TournamentRecord,
  TournamentTeamStats,
  TournamentFixture,
  TournamentLeader,
  MatchRecord,
} from '../types/cricket';
import { oversToDecimal } from './scoringEngine';

/**
 * Generate Round-Robin fixtures for a list of teams
 */
export function generateRoundRobinFixtures(teams: string[]): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  let matchCounter = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: `fix_${Date.now()}_${matchCounter}`,
        roundName: `League Match ${matchCounter}`,
        teamA: teams[i],
        teamB: teams[j],
        isCompleted: false,
      });
      matchCounter++;
    }
  }

  return fixtures;
}

/**
 * Recalculate Tournament Standings and Leaderboards from completed matches
 */
export function recalculateTournamentStandings(
  tournament: TournamentRecord,
  completedMatches: MatchRecord[]
): {
  standings: TournamentTeamStats[];
  orangeCap?: TournamentLeader;
  purpleCap?: TournamentLeader;
} {
  const teamMap: Record<string, TournamentTeamStats> = {};

  // Initialize all teams
  tournament.teams.forEach((team) => {
    teamMap[team] = {
      teamName: team,
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
    };
  });

  const playerRuns: Record<string, { runs: number; team: string }> = {};
  const playerWickets: Record<string, { wickets: number; team: string }> = {};

  // Process all matches linked to this tournament
  completedMatches.forEach((match) => {
    if (match.status !== 'COMPLETED') return;

    const { innings1, innings2, winner, rules } = match;
    const rawTeam1 = innings1.battingTeam;
    const rawTeam2 = innings1.bowlingTeam;

    const findTeamKey = (name?: string): string | undefined => {
      if (!name) return undefined;
      const clean = name.trim().toLowerCase();
      return Object.keys(teamMap).find((k) => k.trim().toLowerCase() === clean);
    };

    const team1 = findTeamKey(rawTeam1) || findTeamKey(match.teamA.name);
    const team2 = findTeamKey(rawTeam2) || findTeamKey(match.teamB.name);

    if (!team1 || !team2) return;

    teamMap[team1].played += 1;
    teamMap[team2].played += 1;

    // Award Points
    const winnerKey = findTeamKey(winner);
    if (winner === 'TIE') {
      teamMap[team1].tied += 1;
      teamMap[team2].tied += 1;
      teamMap[team1].points += 1;
      teamMap[team2].points += 1;
    } else if (winnerKey === team1) {
      teamMap[team1].won += 1;
      teamMap[team2].lost += 1;
      teamMap[team1].points += 2;
    } else if (winnerKey === team2) {
      teamMap[team2].won += 1;
      teamMap[team1].lost += 1;
      teamMap[team2].points += 2;
    }

    // NRR Calculation Helpers
    // In ICC rules, if a team is all out, their full quota of overs is used
    const maxWickets = rules.lastManStanding ? rules.playersPerTeam : rules.playersPerTeam - 1;

    const computeEffectiveOvers = (legalBalls: number, wickets: number) => {
      if (wickets >= maxWickets) {
        return rules.totalOvers; // full quota
      }
      return oversToDecimal(legalBalls, rules.ballsPerOver);
    };

    // Innings 1
    const inn1Overs = computeEffectiveOvers(innings1.legalBallsBowled, innings1.wicketsLost);
    teamMap[team1].runsScored += innings1.totalRuns;
    teamMap[team1].oversFaced += inn1Overs;

    teamMap[team2].runsConceded += innings1.totalRuns;
    teamMap[team2].oversBowled += inn1Overs;

    // Innings 2 (if present)
    if (innings2) {
      const inn2Overs = computeEffectiveOvers(innings2.legalBallsBowled, innings2.wicketsLost);
      teamMap[team2].runsScored += innings2.totalRuns;
      teamMap[team2].oversFaced += inn2Overs;

      teamMap[team1].runsConceded += innings2.totalRuns;
      teamMap[team1].oversBowled += inn2Overs;
    }

    // Tally individual stats for Orange & Purple cap
    const tallyInnings = (inn: typeof innings1, battingTeam: string, bowlingTeam: string) => {
      Object.values(inn.batters).forEach((b) => {
        if (!playerRuns[b.name]) playerRuns[b.name] = { runs: 0, team: battingTeam };
        playerRuns[b.name].runs += b.runs;
      });

      Object.values(inn.bowlers).forEach((bw) => {
        if (!playerWickets[bw.name]) playerWickets[bw.name] = { wickets: 0, team: bowlingTeam };
        playerWickets[bw.name].wickets += bw.wickets;
      });
    };

    tallyInnings(innings1, team1, team2);
    if (innings2) {
      tallyInnings(innings2, innings2.battingTeam, innings2.bowlingTeam);
    }
  });

  // Calculate NRR for each team
  // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
  const standings = Object.values(teamMap).map((team) => {
    const forRate = team.oversFaced > 0 ? team.runsScored / team.oversFaced : 0;
    const againstRate = team.oversBowled > 0 ? team.runsConceded / team.oversBowled : 0;
    const nrr = parseFloat((forRate - againstRate).toFixed(3));
    return { ...team, nrr };
  });

  // Sort standings: Points desc, then NRR desc, then Won desc
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    return b.won - a.won;
  });

  // Determine Orange Cap (Most runs)
  let orangeCap: TournamentLeader | undefined = undefined;
  const sortedRuns = Object.entries(playerRuns).sort((a, b) => b[1].runs - a[1].runs);
  if (sortedRuns.length > 0 && sortedRuns[0][1].runs > 0) {
    orangeCap = {
      playerName: sortedRuns[0][0],
      teamName: sortedRuns[0][1].team,
      value: sortedRuns[0][1].runs,
    };
  }

  // Determine Purple Cap (Most wickets)
  let purpleCap: TournamentLeader | undefined = undefined;
  const sortedWickets = Object.entries(playerWickets).sort((a, b) => b[1].wickets - a[1].wickets);
  if (sortedWickets.length > 0 && sortedWickets[0][1].wickets > 0) {
    purpleCap = {
      playerName: sortedWickets[0][0],
      teamName: sortedWickets[0][1].team,
      value: sortedWickets[0][1].wickets,
    };
  }

  return { standings, orangeCap, purpleCap };
}

/**
 * Automatically update tournament fixtures, points table, NRR, and caps when a match completes
 */
export async function updateTournamentOnMatchCompletion(
  match: MatchRecord,
  dbInstance: any
): Promise<void> {
  if (!match.tournamentId) return;

  try {
    const tournament = await dbInstance.tournaments.get(match.tournamentId);
    if (!tournament) return;

    const normA = match.teamA.name.trim().toLowerCase();
    const normB = match.teamB.name.trim().toLowerCase();

    // Match fixture
    let fixtureUpdated = false;
    tournament.fixtures.forEach((f: TournamentFixture) => {
      if (f.matchId === match.id) {
        f.isCompleted = true;
        f.winner = match.winner;
        fixtureUpdated = true;
      } else if (!f.isCompleted && !fixtureUpdated) {
        const fA = f.teamA.trim().toLowerCase();
        const fB = f.teamB.trim().toLowerCase();
        if ((fA === normA && fB === normB) || (fA === normB && fB === normA)) {
          f.isCompleted = true;
          f.matchId = match.id;
          f.winner = match.winner;
          fixtureUpdated = true;
        }
      }
    });

    // Retrieve all completed matches for this tournament
    const allMatches: MatchRecord[] = await dbInstance.matches
      .where('tournamentId')
      .equals(tournament.id)
      .toArray();

    const idx = allMatches.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      allMatches[idx] = match;
    } else {
      allMatches.push(match);
    }

    const { standings, orangeCap, purpleCap } = recalculateTournamentStandings(
      tournament,
      allMatches
    );

    const allFixturesDone = tournament.fixtures.every((f: TournamentFixture) => f.isCompleted);

    const updatedTournament: TournamentRecord = {
      ...tournament,
      standings,
      orangeCap,
      purpleCap,
      status: allFixturesDone ? 'COMPLETED' : 'ONGOING',
      winner: allFixturesDone ? standings[0]?.teamName : tournament.winner,
      updatedAt: Date.now(),
    };

    await dbInstance.tournaments.put(updatedTournament);
  } catch (err) {
    console.error('Failed to sync tournament on match completion:', err);
  }
}
