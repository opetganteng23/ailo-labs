import Link from "next/link";

import { BackButton } from "./BackButton";

/** Dark header for the Join and Booking flows: white AILO wordmark and a Back button only. */
export function MinimalSiteHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="minimal-header">
      <div className="wrap minimal-header-row">
        <Link href="/" className="minimal-header-brand">
          <span>AILO</span>
        </Link>
        <BackButton fallbackHref={backHref} />
      </div>
    </header>
  );
}
