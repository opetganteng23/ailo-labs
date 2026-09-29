import { redirect } from "next/navigation";

// The proxy already redirects bare /admin to /admin/dashboard, but this page
// exists as a fallback so the route never 404s even if that redirect is
// ever bypassed (e.g. a client-side navigation that skips the proxy).
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
