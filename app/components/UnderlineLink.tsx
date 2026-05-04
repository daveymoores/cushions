import {Link, type LinkProps} from 'react-router';
import type {ReactNode} from 'react';

type Props = Omit<LinkProps, 'children'> & {
  children: ReactNode;
  className?: string;
  staticUnderline?: boolean;
};

export function UnderlineLink({
  children,
  className = '',
  staticUnderline = false,
  ...rest
}: Props) {
  return (
    <Link
      className={`underline-link ${staticUnderline ? 'is-static' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
