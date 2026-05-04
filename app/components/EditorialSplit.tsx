import type {ReactNode} from 'react';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {UnderlineLink} from './UnderlineLink';

type Props = {
  eyebrow: string;
  heading: ReactNode;
  body: string;
  ctaLabel: string;
  ctaTo: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
};

export function EditorialSplit({
  eyebrow,
  heading,
  body,
  ctaLabel,
  ctaTo,
  imageSrc,
  imageAlt,
  reverse = false,
}: Props) {
  return (
    <section className="section-y bg-cream">
      <Container>
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-center`}
        >
          <div
            className={`lg:col-span-7 ${reverse ? 'lg:order-2' : 'lg:order-1'}`}
          >
            <div className="aspect-[4/5] lg:aspect-[5/6] overflow-hidden bg-bone">
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div
            className={`lg:col-span-5 ${reverse ? 'lg:order-1' : 'lg:order-2'}`}
          >
            <Eyebrow className="mb-8 block">{eyebrow}</Eyebrow>
            <h2 className="font-serif font-light text-[44px] sm:text-[56px] lg:text-[64px] leading-[0.95] tracking-[-0.02em] text-ink">
              {heading}
            </h2>
            <p className="mt-8 text-stone text-[15px] leading-relaxed font-light max-w-md">
              {body}
            </p>
            <div className="mt-10">
              <UnderlineLink
                to={ctaTo}
                staticUnderline
                className="eyebrow text-ink"
              >
                {ctaLabel}
              </UnderlineLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
