export function MarqueeText({items}: {items: string[]}) {
  // Duplicate the items so the loop seam is invisible. The duplicates are
  // hidden from assistive technology so the announcements are read once.
  const sequence = [...items, ...items, ...items, ...items];
  return (
    <>
      <ul className="sr-only" aria-label="Announcements">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {sequence.map((item, i) => (
            <span
              key={i}
              className="eyebrow whitespace-nowrap text-cream/90 inline-flex items-center gap-14"
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
