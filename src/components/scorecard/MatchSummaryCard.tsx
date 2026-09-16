import React, { useEffect, useRef, useState } from 'react';
import type { MatchRecord } from '../../types/cricket';
import { formatOvers } from '../../engine/scoringEngine';
import { generateMatchAwards } from '../../services/aiAnalyst';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import {
  Trophy,
  Award,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Flame,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface MatchSummaryCardProps {
  match: MatchRecord;
  onUpdateMatch: (updatedMatch: MatchRecord) => void;
}

export const MatchSummaryCard: React.FC<MatchSummaryCardProps> = ({
  match,
  onUpdateMatch,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Trigger confetti celebration once on mount if match is completed
  useEffect(() => {
    if (match.status === 'COMPLETED') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#ec4899'],
        });
      } catch (err) {
        console.log('Confetti error:', err);
      }
    }
  }, [match.status]);

  // If AI summary does not exist, auto-generate on load
  useEffect(() => {
    if (match.status === 'COMPLETED' && !match.aiSummary) {
      handleGenerateAI();
    }
  }, [match.status, match.aiSummary]);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const summary = await generateMatchAwards(match);
      const updated: MatchRecord = {
        ...match,
        aiSummary: summary,
        updatedAt: Date.now(),
      };
      onUpdateMatch(updated);
    } catch (error) {
      console.error('Failed to generate AI awards:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // High resolution for mobile/retina
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `CricFlex_${match.teamA.name}_vs_${match.teamB.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download card error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const summary = match.aiSummary;
    const isTest = match.matchType === 'TEST';

    let scoresText = '';
    if (isTest) {
      const inn1 = match.innings1;
      const inn2 = match.innings2;
      const inn3 = match.innings3;
      const inn4 = match.innings4;
      const teamATotal = inn1.totalRuns + (inn3?.totalRuns || 0);
      const teamBTotal = (inn2?.totalRuns || 0) + (inn4?.totalRuns || 0);

      scoresText = `*${inn1.battingTeam}:* ${teamATotal} (1st: ${inn1.totalRuns}/${inn1.wicketsLost} | 2nd: ${inn3 ? inn3.totalRuns + '/' + inn3.wicketsLost : 'DNB'})
${inn2 ? `*${inn2.battingTeam}:* ${teamBTotal} (1st: ${inn2.totalRuns}/${inn2.wicketsLost} | 2nd: ${inn4 ? inn4.totalRuns + '/' + inn4.wicketsLost : 'DNB'})` : ''}`;
    } else {
      const inn1 = match.innings1;
      const inn2 = match.innings2;
      scoresText = `*${inn1.battingTeam}:* ${inn1.totalRuns}/${inn1.wicketsLost} (${formatOvers(inn1.legalBallsBowled, match.rules.ballsPerOver)} ov)
${inn2 ? `*${inn2.battingTeam}:* ${inn2.totalRuns}/${inn2.wicketsLost} (${formatOvers(inn2.legalBallsBowled, match.rules.ballsPerOver)} ov)` : ''}`;
    }

    const text = `🏏 *CricFlex Match Result* 🏏
🏆 *Result:* ${match.resultText}

📊 *Scores:*
${scoresText}

🌟 *Honours:*
🏅 *POTM:* ${summary?.potm || 'N/A'} - ${summary?.potmReason || ''}
🏏 *Best Batter:* ${summary?.bestBatter || 'N/A'}
🎯 *Best Bowler:* ${summary?.bestBowler || 'N/A'}
🧤 *Best Fielder:* ${summary?.bestFielder || 'N/A'}

📰 *Match Recap:*
"${summary?.narrative || ''}"

⚡ Scored with CricFlex Zero-DB`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const summary = match.aiSummary;

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Match Report Card & AI Awards</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isGeneratingAI}
            onClick={handleGenerateAI}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isGeneratingAI ? 'Analyzing...' : 'AI Re-analyze'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadImage}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExporting ? 'Exporting...' : 'Save Image'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Printable / Shareable Card Container */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 border-2 border-emerald-500/30 p-6 sm:p-8 shadow-xl text-slate-900"
      >
        {/* Subtle decorative glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="text-center pb-6 border-b border-slate-200">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Match Concluded</span>
          </div>

          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            {match.resultText || 'Match Completed'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {match.teamA.name} vs {match.teamB.name} • {match.matchType} ({match.rules.ballsPerOver} balls/over)
          </p>
        </div>

        {/* Scores Display */}
        {match.matchType === 'TEST' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {/* Team 1 (Batting 1st) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Team 1
              </span>
              <div className="text-lg font-bold text-slate-800 mb-2">
                {match.innings1.battingTeam}
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                {match.innings1.totalRuns + (match.innings3 ? match.innings3.totalRuns : 0)}
              </div>
              <div className="flex justify-center items-center gap-3 text-xs text-slate-600 font-mono mt-2 pt-2 border-t border-slate-100">
                <span>
                  1st: <strong className="text-slate-900">{match.innings1.totalRuns}/{match.innings1.wicketsLost}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  2nd: <strong className="text-slate-900">{match.innings3 ? `${match.innings3.totalRuns}/${match.innings3.wicketsLost}` : 'DNB'}</strong>
                </span>
              </div>
            </div>

            {/* Team 2 (Batting 2nd) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Team 2
              </span>
              <div className="text-lg font-bold text-slate-800 mb-2">
                {match.innings2 ? match.innings2.battingTeam : match.innings1.bowlingTeam}
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                {(match.innings2 ? match.innings2.totalRuns : 0) + (match.innings4 ? match.innings4.totalRuns : 0)}
              </div>
              <div className="flex justify-center items-center gap-3 text-xs text-slate-600 font-mono mt-2 pt-2 border-t border-slate-100">
                <span>
                  1st: <strong className="text-slate-900">{match.innings2 ? `${match.innings2.totalRuns}/${match.innings2.wicketsLost}` : 'DNB'}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  2nd: <strong className="text-slate-900">{match.innings4 ? `${match.innings4.totalRuns}/${match.innings4.wicketsLost}` : 'DNB'}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Limited Overs Scores */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                1st Innings
              </span>
              <div className="text-base font-bold text-slate-800">
                {match.innings1.battingTeam}
              </div>
              <div className="font-display text-3xl sm:text-4xl font-black text-emerald-600 font-mono mt-1">
                {match.innings1.totalRuns}/{match.innings1.wicketsLost}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1 font-semibold">
                {formatOvers(match.innings1.legalBallsBowled, match.rules.ballsPerOver)} / {match.rules.totalOvers} overs
              </div>
            </div>

            {match.innings2 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  2nd Innings
                </span>
                <div className="text-base font-bold text-slate-800">
                  {match.innings2.battingTeam}
                </div>
                <div className="font-display text-3xl sm:text-4xl font-black text-emerald-600 font-mono mt-1">
                  {match.innings2.totalRuns}/{match.innings2.wicketsLost}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1 font-semibold">
                  {formatOvers(match.innings2.legalBallsBowled, match.rules.ballsPerOver)} / {match.rules.totalOvers} overs
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Honors & Recap */}
        {summary ? (
          <div className="space-y-4 pt-2">
            {/* Player of the Match Banner */}
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border-l-4 border-amber-500 rounded-2xl p-4 border-y border-r border-amber-200 shadow-sm">
              <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Player of the Match</span>
              </div>
              <div className="text-xl font-display font-extrabold text-slate-900">
                {summary.potm}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {summary.potmReason}
              </p>
            </div>

            {/* Other 3 Honors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Best Batter */}
              <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-200/80 shadow-xs">
                <div className="text-xs text-blue-700 font-bold mb-1 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-blue-600" />
                  <span>Best Batter</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">
                  {summary.bestBatter}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {summary.bestBatterReason}
                </p>
              </div>

              {/* Best Bowler */}
              <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-200/80 shadow-xs">
                <div className="text-xs text-emerald-700 font-bold mb-1 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Best Bowler</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">
                  {summary.bestBowler}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {summary.bestBowlerReason}
                </p>
              </div>

              {/* Best Fielder */}
              <div className="bg-purple-50/50 rounded-2xl p-3.5 border border-purple-200/80 shadow-xs">
                <div className="text-xs text-purple-700 font-bold mb-1 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Best Fielder</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">
                  {summary.bestFielder}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {summary.bestFielderReason}
                </p>
              </div>
            </div>

            {/* Match Narrative */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Editorial Match Recap</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                "{summary.narrative}"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200">
            <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Compiling AI Match Honors & Stats...</p>
          </div>
        )}

        {/* Footer Brand */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>🏏 CricFlex (Zero-DB Edition)</span>
          <span>Offline Browser PWA</span>
        </div>
      </div>
    </div>
  );
};
