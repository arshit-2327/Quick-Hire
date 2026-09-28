import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, getStoredUser, setAuthToken, setStoredUser, logoutUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authToken, setAuthTokenState] = useState(() => getAuthToken());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [intendedRole, setIntendedRole] = useState('STUDENT'); // 'STUDENT' | 'RECRUITER'

  useEffect(() => {
    const user = getStoredUser();
    const token = getAuthToken();
    if (user && token) {
      setCurrentUser(user);
      setAuthTokenState(token);
    }
  }, []);

  const login = async (email, password) => {
    const result = await api.login({ email, password });
    setCurrentUser({
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      companyName: result.companyName,
    });
    setAuthTokenState(result.token);
    setAuthModalOpen(false);
    return result;
  };

  const register = async (data) => {
    const result = await api.register(data);
    setCurrentUser({
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      companyName: result.companyName,
    });
    setAuthTokenState(result.token);
    setAuthModalOpen(false);
    return result;
  };

  const logout = () => {
    logoutUser();
    setCurrentUser(null);
    setAuthTokenState(null);
  };

  const openLogin = (role = 'STUDENT') => {
    setIntendedRole(role);
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = (role = 'STUDENT') => {
    setIntendedRole(role);
    setAuthMode('register');
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        login,
        register,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        intendedRole,
        setIntendedRole,
        openLogin,
        openRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
