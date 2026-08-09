import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  targetMuscle: string;
  instructions?: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  isPR?: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  routineId?: string;
  routineName?: string;
  startTime: string;
  endTime: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  createdBy: string;
  isPreset?: boolean;
  exercises: string[];
}

interface WorkoutContextType {
  pastWorkouts: Workout[];
  routines: Routine[];
  friendFeed: any[];
  addWorkout: (workout: Workout) => Promise<boolean>;
  addRoutine: (routine: Routine) => Promise<boolean>;
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

  // Synchronized with AuthContext to fix the background crash loop
  const currentUserId = localStorage.getItem('ironcrew_current_user_id') || '';
  const allUsersString = localStorage.getItem('ironcrew_users') || '[]';
  const allUsers = JSON.parse(allUsersString);
  const currentUser = Array.isArray(allUsers) ? allUsers.find((u: any) => u.id === currentUserId) : null;
  const activeUserId = currentUser?.id || '';

  useEffect(() => {
    if (!activeUserId) return;

    fetch(`/api/workouts?userId=${activeUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setPastWorkouts(data); })
      .catch(() => {});

    fetch('/api/feed')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setFriendFeed(data); })
      .catch(() => {});

    fetch(`/api/routines?userId=${activeUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setRoutines(data); })
      .catch(() => {});
  }, [activeUserId]);

  const addWorkout = async (workout: Workout) => {
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });
      if (res.ok) {
        setPastWorkouts(prev => [workout, ...prev]);
        return true;
      }
    } catch (e) {}
    return false;
  };

  const addRoutine = async (routine: Routine) => {
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routine),
      });
      if (res.ok) {
        setRoutines(prev => [...prev, routine]);
        return true;
      }
    } catch (e) {}
    return false;
  };

  return (
    <WorkoutContext.Provider value={{ pastWorkouts, routines, friendFeed, addWorkout, addRoutine }}>
      {children}
    </WorkoutContext.Provider>
  );
};
