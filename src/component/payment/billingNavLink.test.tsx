import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AuthContext } from '../../context/AuthContext';
import BillingNavLink from './billingNavLink';

const originalFlag = process.env.REACT_APP_BILLING_ENABLED;
afterEach(() => {
  if (originalFlag === undefined) delete process.env.REACT_APP_BILLING_ENABLED;
  else process.env.REACT_APP_BILLING_ENABLED = originalFlag;
});

function renderLink() {
  render(<AuthContext.Provider value={{
    authState: { token: 'test', username: 'test', id: 1 }, setAuthState: jest.fn(),
  }}><MemoryRouter><BillingNavLink /></MemoryRouter></AuthContext.Provider>);
}

it('hides billing for the beta participant build', () => {
  process.env.REACT_APP_BILLING_ENABLED = 'false';
  renderLink();
  expect(screen.queryByRole('link', { name: 'Plans & billing' })).not.toBeInTheDocument();
});

it('preserves billing by default for other builds', () => {
  delete process.env.REACT_APP_BILLING_ENABLED;
  renderLink();
  expect(screen.getByRole('link', { name: 'Plans & billing' })).toHaveAttribute('href', '/billing');
});
