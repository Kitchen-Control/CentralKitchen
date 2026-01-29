import React, { createContext, useContext, useState, useEffect } from 'react';
import { users, stores, roles } from '../data/mockData';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('kitchen_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    const foundUser = users.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      const role = roles.find(r => r.role_id === foundUser.role_id);
      const store = foundUser.store_id 
        ? stores.find(s => s.store_id === foundUser.store_id) 
        : null;

      const userData = {
        ...foundUser,
        role: role,
        store: store,
      };

      setUser(userData);
      localStorage.setItem('kitchen_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }

    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kitchen_user');
  };

  const getRolePath = () => {
    if (!user) return '/login';
    
    switch (user.role_id) {
      case 1: return '/admin';
      case 2: return '/coordinator';
      case 3: return '/kitchen';
      case 4: return '/store';
      case 5: return '/shipper';
      default: return '/login';
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    getRolePath,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
