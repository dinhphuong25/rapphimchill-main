"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedSidebarIconProps {
  className?: string;
  size?: number;
  isHovered?: boolean;
  isActive?: boolean;
}

/**
 * 1. Home Icon (Trang Chủ) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Nóc nhà cam ấm, tường xanh ngọc, khói ống khói bốc lên mượt mà bằng CSS Compositor.
 */
export const AnimatedHomeIcon = memo(function AnimatedHomeIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Ống khói */}
        <path d="M18 10V5h-2v3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Làn khói bay lượn GPU Composited */}
        <g className="anim-smoke">
          <circle cx="17" cy="3" r="1" fill="#cbd5e1" />
          <circle cx="18" cy="1.2" r="0.75" fill="#cbd5e1" />
        </g>

        {/* Thân nhà màu xanh da trời trong trẻo */}
        <path
          d="M4 10.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.5"
          fill="#38bdf8"
          fillOpacity="0.25"
          stroke="#38bdf8"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Mái ngói đỏ cam rực rỡ */}
        <path
          d="M2.5 10.5 12 2.5l9.5 8"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cửa chính vàng ấm tỏa sáng */}
        <rect
          x="9.5"
          y="13"
          width="5"
          height="8"
          rx="1"
          fill="#facc15"
          stroke="#d97706"
          strokeWidth="1.5"
          className="anim-shine"
        />
        {/* Tay nắm cửa */}
        <circle cx="13" cy="17" r="0.6" fill="#78350f" />
      </svg>
    </div>
  );
});

/**
 * 2. Clapperboard Icon (Chiếu Rạp) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Cần dập mở lên gõ nhịp liên tục bằng CSS Compositor, sao Hollywood vàng lấp lánh.
 */
export const AnimatedClapperboardIcon = memo(function AnimatedClapperboardIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Thân bảng clapperboard màu đen tím rạp chiếu */}
        <rect
          x="3"
          y="8"
          width="18"
          height="13"
          rx="2"
          fill="#1e1b4b"
          fillOpacity="0.8"
          stroke="#818cf8"
          strokeWidth="1.75"
        />

        {/* Ngôi sao vàng Hollywood lấp lánh ở trung tâm */}
        <g className="anim-sparkle" style={{ transformOrigin: "12px 14.5px" }}>
          <path
            d="m12 11.5 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"
            fill="#facc15"
            stroke="#eab308"
            strokeWidth="0.5"
          />
        </g>

        {/* Cần dập bên trên - chuyển động gõ nhịp liên tục GPU */}
        <g className="anim-clapper">
          <path
            d="M3 8V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3Z"
            fill="#e11d48"
            stroke="#f43f5e"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Các vạch sọc trắng xiên của cần dập clapper */}
          <line x1="7" y1="4" x2="5" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="4" x2="9" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="4" x2="13" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="4" x2="17" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 3. TV Icon (Phim Bộ) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * 2 ăng-ten dao động sóng, màn hình xanh cyan với nút play đập nhịp liên tục.
 */
export const AnimatedTvIcon = memo(function AnimatedTvIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Râu ăng-ten trái dao động sóng */}
        <line
          x1="12"
          y1="7"
          x2="7.5"
          y2="2"
          stroke="#facc15"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="anim-antenna-left"
        />
        {/* Râu ăng-ten phải dao động sóng */}
        <line
          x1="12"
          y1="7"
          x2="16.5"
          y2="2"
          stroke="#facc15"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="anim-antenna-right"
        />

        {/* Khung TV màu tím neon */}
        <rect
          x="2.5"
          y="7"
          width="19"
          height="14"
          rx="2.5"
          fill="#2e1065"
          stroke="#a855f7"
          strokeWidth="1.75"
        />

        {/* Màn hình TV màu xanh cyan */}
        <rect
          x="4.5"
          y="9"
          width="12"
          height="10"
          rx="1.5"
          fill="#0284c7"
          fillOpacity="0.4"
          stroke="#38bdf8"
          strokeWidth="1"
        />

        {/* Nút Play xanh lá nhấp nhô đập nhịp */}
        <path
          d="m9 11.5 4 2.5-4 2.5z"
          fill="#22c55e"
          stroke="#4ade80"
          strokeWidth="1"
          strokeLinejoin="round"
          className="anim-heart"
          style={{ transformOrigin: "11px 14px" }}
        />

        {/* Núm vặn kênh tivi bên phải */}
        <circle cx="18.5" cy="11.5" r="1.25" fill="#facc15" />
        <circle cx="18.5" cy="15.5" r="1.25" fill="#facc15" />
      </svg>
    </div>
  );
});

/**
 * 4. Film Icon (Phim Lẻ / Cinema) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Cuộn phim kim loại vàng xoay tròn 360 độ liên tục hoàn toàn trên GPU.
 */
export const AnimatedFilmIcon = memo(function AnimatedFilmIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        <g className="anim-spin-slow" style={{ transformOrigin: "12px 12px" }}>
          {/* Viền cuộn phim tròn màu vàng đồng */}
          <circle cx="12" cy="12" r="9.5" fill="#78350f" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.75" />
          {/* Tâm trục cuộn phim màu vàng kim */}
          <circle cx="12" cy="12" r="3.5" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="1.5" fill="#78350f" />

          {/* 4 lỗ băng phim tròn xoay quanh trục */}
          <circle cx="12" cy="6" r="1.5" fill="#fde047" stroke="#b45309" strokeWidth="0.75" />
          <circle cx="12" cy="18" r="1.5" fill="#fde047" stroke="#b45309" strokeWidth="0.75" />
          <circle cx="6" cy="12" r="1.5" fill="#fde047" stroke="#b45309" strokeWidth="0.75" />
          <circle cx="18" cy="12" r="1.5" fill="#fde047" stroke="#b45309" strokeWidth="0.75" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 5. Cat Icon (Anime / Hoạt Hình) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Mèo may mắn Anime nghiêng đầu, chớp mắt tự nhiên trên GPU Compositor.
 */
export const AnimatedCatIcon = memo(function AnimatedCatIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Nhóm đầu cử động nghiêng đầu GPU */}
        <g className="anim-cat-head">
          {/* Tai mèo bên trái và phải với tai trong màu hồng */}
          <path d="M4 11 7 3l4.5 3.5" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 9 7.5 5 10 7.5" fill="#fda4af" />

          <path d="M20 11 17 3l-4.5 3.5" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M18 9 16.5 5 14 7.5" fill="#fda4af" />

          {/* Khuôn mặt mèo tròn bầu bĩnh màu cam vàng */}
          <circle cx="12" cy="13.5" r="7.5" fill="#ffedd5" stroke="#f97316" strokeWidth="1.75" />

          {/* Mắt to tròn anime chớp mắt tự nhiên GPU */}
          <ellipse cx="9" cy="13" rx="1.2" ry="1.6" fill="#1e1b4b" className="anim-cat-blink" style={{ transformOrigin: "9px 13px" }} />
          <ellipse cx="15" cy="13" rx="1.2" ry="1.6" fill="#1e1b4b" className="anim-cat-blink" style={{ transformOrigin: "15px 13px" }} />

          {/* Chấm má hồng hào phong cách Flaticon */}
          <circle cx="7" cy="15" r="1.2" fill="#fda4af" />
          <circle cx="17" cy="15" r="1.2" fill="#fda4af" />

          {/* Mũi tam giác nhỏ màu hồng và miệng cười mèo */}
          <polygon points="12,14.5 11.2,15.5 12.8,15.5" fill="#f43f5e" />
          <path d="M10.5 16.5c.8.6 1.5.3 1.5 0 .0.3.7.6 1.5 0" stroke="#c2410c" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 6. Refresh / Sync Circle Icon (Mới Cập Nhật) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * 2 mũi tên vòng cung đa sắc (lam ngọc & vàng neon) xoay tròn 360 độ liên tục,
 * tâm phát sáng với vệt phản chiếu ánh sáng lướt qua trên GPU Compositor.
 */
export const AnimatedRefreshIcon = memo(function AnimatedRefreshIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        <defs>
          {/* Gradient cung tên trên: Lam ngọc sang Xanh Emerald */}
          <linearGradient id="syncCyanGreenGrad" x1="4" y1="4" x2="20" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#20d66b" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Gradient cung tên dưới: Vàng Neon sang Cam tươi */}
          <linearGradient id="syncYellowOrangeGrad" x1="20" y1="20" x2="4" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Vòng quay kép 2 mũi tên đối xứng xoay 360 độ liên tục GPU */}
        <g className="anim-sync-spin" style={{ transformOrigin: "12px 12px" }}>
          {/* Cung tên trên (Xanh lam - ngọc lục bảo) */}
          <path
            d="M5.5 12a6.5 6.5 0 0 1 12.3-3"
            stroke="url(#syncCyanGreenGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Đầu mũi tên trên */}
          <polygon
            points="17,3.5 21,8.5 15.5,9.5"
            fill="#20d66b"
            stroke="#059669"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Cung tên dưới (Vàng neon - cam ấm) */}
          <path
            d="M18.5 12a6.5 6.5 0 0 1-12.3 3"
            stroke="url(#syncYellowOrangeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Đầu mũi tên dưới */}
          <polygon
            points="7,20.5 3,15.5 8.5,14.5"
            fill="#facc15"
            stroke="#d97706"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Vệt phản quang lướt trên cung tên */}
          <path
            d="M8 6.5a6.5 6.5 0 0 1 5.5-1.5"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M16 17.5a6.5 6.5 0 0 1-5.5 1.5"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* Chấm tròn phát sáng tâm với ngôi sao 4 cánh ở trung tâm */}
        <circle cx="12" cy="12" r="2.2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="12" cy="12" r="1.2" fill="#facc15" className="anim-shine" />
      </svg>
    </div>
  );
});

export const AnimatedFlameIcon = AnimatedRefreshIcon;

/**
 * 7. Layers Icon (Thể Loại) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * 3 tầng đĩa 3D đa sắc bay lơ lửng kiểu accordion trên GPU.
 */
export const AnimatedLayersIcon = memo(function AnimatedLayersIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Tầng 1 (Trên cùng): Xanh ngọc lục bảo */}
        <path
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="anim-layer-top"
        />

        {/* Tầng 2 (Ở giữa): Xanh lam Cyan */}
        <path
          d="m2 12 10 4.5 10-4.5"
          stroke="#0284c7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m2 12 10 4.5 10-4.5v1.5L12 18 2 13.5Z"
          fill="#38bdf8"
          fillOpacity="0.4"
        />

        {/* Tầng 3 (Dưới cùng): Tím chàm Neon */}
        <path
          d="m2 17 10 4.5 10-4.5"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-layer-bottom"
        />
        <path
          d="m2 17 10 4.5 10-4.5v1.5L12 23 2 18.5Z"
          fill="#818cf8"
          fillOpacity="0.4"
          className="anim-layer-bottom"
        />
      </svg>
    </div>
  );
});

/**
 * 8. Globe Icon (Quốc Gia) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Trái Đất xanh dương ngọc, vệ tinh vàng quay quỹ đạo 360 độ trên GPU.
 */
export const AnimatedGlobeIcon = memo(function AnimatedGlobeIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Đại dương xanh biển sâu */}
        <circle cx="12" cy="12" r="9" fill="#0284c7" fillOpacity="0.3" stroke="#0ea5e9" strokeWidth="1.75" />

        {/* Các mảng lục địa màu xanh lá cây tươi */}
        <path
          d="M8 8c1.5-1 4-1.5 5 0s0 3-1.5 3.5-3 .5-3.5-1.5-.5-1.5 0-2Z"
          fill="#22c55e"
          fillOpacity="0.8"
        />
        <path
          d="M13 14c1.5-.5 3.5 0 4 1.5s-.5 3-2 3-2.5-1-2.5-2.5.5-1.5.5-2Z"
          fill="#22c55e"
          fillOpacity="0.8"
        />

        {/* Đường kinh tuyến và vĩ tuyến */}
        <path d="M12 3a13 13 0 0 0 0 18" stroke="#38bdf8" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M12 3a13 13 0 0 1 0 18" stroke="#38bdf8" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M3 12h18" stroke="#38bdf8" strokeWidth="1.25" strokeLinecap="round" />

        {/* Ngôi sao vệ tinh quay quanh quỹ đạo Trái Đất trên GPU */}
        <g className="anim-globe-orbit">
          <circle cx="12" cy="1" r="1.75" fill="#facc15" stroke="#eab308" strokeWidth="0.75" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 9. Calendar Icon (Năm Phát Hành) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Lịch bàn gáy đỏ, chấm ngày đa sắc gợn sóng nhấp nhô mượt mà trên GPU.
 */
export const AnimatedCalendarIcon = memo(function AnimatedCalendarIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Nền tờ lịch trắng ngà */}
        <rect
          x="3"
          y="6"
          width="18"
          height="15"
          rx="2.5"
          fill="#1e293b"
          stroke="#94a3b8"
          strokeWidth="1.75"
        />

        {/* Gáy lịch trên màu đỏ tươi */}
        <path
          d="M3 6a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 6v3H3Z"
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth="1"
        />

        {/* Hai cọc ghim xoắn vàng */}
        <line x1="8" y1="2" x2="8" y2="5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="2" x2="16" y2="5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />

        {/* Các chấm ngày đa sắc nhấp nhô tuần hoàn trên GPU */}
        <circle cx="8" cy="12" r="1.3" fill="#38bdf8" className="anim-dot-1" />
        <circle cx="12" cy="12" r="1.3" fill="#facc15" className="anim-dot-2" />
        <circle cx="16" cy="12" r="1.3" fill="#4ade80" className="anim-dot-3" />

        <circle cx="8" cy="16" r="1.3" fill="#fb7185" className="anim-dot-2" />
        <circle cx="12" cy="16" r="1.3" fill="#c084fc" className="anim-dot-3" />
        <circle cx="16" cy="16" r="1.3" fill="#f97316" className="anim-dot-1" />
      </svg>
    </div>
  );
});

/**
 * 10. History Icon (Lịch Sử Xem) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Mặt đồng hồ ngọc teal, kim giờ và kim giây quay 360 độ liên tục trên GPU.
 */
export const AnimatedHistoryIcon = memo(function AnimatedHistoryIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible will-change-transform"
      >
        {/* Mặt đồng hồ bấm giờ màu xanh ngọc Teal */}
        <circle cx="12" cy="12" r="9" fill="#0f766e" fillOpacity="0.2" stroke="#2dd4bf" strokeWidth="1.75" />
        {/* Nút bấm trên đỉnh */}
        <path d="M12 3v2" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />

        {/* Cung tên xoay ngược màu vàng */}
        <path
          d="M3 12a9 9 0 0 1 9-9"
          stroke="#facc15"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="anim-shine"
        />

        {/* Kim giờ (Xoay 360 độ liên tục GPU) */}
        <line
          x1="12"
          y1="12"
          x2="12"
          y2="7.5"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
          className="anim-spin-slow"
          style={{ transformOrigin: "12px 12px" }}
        />
        {/* Kim giây màu đỏ cam quay tích tắc liên tục GPU */}
        <line
          x1="12"
          y1="12"
          x2="16.5"
          y2="14"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="anim-spin-fast"
          style={{ transformOrigin: "12px 12px" }}
        />
        <circle cx="12" cy="12" r="1.5" fill="#facc15" />
      </svg>
    </div>
  );
});

/**
 * 11. Heart Icon (Phim Yêu Thích) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Trái tim ruby đập thình thịch 2 nhịp liên tục với hào quang tỏa sáng trên GPU.
 */
export const AnimatedHeartIcon = memo(function AnimatedHeartIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible anim-heart will-change-transform"
      >
        {/* Hào quang nhịp đập của trái tim */}
        <path
          d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"
          fill="#f43f5e"
          className="anim-shine"
        />
        {/* Trái tim màu đỏ ruby bóng bẩy */}
        <path
          d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"
          fill="#e11d48"
          stroke="#fb7185"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Vệt sáng bóng phản chiếu */}
        <path d="M6 8a3 3 0 0 1 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      </svg>
    </div>
  );
});

/**
 * 12. Smartphone Icon (Tải App Mobile) - Lineal Color Phong cách Flaticon (GPU Accelerated)
 * Điện thoại tím neon rung nảy haptic vibration, mũi tên tải xuống chuyển động trên GPU.
 */
export const AnimatedSmartphoneIcon = memo(function AnimatedSmartphoneIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible anim-phone will-change-transform"
      >
        {/* Thân máy smartphone viền mỏng */}
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.75" />

        {/* Màn hình phát sáng màu xanh tím */}
        <rect x="6.5" y="4" width="11" height="15" rx="1.5" fill="#4f46e5" fillOpacity="0.4" />

        {/* Loa thoại */}
        <line x1="10" y1="3" x2="14" y2="3" stroke="#c7d2fe" strokeWidth="1" strokeLinecap="round" />

        {/* Mũi tên tải xuống màu xanh lá nhấp nhô liên tục GPU */}
        <path
          d="m9.5 11 2.5 2.5 2.5-2.5M12 7.5v6"
          stroke="#22c55e"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-arrow"
        />

        {/* Chấm đèn thông báo màu xanh ngọc nhấp nháy */}
        <circle
          cx="17"
          cy="4"
          r="1.5"
          fill="#22c55e"
          className="anim-shine"
        />
      </svg>
    </div>
  );
});

/**
 * Tương thích linh hoạt cho cả Sidebar Desktop và Mobile Menu Sheet
 */
export type SidebarIconType =
  | "home"
  | "clapperboard"
  | "tv"
  | "film"
  | "cat"
  | "flame"
  | "refresh"
  | "layers"
  | "globe"
  | "calendar"
  | "history"
  | "heart"
  | "smartphone";

interface SidebarAnimatedIconComponentProps extends AnimatedSidebarIconProps {
  type: SidebarIconType;
}

export function SidebarAnimatedIcon({
  type,
  className,
  size,
  isHovered = false,
  isActive = false,
}: SidebarAnimatedIconComponentProps) {
  switch (type) {
    case "home":
      return <AnimatedHomeIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "clapperboard":
      return <AnimatedClapperboardIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "tv":
      return <AnimatedTvIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "film":
      return <AnimatedFilmIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "cat":
      return <AnimatedCatIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "flame":
    case "refresh":
      return <AnimatedRefreshIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "layers":
      return <AnimatedLayersIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "globe":
      return <AnimatedGlobeIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "calendar":
      return <AnimatedCalendarIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "history":
      return <AnimatedHistoryIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "heart":
      return <AnimatedHeartIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "smartphone":
      return <AnimatedSmartphoneIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    default:
      return null;
  }
}
