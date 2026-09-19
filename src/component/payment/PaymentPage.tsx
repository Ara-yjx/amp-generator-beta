import {
  Alert,
  Button,
  Card,
  Empty,
  Grid,
  Input,
  Message,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CheckoutForm from './CheckoutForm';
import TopUpForm from './TopUpForm';
import {
  BillingCycle,
  BillingHistory,
  CreditHistory,
  CreditWallet,
  paymentApi,
  Plan,
  Subscription,
} from '../../data/payment/paymentApi';
import './payment.css';

const { Row, Col } = Grid;
const { Title, Paragraph, Text } = Typography;

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value))
    : '—';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const formatCreditAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);

const PaymentPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<BillingHistory | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditHistory | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const [
        loadedPlans,
        subscriptionResponse,
        billingHistory,
        balanceResponse,
        loadedCreditHistory,
      ] =
        await Promise.all([
          paymentApi.getPlans(),
          paymentApi.getSubscription(),
          paymentApi.getBillingHistory(),
          paymentApi.getCreditBalance(),
          paymentApi.getCreditHistory(),
        ]);
      setPlans(loadedPlans);
      setSubscription(subscriptionResponse.subscription);
      setHistory(billingHistory);
      setWallet(balanceResponse.wallet);
      setCreditHistory(loadedCreditHistory);
      if (subscriptionResponse.subscription?.billing_cycle) {
        setBillingCycle(subscriptionResponse.subscription.billing_cycle);
      }
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Unable to load billing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const currentPlanId = subscription?.plan?.id;
  const hasLiveSubscription =
    !!subscription && ['active', 'trialing', 'past_due'].includes(subscription.status);

  const choosePlan = async (plan: Plan) => {
    if (!hasLiveSubscription) {
      if (!stripeKey) {
        Message.error('Stripe publishable key is not configured.');
        return;
      }
      setCheckoutPlan(plan);
      return;
    }

    if (plan.id === currentPlanId && billingCycle === subscription?.billing_cycle) {
      Message.info('This is already your current plan.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await paymentApi.changePlan(plan.id, billingCycle);
      setSubscription(response.subscription);
      Message.success(`Plan changed to ${plan.name}.`);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Unable to change plan.');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await paymentApi.cancelSubscription();
      setSubscription(response.subscription);
      Message.success(response.message);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Unable to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    setActionLoading(true);
    try {
      const response = await paymentApi.reactivateSubscription();
      setSubscription(response.subscription);
      Message.success(response.message);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Unable to reactivate.');
    } finally {
      setActionLoading(false);
    }
  };

  const applyPromotion = async () => {
    const code = promoCode.trim();
    if (!code) {
      Message.warning('Enter a promotion code.');
      return;
    }

    setActionLoading(true);
    try {
      const eligibility = await paymentApi.checkPromotion(code);
      if (!eligibility.eligible) {
        throw new Error(eligibility.error || 'This code is not eligible.');
      }
      const result = await paymentApi.applyPromotion(code);
      Message.success(result.message);
      setPromoCode('');
      await loadBilling();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Unable to apply code.');
    } finally {
      setActionLoading(false);
    }
  };

  const historyColumns = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'created_at',
        render: (value: string) => formatDate(value),
      },
      {
        title: 'Invoice',
        dataIndex: 'stripe_invoice_id',
        render: (value: string | null) => value || '—',
      },
      {
        title: 'Amount',
        render: (_: unknown, record: BillingHistory['payments'][number]) =>
          formatMoney(record.amount, record.currency),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (value: string) => (
          <Tag color={value === 'succeeded' ? 'green' : value === 'failed' ? 'red' : 'orange'}>
            {value}
          </Tag>
        ),
      },
    ],
    [],
  );

  const creditHistoryColumns = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'created_at',
        render: (value: string) => formatDate(value),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        render: (value: string | null) => value || 'AI credit transaction',
      },
      {
        title: 'Amount',
        render: (_: unknown, record: CreditHistory['transactions'][number]) => (
          <Text
            style={{
              color:
                record.amount_micros >= 0
                  ? 'rgb(var(--green-6))'
                  : 'rgb(var(--red-6))',
            }}
          >
            {record.amount_micros >= 0 ? '+' : ''}
            {formatCreditAmount(record.amount, record.currency)}
          </Text>
        ),
      },
      {
        title: 'Balance after',
        render: (_: unknown, record: CreditHistory['transactions'][number]) =>
          formatCreditAmount(record.balance_after, record.currency),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (value: string) => <Tag color="green">{value}</Tag>,
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="payment-loading">
        <Spin size={32} tip="Loading billing information…" />
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-hero">
        <Title heading={2}>Plans & billing</Title>
        <Paragraph>Manage your subscription, promotions, and payment history.</Paragraph>
      </div>

      {!stripeKey && (
        <Alert
          type="warning"
          content="Set REACT_APP_STRIPE_PUBLISHABLE_KEY before accepting card details."
          className="payment-alert"
        />
      )}

      <Card className="payment-section credit-balance-card">
        <Row gutter={24} align="center">
          <Col xs={24} md={16}>
            <Text type="secondary">Prepaid AI credit balance</Text>
            <div className="credit-balance-value">
              {formatCreditAmount(
                wallet?.balance || 0,
                wallet?.currency || 'usd',
              )}
            </div>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Add funds now for future token-based chatbot usage.
            </Paragraph>
          </Col>
          <Col xs={24} md={8} className="payment-current-actions">
            <Button
              type="primary"
              size="large"
              disabled={!stripeKey}
              onClick={() => setTopUpVisible(true)}
            >
              Add funds
            </Button>
          </Col>
        </Row>
      </Card>

      {subscription && (
        <Card title="Current subscription" className="payment-section">
          <Row gutter={24} align="center">
            <Col xs={24} md={14}>
              <Space direction="vertical" align="start">
                <Space>
                  <Title heading={5} style={{ margin: 0 }}>
                    {subscription.plan?.name || 'Subscription'}
                  </Title>
                  <Tag color={subscription.status === 'active' ? 'green' : 'arcoblue'}>
                    {subscription.status}
                  </Tag>
                </Space>
                <Text>
                  {subscription.status === 'trialing'
                    ? `Trial ends ${formatDate(subscription.trial_end)}`
                    : `Current period ends ${formatDate(subscription.current_period_end)}`}
                </Text>
                {subscription.cancel_at_period_end && (
                  <Alert
                    type="warning"
                    content={`Cancellation is scheduled for ${formatDate(
                      subscription.current_period_end,
                    )}.`}
                  />
                )}
              </Space>
            </Col>
            <Col xs={24} md={10} className="payment-current-actions">
              {subscription.cancel_at_period_end ? (
                <Button
                  type="primary"
                  loading={actionLoading}
                  onClick={reactivateSubscription}
                >
                  Keep subscription
                </Button>
              ) : (
                <Popconfirm
                  title="Cancel at the end of the current billing period?"
                  onOk={cancelSubscription}
                >
                  <Button status="danger" loading={actionLoading}>
                    Cancel subscription
                  </Button>
                </Popconfirm>
              )}
            </Col>
          </Row>
        </Card>
      )}

      <section className="payment-section">
        <div className="payment-section-heading">
          <div>
            <Title heading={4}>Choose a plan</Title>
            <Paragraph>Change plans at any time. Stripe calculates prorations.</Paragraph>
          </div>
          <Radio.Group
            type="button"
            value={billingCycle}
            onChange={setBillingCycle}
            options={[
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />
        </div>

        <Row gutter={[20, 20]}>
          {plans.map((plan) => {
            const price =
              billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const isCurrent =
              plan.id === currentPlanId && billingCycle === subscription?.billing_cycle;

            return (
              <Col xs={24} md={8} key={plan.id}>
                <Card
                  className={`payment-plan-card ${isCurrent ? 'is-current' : ''}`}
                  title={
                    <Space>
                      <span>{plan.name}</span>
                      {isCurrent && <Tag color="green">Current</Tag>}
                    </Space>
                  }
                >
                  <div className="payment-price">
                    <span>${price.toFixed(2)}</span>
                    <small>/{billingCycle === 'monthly' ? 'month' : 'year'}</small>
                  </div>
                  <ul className="payment-features">
                    <li>{plan.max_projects < 0 ? 'Unlimited' : plan.max_projects} projects</li>
                    <li>
                      {plan.max_experiments < 0 ? 'Unlimited' : plan.max_experiments}{' '}
                      experiments
                    </li>
                    <li>{plan.storage_gb} GB storage</li>
                  </ul>
                  <Button
                    long
                    type={isCurrent ? 'secondary' : 'primary'}
                    disabled={isCurrent}
                    loading={actionLoading}
                    onClick={() => choosePlan(plan)}
                  >
                    {isCurrent
                      ? 'Current plan'
                      : hasLiveSubscription
                        ? 'Switch plan'
                        : 'Choose plan'}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      </section>

      {subscription && (
        <Card title="Promotion code" className="payment-section">
          <Space className="payment-promo">
            <Input
              value={promoCode}
              onChange={setPromoCode}
              onPressEnter={applyPromotion}
              placeholder="Enter promotion code"
              allowClear
            />
            <Button type="primary" loading={actionLoading} onClick={applyPromotion}>
              Apply
            </Button>
          </Space>
        </Card>
      )}

      <Card title="AI credit history" className="payment-section">
        {creditHistory?.transactions.length ? (
          <Table
            rowKey="id"
            columns={creditHistoryColumns}
            data={creditHistory.transactions}
            pagination={{
              total: creditHistory.total,
              pageSize: creditHistory.per_page,
              current: creditHistory.page,
              onChange: async (page) => {
                try {
                  setCreditHistory(
                    await paymentApi.getCreditHistory(
                      page,
                      creditHistory.per_page,
                    ),
                  );
                } catch (error) {
                  Message.error(
                    error instanceof Error
                      ? error.message
                      : 'Unable to load credit history.',
                  );
                }
              },
            }}
          />
        ) : (
          <Empty description="No AI credit transactions yet." />
        )}
      </Card>

      <Card title="Billing history" className="payment-section">
        {history?.payments.length ? (
          <Table
            rowKey="id"
            columns={historyColumns}
            data={history.payments}
            pagination={{
              total: history.total,
              pageSize: history.per_page,
              current: history.page,
              onChange: async (page) => {
                try {
                  setHistory(await paymentApi.getBillingHistory(page, history.per_page));
                } catch (error) {
                  Message.error(
                    error instanceof Error ? error.message : 'Unable to load payment history.',
                  );
                }
              },
            }}
          />
        ) : (
          <Empty description="No payments recorded yet." />
        )}
      </Card>

      <Modal
        visible={topUpVisible}
        title="Add prepaid AI credits"
        footer={null}
        unmountOnExit
        onCancel={() => setTopUpVisible(false)}
      >
        {topUpVisible && stripePromise && (
          <Elements stripe={stripePromise}>
            <TopUpForm
              onCancel={() => setTopUpVisible(false)}
              onSuccess={async () => {
                setTopUpVisible(false);
                await loadBilling();
              }}
            />
          </Elements>
        )}
      </Modal>

      <Modal
        visible={!!checkoutPlan}
        title="Secure checkout"
        footer={null}
        unmountOnExit
        onCancel={() => setCheckoutPlan(null)}
      >
        {checkoutPlan && stripePromise && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              plan={checkoutPlan}
              billingCycle={billingCycle}
              onCancel={() => setCheckoutPlan(null)}
              onSuccess={(createdSubscription) => {
                setSubscription(createdSubscription);
                setCheckoutPlan(null);
                loadBilling();
              }}
            />
          </Elements>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPage;
