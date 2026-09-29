import Image from "next/image";
import Link from "next/link";

/** The dark, minimal header used on the Join and Booking flows (not the full site nav). */
export function MinimalSiteHeader({ rightLabel, rightHref }: { rightLabel: string; rightHref: string }) {
  return (
    <header className="minimal-header">
      <div className="wrap minimal-header-row">
        <Link href="/" className="minimal-header-brand">
          <Image src="/logo-icon.png" alt="AILO" width={24} height={24} />
          <span>AILO</span>
        </Link>
        <Link href="/" className="minimal-header-back">
          Back to site
        </Link>
        <Link href={rightHref} className="minimal-header-cta">
          {rightLabel}
        </Link>
      </div>
    </header>
  );
}
