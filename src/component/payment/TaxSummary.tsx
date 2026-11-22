import { Spin, Typography } from '@arco-design/web-react';
import { formatCents, TaxPreview } from '../../data/payment/paymentApi';

const { Text } = Typography;

type TaxSummaryProps = {
  preview: TaxPreview | null;
  loading?: boolean;
};

const TaxSummary: React.FC<TaxSummaryProps> = ({ preview, loading }) => {
  if (loading && !preview) {
    return (
      <div className="payment-tax-summary">
        <Spin size={16} />
        <Text type="secondary"> Calculating tax…</Text>
      </div>
    );
  }

  if (!preview) {
    return (
      <Text type="secondary" className="payment-tax-note">
        Enter your billing address to see tax before you pay.
      </Text>
    );
  }

  return (
    <div className="payment-tax-summary">
      <div className="payment-tax-row">
        <Text type="secondary">Subtotal</Text>
        <Text>{formatCents(preview.subtotal_cents, preview.currency)}</Text>
      </div>
      <div className="payment-tax-row">
        <Text type="secondary">Tax</Text>
        <Text>
          {preview.tax_cents === 0
            ? 'None for this address'
            : formatCents(preview.tax_cents, preview.currency)}
        </Text>
      </div>
      <div className="payment-tax-row payment-tax-total">
        <Text>Total</Text>
        <Text>{formatCents(preview.total_cents, preview.currency)}</Text>
      </div>
    </div>
  );
};

export default TaxSummary;
