import React from 'react';
import { Trophy, Flame, Sparkles, X, Share2 } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

export const PRCelebrationModal: React.FC = () => {
  const { prCelebration, dismissPRCelebration } = useWorkout();
  const { theme, formatWeight } = useTheme();

  if (!prCelebration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-sm ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 text-center overflow-hidden`}>
        {/* Glowing background burst */}
        <div className={`absolute -top-20 -left-20 w-48 h-48 rounded-full ${theme.accentBgClass} opacity-20 blur-3xl pointer-events-none`} />

        <button
          onClick={dismissPRCelebration}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white bg-black/20 hover:bg-black/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl ${theme.badgeBgClass} ${theme.accentClass} border ${theme.accentBorderClass} flex items-center justify-center mb-4 shadow-lg scale-110 animate-bounce`}>
            <Trophy className="w-9 h-9" />
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${theme.badgeBgClass} ${theme.accentClass} mb-2`}>
            <Flame className="w-3.5 h-3.5" />
            New Personal Record!
          </span>

          <h3 className={`text-xl font-extrabold ${theme.textPrimaryClass} mb-1`}>
            {prCelebration.exerciseName}
          </h3>

          <div className="my-4 py-3 px-6 rounded-2xl bg-black/30 border border-white/5 inline-block">
            <span className={`text-3xl font-black ${theme.accentClass} tracking-tight`}>
              {formatWeight(prCelebration.weightLbs)}
            </span>
            <span className={`text-sm font-semibold ${theme.textSecondaryClass} ml-2`}>
              × {prCelebration.reps} reps
            </span>
          </div>

          <p className={`text-xs ${theme.textSecondaryClass} mb-6`}>
            Estimated 1-Rep Max (1RM):{' '}
            <strong className={theme.textPrimaryClass}>{formatWeight(prCelebration.estimated1RM)}</strong>
          </p>

          <div className="flex gap-2 w-full">
            <button
              onClick={dismissPRCelebration}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm ${theme.buttonPrimaryClass} shadow-md transition-all active:scale-95`}
            >
              Keep Lifting 💪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
