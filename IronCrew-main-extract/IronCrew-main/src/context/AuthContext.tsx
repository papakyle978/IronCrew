import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null; usersList: UserProfile[]; isAuthenticated: boolean;
  login: (e: string, p?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (d: string, u: string, p?: string, em?: string, m?: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void; updateProfile: (f: Partial<UserProfile>) => void; addFriendByCodeOrUsername: (c: string) => { success: boolean; message: string };
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => useContext(AuthContext)!;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const s = localStorage.getItem('ironcrew_users');
    return s ? JSON.parse(s) : [];
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => localStorage.getItem('ironcrew_current_user_id') || '');

  useEffect(() => { localStorage.setItem('ironcrew_users', JSON.stringify(usersList)); }, [usersList]);
  useEffect(() => { currentUserId ? localStorage.setItem('ironcrew_current_user_id', currentUserId) : localStorage.removeItem('ironcrew_current_user_id'); }, [currentUserId]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsersList(prev => {
            const map = new Map<string, UserProfile>();
            prev.forEach(u => map.set(u.id, u));
            data.forEach((u: UserProfile) => {
              if (u && u.id) {
                const existing = map.get(u.id);
                map.set(u.id, { ...existing, ...u });
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  const currentUser = usersList.find(u => u.id === currentUserId) || null;

  const login = async (emailOrUsername: string, password?: string) => {
    const q = emailOrUsername.trim().toLowerCase();
    if (!q) return { success: false, message: 'Enter username or email' };
    const local = usersList.find(u => u.username.toLowerCase() === q || u.email?.toLowerCase() === q);
    if (local && (!local.password || local.password === password)) { setCurrentUserId(local.id); return { success: true }; }
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, password }) });
      const d = res.ok && await res.json();
      if (d?.user) { setUsersList(p => [...p.filter(x => x.id !== d.user.id), d.user]); setCurrentUserId(d.user.id); return { success: true }; }
    } catch (e) {}
    return { success: false, message: 'User not found.' };
  };

  const signup = async (displayName: string, username: string, password?: string, email?: string, metrics?: any) => {
    const cu = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cu) return { success: false, message: 'Invalid username' };
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      username: cu,
      displayName: displayName.trim() || username,
      email: email?.trim().toLowerCase() || `${cu}@ironcrew.app`,
      password: password?.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cu}`,
      friendCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      weightUnit: 'lbs',
      bio: 'Ready to crush PRs with friends!',
      joinedDate: new Date().toISOString().split('T')[0],
      heightInches: metrics?.heightInches || 68,
      age: metrics?.age || 25,
      bodyweightLbs: metrics?.bodyweightLbs || 180,
      friends: [],
      stats: { totalWorkouts: 0, totalVolumeLbs: 0, streakDays: 1, benchPressMaxLbs: 0, squatMaxLbs: 0, deadliftMaxLbs: 0, ohpMaxLbs: 0 },
      settings: { theme: 'iron-gym', defaultRestSeconds: 90, autoStartRestTimer: true, soundEnabled: true, barbellWeightLbs: 45 }
    };
    setUsersList(p => [...p, newUser]); setCurrentUserId(newUser.id);
    try { await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) }); } catch (e) {}
    return { success: true };
  };

  const addFriendByCodeOrUsername = (codeOrUsername: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    const q = codeOrUsername.trim().toLowerCase(), t = usersList.find(x => x.friendCode.toLowerCase() === q || x.username.toLowerCase() === q);
    if (!t) return { success: false, message: 'Friend not found.' };
    if (t.id === currentUser.id) return { success: false, message: 'Cannot add yourself.' };
    setUsersList(p => p.map(u => u.id === currentUser.id && !u.friends.includes(t.id) ? { ...u, friends: [...u.friends, t.id] } : u.id === t.id && !u.friends.includes(currentUser.id) ? { ...u, friends: [...u.friends, currentUser.id] } : u));
    return { success: true, message: `Added ${t.displayName}!` };
  };

  return (
    <AuthContext.Provider value={{ currentUser, usersList, isAuthenticated: !!currentUser, login, signup, logout: () => { setCurrentUserId(''); localStorage.removeItem('ironcrew_current_user_id'); }, updateProfile: (f) => { if (!currentUser) return; const u = { ...currentUser, ...f }; setUsersList(p => p.map(x => x.id === currentUser.id ? u : x)); try { fetch(`/api/users/${currentUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) }); } catch (e) {} }, addFriendByCodeOrUsername }}>
      {children}
    </AuthContext.Provider>
  );
};