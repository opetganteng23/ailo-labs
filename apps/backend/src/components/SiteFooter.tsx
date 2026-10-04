import Image from "next/image";
import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

const DEFAULT_CONTACT = {
  email: "ailo@telkomuniversity.ac.id",
  phone: "+62 22 756 4108",
  address: "Gedung TULT, Telkom University, Bandung, Jawa Barat",
};

type SocialLink = { key: "instagram" | "linkedin" | "youtube"; label: string };
const SOCIAL_LINKS: SocialLink[] = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

export async function SiteFooter() {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "global" }).lean<{
    contact?: { email?: string; phone?: string; address?: string };
    socialMedia?: { instagram?: string; linkedin?: string; youtube?: string };
  }>();

  const email = settings?.contact?.email || DEFAULT_CONTACT.email;
  const phone = settings?.contact?.phone || DEFAULT_CONTACT.phone;
  const address = settings?.contact?.address || DEFAULT_CONTACT.address;
  const addressLines = address.split(",").map((line) => line.trim()).filter(Boolean);

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Image src="/logo-horizontal.png" alt="AILO" width={160} height={40} style={{ height: 36, width: "auto" }} />
            <p>AI Learning For Optimization, a Center of Excellence under Telkom University, Bandung.</p>
          </div>
          <div className="foot-col">
            <h5>EXPLORE</h5>
            <ul>
              <li><Link href="/research">Research</Link></li>
              <li><Link href="/projects">Projects</Link></li>
              <li><Link href="/team">Team</Link></li>
              <li><Link href="/labs">Labs</Link></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>AILO</h5>
            <ul>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/#about">About</Link></li>
              <li><Link href="/join">Become a member</Link></li>
              <li><Link href="/labs">Ajukan peminjaman</Link></li>
            </ul>
          </div>
          <div className="foot-col">
            <h5>CONTACT</h5>
            <ul>
              <li><Link href="/contact">Contact form</Link></li>
              <li><a href={`mailto:${email}`}>{email}</a></li>
              <li><span>{phone}</span></li>
              {addressLines.length > 0 ? addressLines.map((line) => <li key={line}><span>{line}</span></li>) : <li><span>{address}</span></li>}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 AILO · Telkom University Center of Excellence</span>
          <div className="socials">
            {SOCIAL_LINKS.map(({ key, label }) => {
              const href = settings?.socialMedia?.[key];
              return href ? (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
              ) : (
                <span key={key} className="social-pending" title="Coming soon">{label}</span>
              );
            })}
            <Link href="/login" className="admin-link">Lecturer &amp; admin login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
