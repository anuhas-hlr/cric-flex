import React, { useState } from 'react';
import type { MatchRecord, InningsState } from '../../types/cricket';
import { X, Users, Edit2, Check, Plus } from 'lucide-react';

interface SquadManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchRecord;
  currentInnings: InningsState;
  onAddPlayerToTeam: (teamKey: 'teamA' | 'teamB', playerName: string) => void;
  onRenamePlayer: (teamKey: 'teamA' | 'teamB', oldName: string, newName: string) => void;
}

export const SquadManagementModal: React.FC<SquadManagementModalProps> = ({
  isOpen,
  onClose,
  match,
  currentInnings,
  onAddPlayerToTeam,
  onRenamePlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'teamA' | 'teamB'>('teamA');
  const [newPlayerInput, setNewPlayerInput] = useState<string>('');
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTeam = activeTab === 'teamA' ? match.teamA : match.teamB;

  const handleAddPlayer = () => {
    setErrorMsg(null);
    const trimmed = newPlayerInput.trim();
    if (!trimmed) return;
    if (currentTeam.players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" is already in ${currentTeam.name}.`);
      return;
    }
    onAddPlayerToTeam(activeTab, trimmed);
    setNewPlayerInput('');
  };

  const handleStartRename = (player: string) => {
    setErrorMsg(null);
    setEditingPlayer(player);
    setEditingValue(player);
  };

  const handleSaveRename = (oldName: string) => {
    setErrorMsg(null);
    const trimmed = editingValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingPlayer(null);
      return;
    }
    if (currentTeam.players.some((p) => p.toLowerCase() === trimmed.toLowerCase() && p !== oldName)) {
      setErrorMsg(`"${trimmed}" already exists in ${currentTeam.name}. Names must be unique.`);
      return;
    }
    onRenamePlayer(activeTab, oldName, trimmed);
    setEditingPlayer(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Manage Team Players
              </h3>
              <p className="text-xs text-slate-500">
                Add new players or rename existing players in live match
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('teamA');
              setErrorMsg(null);
              setEditingPlayer(null);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'teamA'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="truncate">🏏 {match.teamA.name}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 text-[10px] text-slate-700 font-bold">
              {match.teamA.players.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('teamB');
              setErrorMsg(null);
              setEditingPlayer(null);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'teamB'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="truncate">⚾ {match.teamB.name}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 text-[10px] text-slate-700 font-bold">
              {match.teamB.players.length}
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Add Player Input */}
        <div className="mb-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            + Add Player to {currentTeam.name}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter player name..."
              value={newPlayerInput}
              onChange={(e) => setNewPlayerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPlayer();
                }
              }}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={handleAddPlayer}
              className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Player Roster List */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
            <span>Roster ({currentTeam.players.length} players)</span>
            <span className="text-[11px] text-slate-400">Click pencil to rename</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {currentTeam.players.map((player, idx) => {
              const isStriker = player === currentInnings.strikerName;
              const isNonStriker = player === currentInnings.nonStrikerName;
              const isBowler = player === currentInnings.currentBowlerName;
              const batterStats = currentInnings.batters[player];
              const isOut = batterStats?.isOut;

              return (
                <div
                  key={`${activeTab}_${player}_${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center space-x-2 flex-1 mr-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </span>

                    {editingPlayer === player ? (
                      <div className="flex items-center space-x-1.5 flex-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(player);
                            if (e.key === 'Escape') setEditingPlayer(null);
                          }}
                          autoFocus
                          className="flex-1 bg-white border border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(player)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlayer(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{player}</span>
                        {isStriker && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                            🏏 Striker
                          </span>
                        )}
                        {isNonStriker && (
                          <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md border border-teal-200 font-semibold">
                            Non-Striker
                          </span>
                        )}
                        {isBowler && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
                            ⚾ Bowler
                          </span>
                        )}
                        {isOut && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 font-semibold">
                            Out
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {editingPlayer !== player && (
                    <button
                      type="button"
                      onClick={() => handleStartRename(player)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Rename player"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
