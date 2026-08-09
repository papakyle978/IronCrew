import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  setType: string;
  isPR?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeLbs: number;
  totalCompletedSets: number;
  prsEarned: number;
  isFinished: boolean;
  dataType?: string; 
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  muscleGroups: string[];
  exercises: any[];
  createdBy: string;
  isPreset?: boolean;
  dataType?: string;
}

interface WorkoutContextType {
  pastWorkouts: Workout[];
  routines: Routine[];
  friendFeed: any[];
  activeWorkout: any | null;
  exercises: Exercise[];
  plateCalcTargetWeight: number | null;
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
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [friendFeed, setFriendFeed] = useState<any[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);

  // Default fallbacks from initialData simulation
  const [exercises] = useState<Exercise[]>([
    { id: 'ex-bench-press', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
    { id: 'ex-barbell-squat', name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
    { id: 'ex-deadlift', name: 'Conventional Deadlift', muscleGroup: 'Back', equipment: 'Barbell' }
  ]);

  const currentUserString = localStorage.getItem('ironcrew_user');
  const currentUser = currentUserString ? JSON.parse(currentUserString) : null;
  const activeUserId = currentUser?.id || 'guest';

  useEffect(() => {
    if (!activeUserId || activeUserId === 'guest') return;
    fetch(`/api/workouts?userId=${activeUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setPastWorkouts(data); })
      .catch(() => {});

    fetch('/api/routines?userId=${activeUserId}')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setRoutines(data); })
      .catch(() => {});
  }, [activeUserId]);

  const startWorkout = (title: string, routineId?: string) => {
    setActiveWorkout({
      id: `workout-${Date.now()}`,
      userId: activeUserId,
      title,
      startTime: new Date().toISOString(),
      exercises: [],
      totalCompletedSets: 0,
      totalVolumeLbs: 0,
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
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter((e: any) => e.id !== id)
    });
  };

  const addSetToExercise = (weId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e: any) => {
        if (e.id !== weId) return e;
        return {
          ...e,
          sets: [...e.sets, { id: `set-${Date.now()}`, reps: 10, weight: 135, completed: false, setType: 'normal' }]
        };
      })
    });
  };

  const removeSetFromExercise = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e: any) => {
        if (e.id !== weId) return e;
        return { ...e, sets: e.sets.filter((s: any) => s.id !== setId) };
      })
    });
  };

  const updateSet = (weId: string, setId: string, fields: any) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e: any) => {
        if (e.id !== weId) return e;
        return {
          ...e,
          sets: e.sets.map((s: any) => s.id === setId ? { ...s, ...fields } : s)
        };
      })
    });
  };

  const toggleSetCompleted = (weId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((e: any) => {
        if (e.id !== weId) return e;
        return {
          ...e,
          sets: e.sets.map((s: any) => {
            if (s.id !== setId) return s;
            const targetState = !s.completed;
            return { ...s, completed: targetState };
          })
        };
      })
    });
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    const finalWorkout: Workout = {
      ...activeWorkout,
      dataType: 'workout',
      isFinished: true,
      endTime: new Date().toISOString(),
      durationSeconds: Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000),
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

  const cancelWorkout = () => setActiveWorkout(null);

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
      setRoutines(prev => [...prev, routine]);
    } catch (e) {
      console.error(e);
    }
  };

  const getLeaderboard = () => [];

  return (
    <WorkoutContext.Provider value={{
      pastWorkouts, routines, friendFeed, activeWorkout, exercises, plateCalcTargetWeight,
      startWorkout, addExerciseToActiveWorkout, removeExerciseFromActiveWorkout,
      addSetToExercise, removeSetFromExercise, updateSet, toggleSetCompleted,
      setPlateCalcTargetWeight, finishWorkout, cancelWorkout, createRoutine, getLeaderboard
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
