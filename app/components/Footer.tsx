import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import type {NavColumn, NavLink} from '~/lib/nav';
import {Container} from './Container';
import {UnderlineLink} from './UnderlineLink';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

/**
 * The footer's link columns render the merchant's Shopify `footer` menu, one
 * level of nesting deep. These are the columns used when that menu can't give
 * us any — query failure, a deleted or renamed menu, or (the state it is in
 * today) a *flat* menu, where no item has children and so no item describes a
 * column. Every destination below is a route or page that exists.
 */
const FALLBACK_COLUMNS: NavColumn[] = [
  {
    id: 'fallback-house',
    title: 'House',
    links: [
      {
        id: 'fallback-about',
        to: '/atelier',
        label: 'About Us',
        external: false,
      },
      {
        id: 'fallback-journal',
        to: '/journal',
        label: 'Journal',
        external: false,
      },
      {
        id: 'fallback-process',
        to: '/journal/how-a-sisu-cushion-is-made',
        label: 'The Process',
        external: false,
      },
    ],
  },
  {
    id: 'fallback-care',
    title: 'Care',
    links: [
      {
        id: 'fallback-fabrics',
        to: '/materials',
        label: 'Fabrics',
        external: false,
      },
      {
        id: 'fallback-delivery',
        to: '/pages/shipping',
        label: 'Delivery',
        external: false,
      },
      {
        id: 'fallback-returns',
        to: '/pages/returns',
        label: 'Returns',
        external: false,
      },
    ],
  },
  {
    id: 'fallback-letters',
    title: 'Letters',
    links: [
      {
        id: 'fallback-contact',
        to: '/pages/contact',
        label: 'Contact',
        external: false,
      },
      {id: 'fallback-faq', to: '/pages/faq', label: 'FAQ', external: false},
    ],
  },
  {
    id: 'fallback-legal',
    title: 'Legal',
    links: [
      {
        id: 'fallback-privacy',
        to: '/policies/privacy-policy',
        label: 'Privacy Policy',
        external: false,
      },
      {
        id: 'fallback-contact-info',
        to: '/policies/contact-information',
        label: 'Contact Information',
        external: false,
      },
    ],
  },
];

export function Footer() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const collections = rootData?.collections ?? [];
  const menuColumns = rootData?.footerMenu ?? [];

  // Shop column is driven by live Shopify collections, not by the menu: with a
  // single collection a merchant-authored Shop column would add nothing, and a
  // mistyped handle would break it silently. Falls back to a link to the
  // collections index when no collection is visible yet.
  const shopColumn: NavColumn = {
    id: 'shop',
    title: 'Shop',
    links:
      collections.length > 0
        ? collections.slice(0, 4).map((c) => ({
            id: c.id,
            to: `/collections/${c.handle}`,
            label: c.title,
            external: false,
          }))
        : [
            {
              id: 'all-collections',
              to: '/collections',
              label: 'All collections',
              external: false,
            },
          ],
  };

  const columns = menuColumns.length > 0 ? menuColumns : FALLBACK_COLUMNS;

  return (
    <footer className="bg-paper text-ink mt-32 border-t border-hairline">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 pt-20 pb-16">
          {[shopColumn, ...columns].map((col) => (
            <div key={col.id}>
              <Eyebrow className="block mb-6">{col.title}</Eyebrow>
              <ul className="space-y-3 text-[13px] font-light text-ash">
                {col.links.map((l) => (
                  <li key={l.id}>
                    <FooterLink link={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-hairline pt-12 pb-14 flex flex-col items-center text-center gap-5">
          <SealMark size={22} className="text-ink" />
          <div className="wordmark text-[28px] text-ink">
            Sisu
          </div>
          <p className="eyebrow text-ash max-w-[420px]">
            Cushions made from deadstock fabric · sewn in Amsterdam
          </p>
          <p className="caption mt-2 text-stone">
            © {new Date().getFullYear()} Sisu. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}

/**
 * A menu item can point off-site, and React Router's `<Link>` is for in-app
 * routes only — an external item renders as a plain anchor instead, with
 * `rel="noreferrer"` so this site isn't named in the outbound referrer.
 */
function FooterLink({link}: {link: NavLink}) {
  if (link.external) {
    return (
      <a
        href={link.to}
        rel="noreferrer"
        className="underline-link text-ash hover:text-ink"
      >
        {link.label}
      </a>
    );
  }
  return (
    <UnderlineLink to={link.to} className="text-ash hover:text-ink">
      {link.label}
    </UnderlineLink>
  );
}
