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
    <section
      className="relative w-full overflow-hidden noise-overlay"
      style={{height: '88vh', minHeight: '520px'}}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover image-grade"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(28,26,22,0.65) 0%, rgba(28,26,22,0.32) 35%, rgba(28,26,22,0.08) 60%, rgba(28,26,22,0) 80%)',
        }}
      />
      <div className="absolute inset-0 flex items-end">
        <div className="container-page w-full pb-12 lg:pb-24">
          <div className="max-w-xl text-paper">
            <div
              aria-hidden="true"
              className="w-10 h-px bg-paper/60 mb-5"
            />
            <span className="eyebrow text-paper/80 block">{eyebrow}</span>
            <h2 className="display-h1 mt-5 text-paper">{heading}</h2>
            <div className="mt-8">
              <Link
                to={ctaTo}
                className="arrow-link text-paper"
                aria-label={ctaLabel}
              >
                <span>{ctaLabel}</span>
                <svg
                  viewBox="0 0 24 1"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="0.5"
                    x2="24"
                    y2="0.5"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
