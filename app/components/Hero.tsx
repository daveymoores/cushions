import {useEffect, useState} from 'react';
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

const STAGGER_KEY = 'maison-hero-staggered';

export function Hero({imageSrc, imageAlt, eyebrow, heading, ctaLabel, ctaTo}: Props) {
  const [skipAnim, setSkipAnim] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STAGGER_KEY) === '1') {
      setSkipAnim(true);
      return;
    }
    sessionStorage.setItem(STAGGER_KEY, '1');
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden noise-overlay"
      style={{height: '85vh', minHeight: '480px'}}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover image-grade"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(28,26,22,0.62) 0%, rgba(28,26,22,0.32) 30%, rgba(28,26,22,0.08) 55%, rgba(28,26,22,0) 75%)',
        }}
      />
      <div className="absolute inset-0 flex items-end">
        <div className="container-page w-full pb-12 lg:pb-24">
          <div className="max-w-xl text-paper">
            <span
              className="eyebrow stagger-rise block text-paper/80"
              data-no-animate={skipAnim || undefined}
              style={{animationDelay: '60ms'}}
            >
              {eyebrow}
            </span>
            <h1
              className="display-h1 mt-5 stagger-rise"
              data-no-animate={skipAnim || undefined}
              style={{animationDelay: '160ms'}}
            >
              {heading}
            </h1>
            <div
              className="mt-8 stagger-rise"
              data-no-animate={skipAnim || undefined}
              style={{animationDelay: '260ms'}}
            >
              <Link
                to={ctaTo}
                className="arrow-link text-paper"
                aria-label={ctaLabel}
              >
                <span>{ctaLabel}</span>
                <svg viewBox="0 0 24 1" preserveAspectRatio="none" aria-hidden="true">
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
