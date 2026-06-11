import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ZINE — Culture Timeline";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * サイト全体のOGP画像。SNSでURLを共有したときに表示される。
 * 日本語フォントの埋め込みを避けるため、欧文のみで構成。
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#141310",
          color: "#e9e5da",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 64,
            right: 64,
            height: 2,
            background: "#2e2b24",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 64,
            right: 64,
            height: 2,
            background: "#2e2b24",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 18, color: "#6b655a" }}>
          CULTURE / TIMELINE / ARCHIVE
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 200,
            fontWeight: 700,
            letterSpacing: 36,
            marginTop: 8,
          }}
        >
          ZINE
        </div>
        <div
          style={{
            display: "flex",
            width: 120,
            height: 6,
            background: "#e2603f",
            marginTop: 16,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
