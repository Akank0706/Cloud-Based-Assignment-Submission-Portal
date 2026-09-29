/**
 * Authentication Context & State Management
 * Answers the primary cloud security questions:
 * - Authentication: "Who are you?" (Identity verification)
 * - Authorization: "What are you allowed to do?" (RBAC checks)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { cloudDatabase } from './databaseService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<User>;
  register: (name: string, email: string, role: UserRole) => Promise<User>;
  logout: () => void;
  switchDemoUser: (role: 'student' | 'teacher') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = 'cloud_portal_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load existing session on boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const freshUser = await cloudDatabase.getUserById(parsed.uid);
          if (freshUser) {
            setCurrentUser(freshUser);
          } else {
            setCurrentUser(parsed);
          }
        } else {
          // Default to Demo Student for immediate exploratory experience
          const defaultStudent = await cloudDatabase.getUserByEmail('student@example.com');
          if (defaultStudent) {
            setCurrentUser(defaultStudent);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(defaultStudent));
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, expectedRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      let user = await cloudDatabase.getUserByEmail(cleanEmail);

      if (!user) {
        // Auto-provision if user enters a valid new email with demo credentials
        const nameGuess = cleanEmail.split('@')[0].replace('.', ' ');
        const formattedName = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);
        user = await cloudDatabase.createUser(
          formattedName,
          cleanEmail,
          expectedRole || (cleanEmail.includes('teacher') ? 'teacher' : 'student')
        );
      }

      if (expectedRole && user.role !== expectedRole) {
        throw new Error(`Account exists as a "${user.role}", but you attempted to login under "${expectedRole}".`);
      }

      setCurrentUser(user);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await cloudDatabase.createUser(name, email, role);
      setCurrentUser(user);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const switchDemoUser = async (role: 'student' | 'teacher') => {
    const targetEmail = role === 'teacher' ? 'teacher@example.com' : 'student@example.com';
    const target = await cloudDatabase.getUserByEmail(targetEmail);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(target));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser
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
