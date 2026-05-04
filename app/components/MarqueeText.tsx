export function MarqueeText({items}: {items: string[]}) {
  // Duplicate the items so the loop seam is invisible.
  const sequence = [...items, ...items, ...items, ...items];
  return (
    <div className="marquee" aria-hidden="false">
      <div className="marquee-track">
        {sequence.map((item, i) => (
          <span
            key={i}
            className="eyebrow whitespace-nowrap text-cream/90 inline-flex items-center gap-14"
          >
            {item}
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
