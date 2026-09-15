import React, { useState } from 'react';
import type { InningsState, MatchRules } from '../../types/cricket';
import { X, Check, Plus } from 'lucide-react';

interface BowlerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  innings: InningsState;
  rules: MatchRules;
  allBowlingPlayers: string[];
  previousBowlerName?: string;
  onSelectBowler: (bowlerName: string) => void;
  onAddNewBowler?: (bowlerName: string) => void;
}

export const BowlerSelectModal: React.FC<BowlerSelectModalProps> = ({
  isOpen,
  onClose,
  innings,
  rules,
  allBowlingPlayers,
  previousBowlerName,
  onSelectBowler,
  onAddNewBowler,
}) => {
  const [newBowlerInput, setNewBowlerInput] = useState<string>('');

  if (!isOpen) return null;

  const handleAddNew = () => {
    const trimmed = newBowlerInput.trim();
    if (!trimmed) return;
    if (onAddNewBowler) {
      onAddNewBowler(trimmed);
      setNewBowlerInput('');
      onClose();
    } else {
      onSelectBowler(trimmed);
      setNewBowlerInput('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Select Next Bowler
            </h3>
            <p className="text-xs text-slate-400">
              Select an existing bowler or add a new bowler to bowl (Max {rules.maxOversPerBowler} ov/bowler)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {allBowlingPlayers.map((player) => {
            const stats = innings.bowlers[player] || {
              overs: 0,
              balls: 0,
              maidens: 0,
              runs: 0,
              wickets: 0,
              economy: 0,
            };

            const isCurrent = player === innings.currentBowlerName;
            const isPrevious = player === previousBowlerName;
            const hasExceededOvers = stats.overs >= rules.maxOversPerBowler;

            // Disallow consecutive overs unless team only has 1 bowler
            const isDisabled = (isPrevious && allBowlingPlayers.length > 1) || hasExceededOvers;

            return (
              <button
                key={player}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onSelectBowler(player);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/50'
                    : isDisabled
                    ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-750 hover:border-emerald-500/40'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{player}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        Current
                      </span>
                    )}
                    {isPrevious && allBowlingPlayers.length > 1 && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        Just Bowled
                      </span>
                    )}
                    {hasExceededOvers && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                        Quota Maxed
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {stats.overs}.{stats.balls} ov • {stats.maidens} mdn • {stats.runs} r • {stats.wickets} w
                  </div>
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

        {/* Quick Add New Player to Bowling Team */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            + Add New Bowler to Squad
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter new bowler name..."
              value={newBowlerInput}
              onChange={(e) => setNewBowlerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew();
                }
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add & Bowl</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
