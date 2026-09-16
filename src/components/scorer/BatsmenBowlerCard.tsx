import React, { useState } from 'react';
import type { InningsState, MatchRules } from '../../types/cricket';
import { ArrowLeftRight, RefreshCw, Users, Edit2, Check, X } from 'lucide-react';

interface BatsmenBowlerCardProps {
  innings: InningsState;
  rules: MatchRules;
  onSwapStrike: () => void;
  onChangeBowler: () => void;
  onChangeBatter: (type: 'striker' | 'nonStriker') => void;
  onOpenSquads?: () => void;
  onRenamePlayer?: (teamKey: 'teamA' | 'teamB', oldName: string, newName: string) => void;
  battingTeamKey?: 'teamA' | 'teamB';
  bowlingTeamKey?: 'teamA' | 'teamB';
}

export const BatsmenBowlerCard: React.FC<BatsmenBowlerCardProps> = ({
  innings,
  rules,
  onSwapStrike,
  onChangeBowler,
  onChangeBatter,
  onOpenSquads,
  onRenamePlayer,
  battingTeamKey = 'teamA',
  bowlingTeamKey = 'teamB',
}) => {
  const [quickRename, setQuickRename] = useState<{
    role: 'striker' | 'nonStriker' | 'bowler';
    name: string;
    teamKey: 'teamA' | 'teamB';
  } | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

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

  const handleStartRename = (
    role: 'striker' | 'nonStriker' | 'bowler',
    name: string,
    teamKey: 'teamA' | 'teamB'
  ) => {
    setQuickRename({ role, name, teamKey });
    setRenameValue(name);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickRename) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== quickRename.name && onRenamePlayer) {
      onRenamePlayer(quickRename.teamKey, quickRename.name, trimmed);
    }
    setQuickRename(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Batting Duo Card */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Batting</span>
            {onOpenSquads && (
              <button
                type="button"
                onClick={onOpenSquads}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-emerald-700 font-bold border border-slate-200 transition-colors cursor-pointer"
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
              <div className="flex items-center space-x-1.5">
                <span
                  onClick={() => onChangeBatter('striker')}
                  className="text-sm font-bold text-slate-900 tracking-wide hover:underline cursor-pointer"
                  title="Click to switch striker"
                >
                  {striker.name}
                </span>
                <span className="text-xs text-emerald-600 font-bold">🏏*</span>
                <button
                  type="button"
                  onClick={() => handleStartRename('striker', striker.name, battingTeamKey)}
                  className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-md transition-colors cursor-pointer"
                  title="Rename this batter"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
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
                <div className="flex items-center space-x-1.5">
                  <span
                    onClick={() => onChangeBatter('nonStriker')}
                    className="text-sm font-semibold text-slate-800 hover:underline cursor-pointer"
                    title="Click to switch non-striker"
                  >
                    {nonStriker.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartRename('nonStriker', nonStriker.name, battingTeamKey)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                    title="Rename this batter"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
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
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
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
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Bowling</span>
            {onOpenSquads && (
              <button
                type="button"
                onClick={onOpenSquads}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] text-indigo-700 font-bold border border-slate-200 transition-colors cursor-pointer"
                title="Manage squads, add new players, or rename players"
              >
                <Users className="w-3 h-3" />
                <span>Roster</span>
              </button>
            )}
          </div>
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
              <button
                type="button"
                onClick={() => handleStartRename('bowler', bowler.name, bowlingTeamKey)}
                className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-100/50 rounded-md transition-colors cursor-pointer"
                title="Rename this bowler"
              >
                <Edit2 className="w-3 h-3" />
              </button>
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
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Change Bowler</span>
          </button>
        </div>
      </div>

      {/* Quick Player Rename Modal */}
      {quickRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>Rename {quickRename.role === 'striker' ? 'Striker' : quickRename.role === 'nonStriker' ? 'Non-Striker' : 'Bowler'}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickRename(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickRename(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
