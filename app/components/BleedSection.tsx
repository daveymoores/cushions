import type {ReactNode} from 'react';
import {Link} from 'react-router';

type Props = {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  heading: ReactNode;
  ctaLabel: string;
  ctaTo: string;
};

export function BleedSection({
  imageSrc,
  imageAlt,
  eyebrow,
  heading,
  ctaLabel,
  ctaTo,
}: Props) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full" style={{aspectRatio: '16 / 8'}}>
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div className="max-w-2xl text-cream">
            <span className="eyebrow text-cream/70">{eyebrow}</span>
            <h2 className="mt-6 font-serif font-light text-[40px] sm:text-[56px] lg:text-[68px] leading-[0.95] tracking-[-0.02em]">
              {heading}
            </h2>
            <div className="mt-10">
              <Link to={ctaTo} className="btn-bleed on-dark text-cream">
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
