import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hi Phim - Xem Phim Online HD Miễn Phí #1 Việt Nam";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 88px",
          backgroundColor: "#06100b",
          backgroundImage:
            "radial-gradient(circle at 78% 42%, rgba(32, 214, 107, 0.22) 0%, rgba(6, 16, 11, 0) 38%), linear-gradient(135deg, #06100b 0%, #0a1b12 52%, #030705 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative grid lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 18px",
            borderRadius: "9999px",
            backgroundColor: "rgba(32, 214, 107, 0.15)",
            border: "1px solid rgba(32, 214, 107, 0.35)",
            color: "#20D66B",
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "26px",
          }}
        >
          KHO PHIM ONLINE CHẤT LƯỢNG CAO #1 VIỆT NAM
        </div>

        {/* Brand Logo & Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: "18px",
          }}
        >
          <span
            style={{
              fontSize: "76px",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "0.01em",
            }}
          >
            Hi
          </span>
          <span
            style={{
              fontSize: "76px",
              fontWeight: 900,
              color: "#20D66B",
              marginLeft: "12px",
              letterSpacing: "0.01em",
            }}
          >
            Phim
          </span>
        </div>

        {/* Slogan */}
        <div
          style={{
            fontSize: "25px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.75)",
            textAlign: "left",
            maxWidth: "820px",
            lineHeight: 1.4,
            marginBottom: "34px",
          }}
        >
          Xem Phim Bộ, Phim Lẻ, Chiếu Rạp & Anime Vietsub Miễn Phí Chuẩn Full HD / 4K
        </div>

        {/* Highlights Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            TỐC ĐỘ CAO 0.8s
          </div>
          <div
            style={{
              display: "flex",
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            50,000+ TẬP PHIM
          </div>
          <div
            style={{
              display: "flex",
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            KHÔNG QUẢNG CÁO
          </div>
        </div>

        {/* Footer domain */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            fontWeight: 700,
            color: "rgba(32, 214, 107, 0.8)",
            letterSpacing: "0.05em",
          }}
        >
          hiphim.biz
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
