import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workout, WorkoutExercise, Exercise, Routine, RestTimerConfig, FriendFeedPost, LeaderboardEntry } from '../types';
import { INITIAL_EXERCISES, INITIAL_ROUTINES } from '../data/initialData';

interface WorkoutContextType {
  pastWorkouts: Workout[]; routines: Routine[]; friendFeed: FriendFeedPost[]; activeWorkout: any | null; exercises: Exercise[]; plateCalcTargetWeight: number | null; restTimer: RestTimerConfig;
  startWorkout: (t: string, rId?: string) => void; addExerciseToActiveWorkout: (ex: Exercise) => void; removeExerciseFromActiveWorkout: (id: string) => void; addSetToExercise: (weId: string) => void; removeSetFromExercise: (weId: string, sId: string) => void; updateSet: (weId: string, sId: string, f: any) => void; toggleSetCompleted: (weId: string, sId: string) => void; setPlateCalcTargetWeight: (w: number | null) => void; finishWorkout: () => Promise<void>; cancelWorkout: () => void; createRoutine: (t: string, d: string, ex: any[]) => Promise<void>; getLeaderboard: () => LeaderboardEntry[]; pauseRestTimer: () => void; resumeRestTimer: () => void; addSecondsToRestTimer: (s: number) => void; stopRestTimer: () => void; toggleWorkoutTimerPause: () => void; likeFeedPost: (pId: string) => void; addCommentToFeedPost: (pId: string, t: string) => void;
}
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);
export const useWorkout = () => useContext(WorkoutContext)!;

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);
  const [exercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [friendFeed, setFriendFeed] = useState<FriendFeedPost[]>([]);
  const [restTimer, setRestTimer] = useState<RestTimerConfig>({ isActive: false, isPaused: false, secondsLeft: 0, totalSeconds: 0, exerciseName: '' });
  const uid = localStorage.getItem('ironcrew_current_user_id') || 'guest';

  useEffect(() => {
    if (friendFeed.length) return;
    setFriendFeed([
      { id: 'f1', userId: 'user-kyle', userName: 'Kyle (Coach)', userAvatar: 'https://unsplash.com', workoutTitle: 'Heavy Squat Session 🔥', durationMinutes: 45, totalVolumeLbs: 12450, prsCount: 1, highlights: ['Hit 315 lbs on Back Squat for a double!'], timestamp: '2h ago', likes: [], comments: [] },
      { id: 'f2', userId: 'user-alex', userName: 'Alex Smith', userAvatar: 'https://unsplash.com', workoutTitle: 'Push Hypertrophy', durationMinutes: 52, totalVolumeLbs: 8900, prsCount: 0, highlights: ['Completed all sets of Incline Dumbbell Bench'], timestamp: '5h ago', likes: [], comments: [] }
    ]);
  }, [friendFeed]);

  useEffect(() => {
    if (!uid || uid === 'guest') return;
    fetch(`/api/workouts?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setPastWorkouts(d)).catch(() => {});
    fetch(`/api/routines?userId=${uid}`).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && d.length && setRoutines([...INITIAL_ROUTINES, ...d])).catch(() => {});
  }, [uid]);

  const syncStats = (exs: WorkoutExercise[]) => {
    let sets = 0, vol = 0;
    exs.forEach(e => e.sets.forEach(s => s.completed && (sets++ || (vol += (Number(s.weight) || 0) * (Number(s.reps) || 0)))));
    return { totalCompletedSets: sets, totalVolumeLbs: vol };
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
    setActiveWorkout({ id: `w-${Date.now()}`, userId: uid, title, startTime: new Date().toISOString(), exercises: initial, ...syncStats(initial), isPaused: false, accumulatedTimeSeconds: 0, lastTickTime: Date.now() });
  };

  const toggleWorkoutTimerPause = () => {
    if (!activeWorkout) return;
    const now = Date.now(), curAcc = activeWorkout.accumulatedTimeSeconds || 0;
    setActiveWorkout({ ...activeWorkout, isPaused: !activeWorkout.isPaused, lastTickTime: now, accumulatedTimeSeconds: activeWorkout.isPaused ? curAcc : curAcc + Math.floor((now - (activeWorkout.lastTickTime || now)) / 1000) });
  };

  const getDuration = () => {
    let d = activeWorkout?.accumulatedTimeSeconds || 0;
    if (activeWorkout && !activeWorkout.isPaused) d += Math.floor((Date.now() - (activeWorkout.lastTickTime || Date.now())) / 1000);
    return d || 1;
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    const finalW = { ...activeWorkout, dataType: 'workout', isFinished: true, endTime: new Date().toISOString(), durationSeconds: getDuration() };
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
    const local = localStorage.getItem('ironcrew_users');
    const uList = [{ id: 'user-kyle', displayName: 'Kyle (Coach)', avatarUrl: 'https://unsplash.com', heightInches: 72, age: 28, bodyweightLbs: 195, stats: { benchPressMaxLbs: 245, squatMaxLbs: 335, deadliftMaxLbs: 425, ohpMaxLbs: 155 } }, { id: 'user-alex', displayName: 'Alex Smith', avatarUrl: 'https://unsplash.com', heightInches: 66, age: 24, bodyweightLbs: 155, stats: { benchPressMaxLbs: 185, squatMaxLbs: 245, deadliftMaxLbs: 315, ohpMaxLbs: 115 } }];
    if (local) JSON.parse(local).forEach((p: any) => !uList.some(x => x.id === p.id) && uList.push(p));

    return uList.map((u, i) => {
      const b = u.stats?.benchPressMaxLbs || 0, s = u.stats?.squatMaxLbs || 0, d = u.stats?.deadliftMaxLbs || 0, t = b + s + d, bw = u.bodyweightLbs || 150;
      return { userId: u.id, userName: u.displayName, userAvatar: u.avatarUrl, benchPressMax: b, squatMax: s, deadliftMax: d, ohpMax: u.stats?.ohpMaxLbs || 0, totalBigThree: t, monthlyVolume: 45000, monthlyWorkouts: 12, heightInches: u.heightInches, age: u.age, bodyweightLbs: bw, strengthToWeightRatio: t / bw, relativeStrengthScore: (t * ((u.age || 25) > 30 ? 1.05 : 1.0)) / ((u.heightInches || 68) / 70), rank: i + 1 };
    });
  };

  return (
    <WorkoutContext.Provider value={{
      pastWorkouts, routines, friendFeed, activeWorkout, exercises, plateCalcTargetWeight, restTimer, startWorkout, finishWorkout, createRoutine, getLeaderboard, toggleWorkoutTimerPause,
      pauseRestTimer: () => setRestTimer(p => ({ ...p, isPaused: true })), resumeRestTimer: () => setRestTimer(p => ({ ...p, isPaused: false })), addSecondsToRestTimer: (s) => setRestTimer(p => ({ ...p, secondsLeft: p.secondsLeft + s, totalSeconds: p.totalSeconds + s })), stopRestTimer: () => setRestTimer(p => ({ ...p, isActive: false })), setPlateCalcTargetWeight, cancelWorkout: () => setActiveWorkout(null),
      addExerciseToActiveWorkout: (ex) => updateActive(prev => [...prev, { id: `we-${Date.now()}`, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup as any, sets: [] }]),
      removeExerciseFromActiveWorkout: (id) => updateActive(prev => prev.filter(e => e.id !== id)),
      addSetToExercise: (weId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: [...e.sets, { id: `s-${Date.now()}`, reps: 10, weight: 135, completed: false, setType: 'normal' }] } : e)),
      removeSetFromExercise: (weId, sId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.filter(s => s.id !== sId) } : e)),
      updateSet: (weId, sId, f) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === sId ? { ...s, ...f } : s) } : e)),
      toggleSetCompleted: (weId, sId) => updateActive(prev => prev.map(e => e.id === weId ? { ...e, sets: e.sets.map(s => s.id === sId ? { ...s, completed: !s.completed } : s) } : e)),
      likeFeedPost: (pId) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, likes: x.likes.includes(uid) ? x.likes.filter(id => id !== uid) : [...x.likes, uid] } : x)),
      addCommentToFeedPost: (pId, txt) => setFriendFeed(p => p.map(x => x.id === pId ? { ...x, comments: [...x.comments, { id: c-${Date.now()}, userId: uid, userName: 'You', userAvatar: 'dicebear.com', text: txt, createdAt: 'Just now' }] } : x))}}>{children}</WorkoutContext.Provider>
      );
  };