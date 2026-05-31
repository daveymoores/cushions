import type {Route} from './+types/account';
import {StubPage} from '~/components/StubPage';
import {routeMeta, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

export async function loader({request}: Route.LoaderArgs) {
  return {seo: basicSeo({title: 'Account', request, noIndex: true})};
}

export default function Account() {
  return (
    <StubPage
      eyebrow="House"
      title={<>Your account</>}
      body="Account is wired up to Shopify Customer Accounts in a follow-up step. For now, this is a placeholder while we perfect the design."
    />
  );
}
