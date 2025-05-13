'use client';

import { authService, userService } from '@/services/api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  invalidateSession: () => void;
}

// Default values for auth context
export const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  invalidateSession: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Helper to set token in both localStorage and cookie
const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('access_token', token);
      Cookies.set('access_token', token, { path: '/' });
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }
};

// Helper to remove token from both localStorage and cookie
const removeToken = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('access_token');
      Cookies.remove('access_token', { path: '/' });
      // Add an additional cookie removal with vanilla JS as a fallback
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }
};

// Helper to get token (try cookie first, then localStorage)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookieToken = Cookies.get('access_token');
    if (cookieToken) return cookieToken;
    
    const lsToken = localStorage.getItem('access_token');
    // If token is in localStorage but not in cookies, sync them
    if (lsToken) {
      Cookies.set('access_token', lsToken, { path: '/' });
      return lsToken;
    }
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
  
  return null;
};

// Helper to clear browser cache
const clearBrowserCache = async () => {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheKeys = await window.caches.keys();
      await Promise.all(
        cacheKeys.map(key => window.caches.delete(key))
      );
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Wait for component to be mounted before checking auth
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run authentication check after the component has mounted
    if (!mounted) return;
    
    const token = getToken();
    if (token) {
      userService.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [mounted]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      console.log('Login attempt with:', credentials);
      const authResponse: AuthResponse = await authService.login(credentials);
      console.log('Login successful, token received:', authResponse);
      setToken(authResponse.access_token);
      const userData = await userService.getCurrentUser();
      setUser(userData);
      router.push('/notes');
    } catch (error) {
      console.error('Login failed:', error);
      // Re-throw to allow the login form to handle the error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      // Register user
      console.log('Registration attempt with:', userData);
      console.log('Has recaptcha token:', !!userData.recaptcha_token);
      
      // Make sure we have a valid token before proceeding
      if (!userData.recaptcha_token) {
        throw new Error('reCAPTCHA verification is required');
      }
      
      try {
        await authService.register(userData);
      } catch (error: any) {
        // Check for reCAPTCHA specific errors
        if (error?.response?.status === 400 && 
            (error?.response?.data?.detail?.includes('reCAPTCHA') || 
             error?.response?.data?.detail?.includes('timeout-or-duplicate'))) {
          throw new Error('reCAPTCHA verification failed or expired. Please try again.');
        }
        throw error; // Re-throw other errors
      }
      
      // Instead of trying to log in immediately (which would reuse the token),
      // redirect to the login page with a success message
      console.log('Registration successful, redirecting to login page');
      
      // Add a success message to localStorage that the login page can display
      if (typeof window !== 'undefined') {
        localStorage.setItem('registration_success', 'true');
        localStorage.setItem('registered_username', userData.username);
      }
      
      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Registration failed:', error);
      // Re-throw to allow the registration form to handle the error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/auth/login');
  };

  // Full session invalidation that clears all auth data
  const invalidateSession = async () => {
    removeToken();
    setUser(null);
    await clearBrowserCache();
    // Use window.location for a full page reload to clear all in-memory state
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        invalidateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Safe way to use auth context that prevents SSR issues
 * This ensures we don't access the context during server rendering
 */
export const useAuth = () => {
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Only access context in browser environment
  if (!isBrowser) {
    return defaultAuthContext;
  }

  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 