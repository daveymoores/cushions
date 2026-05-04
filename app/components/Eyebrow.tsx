import type {ReactNode} from 'react';

export function Eyebrow({
  children,
  className = '',
  as: As = 'span',
}: {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div';
}) {
  return <As className={`eyebrow ${className}`}>{children}</As>;
}
