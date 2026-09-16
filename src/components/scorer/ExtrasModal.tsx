import React, { useState } from 'react';
import type { ExtraType, MatchRules } from '../../types/cricket';
import { X, Check } from 'lucide-react';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: MatchRules;
  onSubmit: (extraType: ExtraType, extraRuns: number, runsOffBat: number) => void;
}

export const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<ExtraType>('WIDE');
  const [additionalRuns, setAdditionalRuns] = useState<number>(0);
  const [runsOffBat, setRunsOffBat] = useState<number>(0);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let totalExtraRuns = 0;
    let offBat = 0;

    if (selectedType === 'WIDE') {
      totalExtraRuns = rules.wideRuns + additionalRuns;
      offBat = 0;
    } else if (selectedType === 'NO_BALL') {
      totalExtraRuns = rules.noBallRuns;
      offBat = runsOffBat;
    } else if (selectedType === 'BYE' || selectedType === 'LEG_BYE') {
      totalExtraRuns = additionalRuns > 0 ? additionalRuns : 1;
      offBat = 0;
    } else if (selectedType === 'PENALTY') {
      totalExtraRuns = 5;
      offBat = 0;
    }

    onSubmit(selectedType, totalExtraRuns, offBat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Record Extras
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Extra Type Selector */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {(['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY'] as ExtraType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelectedType(type);
                setAdditionalRuns(0);
                setRunsOffBat(0);
              }}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                selectedType === type
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type === 'NO_BALL' ? 'NO BALL' : type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Dynamic Sub-options */}
        {selectedType === 'WIDE' && (
          <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 mb-2 font-semibold">
              Additional Byes / Overthrows on Wide:
            </p>
            <div className="flex items-center space-x-2">
              {[0, 1, 2, 3, 4].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => setAdditionalRuns(runs)}
                  className={`flex-1 py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
                    additionalRuns === runs
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  +{runs}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5">
              Total to batting team: <span className="text-emerald-700 font-bold">{rules.wideRuns + additionalRuns} runs</span> (1 Wide {rules.reBallWide ? '+ re-ball' : ''})
            </p>
          </div>
        )}

        {selectedType === 'NO_BALL' && (
          <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 mb-2 font-semibold">
              Runs Scored off No-Ball:
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => setRunsOffBat(runs)}
                  className={`py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
                    runsOffBat === runs
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {runs}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5">
              Total to batting team: <span className="text-emerald-700 font-bold">{rules.noBallRuns + runsOffBat} runs</span> (1 NB penalty + {runsOffBat} off bat)
            </p>
          </div>
        )}

        {(selectedType === 'BYE' || selectedType === 'LEG_BYE') && (
          <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 mb-2 font-semibold">
              Number of {selectedType === 'BYE' ? 'Byes' : 'Leg Byes'}:
            </p>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((runs) => (
                <button
                  key={runs}
                  type="button"
                  onClick={() => setAdditionalRuns(runs)}
                  className={`flex-1 py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
                    (additionalRuns === 0 && runs === 1) || additionalRuns === runs
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {runs}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedType === 'PENALTY' && (
          <div className="mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
            5 penalty runs will be credited directly to the batting side.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Extras</span>
          </button>
        </div>
      </div>
    </div>
  );
};
