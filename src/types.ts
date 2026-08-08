export type WeightUnit = 'lbs' | 'kg';

export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';

export type ThemeId = 'iron-gym' | 'midnight-obsidian' | 'nordic-forest' | 'sunset-gold' | 'synthwave' | 'alpine-frost';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  bgClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  accentClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
  ringClass: string;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  password?: string;
  avatarUrl: string;
  friendCode: string;
  weightUnit: WeightUnit;
  bio?: string;
  joinedDate: string;
  heightInches?: number;
  age?: number;
  bodyweightLbs?: number;
  gender?: 'male' | 'female' | 'other';
  friends: string[]; // array of user IDs
  stats: {
    totalWorkouts: number;
    totalVolumeLbs: number;
    streakDays: number;
    benchPressMaxLbs: number;
    squatMaxLbs: number;
    deadliftMaxLbs: number;
    ohpMaxLbs: number;
  };
  settings: {
    theme: ThemeId;
    defaultRestSeconds: number;
    autoStartRestTimer: boolean;
    soundEnabled: boolean;
    barbellWeightLbs: number;
  };
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Other';
  instructions?: string;
  isCustom?: boolean;
  personalRecord?: {
    maxWeightLbs: number;
    maxReps: number;
    estimated1RMLbs: number;
    achievedAt: string;
  };
}

export interface ExerciseSet {
  id: string;
  setType: SetType;
  weight: number; // always stored in lbs internally
  reps: number;
  completed: boolean;
  isPR?: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  startTime: string; // ISO date string
  endTime?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeLbs: number;
  totalCompletedSets: number;
  prsEarned: number;
  notes?: string;
  isFinished: boolean;
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  muscleGroups: MuscleGroup[];
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: MuscleGroup;
    targetSets: number;
    targetReps: string; // e.g. "8-10"
  }[];
  createdBy: string;
  isPreset?: boolean;
}

export interface FriendFeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  workoutTitle: string;
  durationMinutes: number;
  totalVolumeLbs: number;
  prsCount: number;
  highlights: string[];
  timestamp: string;
  likes: string[]; // array of user IDs who liked
  comments: {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar: string;
  benchPressMax: number;
  squatMax: number;
  deadliftMax: number;
  ohpMax: number;
  totalBigThree: number;
  monthlyVolume: number;
  monthlyWorkouts: number;
  heightInches?: number;
  age?: number;
  bodyweightLbs?: number;
  strengthToWeightRatio: number;
  relativeStrengthScore: number;
  rank: number;
}
