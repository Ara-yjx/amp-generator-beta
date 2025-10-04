import React, { useContext, useEffect, useState } from 'react';
import { Button, Modal, Tabs, Form, Input, Message } from '@arco-design/web-react';
import { getProjects, login, logout, register } from '../data/backend';
import { AuthContext } from '../context/AuthContext';
import { IconUser } from '@arco-design/web-react/icon';

const { TabPane } = Tabs;

// Promise-based API for requiring user login from anywhere
type LoginWaiter = { resolve: () => void; reject: (err: any) => void };
let loginWaiters: LoginWaiter[] = [];
let openLoginModal: ((tab?: 'login' | 'register') => void) | null = null;

export function requireLogin(tab: 'login' | 'register' = 'login'): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    loginWaiters.push({ resolve, reject });
    openLoginModal?.(tab);
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

export default function Login() {
  const { user, setUser } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // Bridge for global requireLogin() to open this modal
  useEffect(() => {
    openLoginModal = (tab: 'login' | 'register' = 'login') => {
      setActiveTab(tab);
      setVisible(true);
    };
    return () => {
      // Reset on unmount only if this instance set it
      if (openLoginModal) {
        openLoginModal = null;
      }
    };
  }, []);

  const onLoginSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await login(values);
      Message.success(res?.meta?.message || `Logged in`);
      if (res?.data?.user) setUser(res.data.user);
      resolveAllLoginWaiters();
      setVisible(false);
    } catch (err: any) {
      Message.error(err?.error || err?.meta?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: any) => {
    setLoading(true);
    try {
      const regRes = await register(values);
      Message.success(regRes?.meta?.message || `Registered successfully`);
      // Auto login after register
      const loginRes = await login(values);
      Message.success(loginRes?.meta?.message || `Logged in`);
      if (loginRes?.data?.user) setUser(loginRes.data.user);
      resolveAllLoginWaiters();
      setVisible(false);
    } catch (err: any) {
      Message.error(err?.error || err?.meta?.message || 'Register/Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onClickLogOut = () => {
    setUser(null);
    Message.success('Logged out');
    logout().catch(() => { /* noop */ });
  }

  return (
    <>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Hello {user.username}</span>
          <Button icon={<IconUser />} size='small' onClick={onClickLogOut}>
            Logout
          </Button>
        </div>
      ) : (
        <Button icon={<IconUser />} type='primary' size='small' onClick={() => setVisible(true)}>
          Login
        </Button>
      )}

      {/* <Button onClick={() => getProjects().then(v => Message.success(JSON.stringify(v)))}>List Projects</Button> */}

      <Modal
        visible={visible}
        confirmLoading={loading}
        footer={null}
        unmountOnExit
        onCancel={() => {
          rejectOneLoginWaiter(new Error('Login cancelled'));
          setVisible(false);
        }}
      >
        <Tabs activeTab={activeTab} onChange={key => setActiveTab(key as 'login' | 'register')}>
          <TabPane key='login' title='Login'>
            <Form
              form={loginForm}
              layout='horizontal'
              onSubmit={onLoginSubmit}
            >
              <Form.Item
                label='Email'
                field='email'
                rules={[{ required: true, message: 'Email is required' }]}
              >
                <Input type='email' placeholder='Enter email' />
              </Form.Item>
              <Form.Item
                label='Username'
                field='username'
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input placeholder='Enter username' />
              </Form.Item>
              <Form.Item
                label='Password'
                field='password'
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password placeholder='Enter password' />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Button htmlType='submit' type='primary'>Login</Button>
              </div>
            </Form>
          </TabPane>

          <TabPane key='register' title='Register'>
            <Form
              form={registerForm}
              layout='horizontal'
              onSubmit={onRegisterSubmit}
            >
              <Form.Item
                label='Email'
                field='email'
                rules={[{ required: true, message: 'Email is required' }]}
              >
                <Input type='email' placeholder='Enter email' />
              </Form.Item>
              <Form.Item
                label='Username'
                field='username'
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input placeholder='Enter username' />
              </Form.Item>
              <Form.Item
                label='Password'
                field='password'
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password placeholder='Enter password' />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Button htmlType='submit' type='primary'>Register</Button>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
    </>
  );
}
