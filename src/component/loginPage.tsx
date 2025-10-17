import React, { useContext, useEffect, useState } from 'react';
import LoginForm from './loginForm';
import { Divider, Space } from '@arco-design/web-react';
import { BubblyButton } from './bubblyButton';
import { AuthContext } from '../context/AuthContext';

const LoginPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // if already logged in, redirect to /my/
  const { authState } = useContext(AuthContext);
  useEffect(() => {
    if (authState) {
      window.location.href = '/my/';
    }
  }, [authState]);

  return (
    <Space
      direction='vertical'
      style={{ margin: '0 auto', padding: 30 }}
      size={30}
    >
      <BubblyButton href='/'>
        Start building experiment without login
      </BubblyButton>

      <Divider orientation='center'>OR</Divider>

      <div style={{ width: 480 }}>
        <LoginForm
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
          setLoading={setLoading}
          onLoginSuccess={() => { window.location.href = '/my/'; }}
        />
      </div>

    </Space>
  );
};

export default LoginPage;