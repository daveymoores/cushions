import type {Route} from './+types/account';
import {StubPage} from '~/components/StubPage';

export const meta: Route.MetaFunction = () => [
  {title: 'Account — Maison Lévantine'},
];

export default function Account() {
  return (
    <StubPage
      eyebrow="House"
      title={<>Your account</>}
      body="Account is wired up to Shopify Customer Accounts in a follow-up step. For now, this is a placeholder while we perfect the design."
    />
  );
}
