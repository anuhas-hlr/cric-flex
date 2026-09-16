import React, { useState } from 'react';
import type { InningsState } from '../../types/cricket';
import { X, Check, Plus } from 'lucide-react';

interface BatterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  innings: InningsState;
  allBattingPlayers: string[];
  targetEnd: 'striker' | 'nonStriker';
  onSelectBatter: (playerName: string) => void;
  onAddNewBatter?: (playerName: string) => void;
}

export const BatterSelectModal: React.FC<BatterSelectModalProps> = ({
  isOpen,
  onClose,
  innings,
  allBattingPlayers,
  targetEnd,
  onSelectBatter,
  onAddNewBatter,
}) => {
  const [newBatterInput, setNewBatterInput] = useState<string>('');

  if (!isOpen) return null;

  const handleAddNew = () => {
    const trimmed = newBatterInput.trim();
    if (!trimmed) return;
    if (onAddNewBatter) {
      onAddNewBatter(trimmed);
      setNewBatterInput('');
      onClose();
    } else {
      onSelectBatter(trimmed);
      setNewBatterInput('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Select {targetEnd === 'striker' ? 'Striker' : 'Non-Striker'}
            </h3>
            <p className="text-xs text-slate-500">
              Select an existing player or add a new player to bat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isAlreadyBatting
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                    : isDisabled
                    ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-emerald-300 text-slate-900 shadow-xs'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{player}</span>
                    {isAlreadyBatting && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        Current End
                      </span>
                    )}
                    {isOtherBatting && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        Other End
                      </span>
                    )}
                    {isOut && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-semibold border border-rose-200">
                        Out
                      </span>
                    )}
                  </div>
                  {stats && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {stats.runs} runs ({stats.balls}b) • {stats.fours} 4s • {stats.sixes} 6s
                    </div>
                  )}
                </div>

                {!isDisabled && (
                  <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Add New Player to Batting Team */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 mb-1.5">
            + Add New Player to Bat
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter new player name..."
              value={newBatterInput}
              onChange={(e) => setNewBatterInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew();
                }
              }}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add & Bat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
