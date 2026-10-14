"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedSidebarIconProps {
  className?: string;
  size?: number;
  isHovered?: boolean;
  isActive?: boolean;
}

/**
 * 1. Home Icon (Trang Chủ) - Lineal Color Phong cách Flaticon
 * Nóc nhà màu cam ấm, tường xanh trời, khói ống khói bay liên tục, ánh đèn cửa sổ nhấp nhô
 */
export const AnimatedHomeIcon = memo(function AnimatedHomeIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Ống khói với các hạt khói bay lượn liên tục */}
        <path d="M18 10V5h-2v3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <motion.circle
          cx="17"
          cy="3"
          r="1"
          fill="#cbd5e1"
          animate={{ y: [0, -5], opacity: [0.9, 0], scale: [0.8, 1.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.circle
          cx="18"
          cy="1.5"
          r="0.75"
          fill="#cbd5e1"
          animate={{ y: [0, -6], opacity: [0.8, 0], scale: [0.7, 1.3] }}
          transition={{ duration: 1.8, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
        />

        {/* Thân nhà màu xanh da trời trong trẻo */}
        <path
          d="M4 10.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.5"
          fill="#38bdf8"
          fillOpacity="0.25"
          stroke="#38bdf8"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Nóc nhà màu cam san hô nhấp nhô nhẹ */}
        <motion.path
          d="m2.5 11 8.35-7.3a1.75 1.75 0 0 1 2.3 0l8.35 7.3"
          fill="#f97316"
          fillOpacity="0.35"
          stroke="#fb923c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, -0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cửa nhà màu vàng hổ phách tỏa ánh đèn ấm áp */}
        <motion.rect
          x="9.5"
          y="13"
          width="5"
          height="8"
          rx="1"
          fill="#facc15"
          stroke="#eab308"
          strokeWidth="1.5"
          animate={{ fillOpacity: [0.5, 0.95, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Nắm cửa */}
        <circle cx="13.2" cy="17" r="0.6" fill="#713f12" />
      </motion.svg>
    </div>
  );
});

/**
 * 2. Clapperboard Icon (Chiếu Rạp) - Lineal Color Phong cách Flaticon
 * Bảng đập phim trường với thanh đập mở ra gõ đóng liên tục, ngôi sao vàng điện ảnh tỏa sáng
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
        className="overflow-visible"
      >
        {/* Thân bảng clapperboard màu xanh đậm điện ảnh */}
        <rect
          x="3.5"
          y="10.5"
          width="17"
          height="10.5"
          rx="1.5"
          fill="#1e293b"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {/* Ngôi sao vàng Hollywood nhấp nháy xoay nhẹ */}
        <motion.path
          d="M12 13.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3z"
          fill="#fbbf24"
          animate={{ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 15.5px" }}
        />

        {/* Thanh đập clapperboard mở lên và gõ đóng liên tục theo chu kỳ */}
        <motion.g
          animate={{ rotate: [0, 0, -22, 2, -1, 0, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "3.5px 10.5px" }}
        >
          <path
            d="M3.5 10.5l16.5-4-1-2.5a1.5 1.5 0 0 0-1.8-.9L4.8 6.5a1.5 1.5 0 0 0-.9 1.8z"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          {/* Sọc vạch phim trường đen vàng */}
          <path d="m7 9.5 2.5-3.5" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d="m12 8.3 2.5-3.5" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d="m17 7.1 2-2.8" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  );
});

/**
 * 3. Tv Icon (Phim Bộ) - Lineal Color Phong cách Flaticon
 * Tivi màu tím retro, ăng-ten lắc lư bắt sóng, nút play phát sóng nhấp nhô
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
        className="overflow-visible"
      >
        {/* Râu ăng-ten lắc lư qua lại liên tục */}
        <motion.g
          animate={{ rotate: [-8, 8, -6, 6, -8] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 7px" }}
        >
          <line x1="12" y1="7" x2="6.5" y2="1.5" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="7" x2="17.5" y2="1.5" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="6.5" cy="1.5" r="1" fill="#c084fc" />
          <circle cx="17.5" cy="1.5" r="1" fill="#c084fc" />
        </motion.g>

        {/* Vỏ Tivi màu tím neon sang trọng */}
        <rect
          x="2.5"
          y="7"
          width="19"
          height="14.5"
          rx="2.5"
          fill="#3b0764"
          fillOpacity="0.4"
          stroke="#c084fc"
          strokeWidth="1.75"
        />

        {/* Màn hình phát sóng màu xanh ngọc Cyan */}
        <rect
          x="4.5"
          y="9"
          width="12"
          height="10.5"
          rx="1.5"
          fill="#06b6d4"
          fillOpacity="0.25"
          stroke="#22d3ee"
          strokeWidth="1.25"
        />
        {/* Biểu tượng Play nhịp đập trên màn hình */}
        <motion.path
          d="m8.5 11.5 4.5 2.75-4.5 2.75z"
          fill="#22d3ee"
          animate={{ scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "10.5px 14.25px" }}
        />

        {/* Các nút bấm điều khiển sắc màu */}
        <circle cx="18.5" cy="11.5" r="1" fill="#facc15" />
        <circle cx="18.5" cy="14.5" r="1" fill="#f43f5e" />
        <line x1="17.5" y1="17.5" x2="19.5" y2="17.5" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
});

/**
 * 4. Film Icon (Phim Lẻ) - Lineal Color Phong cách Flaticon
 * Cuộn phim điện ảnh màu vàng kim hoàng gia xoay tròn liên tục
 */
export const AnimatedFilmIcon = memo(function AnimatedFilmIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "12px 12px" }}
      >
        {/* Vòng ngoài cuộn phim mạ vàng */}
        <circle cx="12" cy="12" r="9.5" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.75" />
        {/* Lõi giữa cuộn phim */}
        <circle cx="12" cy="12" r="3.2" fill="#d97706" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.2" fill="#1e293b" />

        {/* Các lỗ khoét cuộn phim màu vàng nhạt Flaticon */}
        <circle cx="12" cy="6.2" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="17" cy="9.2" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="17" cy="14.8" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="12" cy="17.8" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="7" cy="14.8" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="7" cy="9.2" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
      </motion.svg>
    </div>
  );
});

/**
 * 5. Cat Icon (Hoạt Hình / Anime) - Lineal Color Phong cách Flaticon
 * Chú mèo vàng cam dễ thương, tai vểnh lắc lư, mắt chớp nháy liên tục
 */
export const AnimatedCatIcon = memo(function AnimatedCatIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ rotate: [-7, 7, -5, 5, -7], y: [0, -1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 18px" }}
      >
        {/* Khuôn mặt mèo màu cam đào */}
        <path
          d="M12 5c.7 0 1.4.1 2 .3 1.8-2 5-2.8 6.4-2.3 1.4.6-.4 7-.4 7 .6 1.1 1 2.2 1 3.4 0 5.4-4 8.6-9 8.6s-9-3.2-9-8.6c0-1.2.4-2.3 1-3.4 0 0-1.8-6.4-.4-7 1.4-.5 4.6.3 6.4 2.3.6-.2 1.3-.3 2-.3z"
          fill="#fb923c"
          fillOpacity="0.35"
          stroke="#fb923c"
          strokeWidth="1.75"
        />

        {/* Tai trong màu hồng phấn */}
        <path d="M18.5 6.5c-.5 1-1.5 2-2.5 2.5" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5.5 6.5c.5 1 1.5 2 2.5 2.5" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />

        {/* Đôi mắt vàng chớp nháy liên tục */}
        <motion.circle
          cx="9"
          cy="13"
          r="1.2"
          fill="#fef08a"
          stroke="#ca8a04"
          strokeWidth="0.8"
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          style={{ transformOrigin: "9px 13px" }}
        />
        <motion.circle
          cx="15"
          cy="13"
          r="1.2"
          fill="#fef08a"
          stroke="#ca8a04"
          strokeWidth="0.8"
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          style={{ transformOrigin: "15px 13px" }}
        />

        {/* Chiếc mũi xinh màu hồng dâu và nụ cười */}
        <circle cx="12" cy="15.2" r="0.8" fill="#f43f5e" />
        <path d="M10.8 16.5q1.2.9 2.4 0" stroke="#fb923c" strokeWidth="1.2" strokeLinecap="round" />

        {/* Ria mép */}
        <line x1="2" y1="13.5" x2="6.5" y2="13.5" stroke="#fdba74" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="17.5" y1="13.5" x2="22" y2="13.5" stroke="#fdba74" strokeWidth="1.2" strokeLinecap="round" />
      </motion.svg>
    </div>
  );
});

/**
 * 6. Flame Icon (Mới Cập Nhật / Thịnh Hành) - Lineal Color Phong cách Flaticon
 * Ngọn lửa đỏ cam rực lửa bập bùng, lõi vàng kim nhảy múa, tàn lửa bay liên tục
 */
export const AnimatedFlameIcon = memo(function AnimatedFlameIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{
          scale: [1, 1.18, 0.96, 1.14, 1],
          rotate: [-4, 4, -2, 3, -4],
          y: [0, -2, 0],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 21px" }}
      >
        {/* Ngọn lửa ngoài màu đỏ ruby / cam cháy */}
        <path
          d="M8.9 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          fill="#ef4444"
          fillOpacity="0.35"
          stroke="#f97316"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lõi lửa vàng kim nhảy múa nhiệt huyết */}
        <motion.path
          d="M12 19a3.5 3.5 0 0 0 3.5-3.5c0-1.2-1.2-2.3-1.8-3S12 11 12 11s-.6 1.2-1.2 1.8S9 14.3 9 15.5A3.5 3.5 0 0 0 12 19z"
          fill="#facc15"
          stroke="#eab308"
          strokeWidth="1.2"
          animate={{ scale: [1, 1.3, 0.9, 1.2, 1], y: [0, -1.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 17px" }}
        />

        {/* Đốm tàn lửa bay lên liên tục */}
        <motion.circle
          cx="14"
          cy="6"
          r="0.8"
          fill="#fef08a"
          animate={{ y: [0, -5], opacity: [1, 0], scale: [1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.circle
          cx="10"
          cy="4"
          r="0.6"
          fill="#fef08a"
          animate={{ y: [0, -6], opacity: [1, 0], scale: [1, 0.3] }}
          transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * 7. Layers Icon (Thể Loại) - Lineal Color Phong cách Flaticon
 * 3 tầng phân lớp xanh lục, xanh cyan và tím indigo nhấp nhô lơ lửng 3D liên tục
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
        className="overflow-visible"
      >
        {/* Tầng trên cùng màu xanh ngọc lục bảo */}
        <motion.path
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
          fill="#10b981"
          fillOpacity="0.4"
          stroke="#34d399"
          strokeWidth="1.75"
          animate={{ y: [0, -2.5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tầng giữa màu xanh cyan */}
        <motion.path
          d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
          stroke="#38bdf8"
          strokeWidth="1.75"
          strokeLinecap="round"
          animate={{ y: [0, -4.5, 0] }}
          transition={{ duration: 2.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tầng dưới cùng màu tím indigo */}
        <motion.path
          d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
          stroke="#818cf8"
          strokeWidth="1.75"
          strokeLinecap="round"
          animate={{ y: [0, -6.5, 0] }}
          transition={{ duration: 2.8, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
});

/**
 * 8. Globe Icon (Quốc Gia) - Lineal Color Phong cách Flaticon
 * Quả địa cầu đại dương xanh thẳm, lục địa xanh mát, vệ tinh vàng bay quanh liên tục
 */
export const AnimatedGlobeIcon = memo(function AnimatedGlobeIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Đại dương xanh biển */}
        <circle cx="12" cy="12" r="9.5" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.75" />
        <line x1="2.5" y1="12" x2="21.5" y2="12" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Lục địa xanh lá kinh tuyến chuyển động */}
        <motion.path
          d="M12 2.5a15.3 15.3 0 0 1 4 9.5 15.3 15.3 0 0 1-4 9.5 15.3 15.3 0 0 1-4-9.5 15.3 15.3 0 0 1 4-9.5z"
          fill="#10b981"
          fillOpacity="0.3"
          stroke="#34d399"
          strokeWidth="1.5"
          animate={{ scaleX: [1, 0.2, 1, 0.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 12px" }}
        />

        {/* Ngôi sao vệ tinh mạ vàng bay vòng tròn quanh quỹ đạo */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "12px 12px" }}
        >
          <circle cx="12" cy="1" r="1.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" />
        </motion.g>
      </motion.svg>
    </div>
  );
});

/**
 * 9. Calendar Icon (Năm Phát Hành) - Lineal Color Phong cách Flaticon
 * Cuốn lịch đỏ nổi bật với ghim vàng và các chấm ngày tháng rực rỡ lượn sóng liên tục
 */
export const AnimatedCalendarIcon = memo(function AnimatedCalendarIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  const dots = [
    { cx: 8, cy: 14, color: "#38bdf8" },
    { cx: 12, cy: 14, color: "#facc15" },
    { cx: 16, cy: 14, color: "#f43f5e" },
    { cx: 8, cy: 18, color: "#34d399" },
    { cx: 12, cy: 18, color: "#a855f7" },
    { cx: 16, cy: 18, color: "#fb923c" },
  ];

  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Thân cuốn lịch */}
        <rect x="3" y="4" width="18" height="17" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.75" />
        {/* Thanh gáy lịch màu đỏ nổi bật */}
        <path d="M3 4h18v5H3z" fill="#e11d48" />

        {/* Khuyên ghim màu vàng kim */}
        <line x1="8" y1="2" x2="8" y2="6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="2" x2="16" y2="6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

        {/* Các mốc ngày tháng đa sắc nhấp nháy gợn sóng liên tục */}
        {dots.map((dot, idx) => (
          <motion.circle
            key={idx}
            cx={dot.cx}
            cy={dot.cy}
            r="1.25"
            fill={dot.color}
            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, delay: idx * 0.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.svg>
    </div>
  );
});

/**
 * 10. History Icon (Lịch Sử Xem) - Lineal Color Phong cách Flaticon
 * Đồng hồ màu xanh ngọc bích kim quay tích tắc không ngừng ngược dòng thời gian
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
        className="overflow-visible"
      >
        {/* Mặt đồng hồ bấm giờ màu xanh ngọc Teal */}
        <circle cx="12" cy="12" r="9" fill="#0f766e" fillOpacity="0.2" stroke="#2dd4bf" strokeWidth="1.75" />
        {/* Nút bấm trên đỉnh */}
        <path d="M12 3v2" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />

        {/* Cung tên xoay ngược màu vàng */}
        <motion.path
          d="M3 12a9 9 0 0 1 9-9"
          stroke="#facc15"
          strokeWidth="1.75"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Kim giờ (Xoay 360 độ liên tục) */}
        <motion.line
          x1="12"
          y1="12"
          x2="12"
          y2="7.5"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "12px 12px" }}
        />
        {/* Kim giây màu đỏ cam quay nhanh tích tắc */}
        <motion.line
          x1="12"
          y1="12"
          x2="16.5"
          y2="14"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "12px 12px" }}
        />
        <circle cx="12" cy="12" r="1.5" fill="#facc15" />
      </svg>
    </div>
  );
});

/**
 * 11. Heart Icon (Phim Yêu Thích) - Lineal Color Phong cách Flaticon
 * Trái tim hồng ngọc 3D đập thình thịch 2 nhịp liên tục với hào quang tỏa sáng
 */
export const AnimatedHeartIcon = memo(function AnimatedHeartIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{ scale: [1, 1.25, 1.05, 1.18, 1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 12px" }}
      >
        {/* Hào quang nhịp đập của trái tim */}
        <motion.path
          d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"
          fill="#f43f5e"
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 1.5, repeat: Infinity }}
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
      </motion.svg>
    </div>
  );
});

/**
 * 12. Smartphone Icon (Tải App Mobile) - Lineal Color Phong cách Flaticon
 * Điện thoại thông minh màu tím neon rung nảy haptic vibration, mũi tên tải xuống chuyển động
 */
export const AnimatedSmartphoneIcon = memo(function AnimatedSmartphoneIcon({
  className,
  size = 20,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{
          rotate: [0, 0, -12, 12, -8, 8, -4, 4, 0, 0],
          scale: [1, 1, 1.1, 1.1, 1.08, 1.08, 1, 1, 1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "12px 18px" }}
      >
        {/* Thân máy smartphone viền mỏng */}
        <rect x="5" y="2" width="14" height="20" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.75" />

        {/* Màn hình phát sáng màu xanh tím */}
        <rect x="6.5" y="4" width="11" height="15" rx="1.5" fill="#4f46e5" fillOpacity="0.4" />

        {/* Loa thoại */}
        <line x1="10" y1="3" x2="14" y2="3" stroke="#c7d2fe" strokeWidth="1" strokeLinecap="round" />

        {/* Mũi tên tải xuống màu xanh lá nhấp nhô liên tục */}
        <motion.path
          d="m9.5 11 2.5 2.5 2.5-2.5M12 7.5v6"
          stroke="#22c55e"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Chấm đèn thông báo màu xanh ngọc nhấp nháy */}
        <motion.circle
          cx="17"
          cy="4"
          r="1.5"
          fill="#22c55e"
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * Dispatcher Icon Component
 */
export type SidebarIconType =
  | "home"
  | "clapperboard"
  | "tv"
  | "film"
  | "cat"
  | "flame"
  | "layers"
  | "globe"
  | "calendar"
  | "history"
  | "heart"
  | "smartphone";

interface SidebarIconDispatcherProps extends AnimatedSidebarIconProps {
  type: SidebarIconType;
}

export const SidebarAnimatedIcon = memo(function SidebarAnimatedIcon({
  type,
  ...props
}: SidebarIconDispatcherProps) {
  switch (type) {
    case "home":
      return <AnimatedHomeIcon {...props} />;
    case "clapperboard":
      return <AnimatedClapperboardIcon {...props} />;
    case "tv":
      return <AnimatedTvIcon {...props} />;
    case "film":
      return <AnimatedFilmIcon {...props} />;
    case "cat":
      return <AnimatedCatIcon {...props} />;
    case "flame":
      return <AnimatedFlameIcon {...props} />;
    case "layers":
      return <AnimatedLayersIcon {...props} />;
    case "globe":
      return <AnimatedGlobeIcon {...props} />;
    case "calendar":
      return <AnimatedCalendarIcon {...props} />;
    case "history":
      return <AnimatedHistoryIcon {...props} />;
    case "heart":
      return <AnimatedHeartIcon {...props} />;
    case "smartphone":
      return <AnimatedSmartphoneIcon {...props} />;
    default:
      return null;
  }
});
