import type {Route} from './+types/atelier';
import {StubPage} from '~/components/StubPage';

export const meta: Route.MetaFunction = () => [
  {title: 'The Atelier — Maison Lévantine'},
];

export default function Atelier() {
  return (
    <StubPage
      eyebrow="By Appointment"
      title={
        <>
          The <span className="italic-stone">atelier</span>
        </>
      }
      body="A small north London studio where each cushion is cut, sewn, and finished by hand. Visits and commissions are accepted by appointment from spring."
    />
  );
}
