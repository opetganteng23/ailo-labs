import { CatalogAdminEdit } from "../../_catalog/CatalogAdminPages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CatalogAdminEdit kind="partners" id={id} />;
}
