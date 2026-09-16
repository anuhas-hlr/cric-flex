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
    let bgClass = 'bg-slate-100 text-slate-800 border-slate-200 font-bold';

    if (ball.wicket) {
      label = 'W';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-300 font-black animate-bounce shadow-xs';
    } else if (ball.extraType === 'WIDE') {
      label = ball.extraRuns > rules.wideRuns ? `Wd+${ball.extraRuns - rules.wideRuns}` : 'Wd';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-300 font-bold shadow-xs';
    } else if (ball.extraType === 'NO_BALL') {
      label = ball.runsOffBat > 0 ? `Nb+${ball.runsOffBat}` : 'Nb';
      bgClass = 'bg-orange-50 text-orange-700 border-orange-300 font-bold shadow-xs';
    } else if (ball.extraType === 'BYE') {
      label = `B${ball.extraRuns}`;
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    } else if (ball.extraType === 'LEG_BYE') {
      label = `Lb${ball.extraRuns}`;
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    } else if (ball.runsOffBat === 4) {
      label = '4';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200 font-black shadow-xs';
    } else if (ball.runsOffBat === 6) {
      label = '6';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-xs';
    } else if (ball.runsOffBat === 0) {
      label = '•';
      bgClass = 'bg-slate-100/90 text-slate-400 border-slate-200 text-lg';
    }

    return (
      <div
        key={ball.ballId || index}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center font-mono text-sm tracking-tight transition-transform hover:scale-105 shadow-xs ${bgClass}`}
        title={`${ball.bowler} to ${ball.striker} - ${ball.totalRuns} runs`}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <span className="font-bold text-slate-800">
          This Over ({currentOverIndex + 1}):
        </span>
        <span className="font-mono text-emerald-700 font-semibold">
          {legalBallsInCurrentOver} / {rules.ballsPerOver} legal balls
        </span>
      </div>

      {/* Ball Badges Timeline */}
      <div className="flex items-center flex-wrap gap-2">
        {currentOverBalls.length === 0 ? (
          <span className="text-xs text-slate-400 italic py-1">
            Over starting... select outcome below
          </span>
        ) : (
          currentOverBalls.map(renderBallBadge)
        )}
      </div>
    </div>
  );
};
