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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-sm shadow-sm">
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
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-lg text-slate-900">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab('inn1')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'inn1'
              ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
          }`}
        >
          {match.innings1.battingTeam} ({matchType === 'TEST' ? '1st Inn' : '1st Inn'}) • {match.innings1.totalRuns}/{match.innings1.wicketsLost}
        </button>

        {match.innings2 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn2')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn2'
                ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
            }`}
          >
            {match.innings2.battingTeam} ({matchType === 'TEST' ? '1st Inn' : '2nd Inn'}) • {match.innings2.totalRuns}/{match.innings2.wicketsLost}
          </button>
        )}

        {match.innings3 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn3')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn3'
                ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
            }`}
          >
            {match.innings3.battingTeam} (2nd Inn) • {match.innings3.totalRuns}/{match.innings3.wicketsLost}
          </button>
        )}

        {match.innings4 && (
          <button
            type="button"
            onClick={() => setActiveTab('inn4')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'inn4'
                ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
            }`}
          >
            {match.innings4.battingTeam} (2nd Inn) • {match.innings4.totalRuns}/{match.innings4.wicketsLost}
          </button>
        )}
      </div>

      {/* Batting Scorecard Table */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Batting Card
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-bold">Batter</th>
                <th className="py-2.5 px-3 font-bold">Dismissal</th>
                <th className="py-2.5 px-2 text-right font-bold">R</th>
                <th className="py-2.5 px-2 text-right font-bold">B</th>
                <th className="py-2.5 px-2 text-right font-bold">4s</th>
                <th className="py-2.5 px-2 text-right font-bold">6s</th>
                <th className="py-2.5 px-3 text-right font-bold">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {battersList.map((batter) => {
                const isCurrentlyBatting =
                  !batter.isOut &&
                  (batter.name === currentInnings.strikerName ||
                    batter.name === currentInnings.nonStrikerName);

                return (
                  <tr
                    key={batter.name}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCurrentlyBatting ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{batter.name}</span>
                      {isCurrentlyBatting && (
                        <span className="text-[10px] text-emerald-600 font-bold font-mono">🏏*</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                      {batter.isOut
                        ? batter.dismissalInfo || 'out'
                        : isCurrentlyBatting
                        ? 'not out'
                        : 'did not bat'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-slate-900">
                      {batter.runs}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500">{batter.balls}</td>
                    <td className="py-2.5 px-2 text-right text-slate-700 font-medium">{batter.fours}</td>
                    <td className="py-2.5 px-2 text-right text-slate-700 font-medium">{batter.sixes}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">{batter.strikeRate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Extras & Total Summary */}
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            <span className="font-bold text-slate-800">Extras: </span>
            <span className="font-mono text-emerald-700 font-bold">{currentInnings.extras.total}</span>{' '}
            <span className="text-[11px] text-slate-500">
              (b {currentInnings.extras.byes}, lb {currentInnings.extras.legByes}, w {currentInnings.extras.wides}, nb {currentInnings.extras.noBalls}, p {currentInnings.extras.penalties})
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900">
            Total: <span className="text-emerald-700 font-black font-mono">{currentInnings.totalRuns}/{currentInnings.wicketsLost}</span>{' '}
            <span className="text-xs text-slate-500 font-normal font-mono">
              ({formatOvers(currentInnings.legalBallsBowled, rules.ballsPerOver)} / {rules.totalOvers} ov)
            </span>
          </div>
        </div>
      </div>

      {/* Bowling Scorecard Table */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Bowling Card
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                <th className="py-2.5 px-3 font-bold">Bowler</th>
                <th className="py-2.5 px-2 text-right font-bold">O</th>
                <th className="py-2.5 px-2 text-right font-bold">M</th>
                <th className="py-2.5 px-2 text-right font-bold">R</th>
                <th className="py-2.5 px-2 text-right font-bold">W</th>
                <th className="py-2.5 px-3 text-right font-bold">Econ</th>
                <th className="py-2.5 px-2 text-right font-bold">WD</th>
                <th className="py-2.5 px-2 text-right font-bold">NB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {bowlersList.map((bowler) => (
                <tr key={bowler.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                    {bowler.name}
                  </td>
                  <td className="py-2.5 px-2 text-right text-indigo-700 font-bold">
                    {bowler.overs}.{bowler.balls}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-500">{bowler.maidens}</td>
                  <td className="py-2.5 px-2 text-right text-slate-800 font-semibold">{bowler.runs}</td>
                  <td className="py-2.5 px-2 text-right font-black text-emerald-600">
                    {bowler.wickets}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">{bowler.economy}</td>
                  <td className="py-2.5 px-2 text-right text-slate-500">{bowler.wides}</td>
                  <td className="py-2.5 px-2 text-right text-slate-500">{bowler.noBalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {currentInnings.fallOfWickets.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Fall of Wickets
          </h4>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {currentInnings.fallOfWickets.map((fow) => (
              <div
                key={fow.wicketNumber}
                className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
              >
                <span className="text-rose-700 font-black">{fow.score}/{fow.wicketNumber}</span>{' '}
                <span className="text-slate-600">({fow.playerOut}, {fow.over} ov)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
