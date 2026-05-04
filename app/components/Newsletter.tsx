import {Container} from './Container';
import {Eyebrow} from './Eyebrow';

export function Newsletter() {
  return (
    <section id="newsletter" className="bg-cream section-y">
      <Container>
        <div className="max-w-xl mx-auto text-center">
          <Eyebrow className="block mb-8">Letters</Eyebrow>
          <h2 className="font-serif font-light text-[36px] sm:text-[48px] lg:text-[56px] leading-[1] tracking-[-0.02em]">
            A quiet note,
            <br />
            <span className="italic-stone">once a season</span>
          </h2>
          <p className="mt-8 text-stone text-[14px] leading-relaxed font-light">
            New makings, mending notes, and small studio dispatches — sent
            sparingly, never sold.
          </p>
          <form
            className="mt-12 flex items-end gap-6 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="flex-1 text-left">
              <span className="eyebrow block mb-3">Email</span>
              <input
                type="email"
                required
                placeholder="you@yourhouse.com"
                className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[15px] font-light text-ink placeholder:text-stone/60 focus:outline-none focus:border-ink transition-colors"
              />
            </label>
            <button
              type="submit"
              className="eyebrow pb-2 border-b border-ink text-ink hover:text-stone transition-colors cursor-pointer whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
