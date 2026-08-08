import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { Navbar, ViewTab } from './components/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { RoutinesView } from './components/views/RoutinesView';
import { ExercisesView } from './components/views/ExercisesView';
import { FriendsView } from './components/views/FriendsView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { RestTimerFloating } from './components/RestTimerFloating';
import { PRCelebrationModal } from './components/PRCelebrationModal';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { AuthModal } from './components/AuthModal';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme.bgClass} ${theme.textPrimaryClass} flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950`}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'dashboard' && <DashboardView onNavigateTab={setCurrentTab} />}
        {currentTab === 'routines' && <RoutinesView />}
        {currentTab === 'exercises' && <ExercisesView />}
        {currentTab === 'friends' && <FriendsView />}
        {currentTab === 'history' && <HistoryView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals & Floating Components */}
      <ActiveWorkoutModal />
      <RestTimerFloating />
      <PRCelebrationModal />
      <PlateCalculatorModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WorkoutProvider>
          <MainAppContent />
        </WorkoutProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
