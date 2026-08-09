import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkoutExercise, Exercise, Routine, RestTimerConfig, FriendFeedPost, LeaderboardEntry, MuscleGroup } from '../types';
import { INITIAL_EXERCISES, INITIAL_ROUTINES } from '../data/initialData';
import { useAuth } from './AuthContext';

interface WorkoutContextType {
  pastWorkouts: any[];
  routines: Routine[];
  friendFeed: FriendFeedPost[];
  activeWorkout: any | null;
  exercises: Exercise[];
  plateCalcTargetWeight: number | null;
  restTimer: RestTimerConfig;
  prCelebration: {
    exerciseName: string;
    weightLbs: number;
    reps: number;
    estimated1RM: number;
  } | null;
  dismissPRCelebration: () => void;
  addCustomExercise: (name: string, muscleGroup: MuscleGroup, equipment: any, instructions?: string) => void;
  startWorkout: (t: string, rId?: string) => void;
  addExerciseToActiveWorkout: (ex: Exercise) => void;
  removeExerciseFromActiveWorkout: (id: string) => void;
  addSetToExercise: (weId: string) => void;
  removeSetFromExercise: (weId: string, sId: string) => void;
  updateSet: (weId: string, sId: string, f: any) => void;
  toggleSetCompleted: (weId: string, sId: string) => void;
  setPlateCalcTargetWeight: (w: number | null) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  createRoutine: (t: string, d: string, ex: any[]) => Promise<void>;
  getLeaderboard: () => LeaderboardEntry[];
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  addSecondsToRestTimer: (s: number) => void;
  stopRestTimer: () => void;
  toggleWorkoutTimerPause: () => void;
  likeFeedPost: (pId: string) => void;
  addCommentToFeedPost: (pId: string, t: string) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
export const useWorkout = () => useContext(WorkoutContext)!;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateProfile, usersList } = useAuth();
  const [pastWorkouts, setPastWorkouts] = useState<any[]>([]);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [friendFeed, setFriendFeed] = useState<FriendFeedPost[]>([]);
  const [prCelebration, setPrCelebration] = useState<{
    exerciseName: string;
    weightLbs: number;
    reps: number;
    estimated1RM: number;
  } | null>(null);
  const [restTimer, setRestTimer] = useState<RestTimerConfig>({
    isActive: false,
    isPaused: false,
    secondsLeft: 0,
    totalSeconds: 0,
    exerciseName: ''
  });

  const uid = currentUser?.id || 'guest';

  // Tick down rest timer when active
  useEffect(() => {
    if (!restTimer.isActive || restTimer.isPaused || restTimer.secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev.secondsLeft <= 1) {
          return { ...prev, secondsLeft: 0, isActive: false };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.isPaused, restTimer.secondsLeft]);

  useEffect(() => {
    if (!uid || uid === 'guest') return;
    fetch(`/api/workouts?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setPastWorkouts(d);
    }).catch(() => {});
    fetch(`/api/routines?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d) && d.length) setRoutines([...INITIAL_ROUTINES, ...d]);
    }).catch(() => {});
  }, [uid]);

  const addCustomExercise = (name: string, muscleGroup: MuscleGroup, equipment: any, instructions?: string) => {
    const newEx: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name,
      muscleGroup,
      equipment: equipment || 'Barbell',
      instructions: instructions || 'Custom user created movement.',
    };
    setExercises(prev => [...prev, newEx]);
  };

  const syncStats = (exs: WorkoutExercise[]) => {
    let sets = 0;
    let vol = 0;
    let prs = 0;
    exs.forEach(e => {
      e.sets.forEach(s => {
        if (s.completed) {
          sets++;
          vol += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          if (s.isPR) prs++;
        }
      });
    });
    return { totalCompletedSets: sets, totalVolumeLbs: vol, prsEarned: prs };
  };

  const updateActive = (updater: (exs: WorkoutExercise[]) => WorkoutExercise[]) => {
    if (!activeWorkout) return;
    const nextExs = updater(activeWorkout.exercises);
    setActiveWorkout({ ...activeWorkout, exercises: nextExs, ...syncStats(nextExs) });
  };

  const startWorkout = (title: string, rId?: string) => {
    const found = routines.find(r => r.id === rId);
    const initial = found ? found.exercises.map((rx: any, i) => ({
      id: `we-${Date.now()}-${i}`, exerciseId: rx.exerciseId, exerciseName: rx.exerciseName, muscleGroup: rx.muscleGroup,
      sets: Array.from({ length: rx.targetSets || 3 }).map((_, s) => ({ id: `s-${Date.now()}-${i}-${s}`, reps: parseInt(rx.targetReps) || 10, weight: 135, completed: false, setType: 'normal' }))
    })) : [];

    setActiveWorkout({
      id: `w-${Date.now()}`,
      userId: uid,
      title,
      startTime: new Date().toISOString(),
      exercises: initial,
      ...syncStats(initial),
      isPaused: false,
      accumulatedTimeSeconds: 0,
      lastTickTime: Date.now()
    });
  };

  const toggleWorkoutTimerPause = () => {
    if (!activeWorkout) return;
    const now = Date.now();
    const curAcc = activeWorkout.accumulatedTimeSeconds || 0;
    setActiveWorkout({
      ...activeWorkout,
      isPaused: !activeWorkout.isPaused,
      lastTickTime: now,
      accumulatedTimeSeconds: activeWorkout.isPaused ? curAcc : curAcc + Math.floor((now - (activeWorkout.lastTickTime || now)) / 1000)
    });
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !currentUser) return;
    const now = Date.now();
    let d = activeWorkout.accumulatedTimeSeconds || 0;
    if (!activeWorkout.isPaused) d += Math.floor((now - (activeWorkout.lastTickTime || now)) / 1000);

    const finalStats = syncStats(activeWorkout.exercises);
    const finalW = {
      ...activeWorkout,
      dataType: 'workout',
      isFinished: true,
      endTime: new Date().toISOString(),
      durationSeconds: d || 1,
      ...finalStats
    };

    let updatedBench = currentUser.stats?.benchPressMaxLbs || 0;
    let updatedSquat = currentUser.stats?.squatMaxLbs || 0;
    let updatedDeadlift = currentUser.stats?.deadliftMaxLbs || 0;
    let updatedOhp = currentUser.stats?.ohpMaxLbs || 0;
    const highlightsList: string[] = [];

    activeWorkout.exercises.forEach((ex: any) => {
      ex.sets.forEach((set: any) => {
        if (set.completed && set.weight > 0) {
          if (ex.exerciseId === 'ex-bench-press' && set.weight > updatedBench) {
            updatedBench = set.weight;
            highlightsList.push(`Pushed a new Bench Press personal record: ${set.weight} lbs!`);
          }
          if (ex.exerciseId === 'ex-barbell-squat' && set.weight > updatedSquat) {
            updatedSquat = set.weight;
            highlightsList.push(`Smashed a new Squat personal record: ${set.weight} lbs!`);
          }
          if (ex.exerciseId === 'ex-deadlift' && set.weight > updatedDeadlift) {
            updatedDeadlift = set.weight;
            highlightsList.push(`Ripped a new Deadlift personal record: ${set.weight} lbs!`);
          }
          if (ex.exerciseId === 'ex-overhead-press' && set.weight > updatedOhp) {
            updatedOhp = set.weight;
            highlightsList.push(`Locked out a new OHP personal record: ${set.weight} lbs!`);
          }
        }
      });
    });

    const currentStats = currentUser.stats || {
      totalWorkouts: 0, totalVolumeLbs: 0, streakDays: 1,
      benchPressMaxLbs: 0, squatMaxLbs: 0, deadliftMaxLbs: 0, ohpMaxLbs: 0
    };

    updateProfile({
      stats: {
        ...currentStats,
        totalWorkouts: (currentStats.totalWorkouts || 0) + 1,
        totalVolumeLbs: (currentStats.totalVolumeLbs || 0) + finalStats.totalVolumeLbs,
        benchPressMaxLbs: updatedBench,
        squatMaxLbs: updatedSquat,
        deadliftMaxLbs: updatedDeadlift,
        ohpMaxLbs: updatedOhp
      }
    });

    const feedPost: FriendFeedPost = {
      id: `f-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=iron',
      workoutTitle: finalW.title,
      durationMinutes: Math.max(1, Math.round((finalW.durationSeconds || 1) / 60)),
      totalVolumeLbs: finalStats.totalVolumeLbs,
      prsCount: highlightsList.length,
      highlights: highlightsList.length > 0 ? highlightsList : ['Successfully finalized all scheduled strength training sets!'],
      timestamp: 'Just now',
      likes: [],
      comments: []
    };

    setFriendFeed(prev => [feedPost, ...prev]);

    try {
      await fetch('/api/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalW) });
      setPastWorkouts(prev => [finalW, ...prev]);
    } catch (e) {}
    setActiveWorkout(null);
  };

  const createRoutine = async (title: string, desc: string, targetExercises: any[]) => {
    const routine = { id: `r-${Date.now()}`, title, description: desc, muscleGroups: Array.from(new Set(targetExercises.map(e => e.muscleGroup))) as any[], exercises: targetExercises, createdBy: uid, dataType: 'routine' };
    try {
      await fetch('/api/routines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(routine) });
      setRoutines(prev => [...prev, routine]);
    } catch (e) {}
  };

  const getLeaderboard = (): LeaderboardEntry[] => {
    return usersList.map((u, i) => {
      const b = u.stats?.benchPressMaxLbs || 0;
      const s = u.stats?.squatMaxLbs || 0;
      const d = u.stats?.deadliftMaxLbs || 0;
      const t = b + s + d;
      const bw = u.bodyweightLbs || 180;
      const heightInches = u.heightInches || 68;
      const age = u.age || 25;
      const ratio = bw > 0 ? t / bw : 0;
      const relativeStrengthScore = (heightInches > 0 && bw > 0) ? ((t * (age > 30 ? 1.05 : 1.0)) / (heightInches / 70)) : 0;

      return {
        userId: u.id,
        userName: u.displayName,
        userAvatar: u.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=iron',
        benchPressMax: b,
        squatMax: s,
        deadliftMax: d,
        ohpMax: u.stats?.ohpMaxLbs || 0,
        totalBigThree: t,
        monthlyVolume: u.stats?.totalVolumeLbs || 0,
        monthlyWorkouts: u.stats?.totalWorkouts || 0,
        heightInches,
        age,
        bodyweightLbs: bw,
        strengthToWeightRatio: ratio,
        relativeStrengthScore,
        rank: i + 1
      };
    });
  };

  const toggleSetCompletedHandler = (weId: string, sId: string) => {
    updateActive(prev => prev.map(e => {
      if (e.id !== weId) return e;
      return {
        ...e,
        sets: e.sets.map(s => {
          if (s.id !== sId) return s;
          const nextCompleted = !s.completed;
          if (nextCompleted) {
            // Auto-start rest timer
            const restSecs = currentUser?.settings?.defaultRestSeconds || 90;
            setRestTimer({
              isActive: true,
              isPaused: false,
              secondsLeft: restSecs,
              totalSeconds: restSecs,
              exerciseName: e.exerciseName || 'Between Sets'
            });

            // Check if PR set
            if (s.weight > 0) {
              const currentPR = e.exerciseId === 'ex-bench-press' ? (currentUser?.stats?.benchPressMaxLbs || 0)
                              : e.exerciseId === 'ex-barbell-squat' ? (currentUser?.stats?.squatMaxLbs || 0)
                              : e.exerciseId === 'ex-deadlift' ? (currentUser?.stats?.deadliftMaxLbs || 0)
                              : e.exerciseId === 'ex-overhead-press' ? (currentUser?.stats?.ohpMaxLbs || 0)
                              : 0;
              if (s.weight > currentPR && currentPR > 0) {
                const e1rm = Math.round(s.weight * (1 + s.reps / 30));
                setPrCelebration({
                  exerciseName: e.exerciseName,
                  weightLbs: s.weight,
                  reps: s.reps,
                  estimated1RM: e1rm
                });
              }
            }
          }
          return { ...s, completed: nextCompleted };
        })
      };
    }));
  };

  return (
    <WorkoutContext.Provider value={{
      pastWorkouts, routines, friendFeed, activeWorkout, exercises, plateCalcTargetWeight, restTimer, prCelebration, startWorkout, finishWorkout, createRoutine, getLeaderboard, toggleWorkoutTimerPause,
      addCustomExercise,
      dismissPRCelebration: () => setPrCelebration(null),
      pauseRestTimer: () => setRestTimer(p => ({ ...p, isPaused: true })),
      resumeRestTimer: () => setRestTimer(p => ({ ...p, isPaused: false })),
      addSecondsToRestTimer: (s) => setRestTimer(p => ({ ...p, secondsLeft: p.secondsLeft + s, totalSeconds: p.totalSeconds + s })),
      stopRestTimer: () => setRestTimer(p => ({ ...p, isActive: false })),
      setPlateCalcTargetWeight,
      cancelWorkout: () => setActiveWorkout(null),
      addExerciseToActiveWorkout: (ex) => updateActive(prev => [...prev, { id: `we-${Date.now()}`, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup as any, sets: [] }]),
      removeExerciseFromActiveWorkout: (id) => updateActive(prev => prev.filter(e => e.id !== id)),
      addSetToExercise: (weId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: [...e.sets, { id: `s-${Date.now()}`, reps: 10, weight: 135, completed: false, setType: 'normal' }] } : e)),
      removeSetFromExercise: (weId, sId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.filter(s => s.id !== sId) } : e)),
      updateSet: (weId, sId, f) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === sId ? { ...s, ...f } : s) } : e)),
      toggleSetCompleted: toggleSetCompletedHandler,
      likeFeedPost: (pId) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, likes: x.likes.includes(uid) ? x.likes.filter(id => id !== uid) : [...x.likes, uid] } : x)),
      addCommentToFeedPost: (pId, txt) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, comments: [...x.comments, { id: `c-${Date.now()}`, userId: uid, userName: currentUser?.displayName || 'You', userAvatar: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=iron', text: txt, createdAt: 'Just now' }] } : x))
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
