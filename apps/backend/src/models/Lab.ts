import { model, models, Schema } from "mongoose";

const labSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    location: String,
    capacity: Number,
    description: String,
    facilities: String,
    photos: { type: [String], default: [] },
    devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Lab = models.Lab || model("Lab", labSchema);
