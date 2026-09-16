import React from 'react';
import type { InningsState, MatchRules } from '../../types/cricket';
import { ArrowLeftRight, RefreshCw, Users } from 'lucide-react';

interface BatsmenBowlerCardProps {
  innings: InningsState;
  rules: MatchRules;
  onSwapStrike: () => void;
  onChangeBowler: () => void;
  onChangeBatter: (type: 'striker' | 'nonStriker') => void;
  onOpenSquads?: () => void;
}

export const BatsmenBowlerCard: React.FC<BatsmenBowlerCardProps> = ({
  innings,
  rules,
  onSwapStrike,
  onChangeBowler,
  onChangeBatter,
  onOpenSquads,
}) => {
  const striker = innings.batters[innings.strikerName] || {
    name: innings.strikerName,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
  };

  const nonStriker = innings.batters[innings.nonStrikerName] || {
    name: innings.nonStrikerName,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
  };

  const bowler = innings.bowlers[innings.currentBowlerName] || {
    name: innings.currentBowlerName,
    overs: 0,
    balls: 0,
    maidens: 0,
    runs: 0,
    wickets: 0,
    economy: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Batting Duo Card */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Batting</span>
            {onOpenSquads && (
              <button
                type="button"
                onClick={onOpenSquads}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-emerald-700 font-semibold border border-slate-200 transition-colors"
                title="Manage squads, add new players, or rename players"
              >
                <Users className="w-3 h-3" />
                <span>Manage Players</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-6 text-[11px] font-mono text-slate-400">
            <span className="w-8 text-right">R (B)</span>
            <span className="w-5 text-right">4s</span>
            <span className="w-5 text-right">6s</span>
            <span className="w-10 text-right">SR</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Striker */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 transition-all">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => onChangeBatter('striker')}>
                <span className="text-sm font-bold text-slate-900 tracking-wide hover:underline">
                  {striker.name}
                </span>
                <span className="text-xs text-emerald-600 font-bold">🏏*</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-mono">
              <span className="w-8 text-right font-bold text-emerald-700">
                {striker.runs} <span className="text-slate-500 font-normal">({striker.balls})</span>
              </span>
              <span className="w-5 text-right text-slate-700 font-medium">{striker.fours}</span>
              <span className="w-5 text-right text-slate-700 font-medium">{striker.sixes}</span>
              <span className="w-10 text-right text-slate-600 font-semibold">{striker.strikeRate}</span>
            </div>
          </div>

          {/* Non-Striker (Hidden if Last Man Standing active solo) */}
          {!rules.lastManStanding || innings.nonStrikerName ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-all">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => onChangeBatter('nonStriker')}>
                  <span className="text-sm font-semibold text-slate-800 hover:underline">
                    {nonStriker.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs font-mono">
                <span className="w-8 text-right font-semibold text-slate-800">
                  {nonStriker.runs} <span className="text-slate-500 font-normal">({nonStriker.balls})</span>
                </span>
                <span className="w-5 text-right text-slate-600">{nonStriker.fours}</span>
                <span className="w-5 text-right text-slate-600">{nonStriker.sixes}</span>
                <span className="w-10 text-right text-slate-500">{nonStriker.strikeRate}</span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 text-center text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 rounded-xl">
              ⚡ Last Man Standing: Solo Batting Active
            </div>
          )}
        </div>

        {/* Swap Strike Button */}
        {!rules.lastManStanding && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={onSwapStrike}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="Manually switch striker and non-striker ends"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rotate Strike</span>
            </button>
          </div>
        )}
      </div>

      {/* Bowler Card */}
      <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
          <span className="font-semibold text-slate-700">Bowling</span>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
            <span className="w-7 text-right">O</span>
            <span className="w-5 text-right">M</span>
            <span className="w-6 text-right">R</span>
            <span className="w-5 text-right">W</span>
            <span className="w-8 text-right">Econ</span>
          </div>
        </div>

        {/* Current Bowler Figures */}
        <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 tracking-wide">
                {bowler.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 text-xs font-mono">
            <span className="w-7 text-right text-indigo-700 font-bold">
              {bowler.overs}.{bowler.balls}
            </span>
            <span className="w-5 text-right text-slate-500">{bowler.maidens}</span>
            <span className="w-6 text-right text-slate-800 font-semibold">{bowler.runs}</span>
            <span className="w-5 text-right text-emerald-600 font-extrabold">{bowler.wickets}</span>
            <span className="w-8 text-right text-slate-600 font-semibold">{bowler.economy}</span>
          </div>
        </div>

        {/* Change Bowler Button */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px] font-medium">
            Max: {rules.maxOversPerBowler} ov/bowler
          </span>
          <button
            onClick={onChangeBowler}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Change Bowler</span>
          </button>
        </div>
      </div>
    </div>
  );
};
