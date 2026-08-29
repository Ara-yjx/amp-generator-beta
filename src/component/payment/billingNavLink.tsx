import { Link } from '@arco-design/web-react';
import { useContext } from 'react';
import { useHref, useMatch } from 'react-router';
import { AuthContext } from '../../context/AuthContext';

export default function BillingNavLink() {
  const { authState } = useContext(AuthContext);
  const billingHref = useHref('/billing');
  const isCloudEditorPage = useMatch('/exp/:expId?/edit');
  const target = isCloudEditorPage ? '_self' : '_blank';

  if (!authState) {
    return null;
  }

  return (
    <Link href={billingHref} target={target}>
      Plans &amp; billing
    </Link>
  );
}
