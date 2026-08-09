import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Exercise { id: string; name: string; muscleGroup: string; equipment: string; instructions?: string; }
export interface WorkoutSet { id: string; reps: number; weight: number; completed: boolean; setType: string; isPR?: boolean; }
export interface WorkoutExercise { id: string; exerciseId: string; exerciseName: string; muscleGroup: string; sets: WorkoutSet[]; }
export interface Workout { id: string; userId: string; userName: string; userAvatar: string; title: string; startTime: string; endTime?: string; durationSeconds: number; exercises: WorkoutExercise[]; totalVolumeLbs: number; totalCompletedSets: number; prsEarned: number; isFinished: boolean; dataType?: string; isPaused?: boolean; accumulatedTimeSeconds?: number; lastTickTime?: number; }

interface WorkoutContextType {
  pastWorkouts: Workout[];
  routines: any[];
  friendFeed: any[];
  activeWorkout: any | null;
  exercises: Exercise[];
  plateCalcTargetWeight: number | null;
  restTimer: any;
  startWorkout: (title: string, routineId?: string) => void;
  addExerciseToActiveWorkout: (exercise: Exercise) => void;
  removeExerciseFromActiveWorkout: (id: string) => void;
  addSetToExercise: (workoutExerciseId: string) => void;
  removeSetFromExercise: (workoutExerciseId: string, setId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, fields: any) => void;
  toggleSetCompleted: (workoutExerciseId: string, setId: string) => void;
  setPlateCalcTargetWeight: (w: number | null) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  toggleWorkoutTimerPause: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
export const useWorkout = () => useContext(WorkoutContext)!;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);

  const activeUserId = localStorage.getItem('ironcrew_current_user_id') || 'guest';

  const calculateAggregateStats = (workoutExercises: WorkoutExercise[]) => {
    let totalCompletedSets = 0;
    let totalVolumeLbs = 0;
    workoutExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed) {
          totalCompletedSets++;
          totalVolumeLbs += (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }
      });
    });
    return { totalCompletedSets, totalVolumeLbs };
  };

  const startWorkout = (title: string) => {
    setActiveWorkout({
      id: `workout-${Date.now()}`,
      userId: activeUserId,
      title,
      startTime: new Date().toISOString(),
      exercises: [],
      totalCompletedSets: 0,
      totalVolumeLbs: 0,
      isPaused: false,
      accumulatedTimeSeconds: 0,
      lastTickTime: Date.now()
    });
  };

  const toggleWorkoutTimerPause = () => {
    if (!activeWorkout) return;
    const now = Date.now();
    let updatedTime = activeWorkout.accumulatedTimeSeconds || 0;
    if (!activeWorkout.isPaused) {
      updatedTime += Math.floor((now - activeWorkout.lastTickTime) / 1000);
    }
    setActiveWorkout({
      ...activeWorkout,
      isPaused: !activeWorkout.isPaused,
      lastTickTime: now,
      accumulatedTimeSeconds: updatedTime
    });
  };

  const addExerciseToActiveWorkout = (ex: Exercise) => {
    if (!activeWorkout) return;
    const newEx = { id: `we-${Date.now()}`, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup, sets: [] };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newEx] });
  };

  const removeExerciseFromActiveWorkout = (id: string) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.filter((e: any) => e.id !== id);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updated);
    setActiveWorkout({ ...activeWorkout, exercises: updated, totalCompletedSets, totalVolumeLbs });
  };

  const addSetToExercise = (weId: string) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((e: any) => e.id === weId ? { ...e, sets: [...e.sets, { id: `set-${Date.now()}`, reps: 10, weight: 135, completed: false, setType: 'normal' }] } : e);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updated);
    setActiveWorkout({ ...activeWorkout, exercises: updated, totalCompletedSets, totalVolumeLbs });
  };

  const removeSetFromExercise = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((e: any) => e.id === weId ? { ...e, sets: e.sets.filter((s: any) => s.id !== setId) } : e);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updated);
    setActiveWorkout({ ...activeWorkout, exercises: updated, totalCompletedSets, totalVolumeLbs });
  };

  const updateSet = (weId: string, setId: string, fields: any) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((e: any) => e.id === weId ? { ...e, sets: e.sets.map((s: any) => s.id === setId ? { ...s, ...fields } : s) } : e);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updated);
    setActiveWorkout({ ...activeWorkout, exercises: updated, totalCompletedSets, totalVolumeLbs });
  };

  const toggleSetCompleted = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((e: any) => e.id === weId ? { ...e, sets: e.sets.map((s: any) => s.id === setId ? { ...s, completed: !s.completed } : s) } : e);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updated);
    setActiveWorkout({ ...activeWorkout, exercises: updated, totalCompletedSets, totalVolumeLbs });
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    const now = Date.now();
    let finalDuration = activeWorkout.accumulatedTimeSeconds || 0;
    if (!activeWorkout.isPaused) finalDuration += Math.floor((now - activeWorkout.lastTickTime) / 1000);

    const finalWorkout = { ...activeWorkout, dataType: 'workout', isFinished: true, endTime: new Date().toISOString(), durationSeconds: finalDuration || 1 };
    try {
      await fetch('/api/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalWorkout) });
      setPastWorkouts(prev => [finalWorkout, ...prev]);
    } catch (e) {}
    setActiveWorkout(null);
  };

  return (
    <WorkoutContext.Provider value={{ pastWorkouts, routines: [], friendFeed: [], activeWorkout, exercises: [], plateCalcTargetWeight, restTimer: { isActive: false }, startWorkout, addExerciseToActiveWorkout, removeExerciseFromActiveWorkout, addSetToExercise, removeSetFromExercise, updateSet, toggleSetCompleted, setPlateCalcTargetWeight, finishWorkout, cancelWorkout: () => setActiveWorkout(null), toggleWorkoutTimerPause }}>
      {children}
    </WorkoutContext.Provider>
  );
};