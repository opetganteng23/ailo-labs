import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site">
      <div className="row">
        <Link href="/" style={{ fontWeight: 700 }}>
          AILO
        </Link>
        <nav>
          <Link href="/research">Research</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/team">Team</Link>
          <Link href="/labs">Labs</Link>
          <Link href="/news">News</Link>
        </nav>
        <Link href="/admin/login" className="btn outline">
          Admin login
        </Link>
      </div>
    </header>
  );
}
