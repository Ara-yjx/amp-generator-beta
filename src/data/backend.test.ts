import { requireLogin } from './loginCoordinator';
import { addAuthListener, clearAuth, getAuth, getProjects, login, setAuth } from './backend';

jest.mock('@arco-design/web-react', () => ({
  Message: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('./loginCoordinator', () => ({
  requireLogin: jest.fn(),
}));

const mockedRequireLogin = requireLogin as jest.MockedFunction<typeof requireLogin>;
const authError = { error: 'Invalid, expired, or missing authentication token.' };

function response(status: number, body: unknown): globalThis.Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as globalThis.Response;
}

describe('backend auth lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedRequireLogin.mockReset();
    jest.restoreAllMocks();
  });

  it('notifies same-tab and cross-tab subscribers and cleans up listeners', () => {
    const listener = jest.fn();
    const removeListener = addAuthListener(listener);
    const auth = { token: 'same-tab-token', username: 'alice', id: 1 };

    setAuth(auth);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining(auth));

    const crossTabAuth = {
      token: 'cross-tab-token',
      username: 'bob',
      id: 2,
      tokenCreatedAt: Date.now(),
      tokenExpiresAt: Date.now() + 60_000,
    };
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stimulize_auth',
      newValue: JSON.stringify(crossTabAuth),
    }));
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ username: 'bob' }));

    clearAuth();
    expect(listener).toHaveBeenLastCalledWith(null);
    removeListener();
    setAuth(auth);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('retries an authenticated request at most once', async () => {
    setAuth({ token: 'expired-token', username: 'alice', id: 1 });
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(response(401, authError))
      .mockResolvedValueOnce(response(401, authError));
    mockedRequireLogin.mockImplementation(async () => {
      setAuth({ token: 'replacement-token', username: 'alice', id: 1 });
    });

    await expect(getProjects()).rejects.toThrow('Authentication failed after re-login.');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockedRequireLogin).toHaveBeenCalledTimes(1);
    expect(getAuth()).toBeNull();
  });

  it('does not log login credentials or generic request payloads', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(200, {
      data: {
        access_token: 'access-token',
        user: { email: '', id: 1, username: 'alice' },
      },
    }));

    await login({ email: '', username: 'alice', password: 'secret-password' });

    expect(log).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
  });
});
