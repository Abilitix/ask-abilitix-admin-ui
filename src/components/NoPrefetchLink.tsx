"use client";

import Link, { LinkProps } from "next/link";
import React from "react";

type Props = LinkProps & React.PropsWithChildren<{
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}>;

const NoPrefetchLink = React.forwardRef<HTMLAnchorElement, Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <Link ref={ref} prefetch={false} className={className} {...props}>
        {children}
      </Link>
    );
  }
);

NoPrefetchLink.displayName = "NoPrefetchLink";
export default NoPrefetchLink;
