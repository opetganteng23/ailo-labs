import Image from "next/image";
import Link from "next/link";

import { BackButton } from "./BackButton";

/** Dark header for the Join and Booking flows: logo and a Back button only. */
export function MinimalSiteHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="minimal-header">
      <div className="wrap minimal-header-row">
        <Link href="/" className="minimal-header-brand">
          <Image src="/logo-horizontal.png" alt="AILO" width={200} height={75} priority style={{ height: 44, width: "auto" }} />
        </Link>
        <BackButton fallbackHref={backHref} />
      </div>
    </header>
  );
}
