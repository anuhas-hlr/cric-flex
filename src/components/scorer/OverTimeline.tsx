import React from 'react';
import type { BallEvent, MatchRules } from '../../types/cricket';

interface OverTimelineProps {
  currentOverBalls: BallEvent[];
  rules: MatchRules;
  legalBallsBowled: number;
}

export const OverTimeline: React.FC<OverTimelineProps> = ({
  currentOverBalls,
  rules,
  legalBallsBowled,
}) => {
  const currentOverIndex = Math.floor(legalBallsBowled / rules.ballsPerOver);
  const legalBallsInCurrentOver = currentOverBalls.filter((b) => b.isLegal).length;

  const renderBallBadge = (ball: BallEvent, index: number) => {
    let label = `${ball.runsOffBat}`;
    let bgClass = 'bg-slate-800 text-slate-200 border-slate-700';

    if (ball.wicket) {
      label = 'W';
      bgClass = 'bg-red-500/20 text-red-400 border-red-500/40 font-black animate-bounce';
    } else if (ball.extraType === 'WIDE') {
      label = ball.extraRuns > rules.wideRuns ? `Wd+${ball.extraRuns - rules.wideRuns}` : 'Wd';
      bgClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold';
    } else if (ball.extraType === 'NO_BALL') {
      label = ball.runsOffBat > 0 ? `Nb+${ball.runsOffBat}` : 'Nb';
      bgClass = 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold';
    } else if (ball.extraType === 'BYE') {
      label = `B${ball.extraRuns}`;
      bgClass = 'bg-slate-700/60 text-slate-300 border-slate-600';
    } else if (ball.extraType === 'LEG_BYE') {
      label = `Lb${ball.extraRuns}`;
      bgClass = 'bg-slate-700/60 text-slate-300 border-slate-600';
    } else if (ball.runsOffBat === 4) {
      label = '4';
      bgClass = 'bg-blue-500/25 text-blue-300 border-blue-500/50 font-black shadow-sm';
    } else if (ball.runsOffBat === 6) {
      label = '6';
      bgClass = 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-black shadow-sm';
    } else if (ball.runsOffBat === 0) {
      label = '•';
      bgClass = 'bg-slate-800/60 text-slate-400 border-slate-700/60 text-lg';
    }

    return (
      <div
        key={ball.ballId || index}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-mono text-sm tracking-tight transition-transform hover:scale-105 shadow-sm ${bgClass}`}
        title={`${ball.bowler} to ${ball.striker} - ${ball.totalRuns} runs`}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
      <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
        <span className="font-semibold text-slate-200">
          This Over ({currentOverIndex + 1}):
        </span>
        <span className="font-mono text-emerald-400">
          {legalBallsInCurrentOver} / {rules.ballsPerOver} legal balls
        </span>
      </div>

      {/* Ball Badges Timeline */}
      <div className="flex items-center flex-wrap gap-2">
        {currentOverBalls.length === 0 ? (
          <span className="text-xs text-slate-500 italic py-1">
            Over starting... select outcome below
          </span>
        ) : (
          currentOverBalls.map(renderBallBadge)
        )}
      </div>
    </div>
  );
};
