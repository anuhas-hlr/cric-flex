import React, { useState } from 'react';
import type { MatchType, MatchRules, MatchRecord } from '../../types/cricket';
import { DEFAULT_RULES } from '../../db/cricflexDb';
import { createInitialInnings } from '../../engine/scoringEngine';
import { X, Play, Sliders, Users, Trash2, ClipboardPaste, Plus, ChevronUp, ChevronDown } from 'lucide-react';

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

  const [teamAName, setTeamAName] = useState<string>(defaultTeamA || 'Team Alpha');
  const [teamBName, setTeamBName] = useState<string>(defaultTeamB || 'Team Beta');

  // NO DEFAULT PLAYERS: Users must add player names themselves
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);

  const [activePlayerTab, setActivePlayerTab] = useState<'teamA' | 'teamB'>('teamA');
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [bulkPasteOpen, setBulkPasteOpen] = useState<boolean>(false);
  const [bulkPasteInput, setBulkPasteInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  // Reset or initialize state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setNewPlayerName('');
      setBulkPasteOpen(false);
      setBulkPasteInput('');

      if (tournamentId && tournamentRules) {
        if (defaultTeamA) setTeamAName(defaultTeamA);
        if (defaultTeamB) setTeamBName(defaultTeamB);
        setRules({ ...tournamentRules });
      } else {
        if (defaultTeamA) setTeamAName(defaultTeamA);
        if (defaultTeamB) setTeamBName(defaultTeamB);
      }
    }
  }, [isOpen, tournamentId, defaultTeamA, defaultTeamB, tournamentRules]);

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
    if (!targetName) {
      setValidationError('Please enter a valid player name.');
      return;
    }

    const currentList = team === 'teamA' ? teamAPlayers : teamBPlayers;
    if (currentList.some((p) => p.toLowerCase() === targetName.toLowerCase())) {
      setValidationError(`"${targetName}" is already in the squad.`);
      return;
    }

    if (team === 'teamA') {
      setTeamAPlayers([...teamAPlayers, targetName]);
    } else {
      setTeamBPlayers([...teamBPlayers, targetName]);
    }
    setNewPlayerName('');
  };

  const handleRemovePlayer = (team: 'teamA' | 'teamB', index: number) => {
    setValidationError(null);
    if (team === 'teamA') {
      setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
    } else {
      setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
    }
  };

  const handleClearPlayers = (team: 'teamA' | 'teamB') => {
    setValidationError(null);
    if (team === 'teamA') {
      setTeamAPlayers([]);
    } else {
      setTeamBPlayers([]);
    }
  };

  const handleMovePlayer = (team: 'teamA' | 'teamB', fromIndex: number, toIndex: number) => {
    const list = team === 'teamA' ? [...teamAPlayers] : [...teamBPlayers];
    if (toIndex < 0 || toIndex >= list.length) return;
    const item = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, item);
    if (team === 'teamA') {
      setTeamAPlayers(list);
    } else {
      setTeamBPlayers(list);
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

    if (parsedNames.length === 0) {
      setValidationError('Please enter at least one valid player name.');
      return;
    }

    // Deduplicate against existing and within input
    const currentList = team === 'teamA' ? teamAPlayers : teamBPlayers;
    const combined: string[] = [...currentList];

    for (const name of parsedNames) {
      if (!combined.some((p) => p.toLowerCase() === name.toLowerCase())) {
        combined.push(name);
      }
    }

    if (team === 'teamA') {
      setTeamAPlayers(combined);
    } else {
      setTeamBPlayers(combined);
    }
    setBulkPasteInput('');
    setBulkPasteOpen(false);
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

    // Clean and validate players - NO DEFAULT NAMES PERMITTED
    const cleanedTeamA = teamAPlayers.map((p) => p.trim()).filter((p) => p.length > 0);
    const cleanedTeamB = teamBPlayers.map((p) => p.trim()).filter((p) => p.length > 0);

    if (cleanedTeamA.length < 2) {
      setValidationError(`Please add at least 2 players for "${teamAName}". You currently have ${cleanedTeamA.length}.`);
      setActivePlayerTab('teamA');
      return;
    }
    if (cleanedTeamB.length < 2) {
      setValidationError(`Please add at least 2 players for "${teamBName}". You currently have ${cleanedTeamB.length}.`);
      setActivePlayerTab('teamB');
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
        // Match rules squad count with user-provided roster size
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

          {/* Match Format Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="match-format-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Match Format
              </label>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active: {matchType === 'BOX_GULLY' ? 'Box / Gully' : matchType === 'T20' ? 'T20 Match' : matchType === 'ODI' ? 'One Day (ODI)' : matchType === 'TEST' ? 'Test Match (2 Innings)' : 'Custom Match'}
              </span>
            </div>

            {/* Quick dropdown for all devices */}
            <div className="mb-2.5">
              <select
                id="match-format-select"
                value={matchType}
                onChange={(e) => handleSelectPreset(e.target.value as MatchType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                <option value="BOX_GULLY">📦 Box / Gully Cricket (6 Overs • 4 Balls/Over • Last-Man Standing)</option>
                <option value="T20">🏆 T20 Match (20 Overs • 6 Balls/Over • 11 Players)</option>
                <option value="ODI">🌍 One Day / ODI (50 Overs • 6 Balls/Over • 11 Players)</option>
                <option value="TEST">🔴 Test Match (Multi-Innings: 2 Innings Per Team)</option>
                <option value="CUSTOM">⚡ Custom / Turf Rules (Custom Overs, Balls & Squad)</option>
              </select>
            </div>

            {/* Visual preset cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('BOX_GULLY')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  matchType === 'BOX_GULLY'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">📦 Box Gully</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">6 Ov • 4 b/ov • LMS</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('CUSTOM')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  matchType === 'CUSTOM'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">⚡ Custom / Turf</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">8 Ov • 6 b/ov • 8s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('T20')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  matchType === 'T20'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">🏆 T20 Match</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">20 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('ODI')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  matchType === 'ODI'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">🌍 One Day</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">50 Ov • 6 b/ov • 11s</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('TEST')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  matchType === 'TEST'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">🔴 Test Match</div>
                <div className="text-[11px] text-emerald-700 font-mono font-semibold">2 Innings • 11s</div>
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
                <label className="block text-slate-500 font-semibold mb-1">Target Players / Team</label>
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
                placeholder="e.g. Royal Strikers"
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
                placeholder="e.g. Turf Warriors"
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
                  Player Names (Must Add Players)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {activePlayerTab === 'teamA' ? teamAPlayers.length : teamBPlayers.length} added
              </span>
            </div>

            {/* Team Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setActivePlayerTab('teamA');
                  setValidationError(null);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activePlayerTab === 'teamA'
                    ? 'bg-white text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                }`}
              >
                <span className="truncate">🏏 {teamAName || 'Team A'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  teamAPlayers.length >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}>
                  {teamAPlayers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePlayerTab('teamB');
                  setValidationError(null);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activePlayerTab === 'teamB'
                    ? 'bg-white text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                }`}
              >
                <span className="truncate">⚾ {teamBName || 'Team B'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  teamBPlayers.length >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}>
                  {teamBPlayers.length}
                </span>
              </button>
            </div>

            {/* Toolbar: Information & Fast Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
              <div className="text-[11px] text-slate-500">
                Batting Order: <span className="text-emerald-700 font-bold">#1 Striker (Bat 1st)</span> &{' '}
                <span className="text-teal-700 font-bold">#2 Non-Striker</span>. <span className="text-slate-400">Use ▲▼ to reorder.</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setBulkPasteOpen(!bulkPasteOpen)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer"
                  title="Paste a comma or newline separated list of player names"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paste Names</span>
                </button>
                {(activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers).length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleClearPlayers(activePlayerTab)}
                    className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer"
                    title="Clear all players in this squad"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
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
                    className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste comma-separated or line-separated names, e.g.:&#10;Liam, Noah, Oliver, James, Elijah, William"
                  value={bulkPasteInput}
                  onChange={(e) => setBulkPasteInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleBulkApply(activePlayerTab)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Apply Names
                  </button>
                </div>
              </div>
            )}

            {/* Add Player Input Row (At the top so it's immediately accessible) */}
            <div className="mb-3 flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={`Enter player name for ${activePlayerTab === 'teamA' ? (teamAName || 'Team A') : (teamBName || 'Team B')} and press Enter...`}
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayer(activePlayerTab);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs font-semibold"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddPlayer(activePlayerTab)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Player List Display */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers).length === 0 ? (
                <div className="text-center py-6 px-4 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                  <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No players added for {activePlayerTab === 'teamA' ? (teamAName || 'Team A') : (teamBName || 'Team B')} yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Type a player name in the box above and press Enter, or use "Paste Names".</p>
                </div>
              ) : (
                (activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers).map((player, idx) => {
                  const currentTeamList = activePlayerTab === 'teamA' ? teamAPlayers : teamBPlayers;
                  return (
                    <div
                      key={`${activePlayerTab}_${idx}`}
                      className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 shadow-xs transition-colors"
                    >
                      {/* Move Up / Down Reorder Controls */}
                      <div className="flex flex-col items-center justify-center -my-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePlayer(activePlayerTab, idx, idx - 1)}
                          className="p-0.5 text-slate-400 hover:text-emerald-700 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          title="Move Up (Bat earlier)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentTeamList.length - 1}
                          onClick={() => handleMovePlayer(activePlayerTab, idx, idx + 1)}
                          className="p-0.5 text-slate-400 hover:text-emerald-700 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          title="Move Down (Bat later)"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
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
                          #1 Striker (Bat 1st)
                        </span>
                      )}
                      {idx === 1 && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-200 whitespace-nowrap">
                          #2 Non-Striker
                        </span>
                      )}
                      {idx === 2 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                          #3 In
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(activePlayerTab, idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
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
