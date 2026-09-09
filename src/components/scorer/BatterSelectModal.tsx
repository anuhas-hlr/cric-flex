import React from 'react';
import type { InningsState } from '../../types/cricket';
import { X, Check } from 'lucide-react';

interface BatterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  innings: InningsState;
  allBattingPlayers: string[];
  targetEnd: 'striker' | 'nonStriker';
  onSelectBatter: (playerName: string) => void;
}

export const BatterSelectModal: React.FC<BatterSelectModalProps> = ({
  isOpen,
  onClose,
  innings,
  allBattingPlayers,
  targetEnd,
  onSelectBatter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Select {targetEnd === 'striker' ? 'Striker' : 'Non-Striker'}
            </h3>
            <p className="text-xs text-slate-400">
              Replace active batter on {targetEnd === 'striker' ? 'striker end' : 'non-striker end'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {allBattingPlayers.map((player) => {
            const stats = innings.batters[player];
            const isStriker = player === innings.strikerName;
            const isNonStriker = player === innings.nonStrikerName;
            const isOut = stats?.isOut;

            const isAlreadyBatting = (targetEnd === 'striker' && isStriker) || (targetEnd === 'nonStriker' && isNonStriker);
            const isOtherBatting = (targetEnd === 'striker' && isNonStriker) || (targetEnd === 'nonStriker' && isStriker);

            const isDisabled = isOtherBatting || isOut;

            return (
              <button
                key={player}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onSelectBatter(player);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isAlreadyBatting
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : isDisabled
                    ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-750 hover:border-emerald-500/40'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{player}</span>
                    {isAlreadyBatting && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Current End
                      </span>
                    )}
                    {isOtherBatting && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        Other End
                      </span>
                    )}
                    {isOut && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                        Out
                      </span>
                    )}
                  </div>
                  {stats && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {stats.runs} runs ({stats.balls}b) • {stats.fours} 4s • {stats.sixes} 6s
                    </div>
                  )}
                </div>

                {!isDisabled && (
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
