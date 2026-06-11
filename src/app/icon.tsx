import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** アプリアイコン(PWA・ファビコン)。コードから生成するので画像ファイル不要 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141310",
          color: "#e9e5da",
          fontSize: 320,
          fontWeight: 700,
          borderBottom: "24px solid #e2603f",
        }}
      >
        Z
      </div>
    ),
    { ...size },
  );
}
