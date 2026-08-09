import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Plus, Trash2, X, Calculator, Trophy, Dumbbell, CheckCircle2, Flame } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { SetType } from '../types';

export const ActiveWorkoutModal: React.FC = () => {
  const {
    activeWorkout,
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
    addSetToExercise,
    removeSetFromExercise,
    updateSet,
    toggleSetCompleted,
    finishWorkout,
    cancelWorkout,
    exercises,
    setPlateCalcTargetWeight,
    toggleWorkoutTimerPause,
  } = useWorkout();

  const { theme, formatWeight, displayWeight, inputToLbs, weightUnit } = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      if (!activeWorkout.isPaused) {
        const now = Date.now();
        const baseTime = activeWorkout.accumulatedTimeSeconds || 0;
        const sessionDiff = Math.floor((now - new Date(activeWorkout.lastTickTime || activeWorkout.startTime).getTime()) / 1000);
        setElapsedSeconds(baseTime + sessionDiff);
      } else {
        setElapsedSeconds(activeWorkout.accumulatedTimeSeconds || 0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${hours > 0 ? `${hours}:` : ''}${mins < 10 && hours > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col overflow-hidden animate-fade-in">
      <header className={`px-6 py-4 border-b ${theme.cardBorderClass} ${theme.cardBgClass} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.badgeBgClass} ${theme.accentClass}`}>
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${theme.textPrimaryClass} leading-tight`}>
              {activeWorkout.title}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={theme.accentClass}>{timeFormatted}</span>
              <button 
                type="button"
                onClick={toggleWorkoutTimerPause}
                className="ml-1 px-2 py-0.5 rounded-lg bg-stone-800 text-stone-300 text-[10px] font-bold hover:bg-stone-700 transition-colors"
              >
                {activeWorkout.isPaused ? '▶️ Resume' : '⏸ Pause'}
              </button>
              <span className={theme.textSecondaryClass}>&bull;</span>
              <span className={theme.textSecondaryClass}>{activeWorkout.totalCompletedSets || 0} sets logged</span>
              <span className={theme.textSecondaryClass}>&bull;</span>
              <span className={theme.textSecondaryClass}>{formatWeight(activeWorkout.totalVolumeLbs || 0)} total</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={cancelWorkout} className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20">
            Cancel
          </button>
          <button type="button" onClick={finishWorkout} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${theme.buttonPrimaryClass}`}>
            Finish Workout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
        {activeWorkout.exercises.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-3xl ${theme.badgeBgClass} ${theme.accentClass} flex items-center justify-center`}>
              <Dumbbell className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-bold ${theme.textPrimaryClass}`}>No exercises added yet</h3>
            <button type="button" onClick={() => setShowAddExerciseModal(true)} className={`px-5 py-3 rounded-2xl font-bold text-sm ${theme.buttonPrimaryClass}`}>
              Add Exercise
            </button>
          </div>
        ) : (
          activeWorkout.exercises.map((we: any, exIdx: number) => (
            <div key={we.id} className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-5 space-y-4 shadow-xl`}>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-stone-800 text-xs font-bold flex items-center justify-center">{exIdx + 1}</span>
                  <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>{we.exerciseName}</h3>
                </div>
                <button type="button" onClick={() => removeExerciseFromActiveWorkout(we.id)} className="text-stone-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {we.sets.map((set: any, setIdx: number) => (
                  <div key={set.id} className={`grid grid-cols-12 items-center p-2 rounded-2xl ${set.completed ? 'bg-emerald-950/20' : 'bg-stone-900/40'}`}>
                    <span className="col-span-2 text-xs font-mono font-bold">#{setIdx + 1}</span>
                    <div className="col-span-3">
                      <select
                        value={set.setType}
                        onChange={e => updateSet(we.id, set.id, { setType: e.target.value as SetType })}
                        className="bg-stone-900 text-xs text-stone-300 rounded px-1 py-1 focus:outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="warmup">Warmup</option>
                        <option value="drop">Drop</option>
                        <option value="failure">Failure</option>
                      </select>
                    </div>
                    <div className="col-span-3 px-1">
                      <input
                        type="number"
                        value={displayWeight(set.weight)}
                        onChange={e => updateSet(we.id, set.id, { weight: inputToLbs(Number(e.target.value) || 0) })}
                        className="w-full text-center text-xs bg-stone-950 text-white rounded p-1"
                      />
                    </div>
                    <div className="col-span-2 px-1">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => updateSet(we.id, set.id, { reps: Number(e.target.value) || 0 })}
                        className="w-full text-center text-xs bg-stone-950 text-white rounded p-1"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleSetCompleted(we.id, set.id)}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-black shadow-md' : 'bg-stone-800 text-stone-400'}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addSetToExercise(we.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${theme.buttonSecondaryClass}`}>
                + Add Set
              </button>
            </div>
          ))
        )}
        <div className="text-center pt-4">
          <button type="button" onClick={() => setShowAddExerciseModal(true)} className={`px-6 py-3 rounded-2xl font-bold text-sm ${theme.buttonPrimaryClass}`}>
            + Add Exercise
          </button>
        </div>
      </main>

      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg ${theme.cardBgClass} p-6 rounded-3xl`}>
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold">Select Exercise</h3>
              <button type="button" onClick={() => setShowAddExerciseModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="my-4">
              <input
                type="text"
                placeholder="Search..."
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                className="w-full p-2 rounded bg-stone-950 border border-stone-800 text-xs text-white"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
{exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => (<buttonkey={ex.id}type="button"onClick={() => { addExerciseToActiveWorkout(ex); setShowAddExerciseModal(false); }}className="w-full p-2.5 text-left text-xs bg-stone-900/50 hover:bg-stone-800 rounded-xl block text-stone-200">{ex.name} ({ex.muscleGroup})))})});};