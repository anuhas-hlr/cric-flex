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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              Select Next Bowler
            </h3>
            <p className="text-xs text-slate-500">
              Select an existing bowler or add a new bowler to bowl (Max {rules.maxOversPerBowler} ov/bowler)
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
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : isDisabled
                    ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 hover:border-indigo-300 text-slate-900 shadow-xs'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{player}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-semibold border border-indigo-200">
                        Current
                      </span>
                    )}
                    {isPrevious && allBowlingPlayers.length > 1 && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        Just Bowled
                      </span>
                    )}
                    {hasExceededOvers && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-semibold border border-rose-200">
                        Quota Maxed
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {stats.overs}.{stats.balls} ov • {stats.maidens} mdn • {stats.runs} r • {stats.wickets} w
                  </div>
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

        {/* Quick Add New Player to Bowling Team */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 mb-1.5">
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
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center space-x-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-indigo-600/20"
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
