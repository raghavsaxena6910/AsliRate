import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 share card: logo, eyebrow, big title, footer line. */
export async function ogCard({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }) {
  const fontDir = join(process.cwd(), "node_modules/@fontsource/schibsted-grotesk/files");
  const [logo, regular, heavy] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/aslirate-mark.png")),
    readFile(join(fontDir, "schibsted-grotesk-latin-500-normal.woff")),
    readFile(join(fontDir, "schibsted-grotesk-latin-800-normal.woff")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const size = title.length > 80 ? 52 : title.length > 55 ? 60 : 70;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          fontFamily: "Schibsted Grotesk",
          padding: "64px 72px",
          borderBottom: "18px solid #087a37",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={64} height={64} alt="" />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: "#0f1f17" }}>Asli</span>
            <span style={{ color: "#087a37" }}>Rate</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#087a37", textTransform: "uppercase", letterSpacing: 2 }}>
            {eyebrow}
          </div>
          <div style={{ display: "flex", fontSize: size, fontWeight: 800, color: "#0f1f17", lineHeight: 1.08, letterSpacing: -1.5 }}>
            {title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#3f4f47" }}>{footer}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Schibsted Grotesk", data: regular, weight: 500, style: "normal" },
        { name: "Schibsted Grotesk", data: heavy, weight: 800, style: "normal" },
      ],
    },
  );
}
