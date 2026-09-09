import React, { useState } from 'react';
import type { MatchRecord, InningsState } from '../../types/cricket';
import { formatOvers } from '../../engine/scoringEngine';

interface FullScorecardProps {
  match: MatchRecord;
}

export const FullScorecard: React.FC<FullScorecardProps> = ({ match }) => {
  const getDefaultTab = (): 'inn1' | 'inn2' | 'inn3' | 'inn4' => {
    if (match.currentInningsIndex === 4 && match.innings4) return 'inn4';
    if (match.currentInningsIndex === 3 && match.innings3) return 'inn3';
    if (match.currentInningsIndex === 2 && match.innings2) return 'inn2';
    return 'inn1';
  };

  const [activeTab, setActiveTab] = useState<'inn1' | 'inn2' | 'inn3' | 'inn4'>(getDefaultTab());

  const currentInnings: InningsState | undefined =
    activeTab === 'inn4'
      ? match.innings4
      : activeTab === 'inn3'
      ? match.innings3
      : activeTab === 'inn2'
      ? match.innings2
      : match.innings1;

  if (!currentInnings) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-center text-slate-400 text-sm">
        Innings data not available yet.
      </div>
    );
  }

  const { rules, matchType } = match;
  const battersList = Object.values(currentInnings.batters);
  const bowlersList = Object.values(currentInnings.bowlers).filter(
    (bw) => bw.overs > 0 || bw.balls > 0
  );

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl text-slate-100">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-3 mb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('inn1')}
          className={`flex-1 min-w-[140px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'inn1'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {match.innings1.battingTeam} ({matchType === 'TEST' ? '1st Inn' : '1st Inn'}) • {match.innings1.totalRuns}/{match.innings1.wicketsLost}
        </button>

        {match.innings2 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn2')}
            className={`flex-1 min-w-[140px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn2'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {match.innings2.battingTeam} ({matchType === 'TEST' ? '1st Inn' : '2nd Inn'}) • {match.innings2.totalRuns}/{match.innings2.wicketsLost}
          </button>
        )}

        {match.innings3 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn3')}
            className={`flex-1 min-w-[140px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn3'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {match.innings3.battingTeam} (2nd Inn) • {match.innings3.totalRuns}/{match.innings3.wicketsLost}
          </button>
        )}

        {match.innings4 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn4')}
            className={`flex-1 min-w-[140px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn4'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {match.innings4.battingTeam} (2nd Inn) • {match.innings4.totalRuns}/{match.innings4.wicketsLost}
          </button>
        )}
      </div>

      {/* Batting Scorecard Table */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Batting Card
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3 font-semibold">Batter</th>
                <th className="py-2 px-3 font-semibold">Dismissal</th>
                <th className="py-2 px-2 text-right font-semibold">R</th>
                <th className="py-2 px-2 text-right font-semibold">B</th>
                <th className="py-2 px-2 text-right font-semibold">4s</th>
                <th className="py-2 px-2 text-right font-semibold">6s</th>
                <th className="py-2 px-3 text-right font-semibold">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {battersList.map((batter) => {
                const isCurrentlyBatting =
                  !batter.isOut &&
                  (batter.name === currentInnings.strikerName ||
                    batter.name === currentInnings.nonStrikerName);

                return (
                  <tr
                    key={batter.name}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isCurrentlyBatting ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200 flex items-center space-x-1.5">
                      <span>{batter.name}</span>
                      {isCurrentlyBatting && (
                        <span className="text-[10px] text-emerald-400 font-mono">🏏*</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                      {batter.isOut
                        ? batter.dismissalInfo || 'out'
                        : isCurrentlyBatting
                        ? 'not out'
                        : 'did not bat'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-100">
                      {batter.runs}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400">{batter.balls}</td>
                    <td className="py-2.5 px-2 text-right text-slate-300">{batter.fours}</td>
                    <td className="py-2.5 px-2 text-right text-slate-300">{batter.sixes}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{batter.strikeRate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Extras & Total Summary */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            <span className="font-semibold text-slate-300">Extras: </span>
            <span className="font-mono text-emerald-400 font-bold">{currentInnings.extras.total}</span>{' '}
            <span className="text-[11px] text-slate-500">
              (b {currentInnings.extras.byes}, lb {currentInnings.extras.legByes}, w {currentInnings.extras.wides}, nb {currentInnings.extras.noBalls}, p {currentInnings.extras.penalties})
            </span>
          </div>

          <div className="text-sm font-bold text-white">
            Total: <span className="text-emerald-400 font-mono">{currentInnings.totalRuns}/{currentInnings.wicketsLost}</span>{' '}
            <span className="text-xs text-slate-400 font-normal font-mono">
              ({formatOvers(currentInnings.legalBallsBowled, rules.ballsPerOver)} / {rules.totalOvers} ov)
            </span>
          </div>
        </div>
      </div>

      {/* Bowling Scorecard Table */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Bowling Card
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3 font-semibold">Bowler</th>
                <th className="py-2 px-2 text-right font-semibold">O</th>
                <th className="py-2 px-2 text-right font-semibold">M</th>
                <th className="py-2 px-2 text-right font-semibold">R</th>
                <th className="py-2 px-2 text-right font-semibold">W</th>
                <th className="py-2 px-3 text-right font-semibold">Econ</th>
                <th className="py-2 px-2 text-right font-semibold">WD</th>
                <th className="py-2 px-2 text-right font-semibold">NB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bowlersList.map((bowler) => (
                <tr key={bowler.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    {bowler.name}
                  </td>
                  <td className="py-2.5 px-2 text-right text-indigo-300 font-semibold">
                    {bowler.overs}.{bowler.balls}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-400">{bowler.maidens}</td>
                  <td className="py-2.5 px-2 text-right text-slate-100">{bowler.runs}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-emerald-400">
                    {bowler.wickets}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{bowler.economy}</td>
                  <td className="py-2.5 px-2 text-right text-slate-400">{bowler.wides}</td>
                  <td className="py-2.5 px-2 text-right text-slate-400">{bowler.noBalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {currentInnings.fallOfWickets.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Fall of Wickets
          </h4>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {currentInnings.fallOfWickets.map((fow) => (
              <div
                key={fow.wicketNumber}
                className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <span className="text-red-400 font-bold">{fow.score}/{fow.wicketNumber}</span>{' '}
                <span className="text-slate-400">({fow.playerOut}, {fow.over} ov)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
