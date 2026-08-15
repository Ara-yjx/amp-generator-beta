import { Button, Message, Modal } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { addAuthListener, logout } from '../data/backend';
import { cancelLogin, requireLogin, resolveLogin, setLoginOpener } from '../data/loginCoordinator';
import { LoginForm } from './loginForm';
import { useHref, useLocation } from 'react-router';

export { requireLogin };

export default function LoginModal() {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { authState } = useContext(AuthContext);

  // Bridge for global requireLogin() to open this modal
  useEffect(() => {
    const openThisLoginModal = () => {
      setActiveTab('login');
      setVisible(true);
    };
    return setLoginOpener(openThisLoginModal);
  }, []);

  const onLoginSuccess = () => {
    resolveLogin();
    setVisible(false);
  };

  const onClickLogOut = () => {
    logout().catch(() => { /* noop */ });
    Message.success('Logged out.');
  };

  const onCancel = () => {
    cancelLogin();
    Message.warning('Login cancelled.');
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

  // If logged in from other tab, close modal
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
