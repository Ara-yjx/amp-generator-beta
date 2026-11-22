import { Button, Message, Space, Typography } from '@arco-design/web-react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import BillingAddress, { BillingDetails } from './BillingAddress';
import TaxSummary from './TaxSummary';
import {
  BillingCycle,
  formatCents,
  paymentApi,
  Plan,
  Subscription,
  TaxPreview,
} from '../../data/payment/paymentApi';

const { Paragraph, Text } = Typography;

type CheckoutFormProps = {
  plan: Plan;
  billingCycle: BillingCycle;
  onSuccess: (subscription: Subscription) => void;
  onCancel: () => void;
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  plan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState<BillingDetails | null>(null);
  const [taxPreview, setTaxPreview] = useState<TaxPreview | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const price =
    billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

  useEffect(() => {
    if (!billing?.address) {
      setTaxPreview(null);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setTaxLoading(true);
      try {
        const preview = await paymentApi.previewTax({
          kind: 'subscription',
          plan_id: plan.id,
          billing_cycle: billingCycle,
          address: billing.address,
        });
        if (!cancelled) {
          setTaxPreview(preview);
        }
      } catch (error) {
        if (!cancelled) {
          setTaxPreview(null);
          Message.error(
            error instanceof Error
              ? error.message
              : 'Unable to calculate tax for this address.',
          );
        }
      } finally {
        if (!cancelled) {
          setTaxLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [billing, billingCycle, plan.id]);

  const submit = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card || !billing) return;

    setSubmitting(true);
    try {
      const result = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: {
          name: billing.name,
          address: billing.address,
        },
      });

      if (result.error || !result.paymentMethod) {
        throw new Error(result.error?.message || 'Unable to create payment method.');
      }

      const response = await paymentApi.createSubscription(
        plan.id,
        result.paymentMethod.id,
        billingCycle,
        billing.address,
      );
      Message.success('Subscription created successfully.');
      onSuccess(response.subscription);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Payment setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalLabel = taxPreview
    ? formatCents(taxPreview.total_cents, taxPreview.currency)
    : `$${price.toFixed(2)}`;

  return (
    <div className="payment-checkout">
      <Paragraph>
        Subscribe to <Text bold>{plan.name}</Text> for{' '}
        <Text bold>${price.toFixed(2)}</Text>/
        {billingCycle === 'monthly' ? 'month' : 'year'} plus tax.
      </Paragraph>
      <Paragraph type="secondary">
        Your card is securely collected by Stripe and never sent to Stimulize.
        Recurring invoices include sales tax for your billing address.
      </Paragraph>

      <BillingAddress onChange={setBilling} />
      <TaxSummary preview={taxPreview} loading={taxLoading} />

      <div className="payment-card-element">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: '#1d2129',
                fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
                fontSize: '16px',
                '::placeholder': { color: '#86909c' },
              },
              invalid: { color: '#f53f3f' },
            },
          }}
        />
      </div>
      <Space className="payment-checkout-actions">
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          loading={submitting}
          disabled={!stripe || !billing || taxLoading}
          onClick={submit}
        >
          Start subscription
          {taxPreview ? ` · ${totalLabel} after trial` : ''}
        </Button>
      </Space>
    </div>
  );
};

export default CheckoutForm;
