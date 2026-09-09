import React from 'react';
import { Undo2, ArrowLeftRight, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ScorerPadProps {
  onScoreRuns: (runs: number) => void;
  onOpenExtras: () => void;
  onOpenWicket: () => void;
  onUndo: () => void;
  onSwapStrike: () => void;
  onEndInningsManual: () => void;
  canUndo: boolean;
  isCompleted: boolean;
}

export const ScorerPad: React.FC<ScorerPadProps> = ({
  onScoreRuns,
  onOpenExtras,
  onOpenWicket,
  onUndo,
  onSwapStrike,
  onEndInningsManual,
  canUndo,
  isCompleted,
}) => {
  const triggerVibrate = (pattern: number = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleRunClick = (runs: number) => {
    triggerVibrate(runs >= 4 ? 40 : 20);
    onScoreRuns(runs);
  };

  if (isCompleted) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-center shadow-lg">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h3 className="font-display font-bold text-lg text-white mb-1">
          Innings Completed
        </h3>
        <p className="text-xs text-slate-400">
          Match is concluded or ready for the next innings. Review the scorecard above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xl no-select">
      {/* Primary Keypad Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
        {/* Dot ball */}
        <button
          type="button"
          onClick={() => handleRunClick(0)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700/80 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-200 transition-transform shadow-md"
        >
          <span>0</span>
          <span className="text-[10px] font-sans text-slate-400 font-normal">Dot</span>
        </button>

        {/* 1 Run */}
        <button
          type="button"
          onClick={() => handleRunClick(1)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700/80 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-100 transition-transform shadow-md"
        >
          <span>1</span>
          <span className="text-[10px] font-sans text-slate-400 font-normal">Single</span>
        </button>

        {/* 2 Runs */}
        <button
          type="button"
          onClick={() => handleRunClick(2)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700/80 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-100 transition-transform shadow-md"
        >
          <span>2</span>
          <span className="text-[10px] font-sans text-slate-400 font-normal">Double</span>
        </button>

        {/* 3 Runs */}
        <button
          type="button"
          onClick={() => handleRunClick(3)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700/80 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-100 transition-transform shadow-md"
        >
          <span>3</span>
          <span className="text-[10px] font-sans text-slate-400 font-normal">Three</span>
        </button>

        {/* 4 Runs - Boundary */}
        <button
          type="button"
          onClick={() => handleRunClick(4)}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-600/30 to-blue-900/40 hover:from-blue-600/40 active:scale-95 border border-blue-500/50 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-3xl text-blue-300 transition-transform shadow-lg shadow-blue-950/40"
        >
          <span>4</span>
          <span className="text-[10px] font-sans text-blue-400 font-semibold tracking-wider uppercase">FOUR</span>
        </button>

        {/* 6 Runs - Maximum */}
        <button
          type="button"
          onClick={() => handleRunClick(6)}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-emerald-600/30 to-emerald-900/40 hover:from-emerald-600/40 active:scale-95 border border-emerald-500/50 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-3xl text-emerald-300 transition-transform shadow-lg shadow-emerald-950/40"
        >
          <span>6</span>
          <span className="text-[10px] font-sans text-emerald-400 font-semibold tracking-wider uppercase">SIX</span>
        </button>

        {/* WICKET Button */}
        <button
          type="button"
          onClick={() => {
            triggerVibrate(60);
            onOpenWicket();
          }}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-red-600/30 to-red-950/50 hover:from-red-600/40 active:scale-95 border border-red-500/60 flex flex-col items-center justify-center font-display font-black text-lg sm:text-xl text-red-400 transition-transform shadow-lg shadow-red-950/40"
        >
          <span>OUT</span>
          <span className="text-[10px] font-sans text-red-300 font-bold uppercase tracking-wider">Wicket</span>
        </button>

        {/* EXTRAS Button */}
        <button
          type="button"
          onClick={() => {
            triggerVibrate(30);
            onOpenExtras();
          }}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-amber-600/30 to-amber-950/50 hover:from-amber-600/40 active:scale-95 border border-amber-500/60 flex flex-col items-center justify-center font-display font-black text-base sm:text-lg text-amber-300 transition-transform shadow-lg shadow-amber-950/40"
        >
          <span>EXTRAS</span>
          <span className="text-[10px] font-sans text-amber-400 font-semibold">Wd / Nb / B</span>
        </button>
      </div>

      {/* Auxiliary Scoring Controls: Undo, Swap, End */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            canUndo
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 active:scale-95 text-amber-400'
              : 'opacity-40 bg-slate-950 text-slate-500 border-slate-850 cursor-not-allowed'
          }`}
          title="Undo last recorded ball"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo Ball</span>
        </button>

        <button
          type="button"
          onClick={onSwapStrike}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-750 active:scale-95 border border-slate-700 text-xs font-semibold transition-all"
        >
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span>Switch Ends</span>
        </button>

        <button
          type="button"
          onClick={onEndInningsManual}
          className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-850 hover:bg-red-950/40 hover:text-red-300 text-slate-400 border border-slate-800 text-xs font-medium transition-all"
          title="Manually complete or declare innings"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">End Innings</span>
        </button>
      </div>
    </div>
  );
};
