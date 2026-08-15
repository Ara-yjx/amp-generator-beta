import { act, render } from '@testing-library/react';
import { useContext } from 'react';
import { addAuthListener, AuthState, getAuth } from '../data/backend';
import { AuthContext, AuthProvider } from './AuthContext';

jest.mock('../data/backend', () => ({
  addAuthListener: jest.fn(),
  getAuth: jest.fn(),
}));

const mockedAddAuthListener = addAuthListener as jest.MockedFunction<typeof addAuthListener>;
const mockedGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

describe('AuthProvider', () => {
  beforeEach(() => {
    mockedGetAuth.mockReturnValue(null);
    mockedAddAuthListener.mockReset();
  });

  it('registers its auth listener once and cleans it up', () => {
    const cleanup = jest.fn();
    let updateAuth: ((auth: AuthState | null) => void) | undefined;
    mockedAddAuthListener.mockImplementation(callback => {
      updateAuth = callback;
      return cleanup;
    });

    const Probe = () => {
      const { authState } = useContext(AuthContext);
      return <span>{authState?.username ?? 'anonymous'}</span>;
    };
    const view = render(<AuthProvider><Probe /></AuthProvider>);

    act(() => updateAuth?.({ token: 'token', username: 'alice', id: 1 }));
    expect(view.getByText('alice')).toBeInTheDocument();
    expect(mockedAddAuthListener).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
