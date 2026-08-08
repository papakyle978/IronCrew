import React, { useState } from 'react';
import { BookOpen, Plus, Play, Dumbbell, Trash2, X, Check, Edit2 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { MuscleGroup } from '../../types';

export const RoutinesView: React.FC = () => {
  const { routines, createRoutine, startWorkout, exercises } = useWorkout();
  const { theme } = useTheme();

  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Routine Form State
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDesc, setRoutineDesc] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<{
    exerciseId: string;
    exerciseName: string;
    muscleGroup: MuscleGroup;
    targetSets: number;
    targetReps: string;
  }[]>([]);

  const [exerciseToAddId, setExerciseToAddId] = useState('');

  const filterOptions = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];

  const filteredRoutines = routines.filter(r => {
    if (selectedMuscleFilter === 'All') return true;
    return r.muscleGroups.includes(selectedMuscleFilter as MuscleGroup);
  });

  const handleAddExerciseToRoutine = () => {
    if (!exerciseToAddId) return;
    const foundEx = exercises.find(e => e.id === exerciseToAddId);
    if (!foundEx) return;

    setSelectedExercises(prev => [
      ...prev,
      {
        exerciseId: foundEx.id,
        exerciseName: foundEx.name,
        muscleGroup: foundEx.muscleGroup,
        targetSets: 3,
        targetReps: '8-10',
      },
    ]);
    setExerciseToAddId('');
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim() || selectedExercises.length === 0) return;

    createRoutine(routineTitle, routineDesc, selectedExercises);
    setShowCreateModal(false);
    setRoutineTitle('');
    setRoutineDesc('');
    setSelectedExercises([]);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${theme.textPrimaryClass} tracking-tight`}>Workout Routines</h1>
          <p className={`text-xs ${theme.textSecondaryClass}`}>
            Preset routine library and custom split builders
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs ${theme.buttonPrimaryClass} shadow-lg flex items-center justify-center gap-2`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Routine</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedMuscleFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedMuscleFilter === cat
                ? `${theme.accentBgClass} text-zinc-950`
                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Routines Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutines.map(routine => (
          <div
            key={routine.id}
            className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-400/50 transition-all group`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${theme.badgeBgClass} ${theme.badgeTextClass}`}>
                  {routine.muscleGroups.join(', ')}
                </span>
                <span className={`text-xs ${theme.textSecondaryClass}`}>
                  By {routine.createdBy}
                </span>
              </div>

              <h3 className={`text-lg font-bold ${theme.textPrimaryClass} group-hover:text-amber-400 transition-colors`}>
                {routine.title}
              </h3>
              <p className={`text-xs ${theme.textSecondaryClass} line-clamp-2`}>
                {routine.description}
              </p>

              {/* Exercises preview list */}
              <div className="pt-2 border-t border-stone-800 space-y-1.5">
                {routine.exercises.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${theme.textPrimaryClass} truncate max-w-[170px]`}>
                      {e.exerciseName}
                    </span>
                    <span className={`font-mono text-[11px] ${theme.textSecondaryClass}`}>
                      {e.targetSets} sets × {e.targetReps}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => startWorkout(routine.title, routine.id)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold ${theme.buttonPrimaryClass} shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Routine</span>
            </button>
          </div>
        ))}
      </div>

      {/* Create Custom Routine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative max-h-[85vh] flex flex-col`}>
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>Create Custom Routine</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="my-4 space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1`}>
                  Routine Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest & Arm Hypertrophy"
                  value={routineTitle}
                  onChange={e => setRoutineTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1`}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on upper chest and arms 2x a week"
                  value={routineDesc}
                  onChange={e => setRoutineDesc(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none`}
                />
              </div>

              {/* Add Exercise to Routine */}
              <div className="pt-2 border-t border-stone-800">
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-2`}>
                  Add Exercises
                </label>
                <div className="flex gap-2">
                  <select
                    value={exerciseToAddId}
                    onChange={e => setExerciseToAddId(e.target.value)}
                    className="flex-1 bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="">Select from library...</option>
                    {exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.muscleGroup})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddExerciseToRoutine}
                    disabled={!exerciseToAddId}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${theme.buttonSecondaryClass} disabled:opacity-50`}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected List */}
              <div className="space-y-2 pt-2">
                {selectedExercises.map((se, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs">
                    <div>
                      <p className={`font-bold ${theme.textPrimaryClass}`}>{se.exerciseName}</p>
                      <p className={`text-[11px] ${theme.textSecondaryClass}`}>{se.muscleGroup}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={se.targetSets}
                        onChange={e => {
                          const val = Number(e.target.value) || 1;
                          setSelectedExercises(prev =>
                            prev.map((item, i) => (i === idx ? { ...item, targetSets: val } : item))
                          );
                        }}
                        className="w-12 text-center bg-stone-900 border border-stone-800 rounded-lg py-1 text-xs font-mono font-bold"
                      />
                      <span className="text-stone-500">sets</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExercises(prev => prev.filter((_, i) => i !== idx))}
                        className="text-stone-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${theme.buttonSecondaryClass}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedExercises.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold ${theme.buttonPrimaryClass} disabled:opacity-50`}
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
