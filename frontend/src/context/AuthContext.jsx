import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cleancity_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cleancity_token') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('cleancity_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('cleancity_token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('cleancity_user', JSON.stringify(userData));
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed. Please check credentials.' 
      };
    }
  };

  const register = async (name, email, password, role = 'citizen', department) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, role, department });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('cleancity_user', JSON.stringify(userData));
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed.' 
      };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('cleancity_user');
    localStorage.removeItem('cleancity_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
