import React, { useState, useEffect } from 'react';
import type { MatchRecord } from '../../types/cricket';
import { db } from '../../db/cricflexDb';
import { formatOvers } from '../../engine/scoringEngine';
import {
  History,
  Play,
  FileText,
  Download,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface MatchesHistoryProps {
  onResumeMatch: (match: MatchRecord) => void;
  onViewScorecard: (match: MatchRecord) => void;
}

export const MatchesHistory: React.FC<MatchesHistoryProps> = ({
  onResumeMatch,
  onViewScorecard,
}) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const all = await db.matches.reverse().sortBy('createdAt');
      setMatches(all);
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this match record?')) {
      await db.matches.delete(id);
      loadMatches();
    }
  };

  const handleExportJSON = (match: MatchRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(match, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cricflex_${match.teamA.name}_vs_${match.teamB.name}_${match.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'LIVE') return m.status === 'LIVE';
    if (filter === 'COMPLETED') return m.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              Matches Archive
            </h2>
            <p className="text-xs text-slate-500">
              All matches stored securely in your browser's IndexedDB
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['ALL', 'LIVE', 'COMPLETED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === mode
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No matches found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const dateStr = new Date(match.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={match.id}
                className="bg-white hover:border-emerald-300 rounded-2xl border border-slate-200 p-4 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          match.status === 'LIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {match.status}
                      </span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {match.matchType} ({match.rules.ballsPerOver} b/ov)
                      </span>
                    </div>

                    <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  {/* Team Scores */}
                  <div className="space-y-1.5 mb-3">
                    {match.matchType === 'TEST' ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-800">
                            {match.innings1.battingTeam}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold text-xs sm:text-sm">
                            {match.innings1.totalRuns}/{match.innings1.wicketsLost}
                            {match.innings3 ? (
                              <span className="text-slate-500"> & {match.innings3.totalRuns}/{match.innings3.wicketsLost}</span>
                            ) : null}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-800">
                            {match.innings2 ? match.innings2.battingTeam : (match.teamA.name === match.innings1.battingTeam ? match.teamB.name : match.teamA.name)}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold text-xs sm:text-sm">
                            {match.innings2 ? (
                              <>
                                {match.innings2.totalRuns}/{match.innings2.wicketsLost}
                                {match.innings4 ? (
                                  <span className="text-slate-500"> & {match.innings4.totalRuns}/{match.innings4.wicketsLost}</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-400 italic text-xs font-normal">Yet to bat</span>
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-800">
                            {match.innings1.battingTeam}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold">
                            {match.innings1.totalRuns}/{match.innings1.wicketsLost}{' '}
                            <span className="text-slate-400 text-xs font-normal">
                              ({formatOvers(match.innings1.legalBallsBowled, match.rules.ballsPerOver)} ov)
                            </span>
                          </span>
                        </div>

                        {match.innings2 ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-slate-800">
                              {match.innings2.battingTeam}
                            </span>
                            <span className="font-mono text-emerald-600 font-bold">
                              {match.innings2.totalRuns}/{match.innings2.wicketsLost}{' '}
                              <span className="text-slate-400 text-xs font-normal">
                                ({formatOvers(match.innings2.legalBallsBowled, match.rules.ballsPerOver)} ov)
                              </span>
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            {match.teamA.name === match.innings1.battingTeam ? match.teamB.name : match.teamA.name} yet to bat
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Result or equation */}
                  {match.resultText && (
                    <div className="text-xs text-emerald-700 font-semibold mb-3 flex items-center space-x-1">
                      <span>🏆 {match.resultText}</span>
                    </div>
                  )}

                  {match.aiSummary && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-3 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span className="truncate">
                        POTM: <strong>{match.aiSummary.potm}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleExportJSON(match)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Export match JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(match.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete match record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {match.status === 'LIVE' ? (
                      <button
                        onClick={() => onResumeMatch(match)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onViewScorecard(match)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scorecard</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
