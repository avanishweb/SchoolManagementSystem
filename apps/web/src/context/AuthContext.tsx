import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUser, ISchool } from '@smart-school/shared-types';
import { LoginInput } from '@smart-school/validation';
import { authService } from '../services/authService.js';

interface AuthContextType {
  user: IUser | null;
  school: ISchool | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [school, setSchool] = useState<ISchool | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setSchool(data.school);
    } catch {
      // User is unauthenticated or session expired
      setUser(null);
      setSchool(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    try {
      const authData = await authService.login(credentials);
      setUser(authData.user);
      setSchool(authData.school);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setSchool(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
