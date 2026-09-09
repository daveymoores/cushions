import {useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';

/**
 * How fast the announcements travel, in CSS pixels per second. The animation
 * duration is derived from this and the measured width of one repeat unit, so
 * the speed is the same whatever the merchant types into the announcement
 * field. A fixed duration made a longer list scroll faster.
 */
const TARGET_PX_PER_SECOND = 53;

/**
 * Copies rendered on the server, before anything can be measured. The CSS
 * fallbacks (`130s`, `50%`) animate these until hydration replaces both with
 * measured values, so the bar still scrolls without JS — drifting by a
 * fraction of one gap per cycle, which takes 130s to become visible at all.
 */
const SSR_COPIES = 8;

export function MarqueeText({items}: {items: string[]}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(SSR_COPIES);
  const [unitPx, setUnitPx] = useState(0);
  // `items` is a fresh array on every parent render, so key the effect on the
  // text itself rather than on the array identity.
  const itemCount = items.length;
  const itemsKey = items.join('\n');

  useEffect(() => {
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!track || !viewport) return;

    const measure = () => {
      // One repeat unit is the distance from the first span of a set to the
      // first span of the next, which includes the trailing gap whatever the
      // gap mechanism is — no arithmetic on scrollWidth, and no need to size
      // the spacing so a percentage translate lands on a whole unit. Always
      // measurable: the server renders SSR_COPIES sets.
      //
      // Read it from getBoundingClientRect, not offsetLeft: offsetLeft is
      // rounded to whole pixels, and translating by a rounded unit leaves the
      // seam a fraction of a pixel out on every wrap. Both rects carry the
      // same animating transform, so the difference between them is the
      // untransformed layout distance.
      const first = track.children[0] as HTMLElement | undefined;
      const nextSet = track.children[itemCount] as HTMLElement | undefined;
      if (!first || !nextSet) return;
      const unit =
        nextSet.getBoundingClientRect().left -
        first.getBoundingClientRect().left;
      // Hidden, or not laid out yet: leave the CSS fallback in place.
      if (unit <= 0) return;
      // The track has to stay full while it translates one whole unit, so it
      // needs a viewport plus a unit of content. `gap` puts no space after the
      // final span, so the track is only `copies * unit - gap` wide: +1 can
      // therefore fall a gap short and open a real blank at the seam. +2 is
      // the safe count, not decoration — don't trim it back.
      const needed = Math.ceil(viewport.clientWidth / unit) + 2;
      // Write only on a real change. Both setters re-render the track, and an
      // unconditional write would loop back through the ResizeObserver.
      setUnitPx((prev) => (prev === unit ? prev : unit));
      setCopies((prev) => (prev === needed ? prev : needed));
    };

    // Measuring in the fallback font gives the wrong unit, so wait for the
    // webfonts. `fonts.ready` only covers loads already in flight, hence the
    // `loadingdone` listener for a face that starts loading later.
    let cancelled = false;
    const observer = new ResizeObserver(measure);
    void document.fonts.ready.then(() => {
      // Observing the container, not the track: the container's width is the
      // bar's width and does not change when the copy count does.
      if (!cancelled) observer.observe(viewport);
    });
    document.fonts.addEventListener('loadingdone', measure);

    return () => {
      cancelled = true;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [itemCount, itemsKey]);

  const sequence = Array.from({length: copies}, () => items).flat();
  const measured =
    unitPx > 0
      ? ({
          '--marquee-unit': `${unitPx}px`,
          '--marquee-duration': `${(unitPx / TARGET_PX_PER_SECOND).toFixed(3)}s`,
        } as CSSProperties)
      : undefined;

  return (
    <>
      <ul className="sr-only" aria-label="Announcements">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track" ref={trackRef} style={measured}>
          {sequence.map((item, i) => (
            <span
              key={i}
              className="eyebrow whitespace-nowrap font-semibold text-paper/90 inline-flex items-center gap-14"
            >
              {item}
              <span className="opacity-50">·</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
