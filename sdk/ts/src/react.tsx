import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CapsulexAuth, User, CapsulexOptions } from './index';

interface CapsulexContextType {
  user: User | null;
  isLoading: boolean;
  login: typeof CapsulexAuth.prototype.login;
  register: typeof CapsulexAuth.prototype.register;
  logout: () => void;
  auth: CapsulexAuth;
}

const CapsulexContext = createContext<CapsulexContextType | undefined>(undefined);

export interface CapsulexProviderProps extends CapsulexOptions {
  apiKey: string;
  children: ReactNode;
}

export const CapsulexProvider: React.FC<CapsulexProviderProps> = ({ apiKey, children, ...options }) => {
  const [auth] = useState(() => new CapsulexAuth(apiKey, options));
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

  const value: CapsulexContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    auth,
  };

  return <CapsulexContext.Provider value={value}>{children}</CapsulexContext.Provider>;
};

export const useCapsulexAuth = (): CapsulexContextType => {
  const context = useContext(CapsulexContext);
  if (context === undefined) {
    throw new Error('useCapsulexAuth must be used within a CapsulexProvider');
  }
  return context;
};
