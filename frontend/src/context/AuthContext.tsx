import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getToken, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener('lifedesk:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('lifedesk:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.get<User>('/auth/me');
        setUser(currentUser);
        setTokenState(storedToken);
      } catch (err) {
        removeToken();
        setUser(null);
        setTokenState(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ access_token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setToken(response.access_token);
    setTokenState(response.access_token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const response = await api.post<{ access_token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    setToken(response.access_token);
    setTokenState(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
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
