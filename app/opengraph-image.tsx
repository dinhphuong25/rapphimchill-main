import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hi Phim - Xem Phim Online HD Miễn Phí";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#030705",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(32, 214, 107, 0.22) 0%, rgba(3, 7, 5, 0) 45%), radial-gradient(circle at 85% 50%, rgba(32, 214, 107, 0.25) 0%, rgba(16, 185, 129, 0.08) 35%, rgba(3, 7, 5, 0) 65%), linear-gradient(135deg, #030705 0%, #08150e 50%, #030705 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern background */}
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

        {/* Top neon accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(32, 214, 107, 0.3) 20%, #20D66B 50%, rgba(32, 214, 107, 0.3) 80%, transparent 100%)",
          }}
        />

        {/* Bottom subtle glow border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: "rgba(32, 214, 107, 0.2)",
          }}
        />

        {/* Left Column: Branding, Slogan & Value Props */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "58%",
            padding: "54px 32px 50px 64px",
          }}
        >
          {/* Top block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Pill badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "rgba(32, 214, 107, 0.12)",
                border: "1px solid rgba(32, 214, 107, 0.38)",
                alignSelf: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#20D66B",
                }}
              />
              <span
                style={{
                  color: "#20D66B",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Trải nghiệm rạp chiếu phim tại gia
              </span>
            </div>

            {/* Brand Logo & Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "76px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
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
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  textShadow: "0 0 35px rgba(32, 214, 107, 0.5)",
                }}
              >
                Phim
              </span>
              <div
                style={{
                  marginLeft: "14px",
                  padding: "4px 9px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "0.06em",
                }}
              >
                4K HDR
              </div>
            </div>

            {/* Main Slogan */}
            <span
              style={{
                fontSize: "34px",
                fontWeight: 800,
                color: "#F0FDF4",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                marginBottom: "16px",
              }}
            >
              Xem Phim Online HD Miễn Phí
            </span>

            {/* Sub-description */}
            <span
              style={{
                fontSize: "19px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.72)",
                lineHeight: 1.45,
                maxWidth: "540px",
              }}
            >
              Kho 50,000+ phim bộ, phim lẻ chiếu rạp và anime Vietsub chất lượng cao hoàn toàn miễn phí.
            </span>
          </div>

          {/* Feature Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#20D66B" }} />
              <span>Ultra HD 4K</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#20D66B" }} />
              <span>Vietsub & Thuyết Minh</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#20D66B" }} />
              <span>Tốc Độ Siêu Tốc</span>
            </div>
          </div>

          {/* Bottom domain bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: "#20D66B",
                boxShadow: "0 0 10px #20D66B",
              }}
            />
            <span
              style={{
                fontSize: "19px",
                fontWeight: 800,
                color: "#20D66B",
                letterSpacing: "0.04em",
              }}
            >
              hiphim.biz
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.35)", fontSize: "14px" }}>•</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Cập nhật phim mới mỗi ngày
            </span>
          </div>
        </div>

        {/* Right Column: Cinematic Card Showcase */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42%",
            padding: "44px 56px 44px 16px",
          }}
        >
          {/* Cinema Glassmorphic Card */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "370px",
              height: "490px",
              padding: "30px",
              borderRadius: "26px",
              backgroundColor: "rgba(6, 17, 11, 0.88)",
              border: "1.5px solid rgba(32, 214, 107, 0.4)",
              backgroundImage:
                "linear-gradient(155deg, rgba(32, 214, 107, 0.22) 0%, rgba(5, 14, 9, 0.95) 45%, rgba(12, 36, 22, 0.9) 100%)",
              boxShadow:
                "0 26px 60px rgba(0, 0, 0, 0.65), 0 0 45px rgba(32, 214, 107, 0.15)",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    color: "#20D66B",
                    fontSize: "13px",
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                  }}
                >
                  HI PHIM CINEMA
                </span>
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(32, 214, 107, 0.16)",
                  border: "1px solid rgba(32, 214, 107, 0.45)",
                  color: "#20D66B",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                TOP TRENDING
              </div>
            </div>

            {/* Center Glowing Neon Play Button & Call to Action */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 0",
              }}
            >
              {/* Glowing outer circle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "112px",
                  height: "112px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(32, 214, 107, 0.12)",
                  border: "2px solid rgba(32, 214, 107, 0.5)",
                  boxShadow: "0 0 35px rgba(32, 214, 107, 0.45)",
                  marginBottom: "18px",
                }}
              >
                {/* Inner button with Play triangle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundImage:
                      "linear-gradient(135deg, #20D66B 0%, #10b981 100%)",
                    boxShadow: "0 10px 24px rgba(32, 214, 107, 0.6)",
                  }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginLeft: "4px" }}
                  >
                    <path
                      d="M5 3L19 12L5 21V3Z"
                      fill="#030705"
                    />
                  </svg>
                </div>
              </div>

              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: "21px",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  marginBottom: "6px",
                  textAlign: "center",
                }}
              >
                Khám Phá Điện Ảnh
              </span>

              <span
                style={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Hàng ngàn giờ xem phim không giới hạn
              </span>
            </div>

            {/* Card Footer: Metrics Grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                width: "100%",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      color: "#FFFFFF",
                      fontSize: "20px",
                      fontWeight: 900,
                      lineHeight: 1.1,
                    }}
                  >
                    50,000+
                  </span>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Bộ Phim
                  </span>
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "28px",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#20D66B">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span
                      style={{
                        color: "#20D66B",
                        fontSize: "20px",
                        fontWeight: 900,
                        lineHeight: 1.1,
                      }}
                    >
                      9.8/10
                    </span>
                  </div>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Đánh Giá
                  </span>
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "28px",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      color: "#FFFFFF",
                      fontSize: "20px",
                      fontWeight: 900,
                      lineHeight: 1.1,
                    }}
                  >
                    100%
                  </span>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Miễn Phí
                  </span>
                </div>
              </div>

              {/* Genre Pills */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                <span>Chiếu Rạp</span>
                <span>•</span>
                <span>Hàn Quốc</span>
                <span>•</span>
                <span>Anime</span>
                <span>•</span>
                <span>Âu Mỹ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
