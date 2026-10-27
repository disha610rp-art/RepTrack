import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('reptrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('reptrack_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('reptrack_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Could not verify token with backend, retaining session or resetting:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('reptrack_token', jwtToken);
      localStorage.setItem('reptrack_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('reptrack_token', jwtToken);
      localStorage.setItem('reptrack_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const tryDemoLogin = async () => {
    // Attempt login with demo credentials
    let res = await login('demo@reptrack.com', 'password123');
    if (!res.success) {
      // Trigger seed endpoint then retry
      try {
        await api.post('/seed');
        res = await login('demo@reptrack.com', 'password123');
      } catch (e) {
        console.warn('Backend seed endpoint unreachable, creating local demo profile');
      }
    }

    if (!res.success) {
      // Graceful offline demo fallback
      const mockDemoUser = {
        _id: 'demo-user-offline-1',
        name: 'Demo Athlete',
        email: 'demo@reptrack.com',
        settings: {
          unit: 'kg',
          default1RmFormula: 'epley',
          barWeightKg: 20,
          barWeightLbs: 45,
          soundEnabled: true,
          restTimerAutoStart: true,
        },
      };
      const mockToken = 'mock-demo-jwt-token-2026';
      setUser(mockDemoUser);
      setToken(mockToken);
      localStorage.setItem('reptrack_token', mockToken);
      localStorage.setItem('reptrack_user', JSON.stringify(mockDemoUser));
      return { success: true };
    }

    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('reptrack_token');
    localStorage.removeItem('reptrack_user');
  };

  const updateSettings = async (newSettings) => {
    if (!user) return;
    try {
      const res = await api.put('/auth/settings', newSettings);
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          ...res.data.settings,
        },
      };
      setUser(updatedUser);
      localStorage.setItem('reptrack_user', JSON.stringify(updatedUser));
      return true;
    } catch (err) {
      // Fallback local update
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          ...newSettings,
        },
      };
      setUser(updatedUser);
      localStorage.setItem('reptrack_user', JSON.stringify(updatedUser));
      return true;
    }
  };

  const toggleUnit = async () => {
    const nextUnit = user?.settings?.unit === 'kg' ? 'lbs' : 'kg';
    await updateSettings({ unit: nextUnit });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        tryDemoLogin,
        logout,
        updateSettings,
        toggleUnit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
