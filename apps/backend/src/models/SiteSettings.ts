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
      /** Optional second office/campus address, shown side by side with the first in the footer. */
      address2: String,
      officeHours: String,
    },
    socialMedia: {
      instagram: String,
      linkedin: String,
      youtube: String,
      twitter: String,
    },
    about: {
      title: String,
      /** Plain text; a blank line starts a new paragraph. */
      body: String,
      image: String,
    },
    footer: {
      copyrightText: String,
      quickLinks: [{ label: String, href: String }],
    },
    homepage: {
      heroBackgroundImages: { type: [String], default: [] },
      heroOverlayOpacity: { type: Number, default: 88 },
      researchBackgroundImages: { type: [String], default: [] },
      researchOverlayOpacity: { type: Number, default: 88 },
      projectsBackgroundImages: { type: [String], default: [] },
      projectsOverlayOpacity: { type: Number, default: 88 },
      teamBackgroundImages: { type: [String], default: [] },
      teamOverlayOpacity: { type: Number, default: 88 },
      newsBackgroundImages: { type: [String], default: [] },
      newsOverlayOpacity: { type: Number, default: 88 },
      heroKicker: String,
      heroTitle: String,
      heroSubtitle: String,
      ctaText: String,
      ctaLink: String,
      secondaryCtaText: String,
      secondaryCtaLink: String,
      stat1Value: String,
      stat1Label: String,
      stat2Value: String,
      stat2Label: String,
      stat3Value: String,
      stat3Label: String,
      visibleSections: [String],
      /** The scrolling strip under the hero ("Optimization · Reinforcement Learning · ..."). Each item is either text (bold + text) or an uploaded image. */
      marqueeItems: [{ bold: String, text: String, image: String }],
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
      knowledgeSources: {
        type: [String],
        default: ["news", "research", "project", "team", "lab"],
      },
      provider: {
        type: String,
        enum: ["openai", "anthropic", "gemini", "custom"],
        default: "openai",
      },
      apiKeyEncrypted: String,
      apiKeyLast4: String,
      baseUrl: String,
      chatModel: String,
      embeddingModel: String,
      temperature: { type: Number, default: 0.3 },
      maxTokens: { type: Number, default: 800 },
      topK: { type: Number, default: 5 },
      systemPrompt: {
        type: String,
        default:
          "Kamu adalah asisten virtual CoE AILO Telkom University. Jawab dengan bahasa yang sopan dan ringkas, hanya berdasarkan knowledge yang tersedia. Jika tidak tahu, katakan tidak tahu dan arahkan pengguna ke halaman kontak.",
      },
      fallbackReply: {
        type: String,
        default: "Maaf, saya belum punya informasi tentang itu. Silakan hubungi kami lewat halaman Kontak.",
      },
      monthlyTokenBudget: Number,
      perVisitorDailyLimit: { type: Number, default: 20 },
      tokensUsedThisMonth: { type: Number, default: 0 },
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
