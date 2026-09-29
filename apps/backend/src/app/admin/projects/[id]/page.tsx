import { redirect } from "next/navigation";

/** Editing a project now happens in the side panel on the Projects page. */
export default async function AdminProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/projects?panel=edit&id=${id}`);
}
