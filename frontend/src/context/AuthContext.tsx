import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api.js';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATOR' | 'ACCOUNT_HOLDER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  account: Account | null;
  loading: boolean;
  isBootstrapped: boolean;
  login: (token: string, user: User, account?: Account) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  checkBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(true);

  const checkBootstrap = async () => {
    try {
      const res = await api.getBootstrapStatus();
      setIsBootstrapped(res.isBootstrapped);
    } catch (e) {
      console.error('Failed to check bootstrap status', e);
    }
  };

  const refreshUserData = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setAccount(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setAccount(data.account);
    } catch (err) {
      console.error('Session restore failed', err);
      removeAuthToken();
      setUser(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBootstrap();
    refreshUserData();
  }, []);

  const login = (token: string, userData: User, accountData?: Account) => {
    setAuthToken(token);
    setUser(userData);
    if (accountData) setAccount(accountData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        loading,
        isBootstrapped,
        login,
        logout,
        refreshUserData,
        checkBootstrap
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

