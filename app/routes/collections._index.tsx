import {redirect} from 'react-router';

/**
 * The store carries a single collection, so an index of collections reads as a
 * list of one. `/collections` redirects to it instead — the nav, the homepage
 * CTAs and any link already shared all land on the real page.
 *
 * 302, not 301: the index should come back if the store ever carries more than
 * one collection, and browsers cache a permanent redirect indefinitely. There
 * is no SEO equity to consolidate here — the URL has never been public.
 */
export async function loader() {
  throw redirect('/collections/cushions', 302);
}
