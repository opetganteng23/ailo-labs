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

  const marqueeBold = formData.getAll("marqueeBold").map(String);
  const marqueeText = formData.getAll("marqueeText").map(String);
  const marqueeImage = formData.getAll("marqueeImage").map(String);
  const marqueeItems = marqueeBold
    .map((bold, i) => ({ bold, text: marqueeText[i] ?? "", image: marqueeImage[i] ?? "" }))
    .filter((item) => item.bold || item.text || item.image);

  await withFlash(
    async () => {
      await connectToDatabase();
      await SiteSettings.findOneAndUpdate(
        { key: "global" },
        {
          $set: {
            "about.title": formData.get("aboutTitle"),
            "about.body": formData.get("aboutBody"),
            "about.image": formData.get("aboutImage"),
            "contact.email": formData.get("email"),
            "contact.phone": formData.get("phone"),
            "contact.address": formData.get("address"),
            "contact.address2": formData.get("address2"),
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
            "homepage.marqueeItems": marqueeItems,
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
