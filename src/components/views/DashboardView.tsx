import React from 'react';
import {
  Flame,
  Plus,
  Play,
  Trophy,
  Dumbbell,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { ViewTab } from '../Navbar';

interface DashboardViewProps {
  onNavigateTab: (tab: ViewTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const { startWorkout, routines, pastWorkouts, friendFeed, likeFeedPost } = useWorkout();
  const { theme, formatWeight } = useTheme();

  const bench = currentUser?.stats.benchPressMaxLbs || 0;
  const squat = currentUser?.stats.squatMaxLbs || 0;
  const deadlift = currentUser?.stats.deadliftMaxLbs || 0;
  const ohp = currentUser?.stats.ohpMaxLbs || 0;
  const bigThreeTotal = bench + squat + deadlift;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner & Quick Start CTA */}
      <div className={`relative overflow-hidden rounded-3xl ${theme.cardBgClass} ${theme.cardBorderClass} border p-6 sm:p-8 shadow-2xl`}>
        {/* Glow accent */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full ${theme.accentBgClass} opacity-10 blur-3xl pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Friends Strength League
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${theme.textPrimaryClass} tracking-tight`}>
              Welcome back, {currentUser?.displayName}! 💪
            </h1>
            <p className={`text-xs sm:text-sm ${theme.textSecondaryClass} leading-relaxed`}>
              {friendFeed.length > 0
                ? `${friendFeed.length} friend workout(s) logged recently. Ready to log your session and climb the Big Three Leaderboard?`
                : 'Ready to log your session, track personal records, and climb the Big Three Leaderboard?'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startWorkout('Quick Workout')}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm ${theme.buttonPrimaryClass} shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Blank Workout</span>
            </button>
            <button
              onClick={() => onNavigateTab('routines')}
              className={`px-5 py-3.5 rounded-2xl font-bold text-sm ${theme.buttonSecondaryClass} flex items-center justify-center gap-2`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Start Routine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Big 4 Strength Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${theme.textPrimaryClass} flex items-center gap-2`}>
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Your Personal Max Lifts (1RM)</span>
          </h2>
          <span className={`text-xs font-mono font-bold ${theme.accentClass}`}>
            Big 3 Total: {formatWeight(bigThreeTotal)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Bench */}
          <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 rounded-2xl shadow-sm hover:border-amber-400/40 transition-colors`}>
            <p className={`text-xs font-medium ${theme.textSecondaryClass}`}>Bench Press</p>
            <p className={`text-2xl font-black ${theme.textPrimaryClass} mt-1 font-mono`}>
              {formatWeight(bench)}
            </p>
            <p className="text-[11px] text-amber-400/80 mt-1 font-medium">Chest Target</p>
          </div>

          {/* Squat */}
          <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 rounded-2xl shadow-sm hover:border-amber-400/40 transition-colors`}>
            <p className={`text-xs font-medium ${theme.textSecondaryClass}`}>Barbell Squat</p>
            <p className={`text-2xl font-black ${theme.textPrimaryClass} mt-1 font-mono`}>
              {formatWeight(squat)}
            </p>
            <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">Lower Body</p>
          </div>

          {/* Deadlift */}
          <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 rounded-2xl shadow-sm hover:border-amber-400/40 transition-colors`}>
            <p className={`text-xs font-medium ${theme.textSecondaryClass}`}>Deadlift</p>
            <p className={`text-2xl font-black ${theme.textPrimaryClass} mt-1 font-mono`}>
              {formatWeight(deadlift)}
            </p>
            <p className="text-[11px] text-rose-400/80 mt-1 font-medium">Back & Posterior</p>
          </div>

          {/* OHP */}
          <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 rounded-2xl shadow-sm hover:border-amber-400/40 transition-colors`}>
            <p className={`text-xs font-medium ${theme.textSecondaryClass}`}>Overhead Press</p>
            <p className={`text-2xl font-black ${theme.textPrimaryClass} mt-1 font-mono`}>
              {formatWeight(ohp)}
            </p>
            <p className="text-[11px] text-blue-400/80 mt-1 font-medium">Shoulder Power</p>
          </div>
        </div>
      </div>

      {/* Recommended Routines & Quick Launch */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${theme.textPrimaryClass} flex items-center gap-2`}>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>Preset Routines</span>
          </h2>
          <button
            onClick={() => onNavigateTab('routines')}
            className={`text-xs font-bold ${theme.accentClass} hover:underline flex items-center gap-1`}
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {routines.slice(0, 3).map(routine => (
            <div
              key={routine.id}
              className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between hover:border-amber-400/40 transition-all group`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${theme.badgeBgClass} ${theme.badgeTextClass}`}>
                    {routine.muscleGroups.join(', ')}
                  </span>
                  <span className={`text-xs ${theme.textSecondaryClass}`}>
                    {routine.exercises.length} Exercises
                  </span>
                </div>
                <h3 className={`text-base font-bold ${theme.textPrimaryClass} group-hover:text-amber-400 transition-colors`}>
                  {routine.title}
                </h3>
                <p className={`text-xs ${theme.textSecondaryClass} line-clamp-2`}>
                  {routine.description}
                </p>
              </div>

              <button
                onClick={() => startWorkout(routine.title, routine.id)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold ${theme.buttonPrimaryClass} flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Routine</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Friends Feed Snippet Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${theme.textPrimaryClass} flex items-center gap-2`}>
            <Users className="w-4 h-4 text-purple-400" />
            <span>Recent Friends Activity</span>
          </h2>
          <button
            onClick={() => onNavigateTab('friends')}
            className={`text-xs font-bold ${theme.accentClass} hover:underline flex items-center gap-1`}
          >
            <span>Open Friends Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {friendFeed.length === 0 ? (
            <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-5 rounded-2xl text-center space-y-1.5`}>
              <p className={`text-xs font-bold ${theme.textPrimaryClass}`}>No Friend Activity Yet</p>
              <p className={`text-xs ${theme.textSecondaryClass}`}>
                Add workout partners using your Friend Code in the Friends tab to view live workout logs here!
              </p>
            </div>
          ) : (
            friendFeed.slice(0, 2).map(post => (
              <div
                key={post.id}
                className={`${theme.cardBgClass} ${theme.cardBorderClass} border p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={post.userAvatar}
                    alt={post.userName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${theme.textPrimaryClass}`}>{post.userName}</span>
                      <span className={`text-[10px] ${theme.textSecondaryClass}`}>&bull; {post.timestamp}</span>
                    </div>
                    <p className={`text-sm font-semibold ${theme.textPrimaryClass}`}>{post.workoutTitle}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-stone-400 pt-0.5">
                      <span>{post.durationMinutes} mins</span>
                      <span>&bull;</span>
                      <span>Vol: {formatWeight(post.totalVolumeLbs)}</span>
                      {post.prsCount > 0 && (
                        <span className="text-amber-400 font-bold">&bull; {post.prsCount} PRs Earned!</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => likeFeedPost(post.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold ${
                    currentUser && post.likes.includes(currentUser.id)
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-stone-900 text-stone-300 border border-stone-800'
                  } flex items-center justify-center gap-1.5 self-start sm:self-center`}
                >
                  <span>💪</span>
                  <span>{post.likes.length} Respect</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
