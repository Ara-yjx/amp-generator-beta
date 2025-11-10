import { Button, Message, Modal } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { addAuthListener, getAuth, logout } from '../data/backend';
import { LoginForm } from './loginForm';
import { useHref, useLocation, useNavigate } from 'react-router';

// Promise-based API for requiring user login from anywhere
type LoginWaiter = { resolve: () => void; reject: (err: any) => void };
let loginWaiters: LoginWaiter[] = [];
let openLoginModal: (() => void) | null = null;

export function requireLogin(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    loginWaiters.push({ resolve, reject });
    openLoginModal?.();
  });
}

function resolveAllLoginWaiters() {
  const waiters = loginWaiters;
  loginWaiters = [];
  waiters.forEach(w => {
    try { w.resolve(); } catch { /* noop */ }
  });
}

function rejectOneLoginWaiter(err: any) {
  const w = loginWaiters.pop();
  try { w?.reject(err); } catch { /* noop */ }
}

export default function LoginModal() {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { authState, setAuthState } = useContext(AuthContext);

  // Bridge for global requireLogin() to open this modal
  useEffect(() => {
    openLoginModal = () => {
      setActiveTab('login');
      setVisible(true);
    };
    return () => {
      // Reset on unmount only if this instance set it
      if (openLoginModal) {
        openLoginModal = null;
      }
    };
  }, []);

  // Auto-login on mount if both token and username exist in localStorage
  useEffect(() => {
    const auth = getAuth();
    auth && setAuthState(auth);
  }, [setAuthState]);

  const onLoginSuccess = () => {
    resolveAllLoginWaiters();
    setVisible(false);
  };

  const onClickLogOut = () => {
    setAuthState(null);
    logout().catch(() => { /* noop */ });
    Message.success('Logged out.');
  };

  const onCancel = () => {
    // Will add this back when we have better handling for cancel login
    // rejectOneLoginWaiter(new Error('Login cancelled'));
    Message.warning('Login canceled. Some network operations might be canceled.')
    setVisible(false);
  };

  // Do login. A little bit hack here - loginModal decides login mode (open modal/go to login page)
  const location = useLocation();
  const loginPageHref = useHref('/login');
  const onClickLogIn = () => {
    switch (location.pathname) {
      case '/login':
        break;
      case '/exp':
        window.open(loginPageHref, '_blank');
        break;
      default:
        setVisible(true);
    }
  };

  // If login from other tab, close modal
  useEffect(() => {
    const removeListener = addAuthListener((auth) => {
      if (auth) {
        setVisible(false);
      }
    });
    return removeListener;
  }, []);

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <>
      {authState ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Hello {authState.username}</span>
          <Button icon={<IconUser />} size='small' onClick={onClickLogOut}>
            Logout
          </Button>
        </div>
      ) : (
        <Button icon={<IconUser />} type='primary' size='small' onClick={onClickLogIn}>
          Login
        </Button>
      )}

      {/* <Button onClick={() => getProjects().then(v => Message.success(JSON.stringify(v)))}>List Projects</Button> */}

      <Modal
        visible={visible}
        confirmLoading={loading}
        footer={null}
        unmountOnExit
        onCancel={onCancel}
      >
        <LoginForm
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
          setLoading={setLoading}
          onLoginSuccess={onLoginSuccess}
        />
      </Modal>
    </>
  );
}
