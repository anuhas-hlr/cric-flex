import React from 'react';
import type { MatchRecord, InningsState } from '../../types/cricket';
import { formatOvers, calculateRunRate } from '../../engine/scoringEngine';
import { Target, TrendingUp, Users } from 'lucide-react';

interface ScoreBannerProps {
  match: MatchRecord;
  innings: InningsState;
}

export const ScoreBanner: React.FC<ScoreBannerProps> = ({ match, innings }) => {
  const { rules, currentInningsIndex, targetRuns, matchType } = match;
  const currentOversFormatted = formatOvers(innings.legalBallsBowled, rules.ballsPerOver);
  const totalBallsAllotted = rules.totalOvers * rules.ballsPerOver;
  const ballsRemaining = Math.max(0, totalBallsAllotted - innings.legalBallsBowled);
  const crr = calculateRunRate(innings.totalRuns, innings.legalBallsBowled, rules.ballsPerOver);

  const maxWickets = rules.lastManStanding ? rules.playersPerTeam : rules.playersPerTeam - 1;
  const wicketsInHand = Math.max(0, maxWickets - innings.wicketsLost);

  // Chase conditions
  const isChasing =
    (matchType !== 'TEST' && currentInningsIndex === 2 && targetRuns !== undefined) ||
    (matchType === 'TEST' && currentInningsIndex === 4 && targetRuns !== undefined);

  const runsNeeded = isChasing && targetRuns !== undefined ? Math.max(0, targetRuns - innings.totalRuns) : 0;
  const rrr =
    isChasing && ballsRemaining > 0 && matchType !== 'TEST'
      ? parseFloat((runsNeeded / (ballsRemaining / rules.ballsPerOver)).toFixed(2))
      : 0;

  // Partnership calculation
  const striker = innings.batters[innings.strikerName];
  const nonStriker = innings.batters[innings.nonStrikerName];
  const partnershipRuns = (striker ? striker.runs : 0) + (nonStriker ? nonStriker.runs : 0);
  const partnershipBalls = (striker ? striker.balls : 0) + (nonStriker ? nonStriker.balls : 0);

  // Test match lead/trail computations
  let testStatusLabel = '';
  if (matchType === 'TEST') {
    if (currentInningsIndex === 2) {
      const diff = innings.totalRuns - match.innings1.totalRuns;
      if (diff > 0) testStatusLabel = `Leads by ${diff} run${diff !== 1 ? 's' : ''}`;
      else if (diff < 0) testStatusLabel = `Trails by ${Math.abs(diff)} run${Math.abs(diff) !== 1 ? 's' : ''}`;
      else testStatusLabel = 'Scores level with Team 1';
    } else if (currentInningsIndex === 3) {
      const teamATotal = match.innings1.totalRuns + innings.totalRuns;
      const teamBInn1 = match.innings2 ? match.innings2.totalRuns : 0;
      const diff = teamATotal - teamBInn1;
      if (diff > 0) testStatusLabel = `Overall Lead: ${diff} runs (Target: ${diff + 1})`;
      else if (diff < 0) testStatusLabel = `Still trails by ${Math.abs(diff)} run${Math.abs(diff) !== 1 ? 's' : ''}`;
      else testStatusLabel = 'Scores level (Lead: 0 runs)';
    }
  }

  // Innings badge title
  const getInningsBadgeText = () => {
    if (matchType === 'TEST') {
      if (currentInningsIndex === 1) return '1st Inn (Team 1)';
      if (currentInningsIndex === 2) return '2nd Inn (Team 2 - 1st)';
      if (currentInningsIndex === 3) return '3rd Inn (Team 1 - 2nd)';
      return '4th Inn (Team 2 - 2nd)';
    }
    return currentInningsIndex === 1 ? '1st Innings' : '2nd Innings';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xl shadow-slate-200/50">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />

      {/* Top Header: Teams & Format Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="font-display text-lg font-bold text-slate-900 tracking-wide">
            {innings.battingTeam}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            {getInningsBadgeText()}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            vs {innings.bowlingTeam}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            {matchType === 'BOX_GULLY'
              ? '📦 Box Cricket'
              : matchType === 'TEST'
              ? '🔴 Test Match (2 Inn/Team)'
              : matchType === 'T20'
              ? '🏆 T20 Blast'
              : matchType === 'ODI'
              ? '🌍 One Day'
              : '⚙️ Custom'}{' '}
            ({rules.ballsPerOver} b/ov)
          </span>
          {rules.lastManStanding && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
              LMS
            </span>
          )}
        </div>
      </div>

      {/* Main Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Big Score Numbers */}
        <div className="md:col-span-6 flex items-baseline space-x-4">
          <div className="font-display text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
            {innings.totalRuns}
            <span className="text-emerald-600 text-4xl sm:text-5xl font-light">
              /{innings.wicketsLost}
            </span>
          </div>

          <div className="text-slate-500 text-sm font-medium">
            <div className="text-lg text-slate-800 font-semibold font-mono">
              {currentOversFormatted}
              {matchType === 'TEST' ? (
                <span className="text-slate-500 font-normal text-xs"> ov (Open Overs)</span>
              ) : (
                <span className="text-slate-500 font-normal text-sm"> / {rules.totalOvers} ov</span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              CRR: <span className="text-emerald-600 font-bold font-mono">{crr}</span>
            </div>
          </div>
        </div>

        {/* Chase Equation or Target Info */}
        <div className="md:col-span-6 flex flex-col justify-center">
          {isChasing ? (
            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 rounded-2xl p-3.5 border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center text-emerald-800">
                  <Target className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Target: {targetRuns}
                </span>
                {matchType !== 'TEST' && (
                  <span className="text-slate-600">
                    RRR: <span className="text-amber-700 font-bold font-mono">{rrr}</span>
                  </span>
                )}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 tracking-wide">
                {matchType === 'TEST' ? (
                  <>
                    Need <span className="text-emerald-600 font-mono text-lg">{runsNeeded}</span> runs to win{' '}
                    <span className="text-slate-500 text-xs font-normal">
                      ({wicketsInHand} wickets in hand)
                    </span>
                  </>
                ) : (
                  <>
                    Need <span className="text-emerald-600 font-mono text-lg">{runsNeeded}</span> runs in{' '}
                    <span className="text-amber-700 font-mono text-lg">{ballsRemaining}</span> balls
                  </>
                )}
              </div>
            </div>
          ) : matchType === 'TEST' && (currentInningsIndex === 2 || currentInningsIndex === 3) ? (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-xs text-slate-500 flex items-center mb-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Match Situation
                </div>
                <div className="text-sm font-semibold text-emerald-700">
                  {testStatusLabel}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500 flex items-center justify-end mb-1 font-medium">
                  <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Partnership
                </div>
                <div className="text-sm font-mono font-bold text-slate-800">
                  {partnershipRuns} ({partnershipBalls}b)
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-xs text-slate-500 flex items-center mb-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  {matchType === 'TEST' ? 'Match Format' : 'Projected Score'}
                </div>
                <div className="text-sm font-mono font-bold text-slate-800">
                  {matchType === 'TEST' ? '2 Innings/Team • Open Overs' : `${Math.round(crr * rules.totalOvers)} @ CRR ${crr}`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500 flex items-center justify-end mb-1 font-medium">
                  <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Partnership
                </div>
                <div className="text-sm font-mono font-bold text-slate-800">
                  {partnershipRuns} ({partnershipBalls}b)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
