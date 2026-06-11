import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 112,
          fontWeight: 700,
          borderBottom: "10px solid #e2603f",
        }}
      >
        Z
      </div>
    ),
    { ...size },
  );
}
