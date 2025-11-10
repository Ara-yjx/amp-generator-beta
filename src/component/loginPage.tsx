import React, { useContext, useEffect, useState } from 'react';
import LoginForm from './loginForm';
import { Button, Divider, Space } from '@arco-design/web-react';
import { BubblyButton } from './bubblyButton';
import { AuthContext } from '../context/AuthContext';
import { useHref, useNavigate } from 'react-router';
import { IconEdit } from '@arco-design/web-react/icon';

const LoginPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // if already logged in, redirect to /my/
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (authState) {
      navigate('/my');
    }
  }, [authState]);
  
  const localEditorHref = useHref('/exp');

  return (
    <Space
      direction='vertical'
      style={{ margin: '0 auto', padding: 30 }}
      size={30}
    >
      <div style={{ width: 480 }}>
        <LoginForm
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
          setLoading={setLoading}
          onLoginSuccess={() => { navigate('/my'); }}
        />
      </div>

      <Divider orientation='center'>OR</Divider>

      <Button icon={<IconEdit />} type='outline' shape='round' size='large' href={localEditorHref} target='_blank'>
        Try STIMULIZE as Guest
      </Button>
    </Space>
  );
};

export default LoginPage;