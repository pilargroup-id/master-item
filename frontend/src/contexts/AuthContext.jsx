import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sku_token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get('/api/auth/me');
          setUser(res.data.data);
        } catch (error) {
          localStorage.removeItem('sku_token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    if (res.data.success) {
      localStorage.setItem('sku_token', res.data.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
      setUser(res.data.data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('sku_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isProductDivision = () => {
    return user && (user.division === 'product' || user.division === 'admin');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isProductDivision }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
