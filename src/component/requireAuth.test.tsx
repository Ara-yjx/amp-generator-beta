import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { AuthContext } from '../context/AuthContext';
import { safeReturnTo } from './loginPage';
import RequireAuth from './requireAuth';

function CurrentLocation() {
  const location = useLocation();
  return <span>{`${location.pathname}${location.search}`}</span>;
}

describe('RequireAuth', () => {
  it('preserves a protected deep link as returnTo', () => {
    render(
      <AuthContext.Provider value={{ authState: null, setAuthState: jest.fn() }}>
        <MemoryRouter initialEntries={['/my?view=recent']}>
          <Routes>
            <Route path='/my' element={<RequireAuth><span>private</span></RequireAuth>} />
            <Route path='/login' element={<CurrentLocation />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('/login?returnTo=%2Fmy%3Fview%3Drecent')).toBeInTheDocument();
  });
});

describe('safeReturnTo', () => {
  it('accepts internal paths and rejects external redirects', () => {
    expect(safeReturnTo('/chatroom/scid_123?tab=usage')).toBe('/chatroom/scid_123?tab=usage');
    expect(safeReturnTo('https://example.com')).toBe('/my');
    expect(safeReturnTo('//example.com')).toBe('/my');
    expect(safeReturnTo('/\\example.com')).toBe('/my');
    expect(safeReturnTo('/login')).toBe('/my');
  });
});
