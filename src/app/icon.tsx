import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#2DD4BF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1E293B",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
