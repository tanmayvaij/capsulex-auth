import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { IntellaxisAuth, User, IntellaxisOptions } from './index';

interface IntellaxisContextType {
  user: User | null;
  isLoading: boolean;
  login: typeof IntellaxisAuth.prototype.login;
  register: typeof IntellaxisAuth.prototype.register;
  logout: () => void;
  auth: IntellaxisAuth;
}

const IntellaxisContext = createContext<IntellaxisContextType | undefined>(undefined);

export interface IntellaxisProviderProps extends IntellaxisOptions {
  apiKey: string;
  children: ReactNode;
}

export const IntellaxisProvider: React.FC<IntellaxisProviderProps> = ({ apiKey, children, ...options }) => {
  const [auth] = useState(() => new IntellaxisAuth(apiKey, options));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const token = auth.getToken();
      if (token) {
        const userData = await auth.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Token invalid or expired
      setUser(null);
      auth.logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const login: typeof auth.login = async (email, password) => {
    const res = await auth.login(email, password);
    await fetchUser();
    return res;
  };

  const register: typeof auth.register = async (email, password) => {
    return auth.register(email, password);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  const value: IntellaxisContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    auth,
  };

  return <IntellaxisContext.Provider value={value}>{children}</IntellaxisContext.Provider>;
};

export const useIntellaxisAuth = (): IntellaxisContextType => {
  const context = useContext(IntellaxisContext);
  if (context === undefined) {
    throw new Error('useIntellaxisAuth must be used within an IntellaxisProvider');
  }
  return context;
};
