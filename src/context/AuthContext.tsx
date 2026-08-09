import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext<any>(undefined);
export const useAuth = () => useContext(AuthContext)!;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const activeUserId = localStorage.getItem('ironcrew_current_user_id') || 'guest';

  const updateProfile = (updatedFields: any) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedFields };
    setCurrentUser(updated);

    try {
      fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ currentUser, updateProfile, login: async () => ({ success: true }), signup: async () => ({ success: true }), logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};