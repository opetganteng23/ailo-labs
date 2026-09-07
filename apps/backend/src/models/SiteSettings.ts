import { model, models, Schema } from "mongoose";

const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    branding: {
      logo: String,
      favicon: String,
      siteName: String,
      tagline: String,
    },
    theme: {
      primaryColor: String,
      secondaryColor: String,
      font: { type: String, default: "Poppins" },
    },
    contact: {
      email: String,
      phone: String,
      address: String,
      officeHours: String,
    },
    socialMedia: {
      instagram: String,
      linkedin: String,
      youtube: String,
      twitter: String,
    },
    footer: {
      copyrightText: String,
      quickLinks: [{ label: String, href: String }],
    },
    homepage: {
      heroTitle: String,
      heroSubtitle: String,
      ctaText: String,
      ctaLink: String,
      visibleSections: [String],
    },
    seo: {
      defaultMetaTitle: String,
      defaultMetaDescription: String,
      ogImage: String,
    },
    chatbot: {
      isEnabled: { type: Boolean, default: true },
      welcomeMessage: String,
      widgetColor: String,
    },
    featureToggles: {
      booking: { type: Boolean, default: true },
      newsAI: { type: Boolean, default: false },
      tts: { type: Boolean, default: true },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false },
);

export const SiteSettings =
  models.SiteSettings || model("SiteSettings", siteSettingsSchema);
