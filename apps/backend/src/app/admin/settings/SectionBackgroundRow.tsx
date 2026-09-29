"use client";

import { useState } from "react";

import { MultiImageUploadField } from "@/components/MultiImageUploadField";

export function SectionBackgroundRow({
  zone,
  label,
  images,
  opacity,
  isLast,
}: {
  zone: string;
  label: string;
  images?: string[];
  opacity?: number;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState(images ?? []);
  const [op, setOp] = useState(opacity ?? 88);

  return (
    <div style={{ borderBottom: isLast ? undefined : "1px solid #eeece6" }}>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 200px 90px", gap: 16, alignItems: "center", padding: "16px 24px" }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
        {urls.length > 0 ? (
          <div style={{ display: "flex", gap: 8 }}>
            {urls.slice(0, 3).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image thumbnail
              <img key={url} src={url} alt="" style={{ width: 64, height: 42, borderRadius: 8, objectFit: "cover" }} />
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 13, color: "#6b7573" }}>Plain background</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input aria-label={`${label} darken`} type="range" value={op} min={0} max={100} onChange={(e) => setOp(Number(e.target.value))} style={{ flexGrow: 1, accentColor: "#0e6b73", margin: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, width: 36 }}>{op}%</span>
        </div>
        <button type="button" className="admin2-btn outline" style={{ height: 38, fontSize: 13 }} onClick={() => setOpen((o) => !o)}>
          {urls.length > 0 ? "Manage" : "Add image"}
        </button>
      </div>
      {open && (
        <div style={{ padding: "0 24px 20px" }}>
          <MultiImageUploadField name={`${zone}BackgroundImages`} label="Images (add more than one to slide)" defaultValues={images} onChangeUrls={setUrls} />
        </div>
      )}
      <input type="hidden" name={`${zone}OverlayOpacity`} value={op} />
      {open ? null : urls.map((url) => <input key={url} type="hidden" name={`${zone}BackgroundImages`} value={url} />)}
    </div>
  );
}
