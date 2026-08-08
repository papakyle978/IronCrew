import React, { useState, useEffect } from 'react';
import {
  Play,
  Check,
  Plus,
  Trash2,
  X,
  Timer,
  Trophy,
  Dumbbell,
  Calculator,
  ChevronDown,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';
import { SetType, Exercise } from '../types';

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
  } = useWorkout();

  const { theme, formatWeight, displayWeight, inputToLbs, weightUnit } = useTheme();

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Elapsed timer ticker
  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - new Date(activeWorkout.startTime).getTime()) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${hours > 0 ? `${hours}:` : ''}${mins < 10 && hours > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.muscleGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col overflow-hidden animate-fade-in">
      {/* Top Header */}
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
              <span className={theme.textSecondaryClass}>&bull;</span>
              <span className={theme.textSecondaryClass}>{activeWorkout.totalCompletedSets} sets logged</span>
              <span className={theme.textSecondaryClass}>&bull;</span>
              <span className={theme.textSecondaryClass}>{formatWeight(activeWorkout.totalVolumeLbs)} total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cancelWorkout}
            className={`px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={finishWorkout}
            disabled={activeWorkout.totalCompletedSets === 0}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold ${theme.buttonPrimaryClass} shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Workout</span>
          </button>
        </div>
      </header>

      {/* Main Exercises List Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
        {activeWorkout.exercises.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-3xl ${theme.badgeBgClass} ${theme.accentClass} flex items-center justify-center`}>
              <Dumbbell className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-bold ${theme.textPrimaryClass}`}>No exercises added yet</h3>
            <p className={`text-xs ${theme.textSecondaryClass} max-w-sm mx-auto`}>
              Tap below to add exercises from your library and start logging your sets!
            </p>
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className={`px-5 py-3 rounded-2xl font-bold text-sm ${theme.buttonPrimaryClass} inline-flex items-center gap-2 shadow-lg`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise</span>
            </button>
          </div>
        ) : (
          activeWorkout.exercises.map((we, exIdx) => {
            const masterExercise = exercises.find(e => e.id === we.exerciseId);
            const bestPR = masterExercise?.personalRecord?.maxWeightLbs;

            return (
              <div
                key={we.id}
                className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-5 space-y-4 shadow-xl`}
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full ${theme.badgeBgClass} ${theme.accentClass} text-xs font-bold flex items-center justify-center`}>
                      {exIdx + 1}
                    </span>
                    <div>
                      <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>
                        {we.exerciseName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${theme.badgeBgClass} ${theme.badgeTextClass} font-semibold`}>
                          {we.muscleGroup}
                        </span>
                        {bestPR ? (
                          <span className={`text-[11px] ${theme.textSecondaryClass} flex items-center gap-1`}>
                            <Trophy className="w-3 h-3 text-amber-400" /> Best: {formatWeight(bestPR)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const targetSet = we.sets.find(s => s.completed) || we.sets[0];
                        setPlateCalcTargetWeight(targetSet ? targetSet.weight : 135);
                      }}
                      className={`p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 text-xs flex items-center gap-1`}
                      title="Plate Calculator"
                    >
                      <Calculator className="w-4 h-4" />
                      <span className="hidden sm:inline">Plates</span>
                    </button>
                    <button
                      onClick={() => removeExerciseFromActiveWorkout(we.id)}
                      className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-2">Type</span>
                    <span className="col-span-3 text-center">Weight ({weightUnit})</span>
                    <span className="col-span-3 text-center">Reps</span>
                    <span className="col-span-2 text-center">Check</span>
                  </div>

                  {we.sets.map((set, setIdx) => {
                    const epley1RM = set.completed && set.weight > 0 ? Math.round(set.weight * (1 + set.reps / 30)) : null;

                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 items-center p-2 rounded-2xl transition-all ${
                          set.completed
                            ? 'bg-emerald-950/20 border border-emerald-500/20'
                            : 'bg-stone-950/50 border border-stone-800/60'
                        }`}
                      >
                        <div className="col-span-2 flex items-center gap-1">
                          <span className={`text-xs font-mono font-bold ${set.completed ? 'text-emerald-400' : theme.textPrimaryClass}`}>
                            #{setIdx + 1}
                          </span>
                          {set.isPR && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-400 font-extrabold px-1 rounded">
                              PR
                            </span>
                          )}
                        </div>

                        {/* Set Type toggle */}
                        <div className="col-span-2">
                          <select
                            value={set.setType}
                            onChange={e => updateSet(we.id, set.id, { setType: e.target.value as SetType })}
                            className="bg-stone-900 border border-stone-800 text-[11px] text-stone-300 font-semibold rounded-lg px-1.5 py-1 focus:outline-none"
                          >
                            <option value="normal">Norm</option>
                            <option value="warmup">Warm</option>
                            <option value="drop">Drop</option>
                            <option value="failure">Fail</option>
                          </select>
                        </div>

                        {/* Weight Input */}
                        <div className="col-span-3 px-1">
                          <input
                            type="number"
                            value={displayWeight(set.weight)}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              updateSet(we.id, set.id, { weight: inputToLbs(val) });
                            }}
                            className={`w-full text-center font-mono font-bold text-sm bg-stone-900 border border-stone-800 rounded-xl py-1.5 ${theme.textPrimaryClass} focus:outline-none focus:border-amber-400`}
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-3 px-1">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={e => updateSet(we.id, set.id, { reps: Number(e.target.value) || 0 })}
                            className={`w-full text-center font-mono font-bold text-sm bg-stone-900 border border-stone-800 rounded-xl py-1.5 ${theme.textPrimaryClass} focus:outline-none focus:border-amber-400`}
                          />
                        </div>

                        {/* Completion Button */}
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleSetCompleted(we.id, set.id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              set.completed
                                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md scale-105'
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          <button
                            onClick={() => removeSetFromExercise(we.id, set.id)}
                            className="text-stone-600 hover:text-rose-400 p-1"
                            title="Delete set"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Set CTA */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => addSetToExercise(we.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${theme.buttonSecondaryClass} flex items-center gap-1.5`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                </div>
              </div>
            );
          })
        )}

        <div className="pt-4 pb-12 text-center">
          <button
            onClick={() => setShowAddExerciseModal(true)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm ${theme.buttonPrimaryClass} inline-flex items-center gap-2 shadow-xl`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>
      </main>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative max-h-[85vh] flex flex-col`}>
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>Select Exercise</h3>
              <button
                onClick={() => setShowAddExerciseModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Category Filters */}
            <div className="my-4 space-y-3">
              <input
                type="text"
                placeholder="Search exercise..."
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none`}
              />

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? `${theme.accentBgClass} text-zinc-950`
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    addExerciseToActiveWorkout(ex);
                    setShowAddExerciseModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/60 hover:border-amber-400/50 transition-all text-left group"
                >
                  <div>
                    <p className={`text-sm font-bold ${theme.textPrimaryClass} group-hover:text-amber-400`}>
                      {ex.name}
                    </p>
                    <p className={`text-xs ${theme.textSecondaryClass}`}>
                      {ex.muscleGroup} &bull; {ex.equipment}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-stone-400 group-hover:text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
