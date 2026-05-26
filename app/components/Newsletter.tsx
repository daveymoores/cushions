import {useState} from 'react';
import {Container} from './Container';
import {Eyebrow} from './Eyebrow';
import {SealMark} from './SealMark';

export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="newsletter" className="bg-paper section-y">
      <Container>
        <div className="max-w-[420px] mx-auto text-center">
          {submitted ? (
            <div className="flex flex-col items-center">
              <SealMark size={20} filled className="text-clay mb-5" />
              <Eyebrow className="block mb-3">Thank you</Eyebrow>
              <p className="text-ash text-[14px] leading-[1.7] font-light">
                A quiet note will arrive when the next pieces are ready.
              </p>
            </div>
          ) : (
            <>
              <Eyebrow className="block mb-6">Letters</Eyebrow>
              <h2 className="display-h1 text-ink">
                be the first to know
              </h2>
              <p className="mt-6 text-ash text-[13px] leading-[1.7] font-light">
                New makings, mending notes, and small studio dispatches — sent
                sparingly, never sold.
              </p>
              <form
                className="mt-10 flex items-end gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label className="flex-1 text-left">
                  <span className="eyebrow block mb-3">Email</span>
                  <input
                    type="email"
                    required
                    placeholder="you@yourhouse.com"
                    className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[14px] font-light text-ink placeholder:text-stone/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </label>
                <button
                  type="submit"
                  className="eyebrow pb-2 border-b border-ink text-ink hover:text-clay transition-colors cursor-pointer whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
