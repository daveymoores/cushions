import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

const VALUES = [
  {
    eyebrow: 'i.',
    title: 'Deadstock fabric',
    body: 'Surplus rolls from the interiors industry, bought from EU suppliers and kept out of landfill.',
  },
  {
    eyebrow: 'ii.',
    title: 'Naturally limited',
    body: 'Each fabric run is finite. When a roll is used up, that design won’t be made again.',
  },
  {
    eyebrow: 'iii.',
    title: 'Sewn in Amsterdam',
    body: 'Cut and sewn in small batches, filled with feather inserts and finished by hand.',
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
