import { Exercise, Routine, ThemeConfig, FriendFeedPost, UserProfile } from '../types';

export const THEMES: Record<string, ThemeConfig> = {
  'iron-gym': {
    id: 'iron-gym',
    name: 'Iron Gym',
    tagline: 'Classic heavy lifter dark theme with energetic yellow accents',
    isDark: true,
    bgClass: 'bg-zinc-950',
    cardBgClass: 'bg-zinc-900',
    cardBorderClass: 'border-zinc-800',
    textPrimaryClass: 'text-zinc-100',
    textSecondaryClass: 'text-zinc-400',
    accentClass: 'text-amber-400',
    accentBgClass: 'bg-amber-400',
    accentBorderClass: 'border-amber-400',
    badgeBgClass: 'bg-amber-400/10',
    badgeTextClass: 'text-amber-400',
    buttonPrimaryClass: 'bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold',
    buttonSecondaryClass: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700',
    ringClass: 'focus:ring-amber-400',
    previewColors: { bg: '#09090b', card: '#18181b', accent: '#fbbf24' },
  },
  'midnight-obsidian': {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    tagline: 'Ultra-deep dark canvas with vivid purple neon energy',
    isDark: true,
    bgClass: 'bg-slate-950',
    cardBgClass: 'bg-slate-900',
    cardBorderClass: 'border-slate-800',
    textPrimaryClass: 'text-slate-100',
    textSecondaryClass: 'text-slate-400',
    accentClass: 'text-purple-400',
    accentBgClass: 'bg-purple-500',
    accentBorderClass: 'border-purple-500',
    badgeBgClass: 'bg-purple-500/10',
    badgeTextClass: 'text-purple-400',
    buttonPrimaryClass: 'bg-purple-600 hover:bg-purple-500 text-white font-semibold',
    buttonSecondaryClass: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    ringClass: 'focus:ring-purple-400',
    previewColors: { bg: '#020617', card: '#0f172a', accent: '#a855f7' },
  },
  'nordic-forest': {
    id: 'nordic-forest',
    name: 'Nordic Forest',
    tagline: 'Deep tactical green with vibrant sage highlight',
    isDark: true,
    bgClass: 'bg-stone-950',
    cardBgClass: 'bg-stone-900',
    cardBorderClass: 'border-stone-800',
    textPrimaryClass: 'text-stone-100',
    textSecondaryClass: 'text-stone-400',
    accentClass: 'text-emerald-400',
    accentBgClass: 'bg-emerald-500',
    accentBorderClass: 'border-emerald-500',
    badgeBgClass: 'bg-emerald-500/10',
    badgeTextClass: 'text-emerald-400',
    buttonPrimaryClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold',
    buttonSecondaryClass: 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700',
    ringClass: 'focus:ring-emerald-400',
    previewColors: { bg: '#0c0a09', card: '#1c1917', accent: '#10b981' },
  },
};

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    instructions: 'Lie flat on bench, retract scapulae, lower bar to mid-sternum, drive straight up.',
  },
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
    instructions: 'Place bar across your rear traps, push hips backward, break parallel cleanly, drive back up.',
  },
  {
    id: 'ex-deadlift',
    name: 'Conventional Deadlift',
    muscleGroup: 'Back',
    equipment: 'Barbell',
    instructions: 'Set feet hip-width, engage your lats, pull slack completely out of bar, stand upright fully locked out.',
  },
  {
    id: 'ex-overhead-press',
    name: 'Barbell Overhead Press',
    muscleGroup: 'Shoulders',
    equipment: 'Barbell',
    instructions: 'Strict press bar vertical overhead from your upper collarbone while bracing your core and glutes.',
  }
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'routine-big-three',
    title: 'IronCrew Power Hypertrophy',
    description: 'Core tactical development routine focused around Bench Press, Back Squats, and Deadlifts.',
    muscleGroups: ['Chest', 'Legs', 'Back'],
    isPreset: true,
    createdBy: 'IronCrew System',
    exercises: [
      { exerciseId: 'ex-bench-press', exerciseName: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 3, targetReps: '5-8' },
      { exerciseId: 'ex-barbell-squat', exerciseName: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 3, targetReps: '5' },
      { exerciseId: 'ex-deadlift', exerciseName: 'Conventional Deadlift', muscleGroup: 'Back', targetSets: 3, targetReps: '5' }
    ],
  }
];

export const DEMO_FRIENDS: UserProfile[] = [];
export const INITIAL_FRIEND_FEED: FriendFeedPost[] = [];
