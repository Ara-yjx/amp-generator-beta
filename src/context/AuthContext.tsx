import React, { createContext, useEffect, useMemo, useState } from 'react';
import { addAuthListener, AuthState, getAuth } from '../data/backend';

export type TAuthContext = {
  authState: AuthState | null;
  setAuthState: (u: AuthState | null) => void;
};


/**
 * AuthContext is UI level and is managed by the components, whereas getAuth/setAuth is data level and is managed by the backend operations
 */
const AuthContext = createContext<TAuthContext>({ authState: null, setAuthState: () => { } });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState | null>(() => getAuth());
  const value = useMemo(() => ({ authState, setAuthState }), [authState, setAuthState]);
  useEffect(() => addAuthListener(setAuthState), [setAuthState]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
