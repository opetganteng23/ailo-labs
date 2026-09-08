"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export async function updateSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

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
        updatedBy: session.sub,
      },
    },
    { upsert: true },
  );
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
