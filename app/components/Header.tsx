import {Link} from 'react-router';
import {Container} from './Container';
import {UnderlineLink} from './UnderlineLink';

const LEFT_LINKS = [
  {to: '/collections/the-atelier-collection', label: 'Shop'},
  {to: '/journal', label: 'Journal'},
  {to: '/atelier', label: 'Atelier'},
];

const RIGHT_LINKS = [
  {to: '/account', label: 'Account'},
  {to: '/cart', label: 'Cart'},
];

export function Header() {
  return (
    <header className="border-b border-hairline bg-cream">
      <Container
        as="div"
        className="grid items-center"
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '1fr auto 1fr',
            minHeight: 'var(--header-height)',
          }}
        >
          <nav className="hidden md:flex items-center gap-8 text-[12px] font-normal tracking-[0.18em] uppercase">
            {LEFT_LINKS.map((l) => (
              <UnderlineLink key={l.to} to={l.to}>
                {l.label}
              </UnderlineLink>
            ))}
          </nav>
          <div className="md:hidden">
            <UnderlineLink
              to="/collections/the-atelier-collection"
              className="text-[12px] tracking-[0.18em] uppercase"
            >
              Shop
            </UnderlineLink>
          </div>
          <Link
            to="/"
            className="font-serif text-[22px] sm:text-[26px] tracking-[0.18em] uppercase font-light text-ink whitespace-nowrap"
            aria-label="Maison Lévantine"
          >
            Maison Lévantine
          </Link>
          <nav className="flex items-center justify-end gap-8 text-[12px] font-normal tracking-[0.18em] uppercase">
            {RIGHT_LINKS.map((l) => (
              <UnderlineLink key={l.to} to={l.to}>
                {l.label}
              </UnderlineLink>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}
