import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkoutSession,
  Exercise,
  Routine,
  FriendFeedPost,
  WorkoutExercise,
  ExerciseSet,
  SetType,
  LeaderboardEntry,
} from '../types';
import { INITIAL_EXERCISES, INITIAL_ROUTINES, INITIAL_FRIEND_FEED } from '../data/initialData';
import { useAuth } from './AuthContext';

interface RestTimerState {
  isActive: boolean;
  secondsLeft: number;
  totalSeconds: number;
  exerciseName?: string;
  isPaused: boolean;
}

interface PRCelebration {
  exerciseName: string;
  weightLbs: number;
  reps: number;
  estimated1RM: number;
}

interface WorkoutContextType {
  activeWorkout: WorkoutSession | null;
  startWorkout: (title?: string, routineId?: string) => void;
  addExerciseToActiveWorkout: (exercise: Exercise) => void;
  removeExerciseFromActiveWorkout: (workoutExerciseId: string) => void;
  addSetToExercise: (workoutExerciseId: string, setType?: SetType) => void;
  removeSetFromExercise: (workoutExerciseId: string, setId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, fields: Partial<ExerciseSet>) => void;
  toggleSetCompleted: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  
  // Rest timer
  restTimer: RestTimerState;
  startRestTimer: (seconds: number, exerciseName?: string) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  addSecondsToRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;

  // PR Celebration
  prCelebration: PRCelebration | null;
  dismissPRCelebration: () => void;

  // History & Library
  pastWorkouts: WorkoutSession[];
  exercises: Exercise[];
  routines: Routine[];
  addCustomExercise: (name: string, muscleGroup: Exercise['muscleGroup'], equipment: Exercise['equipment']) => Exercise;
  createRoutine: (title: string, description: string, exercises: Routine['exercises']) => void;

  // Friends feed & Social
  friendFeed: FriendFeedPost[];
  likeFeedPost: (postId: string) => void;
  addCommentToFeedPost: (postId: string, text: string) => void;
  getLeaderboard: () => LeaderboardEntry[];
  
  // Plate calculator modal toggle
  plateCalcTargetWeight: number | null;
  setPlateCalcTargetWeight: (weight: number | null) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateProfile, usersList } = useAuth();

  // 1. Exercises Database
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem('liftoff_exercises');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EXERCISES;
  });

  // 2. Routines
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('liftoff_routines');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ROUTINES;
  });

  // 3. Past Workouts History
  const [pastWorkouts, setPastWorkouts] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem('liftoff_past_workouts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // 4. Friend Feed
  const [friendFeed, setFriendFeed] = useState<FriendFeedPost[]>(() => {
    const saved = localStorage.getItem('liftoff_feed');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => !['user-alex', 'user-sam', 'user-marcus'].includes(p.userId));
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_FRIEND_FEED;
  });

  // 5. Active Workout
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(() => {
    const saved = localStorage.getItem('liftoff_active_workout');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // 6. Rest Timer
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    secondsLeft: 0,
    totalSeconds: 0,
    isPaused: false,
  });

  // 7. PR Celebration Popup
  const [prCelebration, setPRCelebration] = useState<PRCelebration | null>(null);

  // 8. Plate Calculator target
  const [plateCalcTargetWeight, setPlateCalcTargetWeight] = useState<number | null>(null);

  // Sync to local storage
  useEffect(() => { localStorage.setItem('liftoff_exercises', JSON.stringify(exercises)); }, [exercises]);
  useEffect(() => { localStorage.setItem('liftoff_routines', JSON.stringify(routines)); }, [routines]);
  useEffect(() => { localStorage.setItem('liftoff_past_workouts', JSON.stringify(pastWorkouts)); }, [pastWorkouts]);
  useEffect(() => { localStorage.setItem('liftoff_feed', JSON.stringify(friendFeed)); }, [friendFeed]);
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('liftoff_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('liftoff_active_workout');
    }
  }, [activeWorkout]);

  // Initial server sync when user logs in or changes
  // Create an explicit standalone string token variable for esbuild safety
  const currentUserIdToken = currentUser ? currentUser.id : '';

  // Initial server sync when user logs in or changes
  useEffect(() => {
    if (!currentUserIdToken) return;

    fetch(`/api/workouts?userId=${currentUserIdToken}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPastWorkouts(prev => {
            const ids = new Set(prev.map(w => w.id));
            const newItems = data.filter((w: any) => !ids.has(w.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch(() => {});

    fetch('/api/feed')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFriendFeed(data);
        }
      })
      .catch(() => {});

    fetch(`/api/routines?userId=${currentUserIdToken}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRoutines(prev => {
            const ids = new Set(prev.map(r => r.id));
            const newItems = data.filter((r: any) => !ids.has(r.id));
            return [...prev, ...newItems];
          });
        }
      })
      .catch(() => {});
  }, [currentUserIdToken]); // <-- Clean, single-variable reference string



    fetch('/api/feed')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFriendFeed(data);
        }
      })
      .catch(() => {});

    fetch(`/api/routines?userId=${currentUser.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRoutines(prev => {
            const ids = new Set(prev.map(r => r.id));
            const newItems = data.filter((r: any) => !ids.has(r.id));
            return [...prev, ...newItems];
          });
        }
      })
      .catch(() => {});
  }, [currentUser?.id]);

  // Rest Timer ticking effect
  useEffect(() => {
    let timerId: any = null;
    if (restTimer.isActive && !restTimer.isPaused && restTimer.secondsLeft > 0) {
      timerId = setInterval(() => {
        setRestTimer(prev => {
          if (prev.secondsLeft <= 1) {
            // Timer complete chime / vibration
            try {
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            } catch (e) {}
            return { ...prev, isActive: false, secondsLeft: 0 };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [restTimer.isActive, restTimer.isPaused, restTimer.secondsLeft]);

  // Rest timer control methods
  const startRestTimer = (seconds: number, exerciseName?: string) => {
    setRestTimer({
      isActive: true,
      secondsLeft: seconds,
      totalSeconds: seconds,
      exerciseName,
      isPaused: false,
    });
  };

  const pauseRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: true }));
  const resumeRestTimer = () => setRestTimer(prev => ({ ...prev, isPaused: false }));
  const addSecondsToRestTimer = (sec: number) => setRestTimer(prev => ({
    ...prev,
    secondsLeft: prev.secondsLeft + sec,
    totalSeconds: prev.totalSeconds + sec,
  }));
  const stopRestTimer = () => setRestTimer({ isActive: false, secondsLeft: 0, totalSeconds: 0, isPaused: false });

  // Start workout session
  const startWorkout = (title?: string, routineId?: string) => {
    if (!currentUser) return;

    let initialExercises: WorkoutExercise[] = [];
    let workoutTitle = title || 'Quick Workout';

    if (routineId) {
      const routine = routines.find(r => r.id === routineId);
      if (routine) {
        workoutTitle = routine.title;
        initialExercises = routine.exercises.map(re => {
          const matchedEx = exercises.find(e => e.id === re.exerciseId);
          const lastPRWeight = matchedEx?.personalRecord?.maxWeightLbs || 135;
          return {
            id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            exerciseId: re.exerciseId,
            exerciseName: re.exerciseName,
            muscleGroup: re.muscleGroup,
            sets: Array.from({ length: re.targetSets }).map((_, idx) => ({
              id: `set-${Date.now()}-${idx}`,
              setType: 'normal',
              weight: lastPRWeight,
              reps: parseInt(re.targetReps) || 8,
              completed: false,
            })),
          };
        });
      }
    }

    const newWorkout: WorkoutSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      title: workoutTitle,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      exercises: initialExercises,
      totalVolumeLbs: 0,
      totalCompletedSets: 0,
      prsEarned: 0,
      isFinished: false,
    };

    setActiveWorkout(newWorkout);
  };

  const addExerciseToActiveWorkout = (exercise: Exercise) => {
    if (!activeWorkout) return;
    const lastPRWeight = exercise.personalRecord?.maxWeightLbs || 100;
    const newWorkoutEx: WorkoutExercise = {
      id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [
        {
          id: `set-${Date.now()}-1`,
          setType: 'normal',
          weight: lastPRWeight,
          reps: 8,
          completed: false,
        },
      ],
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newWorkoutEx],
    });
  };

  const removeExerciseFromActiveWorkout = (workoutExerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter(we => we.id !== workoutExerciseId),
    });
  };

  const addSetToExercise = (workoutExerciseId: string, setType: SetType = 'normal') => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(we => {
        if (we.id !== workoutExerciseId) return we;
        const lastSet = we.sets[we.sets.length - 1];
        const newWeight = lastSet ? lastSet.weight : 100;
        const newReps = lastSet ? lastSet.reps : 8;

        const newSet: ExerciseSet = {
          id: `set-${Date.now()}-${we.sets.length + 1}`,
          setType,
          weight: newWeight,
          reps: newReps,
          completed: false,
        };
        return { ...we, sets: [...we.sets, newSet] };
      }),
    });
  };

  const removeSetFromExercise = (workoutExerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(we => {
        if (we.id !== workoutExerciseId) return we;
        return { ...we, sets: we.sets.filter(s => s.id !== setId) };
      }),
    });
  };

  const updateSet = (workoutExerciseId: string, setId: string, fields: Partial<ExerciseSet>) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map(we => {
        if (we.id !== workoutExerciseId) return we;
        return {
          ...we,
          sets: we.sets.map(s => (s.id === setId ? { ...s, ...fields } : s)),
        };
      }),
    });
  };

  const toggleSetCompleted = (workoutExerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    let triggerTimerForEx: string | undefined;
    let detectedPR: PRCelebration | null = null;

    const updatedExercises = activeWorkout.exercises.map(we => {
      if (we.id !== workoutExerciseId) return we;

      const targetExerciseObj = exercises.find(e => e.id === we.exerciseId);
      const currentPRWeight = targetExerciseObj?.personalRecord?.maxWeightLbs || 0;

      const updatedSets = we.sets.map(s => {
        if (s.id !== setId) return s;
        const newCompleted = !s.completed;

        if (newCompleted) {
          triggerTimerForEx = we.exerciseName;

          // Check if set is a new PR! (Epley 1RM = W * (1 + R/30))
          const epley1RM = Math.round(s.weight * (1 + s.reps / 30));
          if (s.weight > currentPRWeight && s.weight > 0 && s.reps > 0) {
            s.isPR = true;
            detectedPR = {
              exerciseName: we.exerciseName,
              weightLbs: s.weight,
              reps: s.reps,
              estimated1RM: epley1RM,
            };
          }
        }

        return { ...s, completed: newCompleted };
      });

      return { ...we, sets: updatedSets };
    });

    // Recompute total stats
    let totalVol = 0;
    let completedSetsCount = 0;
    let prsCount = 0;

    updatedExercises.forEach(we => {
      we.sets.forEach(s => {
        if (s.completed) {
          totalVol += s.weight * s.reps;
          completedSetsCount += 1;
          if (s.isPR) prsCount += 1;
        }
      });
    });

    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExercises,
      totalVolumeLbs: totalVol,
      totalCompletedSets: completedSetsCount,
      prsEarned: prsCount,
    });

    // Trigger PR confetti & modal if PR hit!
    if (detectedPR) {
      setPRCelebration(detectedPR);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    // Auto trigger rest timer if set was completed and setting enabled
    if (triggerTimerForEx && currentUser?.settings.autoStartRestTimer) {
      startRestTimer(currentUser.settings.defaultRestSeconds || 90, triggerTimerForEx);
    }
  };

  const dismissPRCelebration = () => setPRCelebration(null);

  const finishWorkout = () => {
    if (!activeWorkout || !currentUser) return;

    const endTime = new Date().toISOString();
    const durationSeconds = Math.max(
      30,
      Math.floor((new Date(endTime).getTime() - new Date(activeWorkout.startTime).getTime()) / 1000)
    );

    const finishedSession: WorkoutSession = {
      ...activeWorkout,
      endTime,
      durationSeconds,
      isFinished: true,
    };

    // Save past workout
    setPastWorkouts(prev => [finishedSession, ...prev]);

    // Update Exercise personal records in local database
    const updatedExercisesList = [...exercises];
    let newBenchPR = currentUser.stats.benchPressMaxLbs;
    let newSquatPR = currentUser.stats.squatMaxLbs;
    let newDeadliftPR = currentUser.stats.deadliftMaxLbs;
    let newOHPPR = currentUser.stats.ohpMaxLbs;

    finishedSession.exercises.forEach(we => {
      let maxSetWeight = 0;
      let maxRepsAtWeight = 0;
      let max1RM = 0;

      we.sets.forEach(s => {
        if (s.completed && s.weight > 0) {
          const e1rm = Math.round(s.weight * (1 + s.reps / 30));
          if (s.weight > maxSetWeight) {
            maxSetWeight = s.weight;
            maxRepsAtWeight = s.reps;
            max1RM = e1rm;
          }
        }
      });

      if (maxSetWeight > 0) {
        const exIndex = updatedExercisesList.findIndex(e => e.id === we.exerciseId);
        if (exIndex >= 0) {
          const ex = updatedExercisesList[exIndex];
          const prevPR = ex.personalRecord?.maxWeightLbs || 0;
          if (maxSetWeight >= prevPR) {
            updatedExercisesList[exIndex] = {
              ...ex,
              personalRecord: {
                maxWeightLbs: maxSetWeight,
                maxReps: maxRepsAtWeight,
                estimated1RMLbs: max1RM,
                achievedAt: new Date().toISOString().split('T')[0],
              },
            };
          }
        }

        // Check Big 4 main lifts update
        const exName = we.exerciseName.toLowerCase();
        if (exName.includes('bench press') && maxSetWeight > newBenchPR) newBenchPR = maxSetWeight;
        if (exName.includes('squat') && maxSetWeight > newSquatPR) newSquatPR = maxSetWeight;
        if (exName.includes('deadlift') && maxSetWeight > newDeadliftPR) newDeadliftPR = maxSetWeight;
        if ((exName.includes('overhead press') || exName.includes('ohp')) && maxSetWeight > newOHPPR) newOHPPR = maxSetWeight;
      }
    });

    setExercises(updatedExercisesList);

    // Update user stats
    updateProfile({
      stats: {
        ...currentUser.stats,
        totalWorkouts: currentUser.stats.totalWorkouts + 1,
        totalVolumeLbs: currentUser.stats.totalVolumeLbs + finishedSession.totalVolumeLbs,
        benchPressMaxLbs: newBenchPR,
        squatMaxLbs: newSquatPR,
        deadliftMaxLbs: newDeadliftPR,
        ohpMaxLbs: newOHPPR,
      },
    });

    // Create post for Friends Feed!
    const highlights = finishedSession.exercises
      .map(we => {
        const bestSet = we.sets.filter(s => s.completed).sort((a, b) => b.weight - a.weight)[0];
        if (!bestSet) return null;
        return `${we.exerciseName}: ${bestSet.weight} lbs × ${bestSet.reps}${bestSet.isPR ? ' (PR!)' : ''}`;
      })
      .filter(Boolean) as string[];

    const newFeedPost: FriendFeedPost = {
      id: `feed-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      workoutTitle: finishedSession.title,
      durationMinutes: Math.round(finishedSession.durationSeconds / 60),
      totalVolumeLbs: finishedSession.totalVolumeLbs,
      prsCount: finishedSession.prsEarned,
      highlights: highlights.slice(0, 3),
      timestamp: 'Just now',
      likes: [],
      comments: [],
    };

    setFriendFeed(prev => [newFeedPost, ...prev]);

    // Send completed workout log and feed post to MongoDB Atlas API
    try {
      fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finishedSession),
      }).catch(() => {});

      fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeedPost),
      }).catch(() => {});
    } catch (e) {}

    // Clear active workout & rest timer
    setActiveWorkout(null);
    stopRestTimer();
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    stopRestTimer();
  };

  const addCustomExercise = (name: string, muscleGroup: Exercise['muscleGroup'], equipment: Exercise['equipment']): Exercise => {
    const newEx: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      equipment,
      isCustom: true,
    };
    setExercises(prev => [...prev, newEx]);
    return newEx;
  };

  const createRoutine = (title: string, description: string, routineExercises: Routine['exercises']) => {
    if (!currentUser) return;
    const muscleGroupSet = new Set<Exercise['muscleGroup']>();
    routineExercises.forEach(e => muscleGroupSet.add(e.muscleGroup));

    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      muscleGroups: Array.from(muscleGroupSet),
      createdBy: currentUser.displayName,
      isPreset: false,
      exercises: routineExercises,
    };

    setRoutines(prev => [newRoutine, ...prev]);

    // Send routine to MongoDB Atlas API
    try {
      fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoutine),
      }).catch(() => {});
    } catch (e) {}
  };

  const likeFeedPost = (postId: string) => {
    if (!currentUser) return;
    setFriendFeed(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const hasLiked = p.likes.includes(currentUser.id);
        const newLikes = hasLiked
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: newLikes };
      })
    );

    // Sync like to MongoDB Atlas API
    try {
      fetch(`/api/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch(() => {});
    } catch (e) {}
  };

  const addCommentToFeedPost = (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    setFriendFeed(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const newComment = {
          id: `c-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatarUrl,
          text: text.trim(),
          createdAt: 'Just now',
        };
        return { ...p, comments: [...p.comments, newComment] };
      })
    );
  };

  const getLeaderboard = (): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = usersList.map(u => {
      const bench = u.stats.benchPressMaxLbs || 0;
      const squat = u.stats.squatMaxLbs || 0;
      const deadlift = u.stats.deadliftMaxLbs || 0;
      const ohp = u.stats.ohpMaxLbs || 0;
      const totalBigThree = bench + squat + deadlift;

      const bw = u.bodyweightLbs || 180;
      const height = u.heightInches || 68;
      const age = u.age || 25;

      const strengthToWeightRatio = bw > 0 ? Number((totalBigThree / bw).toFixed(2)) : 0;
      const heightFactor = 1 + ((height - 68) * 0.008);
      const ageFactor = age > 35 ? 1 + ((age - 35) * 0.008) : 1;
      const relativeStrengthScore = bw > 0
        ? Number(((totalBigThree / Math.pow(bw, 0.67)) * heightFactor * ageFactor * 4).toFixed(1))
        : 0;

      return {
        userId: u.id,
        userName: u.displayName,
        userAvatar: u.avatarUrl,
        benchPressMax: bench,
        squatMax: squat,
        deadliftMax: deadlift,
        ohpMax: ohp,
        totalBigThree,
        monthlyVolume: u.stats.totalVolumeLbs || 0,
        monthlyWorkouts: u.stats.totalWorkouts || 0,
        heightInches: u.heightInches,
        age: u.age,
        bodyweightLbs: u.bodyweightLbs,
        strengthToWeightRatio,
        relativeStrengthScore,
        rank: 0,
      };
    });

    // Sort by Big Three Total descending
    entries.sort((a, b) => b.totalBigThree - a.totalBigThree);
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        addExerciseToActiveWorkout,
        removeExerciseFromActiveWorkout,
        addSetToExercise,
        removeSetFromExercise,
        updateSet,
        toggleSetCompleted,
        finishWorkout,
        cancelWorkout,
        
        restTimer,
        startRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        addSecondsToRestTimer,
        stopRestTimer,

        prCelebration,
        dismissPRCelebration,

        pastWorkouts,
        exercises,
        routines,
        addCustomExercise,
        createRoutine,

        friendFeed,
        likeFeedPost,
        addCommentToFeedPost,
        getLeaderboard,

        plateCalcTargetWeight,
        setPlateCalcTargetWeight,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
