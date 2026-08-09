import React, { useState } from 'react';
import { Dumbbell, UserPlus, LogIn, Lock, ShieldCheck, Flame, Users, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const AuthScreen: React.FC = () => {
  const { login, signup } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(10);
  const [age, setAge] = useState<number>(25);
  const [bodyweightLbs, setBodyweightLbs] = useState<number>(180);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const totalInches = (feet * 12) + (inches || 0);
      const res = await signup(displayName, username, password, undefined, {
        heightInches: totalInches,
        age: Number(age) || 25,
        bodyweightLbs: Number(bodyweightLbs) || 180,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMsg('An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(emailOrUsername, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMsg('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgClass} text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-amber-400 selection:text-zinc-950`}>
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/10 text-zinc-950">
            <Dumbbell className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            IRONCREW <span className="text-amber-400 text-sm font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">Strength</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xs mx-auto">
            Create an account to track sets, reps, maximums & live friend leaderboards.
          </p>
        </div>

        {/* Feature Highlights Pill Bar */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="bg-stone-900/80 border border-stone-800/80 p-2.5 rounded-2xl text-center space-y-1">
            <Flame className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="text-[10px] font-bold text-stone-300">Log Reps & Sets</p>
          </div>
          <div className="bg-stone-900/80 border border-stone-800/80 p-2.5 rounded-2xl text-center space-y-1">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="text-[10px] font-bold text-stone-300">Auto PR Tracking</p>
          </div>
          <div className="bg-stone-900/80 border border-stone-800/80 p-2.5 rounded-2xl text-center space-y-1">
            <Users className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="text-[10px] font-bold text-stone-300">Friend Feed</p>
          </div>
        </div>

        {/* Form Card */}
        <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6`}>
          {/* Toggle Tabs */}
          <div className="flex gap-1 p-1 bg-stone-950/90 rounded-2xl border border-stone-800">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup' ? `${theme.accentBgClass} text-zinc-950 shadow-md` : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' ? `${theme.accentBgClass} text-zinc-950 shadow-md` : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Log In
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          {mode === 'signup' ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Smith"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-950 border ${theme.cardBorderClass} text-stone-100 text-sm focus:outline-none ${theme.ringClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Username (unique handle)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_lifts"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-950 border ${theme.cardBorderClass} text-stone-100 text-sm focus:outline-none ${theme.ringClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={4}
                    placeholder="At least 4 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border ${theme.cardBorderClass} text-stone-100 text-sm focus:outline-none ${theme.ringClass}`}
                  />
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Body Metrics for Strength-to-Weight & Ratio Leaderboard */}
              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Body Metrics (For Strength Ratio Leaderboards)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Height</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={feet}
                        onChange={e => setFeet(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none text-center"
                        placeholder="Ft"
                      />
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={inches}
                        onChange={e => setInches(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none text-center"
                        placeholder="In"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Age</label>
                    <input
                      type="number"
                      min={12}
                      max={100}
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none text-center"
                      placeholder="Age"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1">Bodyweight</label>
                    <input
                      type="number"
                      min={70}
                      max={500}
                      value={bodyweightLbs}
                      onChange={e => setBodyweightLbs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none text-center"
                      placeholder="Lbs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm ${theme.buttonPrimaryClass} shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Create Account & Start Lifting'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Username or Email</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_lifts"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-stone-950 border ${theme.cardBorderClass} text-stone-100 text-sm focus:outline-none ${theme.ringClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border ${theme.cardBorderClass} text-stone-100 text-sm focus:outline-none ${theme.ringClass}`}
                  />
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm ${theme.buttonPrimaryClass} shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2`}
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Logging in...' : 'Log In to IronCrew'}</span>
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            <span>All workout logs & PR stats backed up securely</span>
          </div>
        </div>
      </div>
    </div>
  );
};
