import type {ReactNode} from 'react';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

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
    <section className="section-y bg-paper">
      <Container>
        <div className="max-w-xl">
          <SealMark size={14} className="text-ink/70 mb-6" />
          <Eyebrow className="block mb-5">{eyebrow}</Eyebrow>
          <h1 className="display-h1 text-ink">{title}</h1>
          <p className="mt-7 text-ash text-[14px] leading-[1.7] font-light">
            {body}
          </p>
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
