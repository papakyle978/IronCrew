import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEMO_FRIENDS } from '../data/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  usersList: UserProfile[];
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (displayName: string, username: string, password?: string, email?: string, bodyMetrics?: { heightInches?: number; age?: number; bodyweightLbs?: number }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (updatedFields: Partial<UserProfile>) => void;
  addFriendByCodeOrUsername: (codeOrUsername: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FORBIDDEN_DEFAULT_IDS = ['user-kyle', 'user-alex', 'user-sam', 'user-marcus'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('ironcrew_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter((u: any) => !FORBIDDEN_DEFAULT_IDS.includes(u.id))
            .map((u: any) => ({
              ...u,
              friends: (u.friends || []).filter((fId: string) => !FORBIDDEN_DEFAULT_IDS.includes(fId)),
            }));
          if (sanitized.length > 0) return sanitized;
        }
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return [];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedId = localStorage.getItem('ironcrew_current_user_id') || '';
    if (FORBIDDEN_DEFAULT_IDS.includes(savedId)) {
      return '';
    }
    return savedId;
  });

  useEffect(() => {
    localStorage.setItem('ironcrew_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('ironcrew_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('ironcrew_current_user_id');
    }
  }, [currentUserId]);

  const currentUser = usersList.find(u => u.id === currentUserId) || null;

  const login = async (emailOrUsername: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const query = emailOrUsername.trim().toLowerCase();
    if (!query) {
      return { success: false, message: 'Please enter a username or email' };
    }

    const found = usersList.find(
      u => (u.email && u.email.toLowerCase() === query) || u.username.toLowerCase() === query
    );

    if (found) {
      // Check password if set on user profile
      if (found.password && password && found.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }
      setCurrentUserId(found.id);
      return { success: true };
    }

    // Try server API with MongoDB authentication
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUsersList(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
          setCurrentUserId(data.user.id);
          return { success: true };
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error) {
          return { success: false, message: errorData.error };
        }
      }
    } catch (e) {
      console.log('Server login API offline, using local lookup.');
    }

    return { success: false, message: 'User not found. Check username or sign up for a new account.' };
  };

  const signup = async (
    displayName: string,
    username: string,
    password?: string,
    email?: string,
    bodyMetrics?: { heightInches?: number; age?: number; bodyweightLbs?: number }
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      return { success: false, message: 'Please provide a valid username' };
    }

    if (!password || password.trim().length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long' };
    }

    const exists = usersList.some(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: 'Username is already taken' };
    }

    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      displayName: displayName.trim() || username,
      email: email?.trim().toLowerCase() || `${cleanUsername}@ironcrew.app`,
      password: password.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      friendCode: randomCode,
      weightUnit: 'lbs',
      bio: 'Ready to crush PRs with friends! 💪',
      joinedDate: new Date().toISOString().split('T')[0],
      heightInches: bodyMetrics?.heightInches || 68,
      age: bodyMetrics?.age || 25,
      bodyweightLbs: bodyMetrics?.bodyweightLbs || 180,
      friends: [],
      stats: {
        totalWorkouts: 0,
        totalVolumeLbs: 0,
        streakDays: 1,
        benchPressMaxLbs: 0,
        squatMaxLbs: 0,
        deadliftMaxLbs: 0,
        ohpMaxLbs: 0,
      },
      settings: {
        theme: 'iron-gym',
        defaultRestSeconds: 90,
        autoStartRestTimer: true,
        soundEnabled: true,
        barbellWeightLbs: 45,
      },
    };

    setUsersList(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);

    // Also register on server API / MongoDB
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (e) {
      console.log('Server register API offline, user stored locally.');
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUserId('');
    localStorage.removeItem('ironcrew_current_user_id');
  };

  const updateProfile = (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedFields };
    setUsersList(prev =>
      prev.map(u => (u.id === currentUser.id ? updated : u))
    );

    // Sync updated user profile to MongoDB API
    try {
      fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch (e) {}
  };

  const addFriendByCodeOrUsername = (codeOrUsername: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    const query = codeOrUsername.trim().toLowerCase();
    
    if (!query) return { success: false, message: 'Please enter a code or username' };

    const target = usersList.find(
      u => u.friendCode.toLowerCase() === query || u.username.toLowerCase() === query
    );

    if (!target) {
      return { success: false, message: 'No friend found with that code or username' };
    }

    if (target.id === currentUser.id) {
      return { success: false, message: 'You cannot add yourself as a friend' };
    }

    if (currentUser.friends.includes(target.id)) {
      return { success: false, message: `${target.displayName} is already in your friends list` };
    }

    // Add friend bidirectionally
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, friends: [...u.friends, target.id] };
        }
        if (u.id === target.id) {
          return { ...u, friends: [...u.friends, currentUser.id] };
        }
        return u;
      })
    );

    return { success: true, message: `Added ${target.displayName} to your friends list!` };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        updateProfile,
        addFriendByCodeOrUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
