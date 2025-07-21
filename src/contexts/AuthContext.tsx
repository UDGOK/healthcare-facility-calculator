'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  estimates: string[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  saveEstimate: (estimateId: string, estimateData: any) => void;
  getUserEstimates: () => any[];
  deleteEstimate: (estimateId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Initialize demo users if they don't exist
    const existingUsers = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
    if (existingUsers.length === 0) {
      const demoUsers = [
        {
          id: 'admin-demo',
          email: 'admin@dsarch.org',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date().toISOString(),
          estimates: []
        },
        {
          id: 'user-demo',
          email: 'demo@dsarch.org',
          password: 'demo123',
          name: 'Demo User',
          role: 'user',
          createdAt: new Date().toISOString(),
          estimates: []
        },
        {
          id: 'client-demo',
          email: 'client@healthcare.com',
          password: 'client123',
          name: 'Healthcare Client',
          role: 'user',
          createdAt: new Date().toISOString(),
          estimates: []
        }
      ];
      localStorage.setItem('ds-arch-users', JSON.stringify(demoUsers));
    }

    // Check for saved user
    const savedUser = localStorage.getItem('ds-arch-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('ds-arch-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
    const existingUser = users.find((u: any) => u.email === email && u.password === password);

    if (existingUser) {
      const { password: _, ...userToSave } = existingUser;
      setUser(userToSave);
      localStorage.setItem('ds-arch-user', JSON.stringify(userToSave));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);

    // Get existing users
    const users = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');

    // Check if user already exists
    if (users.find((u: any) => u.email === email)) {
      setIsLoading(false);
      return false;
    }

    // Create new user
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password,
      name,
      role: email === 'admin@dsarch.org' ? 'admin' : 'user' as 'user' | 'admin',
      createdAt: new Date().toISOString(),
      estimates: []
    };

    users.push(newUser);
    localStorage.setItem('ds-arch-users', JSON.stringify(users));

    // Log in the user
    const { password: __, ...userToSave } = newUser;
    setUser(userToSave);
    localStorage.setItem('ds-arch-user', JSON.stringify(userToSave));

    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ds-arch-user');
  };

  const saveEstimate = (estimateId: string, estimateData: any) => {
    if (!user) return;

    const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
    estimates[estimateId] = {
      ...estimateData,
      id: estimateId,
      userId: user.id,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('ds-arch-estimates', JSON.stringify(estimates));

    // Update user's estimate list
    const users = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      if (!users[userIndex].estimates.includes(estimateId)) {
        users[userIndex].estimates.push(estimateId);
        localStorage.setItem('ds-arch-users', JSON.stringify(users));
      }
    }

    // Update current user state
    setUser(prev => prev ? {
      ...prev,
      estimates: prev.estimates.includes(estimateId) ? prev.estimates : [...prev.estimates, estimateId]
    } : null);
  };

  const getUserEstimates = () => {
    if (!user) return [];

    const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
    return user.estimates.map(id => estimates[id]).filter(Boolean);
  };

  const deleteEstimate = (estimateId: string) => {
    if (!user) return;

    // Remove from estimates
    const estimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}');
    delete estimates[estimateId];
    localStorage.setItem('ds-arch-estimates', JSON.stringify(estimates));

    // Update user's estimate list
    const users = JSON.parse(localStorage.getItem('ds-arch-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].estimates = users[userIndex].estimates.filter((id: string) => id !== estimateId);
      localStorage.setItem('ds-arch-users', JSON.stringify(users));
    }

    // Update current user state
    setUser(prev => prev ? {
      ...prev,
      estimates: prev.estimates.filter(id => id !== estimateId)
    } : null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
    saveEstimate,
    getUserEstimates,
    deleteEstimate
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
