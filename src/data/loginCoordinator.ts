type PendingLogin = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
};

let loginOpener: (() => void) | null = null;
let pendingLogin: PendingLogin | null = null;

export function requireLogin(): Promise<void> {
  if (pendingLogin) {
    return pendingLogin.promise;
  }

  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  pendingLogin = { promise, resolve, reject };
  loginOpener?.();
  return promise;
}

export function setLoginOpener(opener: () => void): () => void {
  loginOpener = opener;
  if (pendingLogin) {
    opener();
  }
  return () => {
    if (loginOpener === opener) {
      loginOpener = null;
      cancelLogin(new Error('Login is no longer available.'));
    }
  };
}

export function resolveLogin() {
  const current = pendingLogin;
  pendingLogin = null;
  current?.resolve();
}

export function cancelLogin(error = new Error('Login cancelled.')) {
  const current = pendingLogin;
  pendingLogin = null;
  current?.reject(error);
}
