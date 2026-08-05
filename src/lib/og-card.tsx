import { ImageResponse } from "next/og";

import { truncate } from "./share-meta";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * The share card every public detail route renders. Same frame as the root
 * opengraph-image, with the entity's own words in it — a shared link should
 * show what was shared, not a generic brand plate.
 */
export function ogCard({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fafafa",
        color: "#18181b",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex" }}>Daisy.work</div>
        <div style={{ display: "flex", color: "#71717a" }}>{eyebrow}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {truncate(title, 90)}
        </div>
        {meta ? (
          <div style={{ display: "flex", fontSize: 32, color: "#71717a" }}>
            {meta}
          </div>
        ) : null}
      </div>
    </div>,
    OG_SIZE,
  );
}
