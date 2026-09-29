import { redirect } from "next/navigation";

/** Adding a project now happens in the side panel on the Projects page. */
export default function AdminProjectNewPage() {
  redirect("/admin/projects?panel=new");
}
