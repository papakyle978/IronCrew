import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkoutExercise, Exercise, Routine, RestTimerConfig, FriendFeedPost, LeaderboardEntry } from '../types';
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
  const [restTimer, setRestTimer] = useState<RestTimerConfig>({ isActive: false, isPaused: false, secondsLeft: 0, totalSeconds: 0, exerciseName: '' });
  
  const uid = currentUser?.id || 'guest';

  useEffect(() => {
    if (!uid || uid === 'guest') return;
    fetch(`/api/workouts?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setPastWorkouts(d);
    }).catch(() => {});
    fetch(`/api/routines?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d) && d.length) setRoutines([...INITIAL_ROUTINES, ...d]);
    }).catch(() => {});
  }, [uid]);

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

    // Calculate personal records updates
    let updatedBench = currentUser.stats.benchPressMaxLbs || 0;
    let updatedSquat = currentUser.stats.squatMaxLbs || 0;
    let updatedDeadlift = currentUser.stats.deadliftMaxLbs || 0;
    let updatedOhp = currentUser.stats.ohpMaxLbs || 0;
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

    // Update active profile metrics automatically
    updateProfile({
      stats: {
        ...currentUser.stats,
        totalWorkouts: (currentUser.stats.totalWorkouts || 0) + 1,
        totalVolumeLbs: (currentUser.stats.totalVolumeLbs || 0) + finalStats.totalVolumeLbs,
        benchPressMaxLbs: updatedBench,
        squatMaxLbs: updatedSquat,
        deadliftMaxLbs: updatedDeadlift,
        ohpMaxLbs: updatedOhp
      }
    });

    // Dynamically post results onto the feed lifecycle state
    const feedPost: FriendFeedPost = {
      id: `f-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl || 'https://dicebear.com',
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
      const bw = u.bodyweightLbs || 150;
      return {
        userId: u.id,
        userName: u.displayName,
        userAvatar: u.avatarUrl || 'https://dicebear.com',
        benchPressMax: b,
        squatMax: s,
        deadliftMax: d,
        ohpMax: u.stats?.ohpMaxLbs || 0,
        totalBigThree: t,
        monthlyVolume: u.stats?.totalVolumeLbs || 0,
        monthlyWorkouts: u.stats?.totalWorkouts || 0,
        heightInches: u.heightInches || 68,
        age: u.age || 25,
        bodyweightLbs: bw,
        strengthToWeightRatio: bw > 0 ? t / bw : 0,
        relativeStrengthScore: bw > 0 ? ((t * ((u.age || 25) > 30 ? 1.05 : 1.0)) / ((u.heightInches || 68) / 70)) : 0,
        rank: i + 1
      };
    });
  };

  return (
    <WorkoutContext.Provider value={{
      pastWorkouts, routines, friendFeed, activeWorkout, exercises, plateCalcTargetWeight, restTimer, startWorkout, finishWorkout, createRoutine, getLeaderboard, toggleWorkoutTimerPause,
      pauseRestTimer: () => setRestTimer(p => ({ ...p, isPaused: true })),
      resumeRestTimer: () => setRestTimer(p => ({ ...p, isPaused: false })),
addSecondsToRestTimer: (s) => setRestTimer(p => ({ ...p, secondsLeft: p.secondsLeft + s, totalSeconds: p.totalSeconds + s })),stopRestTimer: () => setRestTimer(p => ({ ...p, isActive: false })),setPlateCalcTargetWeight,cancelWorkout: () => setActiveWorkout(null),addExerciseToActiveWorkout: (ex) => updateActive(prev => [...prev, { id: we-${Date.now()}, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup as any, sets: [] }]),removeExerciseFromActiveWorkout: (id) => updateActive(prev => prev.filter(e => e.id !== id)),addSetToExercise: (weId) => updateActive(prev => [...prev.map(e => e.id === weId ? { ...e, sets: [...e.sets, { id: s-${Date.now()}, reps: 10, weight: 135, completed: false, setType: 'normal' }] } : e)]),removeSetFromExercise: (weId, sId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.filter(s => s.id !== sId) } : e)),updateSet: (weId, sId, f) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === sId ? { ...s, ...f } : s) } : e)),toggleSetCompleted: (weId, sId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === sId ? { ...s, completed: !s.completed } : s) } : e)),likeFeedPost: (pId) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, likes: x.likes.includes(uid) ? x.likes.filter(id => id !== uid) : [...x.likes, uid] } : x)),addCommentToFeedPost: (pId, txt) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, comments: [...x.comments, { id: c-${Date.now()}, userId: uid, userName: currentUser?.displayName || 'You', userAvatar: currentUser?.avatarUrl || 'dicebear.com', text: txt, createdAt: 'Just now' }] } : x))}}>{children}</WorkoutContext.Provider>);};