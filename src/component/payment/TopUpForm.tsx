import {
  Button,
  InputNumber,
  Message,
  Space,
  Typography,
} from '@arco-design/web-react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { usdToCredits } from '../../data/payment/creditDisplay';
import { paymentApi } from '../../data/payment/paymentApi';

const { Paragraph, Text } = Typography;
const PRESET_AMOUNTS = [10, 25, 50];

type TopUpFormProps = {
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
};

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `topup_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

type StripePaymentIntentLike = {
  status?: string;
  last_payment_error?: { message?: string } | null;
};

const confirmationErrorMessage = (
  error?: { message?: string; payment_intent?: StripePaymentIntentLike } | null,
  paymentIntent?: StripePaymentIntentLike | null,
) => {
  const intent = paymentIntent || error?.payment_intent;
  const lastError = intent?.last_payment_error?.message;
  if (error?.message) {
    return error.message;
  }
  if (lastError) {
    return lastError;
  }
  if (intent?.status === 'requires_payment_method') {
    return 'Card confirmation did not complete, so prepaid credits were not added. Check the card details and try again.';
  }
  if (intent?.status) {
    return `Payment is ${intent.status}.`;
  }
  return 'Stripe could not confirm payment.';
};

const TopUpForm: React.FC<TopUpFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState<number>(25);
  const [submitting, setSubmitting] = useState(false);

  const waitForWebhookSettlement = async (paymentIntentId: string) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const history = await paymentApi.getCreditHistory(1, 20);
      if (
        history.transactions.some(
          (transaction) =>
            transaction.stripe_payment_intent_id === paymentIntentId,
        )
      ) {
        return true;
      }
      await delay(1000);
    }
    return false;
  };

  const submit = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    const amountCents = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amountCents < 500 || amountCents > 50_000) {
      Message.warning(
        'Choose between 500 and 50,000 credits ($5.00–$500.00).',
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: 'card',
          card,
        });
      if (paymentMethodError || !paymentMethod) {
        throw new Error(
          paymentMethodError?.message || 'Unable to create payment method.',
        );
      }

      const intent = await paymentApi.createTopUpIntent(
        amountCents,
        createRequestId(),
      );
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethod.id,
        return_url: window.location.href,
      });

      if (result.error) {
        throw new Error(
          confirmationErrorMessage(result.error, result.paymentIntent),
        );
      }

      const status = result.paymentIntent?.status;
      if (status !== 'succeeded' && status !== 'processing') {
        throw new Error(confirmationErrorMessage(null, result.paymentIntent));
      }

      const settled = await waitForWebhookSettlement(intent.payment_intent_id);
      if (settled) {
        Message.success('AI credits added successfully.');
      } else {
        Message.info(
          'Payment succeeded. Stripe is still updating your credit balance.',
        );
      }
      await onSuccess();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : 'Top-up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-checkout">
      <Paragraph>
        Add prepaid AI credits. 100 credits = $1.00, charged in US dollars.
      </Paragraph>

      <Text bold>Credits to add</Text>
      <Space wrap className="topup-presets">
        {PRESET_AMOUNTS.map((preset) => (
          <Button
            key={preset}
            type={amount === preset ? 'primary' : 'secondary'}
            onClick={() => setAmount(preset)}
          >
            {usdToCredits(preset).toLocaleString()} credits
          </Button>
        ))}
        <InputNumber
          min={5}
          max={500}
          precision={2}
          prefix="$"
          value={amount}
          onChange={(value) => setAmount(Number(value || 0))}
          aria-label="Custom top-up amount in dollars"
        />
      </Space>
      <Paragraph type="secondary">
        {usdToCredits(amount).toLocaleString()} credits, charged as $
        {amount.toFixed(2)}.
      </Paragraph>

      <div className="payment-card-element">
        <CardElement
          options={{
            hidePostalCode: false,
            style: {
              base: {
                color: '#1d2129',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
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
          Pay ${amount.toFixed(2)} for {usdToCredits(amount).toLocaleString()}{' '}
          credits
        </Button>
      </Space>
    </div>
  );
};

export default TopUpForm;
