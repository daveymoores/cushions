import type {ReactNode} from 'react';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';

export function StubPage({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  children?: ReactNode;
}) {
  return (
    <section className="section-y bg-cream">
      <Container>
        <div className="max-w-xl">
          <Eyebrow className="block mb-8">{eyebrow}</Eyebrow>
          <h1 className="font-serif font-light text-[52px] sm:text-[72px] leading-[0.95] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-8 text-stone text-[15px] leading-relaxed font-light">
            {body}
          </p>
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
