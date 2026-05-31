import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {Container} from './Container';
import {UnderlineLink} from './UnderlineLink';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

const COLUMNS: {title: string; links: {to: string; label: string}[]}[] = [
  {
    title: 'House',
    links: [
      {to: '/atelier', label: 'The Atelier'},
      {to: '/journal', label: 'Journal'},
      {to: '/atelier', label: 'Commissions'},
      {to: '/atelier', label: 'Mending'},
    ],
  },
  {
    title: 'Care',
    links: [
      {to: '/journal', label: 'How we make'},
      {to: '/journal', label: 'Materials'},
      {to: '/journal', label: 'Repair & return'},
      {to: '/journal', label: 'Shipping'},
    ],
  },
  {
    title: 'Letters',
    links: [
      {to: '/account', label: 'Account'},
      {to: '/#newsletter', label: 'Newsletter'},
      {to: '/journal', label: 'Contact'},
      {to: '/journal', label: 'Press'},
    ],
  },
];

export function Footer() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const collections = rootData?.collections ?? [];

  // Shop column is driven by live Shopify collections; falls back to a link to
  // the collections index when none exist yet.
  const shopColumn = {
    title: 'Shop',
    links:
      collections.length > 0
        ? collections.slice(0, 4).map((c) => ({
            to: `/collections/${c.handle}`,
            label: c.title,
          }))
        : [{to: '/collections', label: 'All collections'}],
  };

  return (
    <footer className="bg-paper text-ink mt-32 border-t border-hairline">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 pt-20 pb-16">
          {[shopColumn, ...COLUMNS].map((col) => (
            <div key={col.title}>
              <Eyebrow className="block mb-6">{col.title}</Eyebrow>
              <ul className="space-y-3 text-[13px] font-light text-ash">
                {col.links.map((l) => (
                  <li key={l.label + l.to}>
                    <UnderlineLink to={l.to} className="text-ash hover:text-ink">
                      {l.label}
                    </UnderlineLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-hairline pt-12 pb-14 flex flex-col items-center text-center gap-5">
          <SealMark size={22} className="text-ink" />
          <div className="wordmark text-[20px] text-ink">
            Sisu
          </div>
          <p className="eyebrow text-ash max-w-[420px]">
            Heirloom cushions · sewn to order in north London
          </p>
          <p className="caption mt-2 text-stone">
            © {new Date().getFullYear()} Sisu. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
