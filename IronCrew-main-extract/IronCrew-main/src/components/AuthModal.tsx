import React, { useState } from 'react';
import { User, LogIn, UserPlus, Sparkles, X, Check, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await login(emailOrUsername, password);
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => onClose(), 600);
    } else {
      setErrorMsg(res.message || 'Login failed. Check password or username!');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await signup(displayName, username, password);
    if (res.success) {
      setSuccessMsg('Account created successfully!');
      setTimeout(() => onClose(), 600);
    } else {
      setErrorMsg(res.message || 'Username already taken or invalid input.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-2xl rounded-3xl p-6 relative overflow-hidden`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex gap-1 p-1 bg-stone-950/80 rounded-2xl mb-6 border border-stone-800">
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); setPassword(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login' ? `${theme.accentBgClass} text-zinc-950` : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); setPassword(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup' ? `${theme.accentBgClass} text-zinc-950` : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
                Username or Email
              </label>
              <input
                type="text"
                required
                placeholder="e.g. kyle_lifts"
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none ${theme.ringClass}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none ${theme.ringClass}`}
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm ${theme.buttonPrimaryClass} shadow-md flex items-center justify-center gap-2`}
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to IronCrew</span>
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
                Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kyle"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none ${theme.ringClass}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
                Username (unique handle)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. kyle_lifts"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none ${theme.ringClass}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${theme.textSecondaryClass} mb-1.5`}>
                Account Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Create password (min 4 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-sm focus:outline-none ${theme.ringClass}`}
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm ${theme.buttonPrimaryClass} shadow-md flex items-center justify-center gap-2`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
