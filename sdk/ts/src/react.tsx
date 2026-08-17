import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CapsulexAuth, User, CapsulexOptions } from './index';

interface CapsulexContextType {
  user: User | null;
  isLoading: boolean;
  login: typeof CapsulexAuth.prototype.login;
  register: typeof CapsulexAuth.prototype.register;
  requestOtp: typeof CapsulexAuth.prototype.requestOtp;
  verifyOtp: typeof CapsulexAuth.prototype.verifyOtp;
  updateMetadata: typeof CapsulexAuth.prototype.updateMetadata;
  getSessions: typeof CapsulexAuth.prototype.getSessions;
  revokeSession: typeof CapsulexAuth.prototype.revokeSession;
  revokeAllOtherSessions: typeof CapsulexAuth.prototype.revokeAllOtherSessions;
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

  useEffect(() => {
    // Initial fetch to populate state if token exists
    setIsLoading(true);
    auth.getMe().catch(() => {
      if (auth.getToken()) auth.logout();
    }).finally(() => {
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, [auth]);

  const value: CapsulexContextType = {
    user,
    isLoading,
    login: auth.login.bind(auth),
    register: auth.register.bind(auth),
    requestOtp: auth.requestOtp.bind(auth),
    verifyOtp: auth.verifyOtp.bind(auth),
    updateMetadata: auth.updateMetadata.bind(auth),
    getSessions: auth.getSessions.bind(auth),
    revokeSession: auth.revokeSession.bind(auth),
    revokeAllOtherSessions: auth.revokeAllOtherSessions.bind(auth),
    logout: auth.logout.bind(auth),
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
