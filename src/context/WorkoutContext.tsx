import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workout, WorkoutExercise, Exercise, Routine, RestTimerConfig } from '../types';
import { INITIAL_EXERCISES, INITIAL_ROUTINES } from '../data/initialData';

interface WorkoutContextType {
  pastWorkouts: Workout[];
  routines: Routine[];
  friendFeed: any[];
  activeWorkout: any | null;
  exercises: Exercise[];
  plateCalcTargetWeight: number | null;
  restTimer: RestTimerConfig;
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
  createRoutine: (title: string, desc: string, exercises: any[]) => Promise<void>;
  getLeaderboard: () => any[];
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  addSecondsToRestTimer: (secs: number) => void;
  stopRestTimer: () => void;
  toggleWorkoutTimerPause: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [friendFeed, setFriendFeed] = useState<any[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);
  const [exercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [restTimer, setRestTimer] = useState<RestTimerConfig>({
    isActive: false,
    isPaused: false,
    secondsLeft: 0,
    totalSeconds: 0,
    exerciseName: ''
  });

  const activeUserId = localStorage.getItem('ironcrew_current_user_id') || 'guest';

  useEffect(() => {
    if (!activeUserId || activeUserId === 'guest') return;
    fetch(`/api/workouts?userId=${activeUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setPastWorkouts(data); })
      .catch(() => {});

    fetch(`/api/routines?userId=${activeUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { 
        if (Array.isArray(data) && data.length > 0) {
          setRoutines([...INITIAL_ROUTINES, ...data]);
        }
      })
      .catch(() => {});
  }, [activeUserId]);

  const pauseRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: true }));
  const resumeRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: false }));
  const addSecondsToRestTimer = (secs: number) => setRestTimer(prev => ({ ...prev, secondsLeft: prev.secondsLeft + secs, totalSeconds: prev.totalSeconds + secs }));
  const stopRestTimer = () => setRestTimer(prev => ({ ...prev, isActive: false }));

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

  const startWorkout = (title: string, routineId?: string) => {
    let initialExercises: WorkoutExercise[] = [];
    if (routineId) {
      const foundRoutine = routines.find(r => r.id === routineId);
      if (foundRoutine) {
        initialExercises = foundRoutine.exercises.map((rEx: any, i: number) => ({
          id: `we-${Date.now()}-${i}`,
          exerciseId: rEx.exerciseId,
          exerciseName: rEx.exerciseName,
          muscleGroup: rEx.muscleGroup,
          sets: Array.from({ length: rEx.targetSets || 3 }).map((_, sIdx) => ({
            id: `set-${Date.now()}-${i}-${sIdx}`,
            reps: parseInt(rEx.targetReps) || 10,
            weight: 135,
            completed: false,
            setType: 'normal'
          }))
        }));
      }
    }

    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(initialExercises);

    setActiveWorkout({
      id: `workout-${Date.now()}`,
      userId: activeUserId,
      title,
      startTime: new Date().toISOString(),
      exercises: initialExercises,
      totalCompletedSets,
      totalVolumeLbs,
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
      updatedTime += Math.floor((now - (activeWorkout.lastTickTime || now)) / 1000);
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
    const newEx: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: []
    };
    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newEx]
    });
  };

  const removeExerciseFromActiveWorkout = (id: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.filter((e: any) => e.id !== id);
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updatedExercises);
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalCompletedSets,
      totalVolumeLbs
    });
  };

  const addSetToExercise = (weId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map((e: any) => {
      if (e.id !== weId) return e;
      return {
        ...e,
        sets: [...e.sets, { id: `set-${Date.now()}`, reps: 10, weight: 135, completed: false, setType: 'normal' }]
      };
    });
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updatedExercises);
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalCompletedSets,
      totalVolumeLbs
    });
  };

  const removeSetFromExercise = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map((e: any) => {
      if (e.id !== weId) return e;
      return { ...e, sets: e.sets.filter((s: any) => s.id !== setId) };
    });
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updatedExercises);
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalCompletedSets,
      totalVolumeLbs
    });
  };

  const updateSet = (weId: string, setId: string, fields: any) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map((e: any) => {
      if (e.id !== weId) return e;
      return {
        ...e,
        sets: e.sets.map((s: any) => s.id === setId ? { ...s, ...fields } : s)
      };
    });
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updatedExercises);
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalCompletedSets,
      totalVolumeLbs
    });
  };

  const toggleSetCompleted = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map((e: any) => {
      if (e.id !== weId) return e;
      return {
        ...e,
        sets: e.sets.map((s: any) => {
          if (s.id !== setId) return s;
          return { ...s, completed: !s.completed };
        })
      };
    });
    const { totalCompletedSets, totalVolumeLbs } = calculateAggregateStats(updatedExercises);
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalCompletedSets,
      totalVolumeLbs
    });
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    const now = Date.now();
    let finalDuration = activeWorkout.accumulatedTimeSeconds || 0;
    if (!activeWorkout.isPaused) {
      finalDuration += Math.floor((now - (activeWorkout.lastTickTime || now)) / 1000);
    }

    const finalWorkout: Workout = {
      ...activeWorkout,
      dataType: 'workout',
      isFinished: true,
      endTime: new Date().toISOString(),
      durationSeconds: finalDuration || 1,
    };

    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalWorkout),
      });
      setPastWorkouts(prev => [finalWorkout, ...prev]);
    } catch (e) {
      console.error("Failed syncing workout to DB:", e);
    }
    setActiveWorkout(null);
  };

  const createRoutine = async (title: string, desc: string, targetExercises: any[]) => {
    const routine: Routine = {
      id: `routine-${Date.now()}`,
      title,
      description: desc,
      muscleGroups: Array.from(new Set(targetExercises.map(e => e.muscleGroup))),
      exercises: targetExercises,
      createdBy: activeUserId,
      dataType: 'routine'
    };

    try {
      await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routine),
      });
setRoutines(prev => [...prev, routine]);} catch (e) {console.error(e);}};const getLeaderboard = () => [];return (<WorkoutContext.Provider value={{pastWorkouts, routines, friendFeed, activeWorkout, exercises, plateCalcTargetWeight, restTimer,startWorkout, addExerciseToActiveWorkout, removeExerciseFromActiveWorkout,addSetToExercise, removeSetFromExercise, updateSet, toggleSetCompleted,setPlateCalcTargetWeight, finishWorkout, cancelWorkout: () => setActiveWorkout(null), createRoutine, getLeaderboard, toggleWorkoutTimerPause}}>{children}</WorkoutContext.Provider>
);
};