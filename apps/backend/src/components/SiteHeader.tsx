import Image from "next/image";
import Link from "next/link";

import { BackButton } from "./BackButton";

/**
 * Header for pages reached from the homepage (lists, details, contact…): just
 * the logo and a Back button, since the full navigation lives on the homepage.
 */
export function SiteHeader({ backHref = "/", backLabel = "Back" }: { backHref?: string; backLabel?: string }) {
  return (
    <header className="site site-back">
      <div className="row">
        <Link href="/" className="brand" aria-label="AILO home">
          <Image src="/logo-telkomu.png" alt="Telkom University" width={120} height={120} style={{ height: 34, width: "auto" }} />
          <span className="brand-divider" />
          <Image src="/logo-horizontal.png" alt="AILO" width={200} height={50} priority style={{ height: 40, width: "auto" }} />
        </Link>
        <BackButton fallbackHref={backHref} label={backLabel} />
      </div>
    </header>
  );
}
