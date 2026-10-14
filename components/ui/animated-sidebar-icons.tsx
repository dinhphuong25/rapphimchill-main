"use client";

import React, { memo } from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedSidebarIconProps {
  className?: string;
  size?: number;
  isHovered?: boolean;
  isActive?: boolean;
}

const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 18,
};

const SPRING_BOUNCE: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 12,
};

/**
 * 1. Home Icon (Trang Chủ)
 * Nóc nhà nảy nhẹ, cửa nhà vẽ mở ra đầy ấm cúng
 */
export const AnimatedHomeIcon = memo(function AnimatedHomeIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isHovered ? { y: [0, -2.5, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={SPRING_BOUNCE}
        className="overflow-visible"
      >
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <motion.path
          d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
          animate={isHovered ? { pathLength: [0, 1], opacity: [0.4, 1] } : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * 2. Clapperboard Icon (Chiếu Rạp)
 * Thanh đập mở lên góc -20° rồi gõ đập đóng xuống giòn giã phong cách đạo diễn
 */
export const AnimatedClapperboardIcon = memo(function AnimatedClapperboardIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overflow-visible"
      >
        {/* Bản lề nắp đập phía trên */}
        <motion.g
          animate={isHovered ? { rotate: [0, -22, 2, 0] } : { rotate: 0 }}
          transition={SPRING_SNAPPY}
          style={{ transformOrigin: "4px 11px" }}
        >
          <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.4-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.4Z" />
          <path d="m6.2 5.3 3.1 3.9" />
          <path d="m12.4 3.4 3.1 4" />
        </motion.g>
        {/* Thân bảng clapperboard phía dưới */}
        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    </div>
  );
});

/**
 * 3. Tv Icon (Phim Bộ)
 * Râu ăng-ten lắc lư ngộ nghĩnh, màn hình TV rung nảy bắt sóng
 */
export const AnimatedTvIcon = memo(function AnimatedTvIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overflow-visible"
      >
        {/* Râu ăng-ten lắc lư */}
        <motion.g
          animate={isHovered ? { rotate: [0, -14, 14, -6, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 7px" }}
        >
          <polyline points="17 2 12 7 7 2" />
        </motion.g>
        {/* Màn hình TV */}
        <motion.rect
          x="2"
          y="7"
          width="20"
          height="15"
          rx="2"
          animate={isHovered ? { scale: [1, 1.08, 0.98, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: "12px 14px" }}
        />
      </svg>
    </div>
  );
});

/**
 * 4. Film Icon (Phim Lẻ)
 * Khung cuộn phim điện ảnh nghiêng và cuộn chuyển động nhịp nhàng
 */
export const AnimatedFilmIcon = memo(function AnimatedFilmIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isHovered ? { rotate: [0, -12, 12, -4, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
        transition={SPRING_BOUNCE}
        className="overflow-visible"
        style={{ transformOrigin: "12px 12px" }}
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 3v18" />
        <path d="M3 7.5h4" />
        <path d="M3 12h18" />
        <path d="M3 16.5h4" />
        <path d="M17 3v18" />
        <path d="M17 7.5h4" />
        <path d="M17 16.5h4" />
      </motion.svg>
    </div>
  );
});

/**
 * 5. Cat Icon (Hoạt Hình / Anime)
 * Chú mèo vểnh tai lắc lư siêu đáng yêu và chớp mắt
 */
export const AnimatedCatIcon = memo(function AnimatedCatIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isHovered ? { rotate: [0, -16, 16, -8, 8, 0], scale: [1, 1.18, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="overflow-visible"
        style={{ transformOrigin: "12px 18px" }}
      >
        <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3.1-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.26 6.5 2.26.65-.17 1.33-.26 2-.26z" />
        <path d="M2 13h5" />
        <path d="M22 13h-5" />
        <motion.circle
          cx="9"
          cy="13"
          r="1"
          fill="currentColor"
          animate={isHovered ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        />
        <motion.circle
          cx="15"
          cy="13"
          r="1"
          fill="currentColor"
          animate={isHovered ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * 6. Flame Icon (Mới Cập Nhật / Thịnh Hành)
 * Ngọn lửa bập bùng, nhảy múa vươn cao với sức sống rực rỡ
 */
export const AnimatedFlameIcon = memo(function AnimatedFlameIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isHovered
            ? {
                scale: [1, 1.25, 0.95, 1.15, 1],
                rotate: [0, -8, 8, -4, 0],
                y: [0, -3, 0],
              }
            : { scale: 1, rotate: 0, y: 0 }
        }
        transition={{ duration: 0.55, ease: "easeInOut" }}
        className="overflow-visible"
        style={{ transformOrigin: "12px 20px" }}
      >
        <path d="M8.9 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        <motion.path
          d="M12 18a3 3 0 0 0 3-3c0-1-1-2-1.5-2.5S12 11 12 11s-.5 1-1 1.5S9.5 14 9.5 15a2.5 2.5 0 0 0 2.5 3z"
          animate={isHovered ? { scale: [1, 1.3, 0.9, 1], opacity: [0.6, 1, 0.8, 1] } : { scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.4 }}
          style={{ transformOrigin: "12px 16px" }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * 7. Layers Icon (Thể Loại)
 * 3 tầng phân lớp tách ra và nhấc bổng 3D isometric rồi xếp lại gọn gàng
 */
export const AnimatedLayersIcon = memo(function AnimatedLayersIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overflow-visible"
      >
        {/* Tầng trên cùng */}
        <motion.path
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
          animate={isHovered ? { y: [0, -2, 0] } : { y: 0 }}
          transition={SPRING_BOUNCE}
        />
        {/* Tầng giữa */}
        <motion.path
          d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
          animate={isHovered ? { y: [0, -4, 0] } : { y: 0 }}
          transition={{ ...SPRING_BOUNCE, delay: 0.05 }}
        />
        {/* Tầng dưới cùng */}
        <motion.path
          d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
          animate={isHovered ? { y: [0, -7, 0] } : { y: 0 }}
          transition={{ ...SPRING_BOUNCE, delay: 0.1 }}
        />
      </svg>
    </div>
  );
});

/**
 * 8. Globe Icon (Quốc Gia)
 * Quả địa cầu quay tròn 3D trên trục tọa độ kết nối toàn cầu
 */
export const AnimatedGlobeIcon = memo(function AnimatedGlobeIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isHovered ? { rotate: 360, scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
        className="overflow-visible"
        style={{ transformOrigin: "12px 12px" }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </motion.svg>
    </div>
  );
});

/**
 * 9. Calendar Icon (Năm Phát Hành)
 * Cuốn lịch nhấp nháy ghim và các mốc thời gian sáng chạy dọc
 */
export const AnimatedCalendarIcon = memo(function AnimatedCalendarIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  const dots = [
    { cx: 8, cy: 14, delay: 0 },
    { cx: 12, cy: 14, delay: 0.08 },
    { cx: 16, cy: 14, delay: 0.16 },
    { cx: 8, cy: 18, delay: 0.24 },
    { cx: 12, cy: 18, delay: 0.32 },
    { cx: 16, cy: 18, delay: 0.4 },
  ];

  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isHovered ? { y: [0, -2, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={SPRING_BOUNCE}
        className="overflow-visible"
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        {dots.map((dot, idx) => (
          <motion.circle
            key={idx}
            cx={dot.cx}
            cy={dot.cy}
            r="1"
            fill="currentColor"
            stroke="none"
            animate={isHovered ? { opacity: [1, 0.2, 1], scale: [1, 1.5, 1] } : { opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.35, delay: dot.delay }}
          />
        ))}
      </motion.svg>
    </div>
  );
});

/**
 * 10. History Icon (Lịch Sử Xem)
 * Kim đồng hồ xoay ngược 360° lùi về quá khứ để tìm lại phim đã xem
 */
export const AnimatedHistoryIcon = memo(function AnimatedHistoryIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overflow-visible"
      >
        {/* Vòng kim tròn có mũi tên ngược */}
        <motion.g
          animate={isHovered ? { rotate: [0, -25, 0] } : { rotate: 0 }}
          transition={SPRING_SNAPPY}
          style={{ transformOrigin: "12px 12px" }}
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </motion.g>
        {/* Kim giờ xoay ngược 360 độ */}
        <motion.line
          x1="12"
          y1="12"
          x2="12"
          y2="7"
          animate={isHovered ? { rotate: [0, -360] } : { rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: "12px 12px" }}
        />
        {/* Kim phút */}
        <motion.line
          x1="12"
          y1="12"
          x2="16"
          y2="14"
          animate={isHovered ? { rotate: [0, -120, 0] } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 12px" }}
        />
      </svg>
    </div>
  );
});

/**
 * 11. Heart Icon (Phim Yêu Thích)
 * Trái tim đập thình thịch 2 nhịp nồng nàn đầy cảm xúc
 */
export const AnimatedHeartIcon = memo(function AnimatedHeartIcon({
  className,
  size = 18,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isHovered
            ? {
                scale: [1, 1.35, 1.05, 1.25, 1],
              }
            : { scale: 1 }
        }
        transition={{ duration: 0.55, ease: "easeInOut" }}
        className="overflow-visible"
        style={{ transformOrigin: "12px 12px" }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </motion.svg>
    </div>
  );
});

/**
 * 12. Smartphone Icon (Tải App Mobile)
 * Điện thoại rung nảy haptic vibration báo thông báo app mới
 */
export const AnimatedSmartphoneIcon = memo(function AnimatedSmartphoneIcon({
  className,
  size = 16,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isHovered
            ? {
                rotate: [0, -15, 15, -12, 12, -6, 6, 0],
                scale: [1, 1.15, 1],
              }
            : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="overflow-visible"
        style={{ transformOrigin: "12px 18px" }}
      >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
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
