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
        updatedBy: session.sub,
      },
    },
    { upsert: true },
  );
  revalidatePath("/admin/settings");
}
