import type {ReactNode} from 'react';

export function Container({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
}) {
  return <As className={`container-page ${className}`}>{children}</As>;
}
