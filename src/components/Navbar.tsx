import React from 'react';
import {
  Dumbbell,
  Users,
  Flame,
  Clock,
  Settings,
  BookOpen,
  History,
  LayoutDashboard,
  User,
  Palette,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

export type ViewTab = 'dashboard' | 'routines' | 'exercises' | 'friends' | 'history' | 'settings';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuthModal }) => {
  const { currentUser } = useAuth();
  const { activeWorkout } = useWorkout();
  const { theme } = useTheme();

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routines', label: 'Routines', icon: BookOpen },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className={`sticky top-0 z-30 border-b ${theme.cardBorderClass} ${theme.cardBgClass}/90 backdrop-blur-md`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Friends Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className={`w-10 h-10 rounded-2xl ${theme.badgeBgClass} ${theme.accentClass} border ${theme.accentBorderClass} flex items-center justify-center font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform`}>
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-black tracking-tight ${theme.textPrimaryClass}`}>
                    IronCrew
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${theme.badgeBgClass} ${theme.accentClass}`}>
                    Friends
                  </span>
                </div>
                <p className={`text-[11px] ${theme.textSecondaryClass}`}>Strength Tracker</p>
              </div>
            </button>
          </div>

          {/* Center: Active Workout Banner (if running) */}
          {activeWorkout && (
            <button
              onClick={() => {}} // Active workout stays open in fullscreen modal
              className={`hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full ${theme.badgeBgClass} border ${theme.accentBorderClass} animate-pulse`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className={`text-xs font-bold ${theme.accentClass}`}>
                Workout Active: {activeWorkout.title}
              </span>
            </button>
          )}

          {/* Right: Theme shortcut & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSelectTab('settings')}
              className={`p-2 rounded-xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 ${theme.textSecondaryClass} hover:${theme.textPrimaryClass} transition-colors flex items-center gap-1.5 text-xs`}
              title="Change Theme"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-medium">{theme.name}</span>
            </button>

            {/* Profile Avatar / Login Button */}
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition-all text-left`}
            >
              {currentUser ? (
                <>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                  />
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold ${theme.textPrimaryClass} leading-tight`}>
                      {currentUser.displayName}
                    </p>
                    <p className={`text-[10px] ${theme.textSecondaryClass}`}>
                      @{currentUser.username}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <User className="w-4 h-4" />
                  <span>Log In</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-stone-800/40">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? `${theme.badgeBgClass} ${theme.accentClass} shadow-xs`
                    : `${theme.textSecondaryClass} hover:${theme.textPrimaryClass} hover:bg-stone-900/50`
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? theme.accentClass : 'opacity-70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
