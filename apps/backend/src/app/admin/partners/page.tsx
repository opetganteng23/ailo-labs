import { CatalogAdminList } from "../_catalog/CatalogAdminPages";

export const dynamic = "force-dynamic";

export default function Page() {
  return <CatalogAdminList kind="partners" />;
}
