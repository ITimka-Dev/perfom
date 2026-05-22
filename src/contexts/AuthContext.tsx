import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api-client';
import { identifyUser, clearUserIdentification } from '@/lib/monitoring';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Identify user in monitoring systems
      identifyUser(userData.id, userData.email, userData.fullName);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    
    const accessToken = response.access_token;
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
      fullName: response.user.fullName,
      role: response.user.role || 'student',
    };

    setToken(accessToken);
    setUser(userData);

    // Store in localStorage
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
    // Identify user in monitoring systems
    identifyUser(userData.id, userData.email, userData.fullName);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    await authApi.signup({ email, password, fullName });
    // After signup, automatically login
    await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Clear user identification in monitoring systems
    clearUserIdentification();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
