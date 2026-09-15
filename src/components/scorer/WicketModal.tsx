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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-white">
              Wicket Fall ({innings.wicketsLost + 1} of {maxWickets})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dismissal Type Buttons */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                    ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player Out Selector */}
        <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Batter Dismissed
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlayerOut(innings.strikerName)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                playerOut === innings.strikerName
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
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
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Non-Striker: {innings.nonStrikerName}
              </button>
            )}
          </div>
        </div>

        {/* Fielder Selector if Caught, Run Out, or Stumped */}
        {(dismissalType === 'CAUGHT' || dismissalType === 'RUN_OUT' || dismissalType === 'STUMPED') && (
          <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {dismissalType === 'CAUGHT' ? 'Fielder (Catch)' : dismissalType === 'STUMPED' ? 'Wicketkeeper' : 'Fielder (Run Out)'}
            </label>
            <select
              value={fielderName}
              onChange={(e) => setFielderName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              {allBowlingPlayers.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>

            {dismissalType === 'RUN_OUT' && (
              <div className="mt-3">
                <label className="block text-xs text-slate-400 mb-1">Runs completed before run-out:</label>
                <div className="flex space-x-2">
                  {[0, 1, 2].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRunsCompleted(r)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                        runsCompleted === r
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
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
          <div className="mb-5 p-3 rounded-xl bg-red-950/30 border border-red-800/50 flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This wicket will conclude the innings (All Out)!</span>
          </div>
        ) : (
          <div className="mb-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Next Batter
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBatter(!isCustomBatter)}
                className="text-xs text-emerald-400 hover:underline font-semibold"
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
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            ) : availableNextBatters.length > 0 ? (
              <select
                value={newBatterName}
                onChange={(e) => setNewBatterName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                {availableNextBatters.map((player) => (
                  <option key={player} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            ) : rules.lastManStanding ? (
              <div className="text-xs text-amber-400">
                ⚡ No more bench batters. Last Man Standing will bat solo!
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  No more bench players available in squad.
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomBatter(true)}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
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
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30"
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
};
