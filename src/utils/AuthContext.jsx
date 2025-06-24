// src\utils\AuthContext.jsx

import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  const [token, setToken] = useState(storedToken || null);
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const login = (newToken, userInfo) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
