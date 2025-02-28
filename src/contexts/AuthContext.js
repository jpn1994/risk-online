import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import socketService from '../services/socket';
import jwtDecode from 'jwt-decode';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for token and load user on mount
  useEffect(() => {
    let socketCheckInterval = null;
    
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Check if token is expired
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }
        
        // Get user data
        const response = await authService.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Connect the socket
        socketService.connect(token);
        
        // Set up an interval to check socket connection and reconnect if needed
        socketCheckInterval = setInterval(() => {
          if (!socketService.isConnected()) {
            console.log('Socket disconnected, attempting to reconnect...');
            socketService.connect(token);
          }
        }, 5000); // Check every 5 seconds
        
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Cleanup socket connection and interval on unmount
    return () => {
      if (socketCheckInterval) {
        clearInterval(socketCheckInterval);
      }
      socketService.disconnect();
    };
  }, []);

  // Register user
  const register = async (userData) => {
    setError(null);
    try {
      const data = await authService.register(userData);
      const response = await authService.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
      
      // Connect socket with the new token
      socketService.connect(data.token);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  // Login user
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authService.login(credentials);
      const response = await authService.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
      
      // Connect socket with the new token
      socketService.connect(data.token);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 