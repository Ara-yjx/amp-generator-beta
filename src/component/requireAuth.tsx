import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router';
import { AuthContext } from '../context/AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authState } = useContext(AuthContext);
  const location = useLocation();

  if (!authState) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?returnTo=${encodeURIComponent(returnTo)}`} />;
  }

  return <>{children}</>;
}
