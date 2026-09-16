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
      <div className="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-md">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
        <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
          Innings Completed
        </h3>
        <p className="text-xs text-slate-500">
          Match is concluded or ready for the next innings. Review the scorecard above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-md no-select">
      {/* Primary Keypad Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
        {/* Dot ball */}
        <button
          type="button"
          onClick={() => handleRunClick(0)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-50 hover:bg-slate-100/90 active:scale-95 border border-slate-200/90 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-800 transition-all shadow-xs"
        >
          <span>0</span>
          <span className="text-[10px] font-sans text-slate-500 font-semibold">Dot</span>
        </button>

        {/* 1 Run */}
        <button
          type="button"
          onClick={() => handleRunClick(1)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-50 hover:bg-slate-100/90 active:scale-95 border border-slate-200/90 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-800 transition-all shadow-xs"
        >
          <span>1</span>
          <span className="text-[10px] font-sans text-slate-500 font-semibold">Single</span>
        </button>

        {/* 2 Runs */}
        <button
          type="button"
          onClick={() => handleRunClick(2)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-50 hover:bg-slate-100/90 active:scale-95 border border-slate-200/90 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-800 transition-all shadow-xs"
        >
          <span>2</span>
          <span className="text-[10px] font-sans text-slate-500 font-semibold">Double</span>
        </button>

        {/* 3 Runs */}
        <button
          type="button"
          onClick={() => handleRunClick(3)}
          className="h-16 sm:h-20 rounded-2xl bg-slate-50 hover:bg-slate-100/90 active:scale-95 border border-slate-200/90 flex flex-col items-center justify-center font-mono font-bold text-xl sm:text-2xl text-slate-800 transition-all shadow-xs"
        >
          <span>3</span>
          <span className="text-[10px] font-sans text-slate-500 font-semibold">Three</span>
        </button>

        {/* 4 Runs - Boundary */}
        <button
          type="button"
          onClick={() => handleRunClick(4)}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/80 hover:from-blue-100 active:scale-95 border border-blue-200 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-3xl text-blue-700 transition-all shadow-sm shadow-blue-500/10"
        >
          <span>4</span>
          <span className="text-[10px] font-sans text-blue-800 font-bold tracking-wider uppercase">FOUR</span>
        </button>

        {/* 6 Runs - Maximum */}
        <button
          type="button"
          onClick={() => handleRunClick(6)}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100/80 hover:from-emerald-100 active:scale-95 border border-emerald-200 flex flex-col items-center justify-center font-mono font-black text-2xl sm:text-3xl text-emerald-700 transition-all shadow-sm shadow-emerald-500/10"
        >
          <span>6</span>
          <span className="text-[10px] font-sans text-emerald-800 font-bold tracking-wider uppercase">SIX</span>
        </button>

        {/* WICKET Button */}
        <button
          type="button"
          onClick={() => {
            triggerVibrate(60);
            onOpenWicket();
          }}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-rose-50 to-rose-100/80 hover:from-rose-100 active:scale-95 border border-rose-200 flex flex-col items-center justify-center font-display font-black text-lg sm:text-xl text-rose-700 transition-all shadow-sm shadow-rose-500/10"
        >
          <span>OUT</span>
          <span className="text-[10px] font-sans text-rose-800 font-extrabold uppercase tracking-wider">Wicket</span>
        </button>

        {/* EXTRAS Button */}
        <button
          type="button"
          onClick={() => {
            triggerVibrate(30);
            onOpenExtras();
          }}
          className="h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100/80 hover:from-amber-100 active:scale-95 border border-amber-200 flex flex-col items-center justify-center font-display font-black text-base sm:text-lg text-amber-700 transition-all shadow-sm shadow-amber-500/10"
        >
          <span>EXTRAS</span>
          <span className="text-[10px] font-sans text-amber-800 font-bold">Wd / Nb / B</span>
        </button>
      </div>

      {/* Auxiliary Scoring Controls: Undo, Swap, End */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            canUndo
              ? 'bg-slate-100 text-amber-800 border-slate-200 hover:bg-slate-200 active:scale-95'
              : 'opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
          title="Undo last recorded ball"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo Ball</span>
        </button>

        <button
          type="button"
          onClick={onSwapStrike}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95 border border-slate-200 text-xs font-semibold transition-all"
        >
          <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
          <span>Switch Ends</span>
        </button>

        <button
          type="button"
          onClick={onEndInningsManual}
          className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 text-xs font-medium transition-all"
          title="Manually complete or declare innings"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">End Innings</span>
        </button>
      </div>
    </div>
  );
};
