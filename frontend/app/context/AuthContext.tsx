'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  getCurrentUser,
  isAuthenticated as checkAuth,
} from '../lib/api/auth';
import { User } from '../lib/api/types';

// Define the types for the context
interface AuthContextType {
  user: User | null;
  activeRole: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => void;
  refreshUser: () => Promise<void>;
  error: string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Set up state variables
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Set up the router
  const router = useRouter();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthentication = async () => {
      // Set loading state to true
      setIsLoading(true);

      try {
        if (checkAuth()) {
          try {
            // Always fetch the complete user profile from the API
            // to ensure we have all the needed fields
            const userData = await getMe();

            // Set the user state with the complete fetched user data
            setUser(userData);

            // Set the active role based on the fetched user data
            const savedRole =
              localStorage.getItem('activeRole') || userData.role;

            // Check if the saved role is valid
            const validRole =
              savedRole === userData.role ||
              savedRole === userData.secondary_role;

            // Set the active role based on the saved role
            setActiveRole(validRole ? savedRole : userData.role);

            // Set the authentication state to true
            setIsAuthenticated(true);
          } catch (fetchError) {
            console.error('⚠️ Error fetching user profile:', fetchError);

            // Fallback to stored user if API call fails
            const storedUser = getCurrentUser();
            if (storedUser) {
              setUser(storedUser);
              const savedRole =
                localStorage.getItem('activeRole') || storedUser.role;
              const validRole =
                savedRole === storedUser.role ||
                savedRole === storedUser.secondary_role;
              setActiveRole(validRole ? savedRole : storedUser.role);
              setIsAuthenticated(true);
            } else {
              // If no stored user, reset authentication
              setUser(null);
              setActiveRole('');
              setIsAuthenticated(false);
            }
          }
        } else {
          // If the user is not authenticated, set the states to default
          setUser(null);
          setActiveRole('');
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Handle any errors that occur during the authentication check
        console.error('⚠️ Authentication error:', err);

        // Set the states to the default
        setUser(null);
        setActiveRole('');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Call the authentication check function
    checkAuthentication();
  }, []);

  // Create the login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API login function
      await apiLogin({ email, password });

      // Get the full user profile after login
      const fullUserProfile = await getMe();

      // Set the user state with the complete profile data
      setUser(fullUserProfile);

      // Set the active role based on the response data
      setActiveRole(fullUserProfile.role);
      // Set the active role in local storage
      localStorage.setItem('activeRole', fullUserProfile.role);

      // Set the authentication state to true
      setIsAuthenticated(true);

      // Redirect to the home page
      router.push('/');
    } catch (err) {
      // Handle any errors that occur during the login process
      setError(err instanceof Error ? err.message : '⚠️ Failed to login');

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the logout function
  const logout = async () => {
    setIsLoading(true);

    try {
      // Call the API logout function
      await apiLogout();

      // Set the states to default
      setUser(null);
      setActiveRole('');
      setIsAuthenticated(false);
      // Remove the active role from local storage
      localStorage.removeItem('activeRole');

      // Redirect to the login page
      router.push('/');
    } catch (err) {
      console.error('⚠️ Failed to logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create the switchRole function
  const switchRole = (role: string) => {
    // Check if the user exists, if not, early return
    if (!user) return;

    // Check if the role is valid
    if (role === user.role || role === user.secondary_role) {
      setActiveRole(role);
      localStorage.setItem('activeRole', role);
    }
  };

  // Create the refreshUser function
  const refreshUser = async () => {
    // Check if the user is authenticated, if not, early return
    if (!isAuthenticated) return;

    try {
      // Fetch the complete user data from the API
      const userData = await getMe();

      // Update localStorage with complete user profile
      localStorage.setItem('user', JSON.stringify(userData));

      // Set the user state with the fetched user data
      setUser(userData);

      // Set the active role based on the fetched user data
      const currentRole = activeRole || userData.role;
      // Check if the current role is valid
      const validRole =
        currentRole === userData.role ||
        currentRole === userData.secondary_role;

      // Check if the saved role is valid
      if (!validRole) {
        setActiveRole(userData.role);
        localStorage.setItem('activeRole', userData.role);
      }
    } catch (err) {
      console.error('⚠️ Failed to refresh user:', err);
    }
  };

  // Return the context provider
  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
        refreshUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Create a custom hook to use the AuthContext
export function useAuth() {
  // Get the context value
  const context = useContext(AuthContext);

  // Check if the context is undefined
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
