import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router';
import {Container} from './Container';
import {UnderlineLink} from './UnderlineLink';
import {SealMark} from './SealMark';

const PRIMARY_LINKS = [
  {to: '/collections/the-atelier-collection', label: 'Shop'},
  {to: '/journal', label: 'Journal'},
  {to: '/atelier', label: 'Atelier'},
];

const SECONDARY_LINKS = [
  {to: '/account', label: 'Account'},
  {to: '/cart', label: 'Cart', cartDot: true},
];

const COLLECTION_LINKS = [
  {to: '/collections/linen', label: 'Linen'},
  {to: '/collections/velvet', label: 'Velvet'},
  {to: '/collections/wool', label: 'Wool'},
  {to: '/collections/archive', label: 'Archive'},
];

export function Header() {
  const progressRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = progressRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
      el.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ESC to close + body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="relative bg-paper z-40">
      <Container as="div">
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '1fr auto 1fr',
            minHeight: 'var(--header-height)',
          }}
        >
          {/* Left: desktop nav, mobile hamburger */}
          <nav className="hidden md:flex items-center gap-7 eyebrow text-ink/85">
            {PRIMARY_LINKS.map((l) => (
              <UnderlineLink key={l.to} to={l.to} className="text-ink/85">
                {l.label}
              </UnderlineLink>
            ))}
          </nav>
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              className="-ml-2 p-2 inline-flex items-center justify-center"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Center: wordmark */}
          <Link
            to="/"
            className="wordmark text-[19px] sm:text-[24px] text-ink whitespace-nowrap"
            aria-label="Maison Lévantine"
          >
            Maison Lévantine
          </Link>

          {/* Right: account/cart on desktop, cart-only on mobile */}
          <nav className="flex items-center justify-end gap-5 sm:gap-7 eyebrow text-ink/85">
            <div className="hidden md:flex items-center gap-7">
              {SECONDARY_LINKS.map((l) => (
                <CartLink key={l.to} link={l} />
              ))}
            </div>
            <div className="md:hidden">
              <CartLink link={SECONDARY_LINKS[1]} />
            </div>
          </nav>
        </div>
      </Container>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-hairline"
      />
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-clay origin-left"
        style={{transform: 'scaleX(0)', willChange: 'transform'}}
      />

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function CartLink({link}: {link: (typeof SECONDARY_LINKS)[number]}) {
  const [hasItems] = useState(false);
  return (
    <UnderlineLink
      to={link.to}
      className="text-ink/85 inline-flex items-center gap-2"
    >
      <span>{link.label}</span>
      {link.cartDot && hasItems ? (
        <span
          aria-hidden="true"
          className="inline-block w-1 h-1 rounded-full bg-clay"
        />
      ) : null}
    </UnderlineLink>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-ink"
    >
      <line x1="3" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="3" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-ink"
    >
      <line x1="5" y1="5" x2="17" y2="17" stroke="currentColor" strokeWidth="1" />
      <line x1="17" y1="5" x2="5" y2="17" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id="mobile-nav-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 md:hidden bg-paper transition-opacity duration-500 ${
        open
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 border-b border-hairline" style={{minHeight: 'var(--header-height)'}}>
          <span className="wordmark text-[19px] text-ink">Maison Lévantine</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 p-2 inline-flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-10 pb-12">
          <div className="mb-10">
            <span className="eyebrow block mb-5">Browse</span>
            <ul className="space-y-5">
              {PRIMARY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="display-h2 text-ink block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-10">
            <span className="eyebrow block mb-5">By Material</span>
            <ul className="space-y-3">
              {COLLECTION_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="text-[15px] font-light text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="eyebrow block mb-5">Yours</span>
            <ul className="space-y-3">
              {SECONDARY_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={onClose}
                    className="text-[15px] font-light text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-hairline px-6 py-8 flex flex-col items-center gap-3">
          <SealMark size={18} className="text-ink/70" />
          <p className="caption text-ash text-center">
            Heirloom cushions, sewn to order in north London
          </p>
        </div>
      </div>
    </div>
  );
}
