"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

const BACKGROUND_ZONES = ["hero", "research", "projects", "team", "news"];

export async function updateSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  const backgroundFields: Record<string, unknown> = {};
  for (const zone of BACKGROUND_ZONES) {
    backgroundFields[`homepage.${zone}BackgroundImages`] = formData.getAll(`${zone}BackgroundImages`);
    backgroundFields[`homepage.${zone}OverlayOpacity`] = Number(formData.get(`${zone}OverlayOpacity`) ?? 88);
  }

  await withFlash(
    async () => {
      await connectToDatabase();
      await SiteSettings.findOneAndUpdate(
        { key: "global" },
        {
          $set: {
            "contact.email": formData.get("email"),
            "contact.phone": formData.get("phone"),
            "contact.address": formData.get("address"),
            "socialMedia.instagram": formData.get("instagram"),
            "socialMedia.linkedin": formData.get("linkedin"),
            "socialMedia.youtube": formData.get("youtube"),
            "homepage.heroKicker": formData.get("heroKicker"),
            "homepage.heroTitle": formData.get("heroTitle"),
            "homepage.heroSubtitle": formData.get("heroSubtitle"),
            "homepage.ctaText": formData.get("ctaText"),
            "homepage.ctaLink": formData.get("ctaLink"),
            "homepage.secondaryCtaText": formData.get("secondaryCtaText"),
            "homepage.secondaryCtaLink": formData.get("secondaryCtaLink"),
            "homepage.stat1Value": formData.get("stat1Value"),
            "homepage.stat1Label": formData.get("stat1Label"),
            "homepage.stat2Value": formData.get("stat2Value"),
            "homepage.stat2Label": formData.get("stat2Label"),
            "homepage.stat3Value": formData.get("stat3Value"),
            "homepage.stat3Label": formData.get("stat3Label"),
            ...backgroundFields,
            updatedBy: session.sub,
          },
        },
        { upsert: true },
      );
    },
    { success: "Settings saved.", error: "Couldn't save the settings. Please try again." },
  );
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
