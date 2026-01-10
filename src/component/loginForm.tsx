import { Button, Form, Input, Message, Tabs } from '@arco-design/web-react';
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { login, register } from '../data/backend';

const { TabPane } = Tabs;

/**
 * The internal UI of Login component, that can be used either in a modal or a plain page
 */
export const LoginForm: React.FC<{
  activeTab: 'login' | 'register';
  setActiveTab: (tab: 'login' | 'register') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess: () => void;
  // onRegisterSuccess: () => void;
}> = ({ activeTab, setActiveTab, loading, setLoading, onLoginSuccess, /* onRegisterSuccess */ }) => {

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const { authState, setAuthState } = useContext(AuthContext);

  const onLoginSubmit = async (values: { email: string, username: string, password: string }) => {
    console.log('LoginForm onloginSubmit', values);
    setLoading(true);
    try {
      const res = await login(values);
      setAuthState(res.auth);
      Message.success(`Logged in`);
      onLoginSuccess();
    } catch (err: any) {
      Message.error('Login failed: ' + (err?.error || err?.message || err?.meta?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: { email: string, username: string, password: string }) => {
    console.log('LoginForm onRegisterSubmit', values);
    setLoading(true);
    try {
      const regRes = await register(values);
      Message.success(regRes?.meta?.message || `Registered successfully`);
      await onLoginSubmit(values);
    } catch (err: any) {
      Message.error(err?.error || err?.meta?.message || 'Register/Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs activeTab={activeTab} onChange={key => setActiveTab(key as 'login' | 'register')} style={{ width: '100%' }}>
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
  );
};

export default LoginForm;
