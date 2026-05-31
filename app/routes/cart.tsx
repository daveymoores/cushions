import type {Route} from './+types/cart';
import {StubPage} from '~/components/StubPage';
import {UnderlineLink} from '~/components/UnderlineLink';

export const meta: Route.MetaFunction = () => [
  {title: 'Cart — Sisu'},
];

export default function Cart() {
  return (
    <StubPage
      eyebrow="Cart"
      title={<>Your cart is empty</>}
      body="Hydrogen's cart provider will be wired up once the Shopify store is connected. Until then, this is a quiet placeholder."
    >
      <UnderlineLink
        to="/collections/the-atelier-collection"
        staticUnderline
        className="eyebrow text-ink"
      >
        Browse the collection
      </UnderlineLink>
    </StubPage>
  );
}
