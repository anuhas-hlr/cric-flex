import { GoogleGenAI } from '@google/genai';
import type { MatchRecord, AISummary, BatterStats, BowlerStats } from '../types/cricket';

/**
 * Get configured Gemini API key from localStorage or Vite environment variables
 */
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cricflex_gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  const envKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_GEMINI_API_KEY ||
    '';
  return envKey.trim();
}

/**
 * Set Gemini API key to localStorage
 */
export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cricflex_gemini_api_key', key.trim());
  }
}

/**
 * Intelligent Offline Cricket Heuristics Engine
 * Evaluates match honors when offline or when no Gemini API key is configured.
 */
export function computeOfflineMatchAwards(match: MatchRecord): AISummary {
  const allBatters: { player: string; team: string; stats: BatterStats }[] = [];
  const allBowlers: { player: string; team: string; stats: BowlerStats }[] = [];
  const fieldersMap: Record<string, { catches: number; runOuts: number; stumpings: number; team: string }> = {};

  const processInnings = (inn: typeof match.innings1, battingTeam: string, bowlingTeam: string) => {
    Object.values(inn.batters).forEach((b) => {
      if (b.balls > 0 || b.runs > 0) {
        allBatters.push({ player: b.name, team: battingTeam, stats: b });
      }
    });

    Object.values(inn.bowlers).forEach((bowler) => {
      if (bowler.overs > 0 || bowler.balls > 0) {
        allBowlers.push({ player: bowler.name, team: bowlingTeam, stats: bowler });
      }
    });

    // Tally fielding
    inn.allBalls.forEach((ball) => {
      if (ball.wicket?.fielderName) {
        const fielder = ball.wicket.fielderName;
        if (!fieldersMap[fielder]) {
          fieldersMap[fielder] = { catches: 0, runOuts: 0, stumpings: 0, team: bowlingTeam };
        }
        if (ball.wicket.type === 'CAUGHT') fieldersMap[fielder].catches += 1;
        if (ball.wicket.type === 'RUN_OUT') fieldersMap[fielder].runOuts += 1;
        if (ball.wicket.type === 'STUMPED') fieldersMap[fielder].stumpings += 1;
      }
    });
  };

  processInnings(match.innings1, match.innings1.battingTeam, match.innings1.bowlingTeam);
  if (match.innings2) {
    processInnings(match.innings2, match.innings2.battingTeam, match.innings2.bowlingTeam);
  }
  if (match.innings3) {
    processInnings(match.innings3, match.innings3.battingTeam, match.innings3.bowlingTeam);
  }
  if (match.innings4) {
    processInnings(match.innings4, match.innings4.battingTeam, match.innings4.bowlingTeam);
  }

  // 1. Best Batter
  const sortedBatters = [...allBatters].sort((a, b) => {
    const scoreA = a.stats.runs * 1.5 + a.stats.sixes * 2 + a.stats.fours * 1;
    const scoreB = b.stats.runs * 1.5 + b.stats.sixes * 2 + b.stats.fours * 1;
    return scoreB - scoreA;
  });
  const bestBatterObj = sortedBatters[0];
  const bestBatterName = bestBatterObj?.player || 'Match Star';
  const bestBatterReason = bestBatterObj
    ? `Scored ${bestBatterObj.stats.runs} off ${bestBatterObj.stats.balls} balls with ${bestBatterObj.stats.fours} fours and ${bestBatterObj.stats.sixes} sixes (SR: ${bestBatterObj.stats.strikeRate})`
    : 'Solid top-order performance';

  // 2. Best Bowler
  const sortedBowlers = [...allBowlers].sort((a, b) => {
    const scoreA = a.stats.wickets * 25 + a.stats.maidens * 15 - a.stats.runs;
    const scoreB = b.stats.wickets * 25 + b.stats.maidens * 15 - b.stats.runs;
    return scoreB - scoreA;
  });
  const bestBowlerObj = sortedBowlers[0];
  const bestBowlerName = bestBowlerObj?.player || 'Strike Bowler';
  const bestBowlerReason = bestBowlerObj
    ? `Claimed ${bestBowlerObj.stats.wickets} wickets for ${bestBowlerObj.stats.runs} runs in ${bestBowlerObj.stats.overs}.${bestBowlerObj.stats.balls} overs (Econ: ${bestBowlerObj.stats.economy})`
    : 'Disciplined bowling spell under pressure';

  // 3. Best Fielder
  let bestFielderName = 'All-Round Fielder';
  let bestFielderReason = 'Sharp fielding and boundary stops throughout the match';
  const fielderEntries = Object.entries(fieldersMap);
  if (fielderEntries.length > 0) {
    fielderEntries.sort((a, b) => {
      const totalA = a[1].catches + a[1].runOuts * 1.5 + a[1].stumpings * 1.2;
      const totalB = b[1].catches + b[1].runOuts * 1.5 + b[1].stumpings * 1.2;
      return totalB - totalA;
    });
    const [topFielder, counts] = fielderEntries[0];
    bestFielderName = topFielder;
    const actions: string[] = [];
    if (counts.catches > 0) actions.push(`${counts.catches} catch${counts.catches > 1 ? 'es' : ''}`);
    if (counts.runOuts > 0) actions.push(`${counts.runOuts} run out${counts.runOuts > 1 ? 's' : ''}`);
    if (counts.stumpings > 0) actions.push(`${counts.stumpings} stumping${counts.stumpings > 1 ? 's' : ''}`);
    bestFielderReason = `Exceptional fielding alertness taking ${actions.join(', ')}`;
  }

  // 4. POTM (Player of the Match)
  // Compute overall MVP score combining batting, bowling, fielding, and match win bonus
  const playerMVP: Record<string, { points: number; team: string; summary: string }> = {};

  allBatters.forEach((b) => {
    const p = b.player;
    if (!playerMVP[p]) playerMVP[p] = { points: 0, team: b.team, summary: '' };
    playerMVP[p].points += b.stats.runs + b.stats.fours * 2 + b.stats.sixes * 4;
    if (b.stats.runs > 20) {
      playerMVP[p].summary += `${b.stats.runs} runs (${b.stats.balls}b)`;
    }
  });

  allBowlers.forEach((bw) => {
    const p = bw.player;
    if (!playerMVP[p]) playerMVP[p] = { points: 0, team: bw.team, summary: '' };
    playerMVP[p].points += bw.stats.wickets * 28 + bw.stats.maidens * 12 - Math.max(0, bw.stats.runs - 15);
    if (bw.stats.wickets > 0) {
      const sep = playerMVP[p].summary ? ' & ' : '';
      playerMVP[p].summary += `${sep}${bw.stats.wickets}/${bw.stats.runs}`;
    }
  });

  fielderEntries.forEach(([fielder, counts]) => {
    if (!playerMVP[fielder]) playerMVP[fielder] = { points: 0, team: counts.team, summary: '' };
    playerMVP[fielder].points += counts.catches * 15 + counts.runOuts * 20 + counts.stumpings * 15;
  });

  // Winning team bonus
  if (match.winner && match.winner !== 'TIE') {
    Object.keys(playerMVP).forEach((player) => {
      if (playerMVP[player].team === match.winner) {
        playerMVP[player].points += 20;
      }
    });
  }

  const sortedMVP = Object.entries(playerMVP).sort((a, b) => b[1].points - a[1].points);
  const potmCandidate = sortedMVP[0];
  const potmName = potmCandidate ? potmCandidate[0] : bestBatterName;
  const potmReason = potmCandidate && potmCandidate[1].summary
    ? `Outstanding match-defining display (${potmCandidate[1].summary}) powering their side`
    : `Match-winning all-round contribution`;

  // 5. Match Narrative Recap
  const inn1Runs = match.innings1.totalRuns;
  const inn1Wkts = match.innings1.wicketsLost;
  const inn2Runs = match.innings2?.totalRuns ?? 0;
  const inn2Wkts = match.innings2?.wicketsLost ?? 0;
  const resultText = match.resultText || 'concluded a thrilling encounter';

  const chasePart = match.innings2
    ? `In reply, ${match.innings2.battingTeam} reached ${inn2Runs}/${inn2Wkts} as ${resultText}`
    : `In a gripping match, ${resultText}`;

  const narrative = `${match.innings1.battingTeam} posted ${inn1Runs}/${inn1Wkts} on the scoreboard. ${chasePart}, punctuated by ${potmName}'s inspiring performance on the pitch.`;

  return {
    potm: potmName,
    potmReason,
    bestBatter: bestBatterName,
    bestBatterReason,
    bestBowler: bestBowlerName,
    bestBowlerReason,
    bestFielder: bestFielderName,
    bestFielderReason,
    narrative,
    generatedAt: Date.now(),
  };
}

/**
 * Generate Match Honors via Google Gemini AI
 * Falls back seamlessly to offline cricket heuristics if offline or API key is absent.
 */
export async function generateMatchAwards(match: MatchRecord): Promise<AISummary> {
  const apiKey = getGeminiApiKey();

  // If no API key provided or currently offline, use offline heuristics
  if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return computeOfflineMatchAwards(match);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const compactScorecard = {
      rules: {
        totalOvers: match.rules.totalOvers,
        ballsPerOver: match.rules.ballsPerOver,
        playersPerTeam: match.rules.playersPerTeam,
        matchType: match.matchType,
      },
      winner: match.winner,
      resultText: match.resultText,
      innings1: {
        battingTeam: match.innings1.battingTeam,
        totalRuns: match.innings1.totalRuns,
        wickets: match.innings1.wicketsLost,
        ballsBowled: match.innings1.legalBallsBowled,
        batters: Object.values(match.innings1.batters).filter((b) => b.balls > 0 || b.runs > 0),
        bowlers: Object.values(match.innings1.bowlers).filter((bw) => bw.overs > 0 || bw.balls > 0),
        fallOfWickets: match.innings1.fallOfWickets,
      },
      innings2: match.innings2
        ? {
            battingTeam: match.innings2.battingTeam,
            totalRuns: match.innings2.totalRuns,
            wickets: match.innings2.wicketsLost,
            ballsBowled: match.innings2.legalBallsBowled,
            batters: Object.values(match.innings2.batters).filter((b) => b.balls > 0 || b.runs > 0),
            bowlers: Object.values(match.innings2.bowlers).filter((bw) => bw.overs > 0 || bw.balls > 0),
            fallOfWickets: match.innings2.fallOfWickets,
          }
        : null,
      innings3: match.innings3
        ? {
            battingTeam: match.innings3.battingTeam,
            totalRuns: match.innings3.totalRuns,
            wickets: match.innings3.wicketsLost,
            ballsBowled: match.innings3.legalBallsBowled,
            batters: Object.values(match.innings3.batters).filter((b) => b.balls > 0 || b.runs > 0),
            bowlers: Object.values(match.innings3.bowlers).filter((bw) => bw.overs > 0 || bw.balls > 0),
            fallOfWickets: match.innings3.fallOfWickets,
          }
        : null,
      innings4: match.innings4
        ? {
            battingTeam: match.innings4.battingTeam,
            totalRuns: match.innings4.totalRuns,
            wickets: match.innings4.wicketsLost,
            ballsBowled: match.innings4.legalBallsBowled,
            batters: Object.values(match.innings4.batters).filter((b) => b.balls > 0 || b.runs > 0),
            bowlers: Object.values(match.innings4.bowlers).filter((bw) => bw.overs > 0 || bw.balls > 0),
            fallOfWickets: match.innings4.fallOfWickets,
          }
        : null,
    };

    const prompt = `
You are an expert cricket commentator and analyst. Review the full scorecard below for a match played under CricFlex rules:
- Total Overs: ${match.rules.totalOvers}
- Balls Per Over: ${match.rules.ballsPerOver} (Notice: may be 4 balls/over for box cricket or standard 6 balls/over)
- Players Per Team: ${match.rules.playersPerTeam}

Scorecard Data:
${JSON.stringify(compactScorecard, null, 2)}

Provide awards in JSON format matching this exact schema:
{
  "potm": "Player Name",
  "potmReason": "Detailed reason why this player is Player of the Match",
  "bestBatter": "Player Name",
  "bestBatterReason": "Key batting stats and impact",
  "bestBowler": "Player Name",
  "bestBowlerReason": "Key bowling stats, wickets, and economy impact",
  "bestFielder": "Player Name",
  "bestFielderReason": "Key catches, run-outs, or fielding presence",
  "narrative": "A gripping, newspaper-style 2 to 3 sentence match recap capturing the momentum swings and final verdict."
}
`;

    // Try modern gemini-2.5-flash or gemini-1.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    if (parsed.potm && parsed.narrative) {
      return {
        potm: parsed.potm,
        potmReason: parsed.potmReason || 'Match-winning performance',
        bestBatter: parsed.bestBatter || parsed.potm,
        bestBatterReason: parsed.bestBatterReason || 'Top scoring innings',
        bestBowler: parsed.bestBowler || parsed.potm,
        bestBowlerReason: parsed.bestBowlerReason || 'Decisive bowling spell',
        bestFielder: parsed.bestFielder || 'Top Fielder',
        bestFielderReason: parsed.bestFielderReason || 'Safe hands in the field',
        narrative: parsed.narrative,
        generatedAt: Date.now(),
      };
    }

    return computeOfflineMatchAwards(match);
  } catch (error) {
    console.warn('Gemini API call failed or timed out, falling back to offline heuristics:', error);
    return computeOfflineMatchAwards(match);
  }
}
