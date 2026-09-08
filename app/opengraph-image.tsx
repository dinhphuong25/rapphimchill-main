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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050807",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(32, 214, 107, 0.18) 0%, rgba(5, 8, 7, 0.95) 70%)",
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
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 24px",
            borderRadius: "9999px",
            backgroundColor: "rgba(32, 214, 107, 0.15)",
            border: "1px solid rgba(32, 214, 107, 0.35)",
            color: "#20D66B",
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "28px",
          }}
        >
          🎬 KHO PHIM ONLINE CHẤT LƯỢNG CAO #1 VIỆT NAM
        </div>

        {/* Brand Logo & Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "76px",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Hi
          </span>
          <span
            style={{
              fontSize: "76px",
              fontWeight: 900,
              color: "#20D66B",
              marginLeft: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Phim
          </span>
        </div>

        {/* Slogan */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.75)",
            textAlign: "center",
            maxWidth: "850px",
            lineHeight: 1.4,
            marginBottom: "36px",
          }}
        >
          Xem Phim Bộ, Phim Lẻ, Chiếu Rạp & Anime Vietsub Miễn Phí Chuẩn Full HD / 4K
        </div>

        {/* Highlights Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            ⚡ Tốc Độ Cao 0.8s
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            ✨ 50,000+ Tập Phim
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            🍿 Không Quảng Cáo
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
