import Image from "next/image";
import Link from "next/link";

import { BackButton } from "./BackButton";

/** Dark header for the Join and Booking flows: logo and a Back button only. */
export function MinimalSiteHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="minimal-header">
      <div className="wrap minimal-header-row">
        <Link href="/" className="minimal-header-brand">
          <Image src="/logo-telkomu.png" alt="Telkom University" width={120} height={120} style={{ height: 34, width: "auto" }} />
          <span className="brand-divider" />
          <Image src="/logo-horizontal-white.png" alt="AILO" width={140} height={44} priority style={{ height: 40, width: "auto" }} />
        </Link>
        <BackButton fallbackHref={backHref} />
      </div>
    </header>
  );
}
