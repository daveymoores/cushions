import type {Route} from './+types/journal';
import {StubPage} from '~/components/StubPage';

export const meta: Route.MetaFunction = () => [
  {title: 'Journal — Sisu'},
];

export default function Journal() {
  return (
    <StubPage
      eyebrow="House Notes"
      title={
        <>
          The <span className="italic-stone">journal</span>
        </>
      }
      body="Quiet dispatches from the atelier — on materials, mending, and the slow work of making cushions one at a time. Coming soon."
    />
  );
}
