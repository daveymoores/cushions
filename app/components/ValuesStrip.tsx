import {Container} from './Container';
import {Eyebrow} from './Eyebrow';

const VALUES = [
  {
    eyebrow: 'i.',
    title: 'Sewn to order',
    body: 'Each piece is cut and finished only after you place your commission. Nothing kept on a shelf.',
  },
  {
    eyebrow: 'ii.',
    title: 'Repaired for life',
    body: 'Send it back when it tires. We mend, re-line, or re-fill — for as long as the cushion is yours.',
  },
  {
    eyebrow: 'iii.',
    title: 'Slowly made',
    body: 'Small batches, single-loom cloth, and a patient pace. We release new pieces twice a year.',
  },
];

export function ValuesStrip() {
  return (
    <section className="bg-bone section-y">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-14 md:gap-x-16">
          {VALUES.map((v) => (
            <article key={v.title} className="border-t border-hairline pt-8">
              <Eyebrow className="block mb-6 italic-stone">{v.eyebrow}</Eyebrow>
              <h3 className="font-serif font-light text-[28px] sm:text-[32px] tracking-[-0.02em] leading-[0.95]">
                {v.title}
              </h3>
              <p className="mt-5 text-stone text-[14px] leading-relaxed font-light max-w-sm">
                {v.body}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
