import React, { useState } from 'react';
import { History as HistoryIcon, Calendar, Clock, Trophy, Dumbbell, Trash2, Download, Eye, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutSession } from '../../types';

export const HistoryView: React.FC = () => {
  const { pastWorkouts } = useWorkout();
  const { theme, formatWeight } = useTheme();

  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutSession | null>(null);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pastWorkouts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `liftoff_workout_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${theme.textPrimaryClass} tracking-tight`}>Workout History</h1>
          <p className={`text-xs ${theme.textSecondaryClass}`}>
            Comprehensive archive of all logged gym sessions
          </p>
        </div>

        {pastWorkouts.length > 0 && (
          <button
            onClick={handleExportJSON}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs ${theme.buttonSecondaryClass} flex items-center justify-center gap-2`}
          >
            <Download className="w-4 h-4" />
            <span>Export Logs (JSON)</span>
          </button>
        )}
      </div>

      {pastWorkouts.length === 0 ? (
        <div className={`text-center py-16 ${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-8 space-y-3`}>
          <div className={`w-14 h-14 mx-auto rounded-2xl ${theme.badgeBgClass} ${theme.accentClass} flex items-center justify-center`}>
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>No logged workouts yet</h3>
          <p className={`text-xs ${theme.textSecondaryClass} max-w-sm mx-auto`}>
            Complete your first workout session to see detailed set breakdowns, volume graphs, and PR callouts here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pastWorkouts.map(session => {
            const dateStr = new Date(session.startTime).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const minutes = Math.round(session.durationSeconds / 60);

            return (
              <div
                key={session.id}
                onClick={() => setSelectedWorkoutDetail(session)}
                className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-5 rounded-3xl shadow-md cursor-pointer hover:border-amber-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-stone-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                    <span className={theme.textSecondaryClass}>&bull;</span>
                    <span className="flex items-center gap-1 text-stone-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {minutes} mins
                    </span>
                  </div>

                  <h3 className={`text-base font-bold ${theme.textPrimaryClass} group-hover:text-amber-400 transition-colors`}>
                    {session.title}
                  </h3>

                  <p className={`text-xs ${theme.textSecondaryClass}`}>
                    {session.exercises.length} Exercises &bull; {session.totalCompletedSets} Completed Sets
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-black font-mono ${theme.accentClass}`}>
                      {formatWeight(session.totalVolumeLbs)}
                    </p>
                    <p className={`text-[10px] ${theme.textSecondaryClass}`}>Total Volume</p>
                  </div>

                  <div className="p-2 rounded-xl bg-stone-900 text-stone-400 group-hover:text-white transition-colors">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Workout Detail Popup Modal */}
      {selectedWorkoutDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative max-h-[85vh] flex flex-col`}>
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>
                  {selectedWorkoutDetail.title}
                </h3>
                <p className={`text-xs ${theme.textSecondaryClass}`}>
                  {new Date(selectedWorkoutDetail.startTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedWorkoutDetail(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-stone-950 border border-stone-800">
                <div>
                  <p className={`text-[10px] ${theme.textSecondaryClass} uppercase`}>Duration</p>
                  <p className={`text-sm font-black ${theme.textPrimaryClass} font-mono`}>
                    {Math.round(selectedWorkoutDetail.durationSeconds / 60)}m
                  </p>
                </div>
                <div>
                  <p className={`text-[10px] ${theme.textSecondaryClass} uppercase`}>Volume</p>
                  <p className={`text-sm font-black ${theme.accentClass} font-mono`}>
                    {formatWeight(selectedWorkoutDetail.totalVolumeLbs)}
                  </p>
                </div>
                <div>
                  <p className={`text-[10px] ${theme.textSecondaryClass} uppercase`}>PRs</p>
                  <p className={`text-sm font-black text-amber-400 font-mono`}>
                    {selectedWorkoutDetail.prsEarned}
                  </p>
                </div>
              </div>

              {/* Exercises breakdown */}
              <div className="space-y-3">
                {selectedWorkoutDetail.exercises.map((we, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
                    <h4 className={`text-xs font-bold ${theme.textPrimaryClass}`}>
                      {we.exerciseName} ({we.muscleGroup})
                    </h4>
                    <div className="space-y-1">
                      {we.sets.map((set, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-stone-900/60 font-mono">
                          <span className="text-stone-400">Set #{sIdx + 1} ({set.setType})</span>
                          <span className={theme.textPrimaryClass}>
                            {formatWeight(set.weight)} × {set.reps} reps {set.isPR ? '🏆 PR' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
