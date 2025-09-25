import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, RegistrationResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'user' | 'business';
  }) => Promise<RegistrationResponse>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  hasRole: (role: 'user' | 'business' | 'admin') => boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const initializeAuth = () => {
      try {
        const token = authService.getToken();
        const userData = authService.getCurrentUser();

        if (token && userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext login called with:', { email }); // Debug log
      const response = await authService.login({ email, password });
      console.log('AuthService response:', response); // Debug log
      
      if (response && response.user) {
        console.log('Setting user in context:', response.user); // Debug log
        setUser(response.user);
        console.log('User set, current state should update'); // Debug log
      } else {
        console.error('Invalid response structure:', response); // Debug log
      }
      
      return { user: response.user, token: response.token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'user' | 'business';
  }): Promise<RegistrationResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      // Don't set user in context until email is verified
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const hasRole = (role: 'user' | 'business' | 'admin'): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    setUser,
  };

  console.log('AuthContext value:', { user, isAuthenticated: !!user }); // Debug log

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
