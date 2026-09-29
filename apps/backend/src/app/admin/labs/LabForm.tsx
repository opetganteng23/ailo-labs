"use client";

import { ImageUploadField } from "@/components/ImageUploadField";

import { createLabAction, updateLabAction } from "./actions";

type LabFormProps = {
  mode?: "create" | "edit";
  initial?: {
    _id: string;
    name: string;
    location?: string;
    capacity?: number;
    description?: string;
    facilities?: string;
    photo?: string;
  };
};

export function LabForm({ mode = "create", initial }: LabFormProps) {
  return (
    <form action={mode === "edit" ? updateLabAction : createLabAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section className="admin2-section">
            {mode === "create" && (
              <div className="admin2-field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" required maxLength={160} />
              </div>
            )}
            <div className="admin2-field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" defaultValue={initial?.location} />
            </div>
            <div className="admin2-field">
              <label htmlFor="capacity">Capacity</label>
              <input id="capacity" name="capacity" type="number" min={0} defaultValue={initial?.capacity} />
            </div>
            <div className="admin2-field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={3} defaultValue={initial?.description} />
            </div>
            <div className="admin2-field">
              <label htmlFor="facilities">Facilities / specification</label>
              <textarea id="facilities" name="facilities" rows={3} placeholder="e.g. 20x workstation, 4K projector, whiteboard wall" defaultValue={initial?.facilities} />
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Photo</h2>
            <ImageUploadField name="photo" label="" defaultValue={initial?.photo} />
          </section>

          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            {mode === "edit" ? "Save changes" : "Create lab"}
          </button>
        </div>
      </div>
    </form>
  );
}
