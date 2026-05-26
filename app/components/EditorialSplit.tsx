import type {ReactNode} from 'react';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';
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
    <section className="section-y bg-paper">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-0">
          <div
            className={`lg:col-span-5 ${reverse ? 'lg:col-start-8' : 'lg:col-start-1'}`}
          >
            <div className="aspect-[4/5] overflow-hidden bg-bone">
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="lazy"
                className="w-full h-full object-cover image-grade"
              />
            </div>
          </div>
          <div
            className={`lg:col-span-6 flex flex-col lg:justify-end lg:pb-2 ${
              reverse ? 'lg:col-start-1 lg:row-start-1' : 'lg:col-start-7'
            }`}
          >
            <Eyebrow className="block mb-5">{eyebrow}</Eyebrow>
            <SealMark size={14} className="text-ink mb-5 opacity-80" />
            <h2 className="display-h2 text-ink max-w-md">{heading}</h2>
            <p className="mt-6 text-ash text-[14px] leading-[1.7] font-light max-w-md">
              {body}
            </p>
            <div className="mt-9">
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
