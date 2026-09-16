import React, { useState } from 'react';
import type { MatchType, MatchRules, MatchRecord } from '../../types/cricket';
import { DEFAULT_RULES } from '../../db/cricflexDb';
import { createInitialInnings } from '../../engine/scoringEngine';
import { X, Play, Sliders, Users, Trash2, ClipboardPaste, RotateCcw, Plus } from 'lucide-react';

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

  const [activePlayerTab, setActivePlayerTab] = useState<'teamA' | 'teamB'>('teamA');
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [bulkPasteOpen, setBulkPasteOpen] = useState<boolean>(false);
  const [bulkPasteInput, setBulkPasteInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  // Re-sync team names and rules when opened with tournament context
  React.useEffect(() => {
    if (defaultTeamA) setTeamAName(defaultTeamA);
    if (defaultTeamB) setTeamBName(defaultTeamB);
    if (tournamentRules) setRules({ ...tournamentRules });
  }, [defaultTeamA, defaultTeamB, tournamentRules, isOpen]);

  // Default player generator
  const generateDefaultPlayers = (teamPrefix: string, count: number) => {
    const names = [
      ['Rohit S.', 'Virat K.', 'Surya Y.', 'Hardik P.', 'Rinku S.', 'Jasprit B.', 'Axar P.', 'Arshdeep S.', 'Kuldeep Y.', 'Sanju S.', 'Rishabh P.'],
      ['Babar A.', 'Rizwan M.', 'Shaheen A.', 'Naseem S.', 'Haris R.', 'Fakhar Z.', 'Shadab K.', 'Iftikhar A.', 'Imad W.', 'Amir M.', 'Agha S.']
    ];
    const source = teamPrefix.includes('A') ? names[0] : names[1];
    return Array.from({ length: count }, (_, i) => source[i] || `${teamPrefix} Player ${i + 1}`);
  };

  // Initialize players gracefully without overwriting custom names
  React.useEffect(() => {
    setTeamAPlayers((prev) => {
      if (prev.length === 0) {
        return generateDefaultPlayers('Team A', rules.playersPerTeam);
      }
      if (prev.length < rules.playersPerTeam) {
        const extra = Array.from(
          { length: rules.playersPerTeam - prev.length },
          (_, i) => `Team A Player ${prev.length + i + 1}`
        );
        return [...prev, ...extra];
      }
      return prev;
    });

    setTeamBPlayers((prev) => {
      if (prev.length === 0) {
        return generateDefaultPlayers('Team B', rules.playersPerTeam);
      }
      if (prev.length < rules.playersPerTeam) {
        const extra = Array.from(
          { length: rules.playersPerTeam - prev.length },
          (_, i) => `Team B Player ${prev.length + i + 1}`
        );
        return [...prev, ...extra];
      }
      return prev;
    });
  }, [rules.playersPerTeam]);

  // Handlers for player management
  const handleUpdatePlayer = (team: 'teamA' | 'teamB', index: number, value: string) => {
    setValidationError(null);
    if (team === 'teamA') {
      const updated = [...teamAPlayers];
      updated[index] = value;
      setTeamAPlayers(updated);
    } else {
      const updated = [...teamBPlayers];
      updated[index] = value;
      setTeamBPlayers(updated);
    }
  };

  const handleAddPlayer = (team: 'teamA' | 'teamB', customName?: string) => {
    setValidationError(null);
    const targetName = (customName !== undefined ? customName : newPlayerName).trim();
    const finalName = targetName || (team === 'teamA' ? `Team A Player ${teamAPlayers.length + 1}` : `Team B Player ${teamBPlayers.length + 1}`);

    if (team === 'teamA') {
      setTeamAPlayers([...teamAPlayers, finalName]);
    } else {
      setTeamBPlayers([...teamBPlayers, finalName]);
    }
    setNewPlayerName('');
  };

  const handleRemovePlayer = (team: 'teamA' | 'teamB', index: number) => {
    setValidationError(null);
    if (team === 'teamA') {
      if (teamAPlayers.length <= 2) {
        setValidationError('Each team must have at least 2 players.');
        return;
      }
      setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
    } else {
      if (teamBPlayers.length <= 2) {
        setValidationError('Each team must have at least 2 players.');
        return;
      }
      setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
    }
  };

  const handleBulkApply = (team: 'teamA' | 'teamB') => {
    setValidationError(null);
    if (!bulkPasteInput.trim()) {
      setBulkPasteOpen(false);
      return;
    }
    const parsedNames = bulkPasteInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedNames.length < 2) {
      setValidationError('Please enter at least 2 player names.');
      return;
    }

    if (team === 'teamA') {
      setTeamAPlayers(parsedNames);
    } else {
      setTeamBPlayers(parsedNames);
    }
    setBulkPasteInput('');
    setBulkPasteOpen(false);
  };

  const handleResetToDefaults = (team: 'teamA' | 'teamB') => {
    setValidationError(null);
    if (team === 'teamA') {
      setTeamAPlayers(generateDefaultPlayers('Team A', rules.playersPerTeam));
    } else {
      setTeamBPlayers(generateDefaultPlayers('Team B', rules.playersPerTeam));
    }
  };

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
    setValidationError(null);

    // Clean and validate players
    const cleanedTeamA = teamAPlayers.map((p, i) => p.trim() || `Player ${i + 1}`);
    const cleanedTeamB = teamBPlayers.map((p, i) => p.trim() || `Player ${i + 1}`);

    if (cleanedTeamA.length < 2) {
      setValidationError(`Team "${teamAName}" must have at least 2 players.`);
      return;
    }
    if (cleanedTeamB.length < 2) {
      setValidationError(`Team "${teamBName}" must have at least 2 players.`);
      return;
    }

    // Ensure unique names within each team to avoid statistics key collision
    const deduplicate = (arr: string[]): string[] => {
      const counts: Record<string, number> = {};
      return arr.map((name) => {
        counts[name] = (counts[name] || 0) + 1;
        return counts[name] > 1 ? `${name} (${counts[name]})` : name;
      });
    };

    const finalTeamAPlayers = deduplicate(cleanedTeamA);
    const finalTeamBPlayers = deduplicate(cleanedTeamB);

    const battingTeamName =
      (tossWinner === 'teamA' && tossDecision === 'BAT') ||
      (tossWinner === 'teamB' && tossDecision === 'BOWL')
        ? teamAName
        : teamBName;

    const bowlingTeamName = battingTeamName === teamAName ? teamBName : teamAName;

    const battingPlayers = battingTeamName === teamAName ? finalTeamAPlayers : finalTeamBPlayers;
    const bowlingPlayers = bowlingTeamName === teamAName ? finalTeamAPlayers : finalTeamBPlayers;

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
      rules: {
        ...rules,
        // Sync rules.playersPerTeam with squad size if customized
        playersPerTeam: Math.max(finalTeamAPlayers.length, finalTeamBPlayers.length),
      },
      teamA: { name: teamAName, players: finalTeamAPlayers },
      teamB: { name: teamBName, players: finalTeamBPlayers },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
              🏏
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900">
                New Cricket Match
              </h2>
              <p className="text-xs text-slate-500">
                Setup match format, teams, and tournament rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Tournament Fixture Alert Banner if match was launched from tournament */}
          {tournamentId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center space-x-3 text-xs text-amber-800">
              <span className="text-xl">🏆</span>
              <div>
                <span className="font-bold block text-slate-900">Playing Tournament Fixture</span>
                <span>This match will automatically update the league points table, Net Run Rate (NRR), and tournament cap leaderboards upon completion.</span>
              </div>
            </div>
          )}

          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Select Match Format Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('BOX_GULLY')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'BOX_GULLY'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 mb-1">📦 Box Gully</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">6 Ov • 4 b/ov • LMS</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('CUSTOM')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'CUSTOM'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 mb-1">⚡ Turf Box</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">8 Ov • 6 b/ov • 8s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('T20')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'T20'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 mb-1">🏆 T20 Match</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">20 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('ODI')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'ODI'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 mb-1">🌍 One Day</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">50 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('TEST')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  matchType === 'TEST'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 mb-1">🔴 Test Match</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">2 Inn • Open Ov • 11s</div>
              </button>
            </div>
          </div>

          {/* Rule Tweaks */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2 mb-3 text-xs font-bold text-slate-700">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Custom Rule Engine Settings</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Total Overs</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={rules.totalOvers}
                  onChange={(e) => setRules({ ...rules, totalOvers: Number(e.target.value) || 1 })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Balls per Over</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={rules.ballsPerOver}
                  onChange={(e) => setRules({ ...rules, ballsPerOver: Number(e.target.value) || 6 })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Players / Team</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={rules.playersPerTeam}
                  onChange={(e) => setRules({ ...rules, playersPerTeam: Number(e.target.value) || 6 })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Max Ov / Bowler</label>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={rules.maxOversPerBowler}
                  onChange={(e) => setRules({ ...rules, maxOversPerBowler: Number(e.target.value) || 1 })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rules.lastManStanding}
                  onChange={(e) => setRules({ ...rules, lastManStanding: e.target.checked })}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
                />
                <span>Enable <strong>Last-Man Standing</strong> (Solo batter till all out)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rules.reBallWide}
                  onChange={(e) => setRules({ ...rules, reBallWide: e.target.checked })}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500/20 w-4 h-4"
                />
                <span>Re-ball on Wide / No-Ball</span>
              </label>
            </div>
          </div>

          {/* Team Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Team A Name
              </label>
              <input
                type="text"
                required
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Team B Name
              </label>
              <input
                type="text"
                required
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center space-x-2">
              <span>⚠️</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Player Names & Squads Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Player Names & Rosters
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {activePlayerTab === 'teamA' ? teamAPlayers.length : teamBPlayers.length} players listed
              </span>
            </div>

            {/* Team Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActivePlayerTab('teamA')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  activePlayerTab === 'teamA'
                    ? 'bg-white text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                }`}
              >
                <span className="truncate">🏏 {teamAName}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700 font-bold">
                  {teamAPlayers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlayerTab('teamB')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  activePlayerTab === 'teamB'
                    ? 'bg-white text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                }`}
              >
                <span className="truncate">⚾ {teamBName}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] text-slate-700 font-bold">
                  {teamBPlayers.length}
                </span>
              </button>
            </div>

            {/* Toolbar: Information & Fast Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
              <div className="text-[11px] text-slate-500">
                Opening batters: <span className="text-emerald-700 font-bold">#1 (Striker)</span> &{' '}
                <span className="text-teal-700 font-bold">#2 (Non-Striker)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setBulkPasteOpen(!bulkPasteOpen)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
                  title="Paste a comma or newline separated list of names"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paste List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetToDefaults(activePlayerTab)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
                  title="Reset team players to defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Defaults</span>
                </button>
              </div>
            </div>

            {/* Bulk Paste Box if open */}
            {bulkPasteOpen && (
              <div className="mb-3 p-3 bg-white border border-emerald-300 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>
                    Paste player names for {activePlayerTab === 'teamA' ? teamAName : teamBName}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkPasteOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste comma-separated or line-separated names, e.g.:&#10;Liam, Noah, Oliver, James, Elijah, William"
                  value={bulkPasteInput}
                  onChange={(e) => setBulkPasteInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleBulkApply(activePlayerTab)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Apply Names
                  </button>
                </div>
              </div>
            )}

            {/* Player Input Rows */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers).map((player, idx) => (
                <div
                  key={`${activePlayerTab}_${idx}`}
                  className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 shadow-xs transition-colors"
                >
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => handleUpdatePlayer(activePlayerTab, idx, e.target.value)}
                    placeholder={`Player ${idx + 1} Name`}
                    className="flex-1 bg-transparent text-xs text-slate-900 font-semibold focus:outline-none"
                  />
                  {idx === 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                      Striker
                    </span>
                  )}
                  {idx === 1 && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-200 whitespace-nowrap">
                      Non-Striker
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(activePlayerTab, idx)}
                    disabled={(activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers).length <= 2}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                    title="Remove player"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Player Input Row */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={`Add new player to ${activePlayerTab === 'teamA' ? teamAName : teamBName}...`}
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayer(activePlayerTab);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddPlayer(activePlayerTab)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Player</span>
              </button>
            </div>
          </div>

          {/* Toss Decision */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              🪙 Toss Result
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-slate-500 font-semibold mb-1">Toss Winner:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossWinner('teamA')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      tossWinner === 'teamA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {teamAName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossWinner('teamB')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      tossWinner === 'teamB'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {teamBName}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-slate-500 font-semibold mb-1">Elected To:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossDecision('BAT')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      tossDecision === 'BAT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏏 Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision('BOWL')}
                    className={`p-2 rounded-xl border font-bold transition-all ${
                      tossDecision === 'BOWL'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
