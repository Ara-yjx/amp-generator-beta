import { Button, Form, Input, Message, Tabs, Typography } from '@arco-design/web-react';
import { IconCheckCircle, IconCloseCircle } from '@arco-design/web-react/icon';
import React, { useState } from 'react';
import { login, register } from '../data/backend';

const { TabPane } = Tabs;
const { Text } = Typography;

const ALLOWED_CHARS_RE = /^[!-~]+$/;     // printable ASCII 33–126, no spaces
const HAS_ALPHA_RE = /[a-zA-Z]/;
const HAS_DIGIT_RE = /[0-9]/;
const VALID_USERNAME_RE = /^[a-zA-Z0-9_\-$^]+$/;

const passwordRequirements: { label: string, met: (password: string,) => boolean }[] = [
  { label: 'At least 8 characters, at most 20 characters', met: password => password.length >= 8 && password.length <= 20 },
  { label: 'Contains at least one letter and one number', met: password => HAS_ALPHA_RE.test(password) && HAS_DIGIT_RE.test(password) },
  { label: 'Only letters, numbers, and printable symbols (no spaces)', met: password => password.length > 0 && ALLOWED_CHARS_RE.test(password) },
];

const passwordPairRequirements: { label: string, met: (password: string, confirmPassword: string) => boolean }[] = [
  ...passwordRequirements,
  { label: 'Passwords must match', met: (password, confirmPassword) => password.length > 0 && password === confirmPassword },
]


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
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const onLoginSubmit = async (values: { email: string, username: string, password: string }) => {
    setLoading(true);
    try {
      await login(values);
      Message.success(`Logged in`);
      onLoginSuccess();
    } catch (err: any) {
      Message.error('Login failed: ' + (err?.error || err?.message || err?.meta?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values: { email: string, username: string, password: string, confirmPassword: string }) => {
    const { confirmPassword: _, ...submitValues } = values;
    setLoading(true);
    try {
      const regRes = await register(submitValues);
      Message.success(regRes?.meta?.message || `Registered successfully`);
    } catch (err: any) {
      setLoading(false);
      Message.error('Registration failed: ' + (err?.error || err?.message || err?.meta?.message || ''));
      return;
    }

    // Auto-login after successful registration
    try {
      await onLoginSubmit(submitValues);
    } catch (err: any) {
      console.warn(err)
      Message.error(err?.error || err?.meta?.message || 'Auto-login failed, please try logging in manually.');
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
          {/* <Form.Item
            label='Email'
            field='email'
            rules={[{ required: true, message: 'Email is required' }]}
          >
            <Input type='email' placeholder='Enter email' />
          </Form.Item> */}
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
            rules={[
              { required: true, message: 'Username is required' },
              {
                validator: (value, cb) => {
                  if (!VALID_USERNAME_RE.test(value)) return cb('Username can contain only letters, numbers, and _ - $ ^');
                  if (value.length < 3 || value.length > 20) return cb('Username must be between 3 and 20 characters');
                  cb(null);
                },
              },
            ]}
          >
            <Input placeholder='Enter username' />
          </Form.Item>
          <Form.Item
            label='Password'
            field='password'
            rules={[
              { required: true, message: 'Password is required' },
              {
                validator: (value, cb) => {
                  for (const req of passwordRequirements) {
                    if (!req.met(value)) return cb(req.label);
                  }
                  cb(null);
                },
              },
            ]}
          >
            <Input.Password
              placeholder='Enter password'
              onChange={(v) => setRegPassword(v)}
            />
          </Form.Item>
          <Form.Item
            label='Confirm'
            field='confirmPassword'
            rules={[
              { required: true, message: 'Please confirm your password' },
              {
                validator: (value, cb) => {
                  if (value !== registerForm.getFieldValue('password')) return cb('Passwords do not match');
                  cb(null);
                },
              },
            ]}
          >
            <Input.Password
              placeholder='Re-enter password'
              onChange={(v) => setRegConfirmPassword(v)}
            />
          </Form.Item>

          {/* Password requirements */}
          <div style={{ textAlign: 'start', marginBottom: 16, padding: '8px 12px', background: 'var(--color-fill-2, #f5f5f5)', borderRadius: 4, fontSize: 13 }}>
            <Text type='secondary' style={{}}>Password should satisfy:</Text>
            {
              passwordPairRequirements.map((req) => {
                const isMet = req.met(regPassword, regConfirmPassword);
                return (
                  <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {isMet
                      ? <IconCheckCircle style={{ color: '#00b42a' }} />
                      : <IconCloseCircle style={{ color: '#f53f3f' }} />}
                    <Text type='secondary'>{req.label}</Text>
                  </div>
                );
              })
            }
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Button
              htmlType='submit'
              type='primary'
              disabled={!passwordPairRequirements.every(r => r.met(regPassword, regConfirmPassword))}
            >
              Register
            </Button>
          </div>
        </Form>
      </TabPane>
    </Tabs>
  );
};

export default LoginForm;
