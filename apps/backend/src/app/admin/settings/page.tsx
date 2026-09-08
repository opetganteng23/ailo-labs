import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "global" }).lean<{
    contact?: { email?: string; phone?: string; address?: string };
    socialMedia?: { instagram?: string; linkedin?: string; youtube?: string };
  }>();

  return (
    <div>
      <h1>Site Settings</h1>
      <form className="stack" action={updateSettingsAction} style={{ marginTop: 24 }}>
        <label>
          Contact email
          <input name="email" defaultValue={settings?.contact?.email ?? ""} />
        </label>
        <label>
          Contact phone
          <input name="phone" defaultValue={settings?.contact?.phone ?? ""} />
        </label>
        <label>
          Address
          <input name="address" defaultValue={settings?.contact?.address ?? ""} />
        </label>
        <label>
          Instagram URL
          <input name="instagram" defaultValue={settings?.socialMedia?.instagram ?? ""} />
        </label>
        <label>
          LinkedIn URL
          <input name="linkedin" defaultValue={settings?.socialMedia?.linkedin ?? ""} />
        </label>
        <label>
          YouTube URL
          <input name="youtube" defaultValue={settings?.socialMedia?.youtube ?? ""} />
        </label>
        <button type="submit" className="btn">
          Save
        </button>
      </form>
    </div>
  );
}
