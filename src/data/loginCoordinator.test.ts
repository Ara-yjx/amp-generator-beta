import { cancelLogin, requireLogin, resolveLogin, setLoginOpener } from './loginCoordinator';

describe('loginCoordinator', () => {
  afterEach(() => {
    cancelLogin(new Error('test cleanup'));
  });

  it('shares one login flow across concurrent callers', async () => {
    const opener = jest.fn();
    const removeOpener = setLoginOpener(opener);

    const first = requireLogin();
    const second = requireLogin();

    expect(first).toBe(second);
    expect(opener).toHaveBeenCalledTimes(1);

    resolveLogin();
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    removeOpener();
  });

  it('rejects every caller when login is cancelled', async () => {
    const removeOpener = setLoginOpener(jest.fn());
    const first = requireLogin();
    const second = requireLogin();

    cancelLogin();

    await expect(first).rejects.toThrow('Login cancelled.');
    await expect(second).rejects.toThrow('Login cancelled.');
    removeOpener();
  });
});
