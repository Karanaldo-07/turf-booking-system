import { createContext, useContext, useMemo, useState } from 'react';
import http from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const saveAuth = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (payload) => {
    const { data } = await http.post('/auth/register', payload);
    saveAuth(data.token, data.user);
  };

  const login = async (payload) => {
    const { data } = await http.post('/auth/login', payload);
    saveAuth(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const { data } = await http.put('/auth/profile', payload);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), register, login, logout, updateProfile }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
