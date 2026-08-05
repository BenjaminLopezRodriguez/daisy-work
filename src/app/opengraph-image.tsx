import { ImageResponse } from "next/og";

export const alt =
  "Describe a job in plain words. Daisy writes the posting.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
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
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>
          Daisy.work
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 68, fontWeight: 600, lineHeight: 1.1 }}>
            Describe a job. Daisy writes the posting.
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#71717a" }}>
            You review and publish. People apply.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
