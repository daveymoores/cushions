type Props = {
  size?: number;
  filled?: boolean;
  className?: string;
  title?: string;
};

export function SealMark({size = 16, filled = false, className = '', title}: Props) {
  const stroke = filled ? 'none' : 'currentColor';
  const fill = filled ? 'currentColor' : 'none';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      fill="none"
    >
      {/* Eight-pointed star — two squares interlocked. A reduced rub-el-hizb,
          drawn at hanko-stamp simplicity. */}
      <path
        d="M12 2 L19.07 4.93 L22 12 L19.07 19.07 L12 22 L4.93 19.07 L2 12 L4.93 4.93 Z"
        stroke={stroke}
        fill={fill}
        strokeWidth="1"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M12 5 L17 7 L19 12 L17 17 L12 19 L7 17 L5 12 L7 7 Z"
        stroke={stroke}
        fill="none"
        strokeWidth="1"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
        opacity={filled ? 0.55 : 1}
      />
      <circle
        cx="12"
        cy="12"
        r="0.9"
        fill={filled ? 'var(--color-paper)' : 'currentColor'}
      />
    </svg>
  );
}
