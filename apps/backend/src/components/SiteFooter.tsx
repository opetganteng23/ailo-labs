import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
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
              <li><a href="mailto:ailo@telkomuniversity.ac.id">ailo@telkomuniversity.ac.id</a></li>
              <li><span>+62 22 756 4108</span></li>
              <li><span>Gedung TULT, Telkom University</span></li>
              <li><span>Bandung, Jawa Barat</span></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 AILO · Telkom University Center of Excellence</span>
          <div className="socials">
            <span className="social-pending" title="Coming soon">Instagram</span>
            <span className="social-pending" title="Coming soon">LinkedIn</span>
            <span className="social-pending" title="Coming soon">YouTube</span>
            <Link href="/login" className="admin-link">Lecturer &amp; admin login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
