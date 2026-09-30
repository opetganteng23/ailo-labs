import Image from "next/image";
import Link from "next/link";

import { BackButton } from "./BackButton";

/** Dark header for the Join and Booking flows: logo and a Back button only. */
export function MinimalSiteHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="minimal-header">
      <div className="wrap minimal-header-row">
        <Link href="/" className="minimal-header-brand">
          <span className="minimal-header-mark">
            <Image src="/logo-square.png" alt="AILO" width={28} height={28} style={{ objectFit: "contain" }} />
          </span>
          <span>AILO</span>
        </Link>
        <BackButton fallbackHref={backHref} />
      </div>
    </header>
  );
}
