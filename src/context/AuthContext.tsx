import React, { createContext, useMemo, useState } from 'react';

export type AuthUser = { id: number; email: string; username: string };

export type AuthContextType = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
