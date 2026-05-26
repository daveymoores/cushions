import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

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
    <section className="bg-cream section-y">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-hairline">
          {VALUES.map((v, i) => (
            <article
              key={v.title}
              className={`px-0 ${
                i > 0 ? 'pt-12 md:pt-0 md:pl-14' : 'md:pr-14'
              } ${i < VALUES.length - 1 ? 'md:pr-14' : ''}`}
            >
              <SealMark size={14} className="text-ink/70 mb-6" />
              <Eyebrow className="block mb-4">
                <span className="italic-stone">{v.eyebrow}</span>
              </Eyebrow>
              <h3 className="display-h2 text-ink">{v.title}</h3>
              <p className="mt-4 text-ash text-[14px] leading-[1.7] font-light max-w-sm">
                {v.body}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
