import Link from "next/link";

import { LabForm } from "../LabForm";

export default function AdminLabNewPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/labs" style={{ color: "#5b6664", fontWeight: 500 }}>
          Labs
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Add lab</span>
      </div>
      <LabForm mode="create" />
    </div>
  );
}
