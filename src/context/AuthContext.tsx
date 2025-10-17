import React, { createContext, useMemo, useState } from 'react';
import { AuthState, getAuth } from '../data/backend';

export type AuthContextType = {
  authState: AuthState | null;
  setAuthState: (u: AuthState | null) => void;
};


/**
 * AuthContext is UI level and is managed by the components, whereas getAuth/setAuth is data level and is managed by the backend operations
 */
const AuthContext = createContext<AuthContextType>({ authState: null, setAuthState: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState | null>(() => getAuth());
  const value = useMemo(() => ({ authState, setAuthState }), [authState, setAuthState]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
