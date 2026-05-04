import {Container} from './Container';
import {UnderlineLink} from './UnderlineLink';
import {Eyebrow} from './Eyebrow';

const COLUMNS: {title: string; links: {to: string; label: string}[]}[] = [
  {
    title: 'Shop',
    links: [
      {to: '/collections/linen', label: 'Linen'},
      {to: '/collections/velvet', label: 'Velvet'},
      {to: '/collections/wool', label: 'Wool'},
      {to: '/collections/archive', label: 'Archive'},
    ],
  },
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
  return (
    <footer className="bg-ink text-cream/85 mt-32">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 pt-24 pb-20">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <Eyebrow className="text-cream/55 block mb-6">
                {col.title}
              </Eyebrow>
              <ul className="space-y-3 font-light text-[14px]">
                {col.links.map((l) => (
                  <li key={l.label + l.to}>
                    <UnderlineLink to={l.to} className="text-cream/85">
                      {l.label}
                    </UnderlineLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-cream/15 pt-10 pb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="font-serif text-[44px] md:text-[64px] leading-[0.95] tracking-[-0.02em] font-light text-cream">
            Maison
            <br />
            <span className="italic text-cream/70">Lévantine</span>
          </div>
          <div className="text-[12px] text-cream/55 leading-relaxed font-light max-w-md">
            <p>
              Heirloom cushions, sewn to order in north London. Each piece is
              repaired for life.
            </p>
            <p className="mt-3">
              © {new Date().getFullYear()} Maison Lévantine. All rights
              reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
