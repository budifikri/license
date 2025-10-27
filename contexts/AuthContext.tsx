import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { useUsers, useCompanies } from '../hooks/useApiData';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: allUsers, isLoading: usersLoading, addItem: addUser } = useUsers();
  const { data: allCompanies } = useCompanies();

  useEffect(() => {
    // Check for a logged-in user in local storage on initial load
    try {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('accessToken');
      
      // If we have both user and token, set the user
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else if (storedToken) {
        // If we only have token, fetch user info from API
        // This would require calling an API to verify the token and get user data
        // For now, we'll just remove the token if no user data
        localStorage.removeItem('accessToken');
      }
    } catch (error) {
      console.error("Failed to parse user from local storage", error);
      localStorage.removeItem('authUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = async (email: string, pass: string): Promise<void> => {
    try {
      // Make API call to login endpoint
      // If VITE_API_BASE_URL is not defined, use relative path which will be handled by Vite proxy
      const baseUrl = process.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pass }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store tokens and user info
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<void> => {
    try {
      // Make API call to register endpoint
      // If VITE_API_BASE_URL is not defined, use relative path which will be handled by Vite proxy
      const baseUrl = process.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password: pass }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Optionally, automatically login the user after registration
      // Or redirect to login page
      console.log('Registration successful:', data);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };
  
  // While users are loading from the mock hook, the app is effectively in a loading state.
  const effectiveIsLoading = isLoading || usersLoading;


  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading: effectiveIsLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};