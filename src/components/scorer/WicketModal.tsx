import React, { useState } from 'react';
import type { DismissalType, InningsState, MatchRules } from '../../types/cricket';
import { X, AlertCircle } from 'lucide-react';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  innings: InningsState;
  rules: MatchRules;
  allBattingPlayers: string[];
  allBowlingPlayers: string[];
  onSubmit: (params: {
    type: DismissalType;
    playerOut: string;
    fielderName?: string;
    runsCompleted?: number;
    newBatterName?: string;
  }) => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  innings,
  rules,
  allBattingPlayers,
  allBowlingPlayers,
  onSubmit,
}) => {
  const [dismissalType, setDismissalType] = useState<DismissalType>('BOWLED');
  const [playerOut, setPlayerOut] = useState<string>(innings.strikerName);
  const [fielderName, setFielderName] = useState<string>(allBowlingPlayers[0] || '');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);

  // Determine eligible next batters
  const maxWickets = rules.lastManStanding
    ? rules.playersPerTeam
    : rules.playersPerTeam - 1;

  const isLastWicket = innings.wicketsLost + 1 >= maxWickets;

  // Players from batting team who are NOT currently batting and NOT already out
  const availableNextBatters = allBattingPlayers.filter((player) => {
    const isCurrentStriker = player === innings.strikerName;
    const isCurrentNonStriker = player === innings.nonStrikerName;
    const isOut = innings.batters[player]?.isOut;
    return !isCurrentStriker && !isCurrentNonStriker && !isOut;
  });

  const [newBatterName, setNewBatterName] = useState<string>(availableNextBatters[0] || '');
  const [isCustomBatter, setIsCustomBatter] = useState<boolean>(availableNextBatters.length === 0 && !isLastWicket && !rules.lastManStanding);
  const [customBatterInput, setCustomBatterInput] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalIncoming = isCustomBatter ? customBatterInput.trim() : newBatterName;
    onSubmit({
      type: dismissalType,
      playerOut,
      fielderName: (dismissalType === 'CAUGHT' || dismissalType === 'RUN_OUT' || dismissalType === 'STUMPED')
        ? fielderName
        : undefined,
      runsCompleted: dismissalType === 'RUN_OUT' ? runsCompleted : 0,
      newBatterName: isLastWicket ? undefined : (finalIncoming || undefined),
    });
    onClose();
  };

  const dismissalOptions: { type: DismissalType; label: string }[] = [
    { type: 'BOWLED', label: 'Bowled' },
    { type: 'CAUGHT', label: 'Caught' },
    { type: 'LBW', label: 'LBW' },
    { type: 'RUN_OUT', label: 'Run Out' },
    { type: 'STUMPED', label: 'Stumped' },
    { type: 'HIT_WICKET', label: 'Hit Wicket' },
    { type: 'RETIRED_HURT', label: 'Retired Hurt' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              Wicket Fall ({innings.wicketsLost + 1} of {maxWickets})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dismissal Type Buttons */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Dismissal Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dismissalOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setDismissalType(opt.type)}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  dismissalType === opt.type
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player Out Selector */}
        <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Batter Dismissed
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlayerOut(innings.strikerName)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                playerOut === innings.strikerName
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🏏 Striker: {innings.strikerName}
            </button>
            {innings.nonStrikerName && (
              <button
                type="button"
                onClick={() => setPlayerOut(innings.nonStrikerName)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  playerOut === innings.nonStrikerName
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Non-Striker: {innings.nonStrikerName}
              </button>
            )}
          </div>
        </div>

        {/* Fielder Selector if Caught, Run Out, or Stumped */}
        {(dismissalType === 'CAUGHT' || dismissalType === 'RUN_OUT' || dismissalType === 'STUMPED') && (
          <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {dismissalType === 'CAUGHT' ? 'Fielder (Catch)' : dismissalType === 'STUMPED' ? 'Wicketkeeper' : 'Fielder (Run Out)'}
            </label>
            <select
              value={fielderName}
              onChange={(e) => setFielderName(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {allBowlingPlayers.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>

            {dismissalType === 'RUN_OUT' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Runs completed before run-out:</label>
                <div className="flex space-x-2">
                  {[0, 1, 2].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRunsCompleted(r)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${
                        runsCompleted === r
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      +{r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Incoming Batter Selection */}
        {isLastWicket ? (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>This wicket will conclude the innings (All Out)!</span>
          </div>
        ) : (
          <div className="mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Next Batter
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBatter(!isCustomBatter)}
                className="text-xs text-emerald-700 hover:underline font-bold"
              >
                {isCustomBatter ? 'Choose from Squad' : '+ Add New Batter'}
              </button>
            </div>
            {isCustomBatter ? (
              <input
                type="text"
                placeholder="Enter new player name..."
                value={customBatterInput}
                onChange={(e) => setCustomBatterInput(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            ) : availableNextBatters.length > 0 ? (
              <select
                value={newBatterName}
                onChange={(e) => setNewBatterName(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {availableNextBatters.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            ) : rules.lastManStanding ? (
              <div className="text-xs text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚡ No more bench batters. Last Man Standing will bat solo!
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500">
                  No more bench players available in squad.
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomBatter(true)}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  + Add New Player to Bat
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/25 transition-all active:scale-95"
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
};
