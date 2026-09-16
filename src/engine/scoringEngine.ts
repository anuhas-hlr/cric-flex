import type {
  MatchRecord,
  MatchRules,
  InningsState,
  BallEvent,
  ExtraType,
  DismissalType,
  BatterStats,
  BowlerStats,
} from '../types/cricket';

/**
 * Format legal balls into standard cricket overs string (e.g. 4.2 or 0.3)
 */
export function formatOvers(legalBalls: number, ballsPerOver: number): string {
  const overs = Math.floor(legalBalls / ballsPerOver);
  const remainingBalls = legalBalls % ballsPerOver;
  return `${overs}.${remainingBalls}`;
}

/**
 * Convert legal balls into decimal overs for run rate calculations
 */
export function oversToDecimal(legalBalls: number, ballsPerOver: number): number {
  if (legalBalls === 0) return 0;
  return legalBalls / ballsPerOver;
}

/**
 * Calculate Run Rate
 */
export function calculateRunRate(runs: number, legalBalls: number, ballsPerOver: number): number {
  const decOvers = oversToDecimal(legalBalls, ballsPerOver);
  if (decOvers === 0) return 0;
  return parseFloat((runs / decOvers).toFixed(2));
}

/**
 * Check if the current over has completed
 */
export function isOverComplete(legalBallsInOver: number, ballsPerOver: number): boolean {
  return legalBallsInOver >= ballsPerOver;
}

/**
 * Check if the batting team is all out
 */
export function isAllOut(wicketsLost: number, rules: MatchRules): boolean {
  const maxWickets = rules.lastManStanding
    ? rules.playersPerTeam
    : rules.playersPerTeam - 1;
  return wicketsLost >= maxWickets;
}

/**
 * Check if maximum overs have been bowled
 */
export function areOversExhausted(legalBallsBowled: number, rules: MatchRules): boolean {
  return legalBallsBowled >= rules.totalOvers * rules.ballsPerOver;
}

/**
 * Initialize a fresh InningsState
 */
export function createInitialInnings(
  battingTeam: string,
  bowlingTeam: string,
  battingPlayers: string[],
  bowlingPlayers: string[]
): InningsState {
  const strikerName = battingPlayers[0] || 'Batter 1';
  const nonStrikerName = battingPlayers[1] || 'Batter 2';
  const currentBowlerName = bowlingPlayers[0] || 'Bowler 1';

  const batters: Record<string, BatterStats> = {};
  battingPlayers.forEach((player) => {
    batters[player] = {
      name: player,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      strikeRate: 0,
    };
  });

  const bowlers: Record<string, BowlerStats> = {};
  bowlingPlayers.forEach((player) => {
    bowlers[player] = {
      name: player,
      overs: 0,
      balls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      wides: 0,
      noBalls: 0,
    };
  });

  return {
    teamName: battingTeam,
    battingTeam,
    bowlingTeam,
    totalRuns: 0,
    wicketsLost: 0,
    legalBallsBowled: 0,
    currentOverBalls: [],
    allBalls: [],
    batters,
    bowlers,
    strikerName,
    nonStrikerName,
    currentBowlerName,
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalties: 0,
      total: 0,
    },
    fallOfWickets: [],
    isCompleted: false,
    battingOrder: [strikerName, nonStrikerName].filter(Boolean),
  };
}

export interface RecordBallParams {
  runsOffBat: number;
  extraType?: ExtraType;
  extraRuns?: number;
  wicket?: {
    type: DismissalType;
    playerOut: string;
    fielderName?: string;
    runsCompleted?: number;
  };
  newBatterName?: string; // If wicket fell and next batter selected
  newBowlerName?: string; // If over ended and next bowler selected
}

/**
 * Process a delivery and return the updated innings state
 */
export function processBall(
  innings: InningsState,
  rules: MatchRules,
  params: RecordBallParams
): { updatedInnings: InningsState; overFinished: boolean; inningsFinished: boolean; message?: string } {
  // Deep clone to avoid direct mutation
  const current = structuredClone(innings) as InningsState;

  const extraType = params.extraType || 'NONE';
  const extraRuns = params.extraRuns ?? (
    extraType === 'WIDE' ? rules.wideRuns :
    extraType === 'NO_BALL' ? rules.noBallRuns :
    0
  );
  const runsOffBat = params.runsOffBat;
  const totalRunsThisBall = runsOffBat + extraRuns;

  // Determine if this delivery is a legal ball
  let isLegal = true;
  if (extraType === 'WIDE' && rules.reBallWide) {
    isLegal = false;
  } else if (extraType === 'NO_BALL' && rules.reBallNoBall) {
    isLegal = false;
  }

  // Ensure batter record exists
  if (!current.batters[current.strikerName]) {
    current.batters[current.strikerName] = {
      name: current.strikerName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      strikeRate: 0,
    };
  }

  // Ensure bowler record exists
  if (!current.bowlers[current.currentBowlerName]) {
    current.bowlers[current.currentBowlerName] = {
      name: current.currentBowlerName,
      overs: 0,
      balls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      economy: 0,
      wides: 0,
      noBalls: 0,
    };
  }

  const striker = current.batters[current.strikerName];
  const bowler = current.bowlers[current.currentBowlerName];

  // Update total score
  current.totalRuns += totalRunsThisBall;

  // Update extras breakdown
  if (extraType === 'WIDE') {
    current.extras.wides += extraRuns;
    bowler.wides += 1;
    bowler.runs += extraRuns;
  } else if (extraType === 'NO_BALL') {
    current.extras.noBalls += extraRuns;
    bowler.noBalls += 1;
    bowler.runs += extraRuns + runsOffBat;
  } else if (extraType === 'BYE') {
    current.extras.byes += extraRuns;
    // Byes do not count against bowler's runs conceded
  } else if (extraType === 'LEG_BYE') {
    current.extras.legByes += extraRuns;
    // Leg byes do not count against bowler's runs conceded
  } else if (extraType === 'PENALTY') {
    current.extras.penalties += extraRuns;
  } else {
    // Normal ball
    bowler.runs += runsOffBat;
  }
  current.extras.total += extraRuns;

  // Update batter stats (Wide does not count as ball faced by batter)
  if (extraType !== 'WIDE') {
    striker.balls += 1;
    striker.runs += runsOffBat;
    if (runsOffBat === 4) striker.fours += 1;
    if (runsOffBat === 6) striker.sixes += 1;
    striker.strikeRate = striker.balls > 0 ? parseFloat(((striker.runs / striker.balls) * 100).toFixed(1)) : 0;
  }

  // Wicket processing
  let wicketDetail = undefined;
  if (params.wicket) {
    const { type, playerOut, fielderName, runsCompleted } = params.wicket;
    current.wicketsLost += 1;

    // Attribute dismissal info
    const outBatter = current.batters[playerOut] || striker;
    outBatter.isOut = true;

    let dismissalText = '';
    if (type === 'BOWLED') {
      dismissalText = `b ${current.currentBowlerName}`;
      bowler.wickets += 1;
    } else if (type === 'CAUGHT') {
      dismissalText = fielderName ? `c ${fielderName} b ${current.currentBowlerName}` : `c & b ${current.currentBowlerName}`;
      bowler.wickets += 1;
    } else if (type === 'LBW') {
      dismissalText = `lbw b ${current.currentBowlerName}`;
      bowler.wickets += 1;
    } else if (type === 'STUMPED') {
      dismissalText = fielderName ? `st ${fielderName} b ${current.currentBowlerName}` : `st b ${current.currentBowlerName}`;
      bowler.wickets += 1;
    } else if (type === 'HIT_WICKET') {
      dismissalText = `hit wicket b ${current.currentBowlerName}`;
      bowler.wickets += 1;
    } else if (type === 'RUN_OUT') {
      dismissalText = fielderName ? `run out (${fielderName})` : 'run out';
      // Run outs do NOT credit bowler with a wicket
    } else {
      dismissalText = `${type.toLowerCase().replace('_', ' ')}`;
    }
    outBatter.dismissalInfo = dismissalText;

    const overString = formatOvers(current.legalBallsBowled + (isLegal ? 1 : 0), rules.ballsPerOver);
    current.fallOfWickets.push({
      wicketNumber: current.wicketsLost,
      score: current.totalRuns,
      over: overString,
      playerOut,
    });

    wicketDetail = {
      type,
      playerOut,
      bowlerName: current.currentBowlerName,
      fielderName,
      runsCompleted,
    };

    // If a new batter is designated, slot them in and record in batting order
    if (params.newBatterName) {
      if (playerOut === current.strikerName) {
        current.strikerName = params.newBatterName;
      } else {
        current.nonStrikerName = params.newBatterName;
      }
      if (!current.battingOrder) {
        current.battingOrder = [];
      }
      if (!current.battingOrder.includes(params.newBatterName)) {
        current.battingOrder.push(params.newBatterName);
      }
    }
  }

  // Ensure current active batters are in batting order
  if (!current.battingOrder) {
    current.battingOrder = [];
  }
  if (current.strikerName && !current.battingOrder.includes(current.strikerName)) {
    current.battingOrder.push(current.strikerName);
  }
  if (current.nonStrikerName && !current.battingOrder.includes(current.nonStrikerName)) {
    current.battingOrder.push(current.nonStrikerName);
  }

  // Create BallEvent record
  const currentLegalBallsInOver = current.currentOverBalls.filter((b) => b.isLegal).length;
  const ballNumberInOver = isLegal ? currentLegalBallsInOver + 1 : currentLegalBallsInOver;

  const ballEvent: BallEvent = {
    ballId: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    overIndex: Math.floor(current.legalBallsBowled / rules.ballsPerOver),
    legalBallNumber: ballNumberInOver,
    isLegal,
    runsOffBat,
    extraType,
    extraRuns,
    totalRuns: totalRunsThisBall,
    striker: current.strikerName,
    nonStriker: current.nonStrikerName,
    bowler: current.currentBowlerName,
    wicket: wicketDetail,
    timestamp: Date.now(),
  };

  current.currentOverBalls.push(ballEvent);
  current.allBalls.push(ballEvent);

  if (isLegal) {
    current.legalBallsBowled += 1;
    bowler.balls += 1;
    if (bowler.balls >= rules.ballsPerOver) {
      bowler.overs += 1;
      bowler.balls = 0;
    }
  }

  // Calculate bowler economy
  const totalBowlerLegalBalls = bowler.overs * rules.ballsPerOver + bowler.balls;
  const bowlerOversDecimal = oversToDecimal(totalBowlerLegalBalls, rules.ballsPerOver);
  bowler.economy = bowlerOversDecimal > 0 ? parseFloat((bowler.runs / bowlerOversDecimal).toFixed(2)) : 0;

  // Strike Rotation Logic
  // In Last-Man Standing, strike only stops rotating once down to the solo last batsman
  const isSoloBatting = rules.lastManStanding && current.wicketsLost >= rules.playersPerTeam - 1;
  const runsForRotation = runsOffBat + (extraType === 'BYE' || extraType === 'LEG_BYE' ? extraRuns : 0);
  const shouldRotateStrikeFromRuns = runsForRotation % 2 !== 0;

  if (shouldRotateStrikeFromRuns && !isSoloBatting && current.nonStrikerName) {
    const temp = current.strikerName;
    current.strikerName = current.nonStrikerName;
    current.nonStrikerName = temp;
  }

  // Check Over Completion
  const legalBallsInThisOver = current.currentOverBalls.filter((b) => b.isLegal).length;
  const overFinished = isOverComplete(legalBallsInThisOver, rules.ballsPerOver);

  if (overFinished) {
    // Check if maiden over (0 runs conceded by bowler in this over)
    const runsInThisOver = current.currentOverBalls.reduce((acc, b) => {
      return acc + (b.extraType === 'BYE' || b.extraType === 'LEG_BYE' ? 0 : b.totalRuns);
    }, 0);
    if (runsInThisOver === 0) {
      bowler.maidens += 1;
    }

    // Reset current over balls
    current.currentOverBalls = [];

    // Switch ends for batters at the end of the over
    if (!isSoloBatting && current.nonStrikerName) {
      const temp = current.strikerName;
      current.strikerName = current.nonStrikerName;
      current.nonStrikerName = temp;
    }

    // Set new bowler if provided
    if (params.newBowlerName) {
      current.currentBowlerName = params.newBowlerName;
    }
  }

  // Check Innings Completion (All Out or Max Overs reached)
  const inningsFinished =
    isAllOut(current.wicketsLost, rules) ||
    areOversExhausted(current.legalBallsBowled, rules);

  if (inningsFinished) {
    current.isCompleted = true;
  }

  return {
    updatedInnings: current,
    overFinished,
    inningsFinished,
  };
}

/**
 * Evaluate Match Result (supports both 2-innings limited overs and 4-innings Test matches)
 */
export function evaluateMatchResult(match: MatchRecord): { winner: string; resultText: string; isCompleted: boolean } {
  const { innings1, innings2, innings3, innings4, rules, targetRuns, matchType } = match;
  const maxWickets = rules.lastManStanding ? rules.playersPerTeam : rules.playersPerTeam - 1;

  // -------------------------------------------------------------
  // TEST MATCH LOGIC (2 Innings Per Team = 4 Innings Total)
  // -------------------------------------------------------------
  if (matchType === 'TEST') {
    // 1st Innings
    if (match.currentInningsIndex === 1) {
      if (innings1.isCompleted) {
        return { winner: '', resultText: '1st Innings Completed', isCompleted: false };
      }
      return { winner: '', resultText: '1st Innings in Progress', isCompleted: false };
    }

    // 2nd Innings (Team B's 1st Innings)
    if (match.currentInningsIndex === 2) {
      if (!innings2) {
        return { winner: '', resultText: '1st Innings Completed', isCompleted: false };
      }

      const diff = innings2.totalRuns - innings1.totalRuns;
      const statusText =
        diff > 0
          ? `${innings2.battingTeam} lead by ${diff} run${diff !== 1 ? 's' : ''}`
          : diff < 0
          ? `${innings2.battingTeam} trail by ${Math.abs(diff)} run${Math.abs(diff) !== 1 ? 's' : ''}`
          : 'Scores level';

      if (innings2.isCompleted || isAllOut(innings2.wicketsLost, rules) || areOversExhausted(innings2.legalBallsBowled, rules)) {
        return { winner: '', resultText: `2nd Innings Completed (${statusText})`, isCompleted: false };
      }
      return { winner: '', resultText: `2nd Innings in Progress (${statusText})`, isCompleted: false };
    }

    // 3rd Innings (Team A's 2nd Innings)
    if (match.currentInningsIndex === 3) {
      if (!innings3) {
        return { winner: '', resultText: '3rd Innings starting', isCompleted: false };
      }

      const teamATotal = innings1.totalRuns + innings3.totalRuns;
      const teamBInn1 = innings2 ? innings2.totalRuns : 0;
      const diff = teamATotal - teamBInn1;
      const statusText =
        diff > 0
          ? `${innings3.battingTeam} lead by ${diff} run${diff !== 1 ? 's' : ''}`
          : diff < 0
          ? `${innings3.battingTeam} trail by ${Math.abs(diff)} run${Math.abs(diff) !== 1 ? 's' : ''}`
          : 'Scores level';

      const isInn3Done =
        innings3.isCompleted ||
        isAllOut(innings3.wicketsLost, rules) ||
        areOversExhausted(innings3.legalBallsBowled, rules);

      if (isInn3Done) {
        // Check for Innings Defeat: Team A's combined 2 innings total is less than Team B's 1st innings total
        if (teamATotal < teamBInn1) {
          const margin = teamBInn1 - teamATotal;
          const winner = innings2 ? innings2.battingTeam : match.teamB.name;
          const resultText = `${winner} won by an innings and ${margin} run${margin !== 1 ? 's' : ''}!`;
          return { winner, resultText, isCompleted: true };
        }

        const target = diff + 1;
        return { winner: '', resultText: `3rd Innings Completed. Target: ${target} runs`, isCompleted: false };
      }

      return { winner: '', resultText: `3rd Innings in Progress (${statusText})`, isCompleted: false };
    }

    // 4th Innings (Team B's 2nd Innings - Chasing Target)
    if (match.currentInningsIndex === 4) {
      if (!innings4) {
        return { winner: '', resultText: '4th Innings starting', isCompleted: false };
      }

      const teamATotal = innings1.totalRuns + (innings3 ? innings3.totalRuns : 0);
      const teamBInn1 = innings2 ? innings2.totalRuns : 0;
      const target = targetRuns ?? (teamATotal - teamBInn1 + 1);

      // Case 4a: Chasing team achieved target in 4th innings
      if (innings4.totalRuns >= target) {
        const wicketsRemaining = Math.max(0, maxWickets - innings4.wicketsLost);
        const winner = innings4.battingTeam;
        const resultText = `${winner} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}!`;
        return { winner, resultText, isCompleted: true };
      }

      // Case 4b: 4th innings finished (All Out or Overs exhausted)
      const is4thInnAllOut = isAllOut(innings4.wicketsLost, rules);
      const is4thInnOversDone = areOversExhausted(innings4.legalBallsBowled, rules);

      if (is4thInnAllOut || is4thInnOversDone || innings4.isCompleted) {
        const teamBTotal = teamBInn1 + innings4.totalRuns;

        if (teamBTotal === teamATotal) {
          return { winner: 'TIE', resultText: 'Match Tied! Historic Test finish!', isCompleted: true };
        }
        if (teamBTotal < teamATotal) {
          const margin = teamATotal - teamBTotal;
          const winner = innings1.battingTeam;
          const resultText = `${winner} won by ${margin} run${margin !== 1 ? 's' : ''}!`;
          return { winner, resultText, isCompleted: true };
        }
        if (is4thInnOversDone && !is4thInnAllOut) {
          return { winner: 'DRAW', resultText: 'Match Drawn!', isCompleted: true };
        }
      }

      const runsNeeded = Math.max(0, target - innings4.totalRuns);
      return { winner: '', resultText: `${innings4.battingTeam} need ${runsNeeded} runs to win`, isCompleted: false };
    }
  }

  // -------------------------------------------------------------
  // LIMITED OVERS LOGIC (Box / T20 / ODI / Custom: 2 Innings Total)
  // -------------------------------------------------------------
  if (!innings2) {
    return { winner: '', resultText: '1st Innings in Progress', isCompleted: false };
  }

  const target = targetRuns ?? (innings1.totalRuns + 1);

  // Case 1: Chasing team reached the target
  if (innings2.totalRuns >= target) {
    const wicketsRemaining = Math.max(0, maxWickets - innings2.wicketsLost);
    const winner = innings2.battingTeam;
    const resultText = `${winner} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    return { winner, resultText, isCompleted: true };
  }

  // Case 2: 2nd innings finished (All Out or Overs exhausted)
  const is2ndInningsAllOut = isAllOut(innings2.wicketsLost, rules);
  const is2ndInningsOversDone = areOversExhausted(innings2.legalBallsBowled, rules);

  if (is2ndInningsAllOut || is2ndInningsOversDone || innings2.isCompleted) {
    if (innings2.totalRuns === innings1.totalRuns) {
      return { winner: 'TIE', resultText: 'Match Tied! Thriller finish!', isCompleted: true };
    }
    if (innings2.totalRuns < innings1.totalRuns) {
      const margin = innings1.totalRuns - innings2.totalRuns;
      const winner = innings1.battingTeam;
      const resultText = `${winner} won by ${margin} run${margin !== 1 ? 's' : ''}`;
      return { winner, resultText, isCompleted: true };
    }
  }

  return { winner: '', resultText: '2nd Innings in Progress', isCompleted: false };
}

/**
 * Return batting player names in the exact chronological order they came in to bat.
 * - Batters who opened and entered the pitch first come on top (#1, #2, #3, ...)
 * - Batters who actually batted (faced balls, scored runs, or were dismissed) are sorted by entrance order
 * - Players who "Did Not Bat" (DNB) are placed at the very end
 */
export function getBattingOrder(innings: InningsState): string[] {
  const order: string[] = [];
  const added = new Set<string>();

  const add = (name?: string) => {
    if (name && !added.has(name) && innings.batters[name]) {
      order.push(name);
      added.add(name);
    }
  };

  // 1. If explicit battingOrder exists, respect its initial chronological entries
  if (innings.battingOrder && innings.battingOrder.length > 0) {
    innings.battingOrder.forEach(add);
  }

  // 2. Trace all balls chronologically from start of innings
  if (innings.allBalls && innings.allBalls.length > 0) {
    for (const b of innings.allBalls) {
      add(b.striker);
      add(b.nonStriker);
      if (b.wicket?.playerOut) {
        add(b.wicket.playerOut);
      }
    }
  }

  // 3. Fall of wickets records
  if (innings.fallOfWickets && innings.fallOfWickets.length > 0) {
    for (const fow of innings.fallOfWickets) {
      add(fow.playerOut);
    }
  }

  // 4. Current active batters
  add(innings.strikerName);
  add(innings.nonStrikerName);

  // 5. Any batter with balls faced, runs scored, or marked out
  Object.values(innings.batters).forEach((b) => {
    if (b.balls > 0 || b.runs > 0 || b.isOut) {
      add(b.name);
    }
  });

  // 6. Remaining squad players who "Did Not Bat" (DNB) are placed at the end
  Object.keys(innings.batters).forEach((name) => {
    add(name);
  });

  return order;
}

