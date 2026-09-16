import React, { useState, useEffect } from 'react';
import type {
  TournamentRecord,
  TournamentTeamStats,
  MatchRules,
} from '../../types/cricket';
import { db } from '../../db/cricflexDb';
import {
  generateRoundRobinFixtures,
  recalculateTournamentStandings,
} from '../../engine/tournamentEngine';
import {
  Trophy,
  Plus,
  Play,
  Flame,
  Shield,
  Trash2,
  Calendar,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';

interface TournamentManagerProps {
  onStartTournamentMatch: (tournamentId: string, teamA: string, teamB: string, rules: MatchRules) => void;
  onViewMatchScorecard: (matchId: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({
  onStartTournamentMatch,
  onViewMatchScorecard,
}) => {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentRecord | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form states for creating a new tournament
  const [name, setName] = useState<string>('Gully Premier League 2026');
  const [teamInput, setTeamInput] = useState<string>('Spartans, Strikers, Titans, Knights');
  const [overs, setOvers] = useState<number>(6);
  const [ballsPerOver, setBallsPerOver] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const syncStandingsForTournament = async (tourn: TournamentRecord) => {
    try {
      const completedMatches = await db.matches
        .where('tournamentId')
        .equals(tourn.id)
        .toArray();

      // Check and update any fixtures whose matches completed
      const updatedFixtures = tourn.fixtures.map((f) => {
        const foundMatch = completedMatches.find(
          (m) =>
            m.id === f.matchId ||
            (!f.isCompleted &&
              ((m.teamA.name.trim().toLowerCase() === f.teamA.trim().toLowerCase() &&
                m.teamB.name.trim().toLowerCase() === f.teamB.trim().toLowerCase()) ||
               (m.teamA.name.trim().toLowerCase() === f.teamB.trim().toLowerCase() &&
                m.teamB.name.trim().toLowerCase() === f.teamA.trim().toLowerCase())))
        );
        if (foundMatch && foundMatch.status === 'COMPLETED') {
          return {
            ...f,
            isCompleted: true,
            matchId: foundMatch.id,
            winner: foundMatch.winner,
          };
        }
        return f;
      });

      const { standings, orangeCap, purpleCap } = recalculateTournamentStandings(
        { ...tourn, fixtures: updatedFixtures },
        completedMatches
      );

      const allDone = updatedFixtures.every((f) => f.isCompleted);

      const updated: TournamentRecord = {
        ...tourn,
        fixtures: updatedFixtures,
        standings,
        orangeCap,
        purpleCap,
        status: allDone ? 'COMPLETED' : 'ONGOING',
        winner: allDone ? standings[0]?.teamName : tourn.winner,
        updatedAt: Date.now(),
      };

      await db.tournaments.put(updated);
      setSelectedTournament(updated);
      setTournaments((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.error('Failed to sync standings:', err);
    }
  };

  const loadTournaments = async () => {
    setIsRefreshing(true);
    try {
      const list = await db.tournaments.reverse().sortBy('createdAt');
      setTournaments(list);
      if (list.length > 0) {
        const current = selectedTournament
          ? list.find((t) => t.id === selectedTournament.id) || list[0]
          : list[0];
        await syncStandingsForTournament(current);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    const teams = teamInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (teams.length < 2) {
      alert('Please enter at least 2 teams separated by commas.');
      return;
    }

    const rules: MatchRules = {
      totalOvers: overs,
      ballsPerOver,
      playersPerTeam,
      maxOversPerBowler: Math.max(1, Math.floor(overs / 3)),
      lastManStanding: true,
      wideRuns: 1,
      noBallRuns: 1,
      reBallWide: true,
      reBallNoBall: true,
    };

    const fixtures = generateRoundRobinFixtures(teams);
    const initialStandings: TournamentTeamStats[] = teams.map((team) => ({
      teamName: team,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      nrr: 0,
    }));

    const newTournament: TournamentRecord = {
      id: `tourn_${Date.now()}`,
      name,
      format: 'ROUND_ROBIN',
      rules,
      teams,
      fixtures,
      standings: initialStandings,
      status: 'ONGOING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.tournaments.add(newTournament);
    setIsCreating(false);
    loadTournaments();
    setSelectedTournament(newTournament);
  };

  const handleDeleteTournament = async (id: string) => {
    if (confirm('Delete this tournament and its standings?')) {
      await db.tournaments.delete(id);
      loadTournaments();
      setSelectedTournament(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Selector & Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              Tournament Manager
            </h2>
            <p className="text-xs text-slate-500">
              Round-robin points tables, live NRR calculation, Orange & Purple caps
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {tournaments.length > 0 && (
            <select
              value={selectedTournament?.id || ''}
              onChange={(e) => {
                const found = tournaments.find((t) => t.id === e.target.value);
                if (found) setSelectedTournament(found);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {selectedTournament && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={loadTournaments}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title="Re-sync tournament points table and fixtures"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Table</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Selected Tournament Content */}
      {selectedTournament ? (
        <div className="space-y-6">
          {/* Tournament Overview & Caps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tournament Details Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    Round-Robin
                  </span>
                  <button
                    onClick={() => handleDeleteTournament(selectedTournament.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete tournament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-1">
                  {selectedTournament.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedTournament.teams.length} Teams • {selectedTournament.rules.totalOvers} Overs • {selectedTournament.rules.ballsPerOver} Balls/Over
                </p>
              </div>
            </div>

            {/* Orange Cap Leaderboard */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-white rounded-2xl border border-amber-200 p-4 flex items-center space-x-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center text-2xl">
                🟠
              </div>
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Orange Cap (Top Runs)</span>
                </div>
                {selectedTournament.orangeCap ? (
                  <>
                    <div className="font-display font-black text-lg text-slate-900">
                      {selectedTournament.orangeCap.playerName}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      <span className="text-amber-700 font-bold">{selectedTournament.orangeCap.value}</span> runs ({selectedTournament.orangeCap.teamName})
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Play matches to unlock cap</p>
                )}
              </div>
            </div>

            {/* Purple Cap Leaderboard */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-white rounded-2xl border border-purple-200 p-4 flex items-center space-x-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center text-2xl">
                🟣
              </div>
              <div>
                <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Purple Cap (Top Wickets)</span>
                </div>
                {selectedTournament.purpleCap ? (
                  <>
                    <div className="font-display font-black text-lg text-slate-900">
                      {selectedTournament.purpleCap.playerName}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      <span className="text-purple-700 font-bold">{selectedTournament.purpleCap.value}</span> wickets ({selectedTournament.purpleCap.teamName})
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Play matches to unlock cap</p>
                )}
              </div>
            </div>
          </div>

          {/* Points Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <h3 className="font-display font-bold text-base text-slate-900 mb-3 flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Standings & Net Run Rate (NRR)</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Pos</th>
                    <th className="py-2.5 px-3 font-semibold">Team</th>
                    <th className="py-2.5 px-2 text-right font-semibold">P</th>
                    <th className="py-2.5 px-2 text-right font-semibold">W</th>
                    <th className="py-2.5 px-2 text-right font-semibold">L</th>
                    <th className="py-2.5 px-2 text-right font-semibold">T</th>
                    <th className="py-2.5 px-3 text-right font-semibold">NRR</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-700">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedTournament.standings.map((team, idx) => (
                    <tr
                      key={team.teamName}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx === 0 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{team.teamName}</span>
                        {idx === 0 && <span className="text-amber-500 text-xs">👑</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{team.played}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-600 font-bold">{team.won}</td>
                      <td className="py-2.5 px-2 text-right text-rose-600 font-medium">{team.lost}</td>
                      <td className="py-2.5 px-2 text-right text-slate-500">{team.tied}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${
                        team.nrr > 0 ? 'text-emerald-600' : team.nrr < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {team.nrr > 0 ? `+${team.nrr}` : team.nrr}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 text-sm">
                        <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fixtures Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <h3 className="font-display font-bold text-base text-slate-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Fixtures & Schedule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedTournament.fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">{fixture.roundName}</span>
                    {fixture.isCompleted ? (
                      <span className="flex items-center text-emerald-700 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="my-1.5 font-bold text-sm text-slate-900">
                    {fixture.teamA} <span className="text-slate-400 font-normal text-xs">vs</span> {fixture.teamB}
                  </div>

                  {fixture.winner && (
                    <div className="text-xs text-emerald-700 font-semibold mb-2">
                      🏆 Won by {fixture.winner}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    {fixture.matchId ? (
                      <button
                        onClick={() => onViewMatchScorecard(fixture.matchId!)}
                        className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      >
                        View Scorecard
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onStartTournamentMatch(
                            selectedTournament.id,
                            fixture.teamA,
                            fixture.teamB,
                            selectedTournament.rules
                          )
                        }
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play Match</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
            No Tournaments Created Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Host gully or box cricket leagues, track points tables with automated NRR, and award Orange & Purple caps!
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            Create Your First Tournament
          </button>
        </div>
      )}

      {/* Create Tournament Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Create New Tournament
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Participating Teams (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  placeholder="e.g. Royal Kings, Turf Strikers, Mumbai Tigers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Overs / Match</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={overs}
                    onChange={(e) => setOvers(Number(e.target.value) || 6)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Balls / Over</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={ballsPerOver}
                    onChange={(e) => setBallsPerOver(Number(e.target.value) || 4)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Players / Team</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(Number(e.target.value) || 6)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
                >
                  Generate League & Fixtures
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
