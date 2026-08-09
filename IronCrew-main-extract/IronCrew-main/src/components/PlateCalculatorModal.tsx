import React, { useState } from 'react';
import { Disc, X, Calculator } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface PlateConfig {
  weight: number;
  color: string;
  label: string;
}

const AVAILABLE_PLATES: PlateConfig[] = [
  { weight: 45, color: 'bg-red-600 border-red-500 text-white', label: '45 lbs' },
  { weight: 35, color: 'bg-blue-600 border-blue-500 text-white', label: '35 lbs' },
  { weight: 25, color: 'bg-yellow-500 border-yellow-400 text-black', label: '25 lbs' },
  { weight: 10, color: 'bg-emerald-600 border-emerald-500 text-white', label: '10 lbs' },
  { weight: 5, color: 'bg-stone-500 border-stone-400 text-white', label: '5 lbs' },
  { weight: 2.5, color: 'bg-stone-300 border-stone-200 text-stone-900', label: '2.5 lbs' },
];

export const PlateCalculatorModal: React.FC = () => {
  const { plateCalcTargetWeight, setPlateCalcTargetWeight } = useWorkout();
  const { theme, formatWeight, displayWeight, weightUnit } = useTheme();
  const { currentUser } = useAuth();

  const [targetInput, setTargetInput] = useState<number>(plateCalcTargetWeight || 225);
  const [barbellWeight, setBarbellWeight] = useState<number>(currentUser?.settings.barbellWeightLbs || 45);

  if (plateCalcTargetWeight === null) return null;

  const calculatePlates = (targetLbs: number, barLbs: number) => {
    if (targetLbs <= barLbs) return [];
    let remainingPerSide = (targetLbs - barLbs) / 2;
    const plateCounts: { plate: PlateConfig; count: number }[] = [];

    AVAILABLE_PLATES.forEach(p => {
      const count = Math.floor(remainingPerSide / p.weight);
      if (count > 0) {
        plateCounts.push({ plate: p, count });
        remainingPerSide -= count * p.weight;
      }
    });

    return plateCounts;
  };

  const plateStack = calculatePlates(targetInput, barbellWeight);
  const totalPerSide = plateStack.reduce((acc, curr) => acc + curr.plate.weight * curr.count, 0);
  const calculatedTotal = barbellWeight + totalPerSide * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative overflow-hidden`}>
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${theme.badgeBgClass} ${theme.accentClass}`}>
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>Barbell Plate Calculator</h3>
              <p className={`text-xs ${theme.textSecondaryClass}`}>Plates needed per side</p>
            </div>
          </div>
          <button
            onClick={() => setPlateCalcTargetWeight(null)}
            className="p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="my-5 space-y-4">
          <div>
            <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
              Target Total Weight ({weightUnit})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={targetInput}
                onChange={e => setTargetInput(Number(e.target.value) || 0)}
                className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-lg font-bold font-mono focus:outline-none ${theme.ringClass}`}
                step={5}
              />
              <button
                onClick={() => setTargetInput(targetInput + 10)}
                className={`px-3 py-2 rounded-xl ${theme.buttonSecondaryClass} font-mono font-bold text-xs`}
              >
                +10
              </button>
              <button
                onClick={() => setTargetInput(Math.max(barbellWeight, targetInput - 10))}
                className={`px-3 py-2 rounded-xl ${theme.buttonSecondaryClass} font-mono font-bold text-xs`}
              >
                -10
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className={theme.textSecondaryClass}>Barbell Weight:</span>
            <div className="flex gap-1.5">
              {[45, 35, 15, 0].map(weight => (
                <button
                  key={weight}
                  onClick={() => setBarbellWeight(weight)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    barbellWeight === weight
                      ? `${theme.accentBgClass} text-zinc-950`
                      : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  {weight === 0 ? 'No Bar' : `${weight} lbs`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Barbell Loading representation */}
        <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 my-4 flex flex-col items-center justify-center min-h-[120px]">
          <p className={`text-xs font-medium ${theme.textSecondaryClass} mb-3`}>
            Load <span className={`font-bold ${theme.accentClass}`}>{totalPerSide} lbs</span> per side
          </p>

          {plateStack.length === 0 ? (
            <p className="text-xs text-stone-500 italic">Just the empty barbell ({barbellWeight} lbs)</p>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 max-w-full px-2">
              {/* Bar Sleeve */}
              <div className="w-6 h-3 bg-stone-600 rounded-s-md" />

              {/* Plates stack from inside out */}
              {plateStack.flatMap(({ plate, count }) =>
                Array.from({ length: count }).map((_, i) => (
                  <div
                    key={`${plate.weight}-${i}`}
                    className={`flex flex-col items-center justify-center px-1 py-3 rounded-md border text-[10px] font-black tracking-tighter ${plate.color} shadow-sm shrink-0 min-w-[28px] animate-fade-in`}
                    style={{ height: `${Math.max(40, Math.min(80, plate.weight * 1.5))}px` }}
                  >
                    <span>{plate.weight}</span>
                  </div>
                ))
              )}

              {/* Collar */}
              <div className="w-3 h-5 bg-stone-400 rounded-e-md" />
            </div>
          )}
        </div>

        {/* Breakdown List */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {plateStack.map(({ plate, count }) => (
            <div
              key={plate.weight}
              className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-stone-900/60 border border-stone-800/50"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${plate.color.split(' ')[0]}`} />
                <span className={`font-semibold ${theme.textPrimaryClass}`}>{plate.label} Plate</span>
              </div>
              <span className={`font-bold font-mono ${theme.accentClass}`}>
                × {count} per side ({count * 2} total)
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
          <span className={theme.textSecondaryClass}>Calculated Bar Total:</span>
          <span className={`font-extrabold text-sm ${theme.textPrimaryClass}`}>
            {formatWeight(calculatedTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
