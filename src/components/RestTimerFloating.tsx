import React from 'react';
import { Play, Pause, Plus, Square, Timer } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

export const RestTimerFloating: React.FC = () => {
  const { restTimer, pauseRestTimer, resumeRestTimer, addSecondsToRestTimer, stopRestTimer } = useWorkout();
  const { theme } = useTheme();

  if (!restTimer.isActive || restTimer.secondsLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(restTimer.secondsLeft / 60);
  const seconds = restTimer.secondsLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.max(0, Math.min(100, ((restTimer.totalSeconds - restTimer.secondsLeft) / restTimer.totalSeconds) * 100));

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
      <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-2xl p-4 w-72 flex flex-col gap-3 backdrop-blur-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${theme.badgeBgClass} ${theme.accentClass}`}>
              <Timer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className={`text-xs font-medium ${theme.textSecondaryClass}`}>Rest Timer</p>
              <p className={`text-xs font-semibold ${theme.textPrimaryClass} truncate max-w-[130px]`}>
                {restTimer.exerciseName || 'Between Sets'}
              </p>
            </div>
          </div>
          <button
            onClick={stopRestTimer}
            className={`p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors`}
            title="Dismiss Timer"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${theme.accentBgClass} transition-all duration-1000 ease-linear`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Display & Controls */}
        <div className="flex items-center justify-between">
          <span className={`text-2xl font-extrabold tracking-tight font-mono ${theme.accentClass}`}>
            {timeFormatted}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addSecondsToRestTimer(30)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${theme.buttonSecondaryClass} flex items-center gap-1`}
              title="Add 30s"
            >
              <Plus className="w-3 h-3" />
              <span>30s</span>
            </button>

            {restTimer.isPaused ? (
              <button
                onClick={resumeRestTimer}
                className={`p-2 rounded-lg ${theme.buttonPrimaryClass}`}
                title="Resume"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={pauseRestTimer}
                className={`p-2 rounded-lg ${theme.buttonSecondaryClass}`}
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
