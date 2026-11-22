import { AddressElement } from '@stripe/react-stripe-js';
import { BillingAddress as BillingAddressPayload } from '../../data/payment/paymentApi';

export type BillingDetails = {
  name: string;
  address: BillingAddressPayload;
};

type BillingAddressProps = {
  onChange: (value: BillingDetails | null) => void;
};

const BillingAddress: React.FC<BillingAddressProps> = ({ onChange }) => (
  <div className="payment-address-element">
    <AddressElement
      options={{
        mode: 'billing',
        fields: { phone: 'never' },
      }}
      onChange={(event) => {
        if (!event.complete) {
          onChange(null);
          return;
        }
        const address = event.value.address;
        onChange({
          name: event.value.name,
          address: {
            line1: address.line1 || '',
            line2: address.line2 || '',
            city: address.city || '',
            state: address.state || '',
            postal_code: address.postal_code || '',
            country: address.country || '',
          },
        });
      }}
    />
  </div>
);

export default BillingAddress;
