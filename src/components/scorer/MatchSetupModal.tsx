import React, { useState } from 'react';
import type { MatchType, MatchRules, MatchRecord } from '../../types/cricket';
import { DEFAULT_RULES } from '../../db/cricflexDb';
import { createInitialInnings } from '../../engine/scoringEngine';
import { X, Play, Sliders } from 'lucide-react';

interface MatchSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId?: string;
  defaultTeamA?: string;
  defaultTeamB?: string;
  tournamentRules?: MatchRules;
  onStartMatch: (match: MatchRecord) => void;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  defaultTeamA,
  defaultTeamB,
  tournamentRules,
  onStartMatch,
}) => {
  const [matchType, setMatchType] = useState<MatchType>('BOX_GULLY');
  const [rules, setRules] = useState<MatchRules>({ ...DEFAULT_RULES.BOX_GULLY });

  const [teamAName, setTeamAName] = useState<string>(defaultTeamA || 'Royal Strikers');
  const [teamBName, setTeamBName] = useState<string>(defaultTeamB || 'Turf Warriors');

  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);

  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  // Re-sync team names and rules when opened with tournament context
  React.useEffect(() => {
    if (defaultTeamA) setTeamAName(defaultTeamA);
    if (defaultTeamB) setTeamBName(defaultTeamB);
    if (tournamentRules) setRules({ ...tournamentRules });
  }, [defaultTeamA, defaultTeamB, tournamentRules, isOpen]);

  // Initialize or re-sync players when count changes
  React.useEffect(() => {
    const generateDefaultPlayers = (teamPrefix: string, count: number) => {
      const names = [
        ['Rohit S.', 'Virat K.', 'Surya Y.', 'Hardik P.', 'Rinku S.', 'Jasprit B.', 'Axar P.', 'Arshdeep S.', 'Kuldeep Y.', 'Sanju S.', 'Rishabh P.'],
        ['Babar A.', 'Rizwan M.', 'Shaheen A.', 'Naseem S.', 'Haris R.', 'Fakhar Z.', 'Shadab K.', 'Iftikhar A.', 'Imad W.', 'Amir M.', 'Agha S.']
      ];
      const source = teamPrefix.includes('A') ? names[0] : names[1];
      return Array.from({ length: count }, (_, i) => source[i] || `${teamPrefix} Player ${i + 1}`);
    };

    setTeamAPlayers(generateDefaultPlayers('A', rules.playersPerTeam));
    setTeamBPlayers(generateDefaultPlayers('B', rules.playersPerTeam));
  }, [rules.playersPerTeam]);

  if (!isOpen) return null;

  const handleSelectPreset = (type: MatchType) => {
    setMatchType(type);
    if (type === 'BOX_GULLY') setRules({ ...DEFAULT_RULES.BOX_GULLY });
    else if (type === 'T20') setRules({ ...DEFAULT_RULES.T20 });
    else if (type === 'ODI') setRules({ ...DEFAULT_RULES.ODI });
    else if (type === 'TEST') setRules({ ...DEFAULT_RULES.TEST });
    else if (type === 'CUSTOM') setRules({ ...DEFAULT_RULES.CUSTOM });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const battingTeamName =
      (tossWinner === 'teamA' && tossDecision === 'BAT') ||
      (tossWinner === 'teamB' && tossDecision === 'BOWL')
        ? teamAName
        : teamBName;

    const bowlingTeamName = battingTeamName === teamAName ? teamBName : teamAName;

    const battingPlayers = battingTeamName === teamAName ? teamAPlayers : teamBPlayers;
    const bowlingPlayers = bowlingTeamName === teamAName ? teamAPlayers : teamBPlayers;

    const initialInnings = createInitialInnings(
      battingTeamName,
      bowlingTeamName,
      battingPlayers,
      bowlingPlayers
    );

    const newMatch: MatchRecord = {
      id: `match_${Date.now()}`,
      tournamentId,
      matchType,
      rules,
      teamA: { name: teamAName, players: teamAPlayers },
      teamB: { name: teamBName, players: teamBPlayers },
      tossWinner: tossWinner === 'teamA' ? teamAName : teamBName,
      tossDecision,
      currentInningsIndex: 1,
      innings1: initialInnings,
      status: 'LIVE',
      undoStack: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onStartMatch(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
              🏏
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                New Cricket Match
              </h2>
              <p className="text-xs text-slate-400">
                Setup match format, teams, and tournament rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Tournament Fixture Alert Banner if match was launched from tournament */}
          {tournamentId && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center space-x-3 text-xs text-amber-300">
              <span className="text-xl">🏆</span>
              <div>
                <span className="font-bold block text-white">Playing Tournament Fixture</span>
                <span>This match will automatically update the league points table, Net Run Rate (NRR), and tournament cap leaderboards upon completion.</span>
              </div>
            </div>
          )}

          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Match Format Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('BOX_GULLY')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'BOX_GULLY'
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">📦 Box Gully</div>
                <div className="text-[11px] text-emerald-400 font-mono">6 Ov • 4 b/ov • LMS</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('CUSTOM')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'CUSTOM'
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">⚡ Turf Box</div>
                <div className="text-[11px] text-emerald-400 font-mono">8 Ov • 6 b/ov • 8s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('T20')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'T20'
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">🏆 T20 Match</div>
                <div className="text-[11px] text-emerald-400 font-mono">20 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('ODI')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'ODI'
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">🌍 One Day</div>
                <div className="text-[11px] text-emerald-400 font-mono">50 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('TEST')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'TEST'
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1">🔴 Test Match</div>
                <div className="text-[11px] text-emerald-400 font-mono">2 Innings • Open Overs • 11s</div>
              </button>
            </div>
          </div>

          {/* Rule Tweaks */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 mb-3 text-xs font-semibold text-slate-300">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Custom Rule Engine Settings</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Total Overs</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={rules.totalOvers}
                  onChange={(e) => setRules({ ...rules, totalOvers: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Balls per Over</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={rules.ballsPerOver}
                  onChange={(e) => setRules({ ...rules, ballsPerOver: Number(e.target.value) || 6 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Players / Team</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={rules.playersPerTeam}
                  onChange={(e) => setRules({ ...rules, playersPerTeam: Number(e.target.value) || 6 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Ov / Bowler</label>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={rules.maxOversPerBowler}
                  onChange={(e) => setRules({ ...rules, maxOversPerBowler: Number(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.lastManStanding}
                  onChange={(e) => setRules({ ...rules, lastManStanding: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span>Enable <strong>Last-Man Standing</strong> (Solo batter till all out)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.reBallWide}
                  onChange={(e) => setRules({ ...rules, reBallWide: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span>Re-ball on Wide / No-Ball</span>
              </label>
            </div>
          </div>

          {/* Team Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Team A Name
              </label>
              <input
                type="text"
                required
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Team B Name
              </label>
              <input
                type="text"
                required
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Toss Decision */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              🪙 Toss Result
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-slate-400 mb-1">Toss Winner:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossWinner('teamA')}
                    className={`p-2 rounded-xl border font-semibold ${
                      tossWinner === 'teamA'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {teamAName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossWinner('teamB')}
                    className={`p-2 rounded-xl border font-semibold ${
                      tossWinner === 'teamB'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {teamBName}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 mb-1">Elected To:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossDecision('BAT')}
                    className={`p-2 rounded-xl border font-semibold ${
                      tossDecision === 'BAT'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    🏏 Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision('BOWL')}
                    className={`p-2 rounded-xl border font-semibold ${
                      tossDecision === 'BOWL'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ⚾ Bowl First
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
