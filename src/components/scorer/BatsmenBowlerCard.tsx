import React from 'react';
import type { InningsState, MatchRules } from '../../types/cricket';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';

interface BatsmenBowlerCardProps {
  innings: InningsState;
  rules: MatchRules;
  onSwapStrike: () => void;
  onChangeBowler: () => void;
  onChangeBatter: (type: 'striker' | 'nonStriker') => void;
}

export const BatsmenBowlerCard: React.FC<BatsmenBowlerCardProps> = ({
  innings,
  rules,
  onSwapStrike,
  onChangeBowler,
  onChangeBatter,
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
      <div className="md:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 font-medium">
          <span>Batting</span>
          <div className="flex items-center space-x-6 text-[11px] font-mono">
            <span className="w-8 text-right">R (B)</span>
            <span className="w-5 text-right">4s</span>
            <span className="w-5 text-right">6s</span>
            <span className="w-10 text-right">SR</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Striker */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 transition-all">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => onChangeBatter('striker')}>
                <span className="text-sm font-bold text-white tracking-wide hover:underline">
                  {striker.name}
                </span>
                <span className="text-xs text-emerald-400">🏏*</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-mono">
              <span className="w-8 text-right font-bold text-emerald-300">
                {striker.runs} <span className="text-slate-500 font-normal">({striker.balls})</span>
              </span>
              <span className="w-5 text-right text-slate-300">{striker.fours}</span>
              <span className="w-5 text-right text-slate-300">{striker.sixes}</span>
              <span className="w-10 text-right text-slate-400 font-semibold">{striker.strikeRate}</span>
            </div>
          </div>

          {/* Non-Striker (Hidden if Last Man Standing active solo) */}
          {!rules.lastManStanding || innings.nonStrikerName ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => onChangeBatter('nonStriker')}>
                  <span className="text-sm font-medium text-slate-300 hover:underline">
                    {nonStriker.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs font-mono">
                <span className="w-8 text-right text-slate-200">
                  {nonStriker.runs} <span className="text-slate-500">({nonStriker.balls})</span>
                </span>
                <span className="w-5 text-right text-slate-400">{nonStriker.fours}</span>
                <span className="w-5 text-right text-slate-400">{nonStriker.sixes}</span>
                <span className="w-10 text-right text-slate-500">{nonStriker.strikeRate}</span>
              </div>
            </div>
          ) : (
            <div className="p-2 text-center text-xs text-amber-400/80 bg-amber-950/20 border border-amber-900/40 rounded-xl">
              ⚡ Last Man Standing: Solo Batting Active
            </div>
          )}
        </div>

        {/* Swap Strike Button */}
        {!rules.lastManStanding && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-end">
            <button
              onClick={onSwapStrike}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/50"
              title="Manually switch striker and non-striker ends"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rotate Strike</span>
            </button>
          </div>
        )}
      </div>

      {/* Bowler Card */}
      <div className="md:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 font-medium">
          <span>Bowling</span>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span className="w-7 text-right">O</span>
            <span className="w-5 text-right">M</span>
            <span className="w-6 text-right">R</span>
            <span className="w-5 text-right">W</span>
            <span className="w-8 text-right">Econ</span>
          </div>
        </div>

        {/* Current Bowler Figures */}
        <div className="p-2 rounded-xl bg-indigo-950/25 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-sm font-bold text-white tracking-wide">
                {bowler.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 text-xs font-mono">
            <span className="w-7 text-right text-indigo-300 font-semibold">
              {bowler.overs}.{bowler.balls}
            </span>
            <span className="w-5 text-right text-slate-400">{bowler.maidens}</span>
            <span className="w-6 text-right text-slate-300">{bowler.runs}</span>
            <span className="w-5 text-right text-emerald-400 font-bold">{bowler.wickets}</span>
            <span className="w-8 text-right text-slate-300 font-semibold">{bowler.economy}</span>
          </div>
        </div>

        {/* Change Bowler Button */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Max: {rules.maxOversPerBowler} ov/bowler
          </span>
          <button
            onClick={onChangeBowler}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Change Bowler</span>
          </button>
        </div>
      </div>
    </div>
  );
};
