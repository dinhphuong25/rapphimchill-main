import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hi Phim - Xem Phim Online HD Miễn Phí";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#050807",
        backgroundImage:
          "radial-gradient(circle at 80% 42%, rgba(32, 214, 107, 0.2) 0%, rgba(5, 8, 7, 0) 36%), linear-gradient(120deg, #050807 0%, #0c1d14 58%, #06100b 100%)",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "56px",
          top: "42px",
          width: "52px",
          height: "4px",
          backgroundColor: "#20D66B",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "58%",
          padding: "24px 32px 24px 56px",
          zIndex: 2,
        }}
      >
        <span
          style={{
            color: "#20D66B",
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "22px",
          }}
        >
          Xem phim theo cách của bạn
        </span>

        <div style={{ display: "flex", alignItems: "baseline", marginBottom: "18px" }}>
          <span style={{ fontSize: "92px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>
            Hi
          </span>
          <span style={{ fontSize: "92px", fontWeight: 900, color: "#20D66B", marginLeft: "14px", letterSpacing: "-0.04em", lineHeight: 1 }}>
            Phim
          </span>
        </div>

        <span
          style={{
            fontSize: "27px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.78)",
            lineHeight: 1.35,
            maxWidth: "560px",
            marginBottom: "30px",
          }}
        >
          Phim bộ, phim lẻ, chiếu rạp và anime Vietsub miễn phí.
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 700 }}>FULL HD / 4K</span>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#20D66B" }} />
          <span style={{ color: "rgba(255, 255, 255, 0.62)", fontSize: "17px", fontWeight: 600 }}>Cập nhật mỗi ngày</span>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "42%",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "32px",
            top: "52px",
            width: "250px",
            height: "470px",
            border: "1px solid rgba(32, 214, 107, 0.35)",
            backgroundColor: "rgba(4, 12, 8, 0.72)",
            transform: "rotate(7deg)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "250px",
            height: "470px",
            padding: "28px",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            backgroundImage:
              "linear-gradient(145deg, rgba(32, 214, 107, 0.45), rgba(3, 8, 5, 0.92) 48%, rgba(11, 40, 23, 0.96))",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.68)", fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em" }}>
            <span>HP</span>
            <span>01</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ width: "64px", height: "64px", border: "2px solid #20D66B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#20D66B", fontSize: "26px", fontWeight: 900 }}>
              +
            </div>
            <span style={{ color: "#FFFFFF", fontSize: "28px", fontWeight: 800, lineHeight: 1.1 }}>
              Điện ảnh<br />mỗi ngày
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "rgba(255,255,255,0.62)", fontSize: "14px", fontWeight: 600 }}>
            <span>PHIM MỚI</span>
            <span style={{ color: "#20D66B" }}>hiphim.biz</span>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: "56px", bottom: "28px", fontSize: "16px", fontWeight: 700, color: "rgba(32, 214, 107, 0.8)", letterSpacing: "0.05em" }}>
        hiphim.biz
      </div>
    </div>,
    { ...size }
  );
}
