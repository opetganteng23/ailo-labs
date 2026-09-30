import { model, models, Schema } from "mongoose";

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    isRead: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    repliedAt: Date,
    // Every reply sent from the admin, shown as a timeline under the message.
    replies: [
      {
        body: { type: String, required: true },
        sentAt: { type: Date, required: true },
        sentBy: String,
        to: String,
      },
    ],
  },
  { timestamps: true },
);

export const ContactMessage =
  models.ContactMessage || model("ContactMessage", contactMessageSchema);
