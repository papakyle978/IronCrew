import React, { useState } from 'react';
import { Dumbbell, Plus, Search, Trophy, Flame, X, Sparkles, Filter } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { Exercise, MuscleGroup } from '../../types';

export const ExercisesView: React.FC = () => {
  const { exercises, addCustomExercise } = useWorkout();
  const { theme, formatWeight } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Custom Exercise Form
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('Chest');
  const [customEquipment, setCustomEquipment] = useState<Exercise['equipment']>('Barbell');

  const muscleCategories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    addCustomExercise(customName, customMuscle, customEquipment);
    setShowAddModal(false);
    setCustomName('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${theme.textPrimaryClass} tracking-tight`}>Exercise Library</h1>
          <p className={`text-xs ${theme.textSecondaryClass}`}>
            Comprehensive movement database with 1RM & PR history
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs ${theme.buttonPrimaryClass} shadow-lg flex items-center justify-center gap-2`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Exercise</span>
        </button>
      </div>

      {/* Search & Muscle Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search exercise by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-900 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none`}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {muscleCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedMuscle(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedMuscle === cat
                  ? `${theme.accentBgClass} text-zinc-950`
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map(ex => {
          const pr = ex.personalRecord;

          return (
            <div
              key={ex.id}
              onClick={() => setSelectedExerciseDetail(ex)}
              className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 sm:p-5 rounded-2xl shadow-md cursor-pointer hover:border-amber-400/50 transition-all space-y-3 group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-base font-bold ${theme.textPrimaryClass} group-hover:text-amber-400 transition-colors`}>
                    {ex.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${theme.badgeBgClass} ${theme.badgeTextClass} font-semibold`}>
                      {ex.muscleGroup}
                    </span>
                    <span className={theme.textSecondaryClass}>{ex.equipment}</span>
                  </div>
                </div>

                {pr && (
                  <div className={`p-2 rounded-xl ${theme.badgeBgClass} ${theme.accentClass}`} title="Has Personal Record">
                    <Trophy className="w-4 h-4" />
                  </div>
                )}
              </div>

              {pr ? (
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs">
                  <span className={theme.textSecondaryClass}>Personal Record:</span>
                  <span className={`font-mono font-bold ${theme.accentClass}`}>
                    {formatWeight(pr.maxWeightLbs)} × {pr.maxReps}
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-stone-950/30 border border-stone-800/40 text-center text-xs text-stone-500 italic">
                  No PR logged yet
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative`}>
            <button
              onClick={() => setSelectedExerciseDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${theme.badgeBgClass} ${theme.accentClass}`}>
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${theme.textPrimaryClass}`}>
                    {selectedExerciseDetail.name}
                  </h3>
                  <p className={`text-xs ${theme.textSecondaryClass}`}>
                    {selectedExerciseDetail.muscleGroup} &bull; {selectedExerciseDetail.equipment}
                  </p>
                </div>
              </div>

              {selectedExerciseDetail.instructions && (
                <p className={`text-xs ${theme.textSecondaryClass} p-3 rounded-xl bg-stone-950/60 border border-stone-800 leading-relaxed`}>
                  {selectedExerciseDetail.instructions}
                </p>
              )}

              {/* PR Box */}
              {selectedExerciseDetail.personalRecord ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase">
                    <Trophy className="w-4 h-4" />
                    <span>Personal Record (1RM)</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {formatWeight(selectedExerciseDetail.personalRecord.maxWeightLbs)}
                    </span>
                    <span className="text-xs text-stone-300 font-semibold">
                      × {selectedExerciseDetail.personalRecord.maxReps} reps
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-amber-500/20">
                    <span>Estimated 1RM:</span>
                    <strong className="text-white font-mono">
                      {formatWeight(selectedExerciseDetail.personalRecord.estimated1RMLbs)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-500">
                  Log this exercise in a workout to set your personal record!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative`}>
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>Create Custom Exercise</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="my-4 space-y-4">
              <div>
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1`}>
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1`}>
                  Target Muscle Group
                </label>
                <select
                  value={customMuscle}
                  onChange={e => setCustomMuscle(e.target.value as MuscleGroup)}
                  className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1`}>
                  Equipment Type
                </label>
                <select
                  value={customEquipment}
                  onChange={e => setCustomEquipment(e.target.value as Exercise['equipment'])}
                  className="w-full bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Other'].map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${theme.buttonSecondaryClass}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold ${theme.buttonPrimaryClass}`}
                >
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
