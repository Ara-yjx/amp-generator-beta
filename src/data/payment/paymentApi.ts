import { getAuth } from '../backend';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live';

export type BillingCycle = 'monthly' | 'yearly';

export type Plan = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_projects: number;
  max_experiments: number;
  storage_gb: number;
};

export type Subscription = {
  id: number;
  plan: Plan | null;
  status: string;
  billing_cycle: BillingCycle | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
};

export type Payment = {
  id: number;
  amount: number;
  currency: string;
  status: string;
  stripe_invoice_id: string | null;
  created_at: string;
};

export type BillingHistory = {
  payments: Payment[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export type Promotion = {
  code: string;
  type: 'discount' | 'trial_extension';
  trial_days: number | null;
  discount_percent: number | null;
  valid_until: string | null;
};

export type CreditWallet = {
  balance_micros: number;
  balance: number;
  currency: string;
  updated_at: string;
};

export type CreditTransaction = {
  id: number;
  amount_micros: number;
  amount: number;
  balance_after_micros: number;
  balance_after: number;
  transaction_type: 'credit' | 'debit' | 'refund' | 'adjustment';
  source: string;
  status: string;
  currency: string;
  stripe_payment_intent_id: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};

export type CreditHistory = {
  transactions: CreditTransaction[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export type TopUpIntent = {
  client_secret: string;
  payment_intent_id: string;
  amount_cents: number;
  currency: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (requireAuth) {
    const token = getAuth()?.token;
    if (!token) {
      throw new Error('Please sign in to manage billing.');
    }
    headers.set('Authorization', token);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.error) {
    throw new Error(body?.error || `Request failed with status ${response.status}.`);
  }

  return body as T;
}

export const paymentApi = {
  getPlans: () => request<Plan[]>('/api/payment/plans', {}, false),

  getSubscription: () =>
    request<{ subscription: Subscription | null }>('/api/payment/subscription'),

  createSubscription: (
    planId: number,
    paymentMethodId: string,
    billingCycle: BillingCycle,
  ) =>
    request<{ subscription: Subscription }>('/api/payment/create-subscription', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_method_id: paymentMethodId,
        billing_cycle: billingCycle,
      }),
    }),

  changePlan: (planId: number, billingCycle: BillingCycle) =>
    request<{ subscription: Subscription }>('/api/payment/change-plan', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }),
    }),

  cancelSubscription: () =>
    request<{ message: string; subscription: Subscription }>(
      '/api/payment/cancel-subscription',
      { method: 'POST', body: '{}' },
    ),

  reactivateSubscription: () =>
    request<{ message: string; subscription: Subscription }>(
      '/api/payment/reactivate',
      { method: 'POST', body: '{}' },
    ),

  getBillingHistory: (page = 1, perPage = 20) =>
    request<BillingHistory>(
      `/api/payment/billing-history?page=${page}&per_page=${perPage}`,
    ),

  checkPromotion: (code: string) =>
    request<{ eligible: boolean; promotion?: Promotion; error?: string }>(
      `/api/promotion/check-eligibility?code=${encodeURIComponent(code)}`,
    ),

  applyPromotion: (code: string) =>
    request<{
      message: string;
      discount_percent?: number;
      trial_end?: string;
    }>('/api/promotion/apply-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  createTopUpIntent: (amountCents: number, requestId: string) =>
    request<TopUpIntent>('/api/payment/create-top-up-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount_cents: amountCents,
        request_id: requestId,
      }),
    }),

  getCreditBalance: () =>
    request<{ wallet: CreditWallet }>('/api/payment/credit-balance'),

  getCreditHistory: (page = 1, perPage = 20) =>
    request<CreditHistory>(
      `/api/payment/credit-history?page=${page}&per_page=${perPage}`,
    ),
};
