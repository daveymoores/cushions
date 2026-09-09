import {StubPage} from './StubPage';
import {UnderlineLink} from './UnderlineLink';

/**
 * The one not-found page. Rendered by the catch-all route (`app/routes/$.tsx`)
 * for a path nothing claims, and by the root `ErrorBoundary` for a 404 thrown
 * by a loader — so both read the same and both keep the site's chrome.
 */
export function NotFound() {
  return (
    <StubPage
      eyebrow="Not found"
      title={
        <>
          You’ve pulled <span className="italic-stone">the wrong thread</span>
        </>
      }
      body="There’s nothing at this address. The cushions are this way."
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 eyebrow text-ink/85">
        <UnderlineLink to="/collections/cushions">Shop cushions</UnderlineLink>
        <UnderlineLink to="/atelier">About Us</UnderlineLink>
      </div>
    </StubPage>
  );
}
