import { Button, Message, Space, Typography } from '@arco-design/web-react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { BillingCycle, paymentApi, Plan, Subscription } from '../../data/payment/paymentApi';

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

  const price =
    billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

  const submit = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    setSubmitting(true);
    try {
      const result = await stripe.createPaymentMethod({
        type: 'card',
        card,
      });

      if (result.error || !result.paymentMethod) {
        throw new Error(result.error?.message || 'Unable to create payment method.');
      }

      const response = await paymentApi.createSubscription(
        plan.id,
        result.paymentMethod.id,
        billingCycle,
      );
      Message.success('Subscription created successfully.');
      onSuccess(response.subscription);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Payment setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-checkout">
      <Paragraph>
        Subscribe to <Text bold>{plan.name}</Text> for{' '}
        <Text bold>${price.toFixed(2)}</Text>/{billingCycle === 'monthly' ? 'month' : 'year'}.
      </Paragraph>
      <Paragraph type="secondary">
        Your card is securely collected by Stripe and never sent to Stimulize.
      </Paragraph>
      <div className="payment-card-element">
        <CardElement
          options={{
            hidePostalCode: false,
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
          disabled={!stripe}
          onClick={submit}
        >
          Start subscription
        </Button>
      </Space>
    </div>
  );
};

export default CheckoutForm;
