import { ImageResponse } from "next/og";

// Branded fallback social-share image, generated at build/request time.
// Replaces the previously-referenced `/og-image.jpg`, which did not exist.
export const alt = "DreamTeam — AI Video Production";
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
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #db4e4e 0%, #6b3f9a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          DreamTeam
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          AI Video Production
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            fontWeight: 500,
            opacity: 0.92,
            maxWidth: 880,
          }}
        >
          High-impact AI-generated video for brands worldwide.
        </div>
      </div>
    ),
    { ...size }
  );
}
