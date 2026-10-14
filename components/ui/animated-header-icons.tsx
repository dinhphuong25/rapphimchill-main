"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedHeaderIconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Kính Lúp Tìm Kiếm (Search Icon) - Phong cách Flaticon Lineal Color
 * Tròng kính phản chiếu ánh ngọc lam, viền vàng kim loại, cán titan sang trọng.
 * Chuyển động liên tục: Kính lúp rà quét góc đa chiều, vệt sáng phản quang lướt qua,
 * cùng tia sao lấp lánh (sparkle) nở rộ liên tục tuần hoàn.
 */
export const AnimatedSearchIcon = memo(function AnimatedSearchIcon({
  className,
  size = 18,
}: AnimatedHeaderIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{
          rotate: [-6, 6, -3, 3, -6],
          x: [-0.5, 0.8, -0.8, 0.5, -0.5],
          y: [-0.5, -1, 0.5, 0, -0.5],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "10px 10px" }}
      >
        <defs>
          {/* Gradient tròng kính lúp lam ngọc */}
          <linearGradient id="searchLensGrad" x1="4" y1="4" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#20d66b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>

          {/* Gradient vành kính vàng neon */}
          <linearGradient id="searchRimGrad" x1="3" y1="3" x2="17" y2="17" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#20d66b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Gradient cán kính lúp kim loại */}
          <linearGradient id="searchHandleGrad" x1="14" y1="14" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Tròng kính lúp với màu kính trong suốt huyền ảo */}
        <circle
          cx="10"
          cy="10"
          r="6.5"
          fill="url(#searchLensGrad)"
        />

        {/* Vành kính kim loại dày Lineal Color */}
        <circle
          cx="10"
          cy="10"
          r="6.5"
          stroke="url(#searchRimGrad)"
          strokeWidth="2"
        />

        {/* Vệt phản chiếu ánh sáng trắng trên mặt kính */}
        <motion.path
          d="M6 7.5a4.5 4.5 0 0 1 4.5-4"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 0.95, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Chốt nối cán kính lúp màu vàng kim */}
        <rect
          x="14.2"
          y="14.2"
          width="2.2"
          height="1.5"
          rx="0.5"
          transform="rotate(45 15.2 15)"
          fill="#facc15"
          stroke="#d97706"
          strokeWidth="0.5"
        />

        {/* Cán cầm kính lúp Lineal Color dày dặn */}
        <path
          d="m15.5 15.5 5 5"
          stroke="url(#searchHandleGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Lõi viền cán phản quang */}
        <path
          d="m16 16 3.8 3.8"
          stroke="#fde047"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Ngôi sao lấp lánh (Sparkle) 4 cánh trên góc kính lúp */}
        <motion.g
          transform="translate(13.5, 4.5)"
          animate={{
            scale: [0, 1.25, 0],
            rotate: [0, 90, 180],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatDelay: 0.8,
            ease: "easeInOut",
          }}
        >
          <path
            d="M0 -3 C0 -1 1 0 3 0 C1 0 0 1 0 3 C0 1 -1 0 -3 0 C-1 0 0 -1 0 -3 Z"
            fill="#facc15"
          />
        </motion.g>
      </motion.svg>
    </div>
  );
});

export interface AnimatedHeaderBellProps extends AnimatedHeaderIconProps {
  hasUnread?: boolean;
  isOpen?: boolean;
}

/**
 * 2. Chuông Thông Báo (Notification Bell Icon) - Phong cách Flaticon Lineal Color
 * Quả chuông vàng 3D với nẹp ruby đỏ, con lắc đung đưa, sóng âm thanh lan tỏa.
 * Chuyển động liên tục tuần hoàn: Chuông lắc lư ngân vang theo nhịp vật lý,
 * con lắc đu đưa bên dưới và sóng âm tỏa ra 2 bên.
 */
export const AnimatedHeaderBellIcon = memo(function AnimatedHeaderBellIcon({
  className,
  size = 20,
  hasUnread = false,
  isOpen = false,
}: AnimatedHeaderBellProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{
          rotate: [0, -14, 14, -10, 10, -4, 4, 0, 0, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "12px 3px" }}
      >
        <defs>
          {/* Gradient thân chuông vàng óng */}
          <linearGradient id="bellGoldGrad" x1="5" y1="4" x2="19" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Gradient nẹp chuông ruby đỏ */}
          <linearGradient id="bellRibbonGrad" x1="4" y1="15" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Sóng âm thanh bên trái phát ra khi lắc chuông */}
        <motion.path
          d="M3 8a8 8 0 0 0 0 8"
          stroke="#facc15"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.25, 0.55],
          }}
          style={{ transformOrigin: "4px 12px" }}
        />

        {/* Sóng âm thanh bên phải phát ra khi lắc chuông */}
        <motion.path
          d="M21 8a8 8 0 0 1 0 8"
          stroke="#facc15"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.25, 0.55],
          }}
          style={{ transformOrigin: "20px 12px" }}
        />

        {/* Quai treo chóp chuông tròn vàng kim */}
        <path
          d="M10 4a2 2 0 1 1 4 0"
          stroke="#ca8a04"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="3" r="1.5" fill="#facc15" />

        {/* Con lắc chuông (Clapper) bên dưới đung đưa nhịp nhàng */}
        <motion.g
          animate={{
            x: [0, 2.5, -2.5, 1.8, -1.8, 0, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <circle cx="12" cy="19.5" r="2.2" fill="#d97706" stroke="#facc15" strokeWidth="1" />
        </motion.g>

        {/* Thân chuông vàng Lineal Color nổi bật */}
        <path
          d="M18 16c-.8-1.5-1.5-3.5-1.5-6.5a4.5 4.5 0 0 0-9 0c0 3-.7 5-1.5 6.5C5.4 17.2 6.2 18 7.5 18h9c1.3 0 2.1-.8 1.5-2Z"
          fill="url(#bellGoldGrad)"
          stroke="#ca8a04"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Vành đai đáy chuông bo cong Lineal Color */}
        <path
          d="M5.5 17.5c1.5-.8 3.8-1 6.5-1s5 .2 6.5 1c.5.3.3.9-.2.9H6c-.5 0-.7-.6-.5-.9Z"
          fill="url(#bellRibbonGrad)"
          stroke="#be123c"
          strokeWidth="1"
        />

        {/* Vệt sáng bóng phản quang bên sườn chuông */}
        <motion.path
          d="M9.5 7.5c-.8 1.5-1 3.5-.8 5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{ opacity: [0.5, 0.95, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
});

/**
 * 3. Icon Người Dùng (User Login / Profile Icon) - Phong cách Flaticon Lineal Color
 * Chàng trai mê điện ảnh với mái tóc xanh chàm, gương mặt tươi vui, áo polo xanh emerald.
 * Chuyển động liên tục tuần hoàn: Đầu nghiêng chào thân thiện, nhịp thở nhấp nhô sống động,
 * đôi mắt nháy sáng chào mừng quý khán giả đăng nhập.
 */
export const AnimatedUserIcon = memo(function AnimatedUserIcon({
  className,
  size = 20,
}: AnimatedHeaderIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible"
        animate={{
          y: [0, -1, 0, -0.6, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <defs>
          {/* Gradient làn da ấm áp */}
          <linearGradient id="userSkinGrad" x1="9" y1="6" x2="15" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fca5a5" />
          </linearGradient>

          {/* Gradient mái tóc xanh tím sành điệu */}
          <linearGradient id="userHairGrad" x1="8" y1="3" x2="16" y2="9" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>

          {/* Gradient áo polo xanh ngọc emerald Hi Phim */}
          <linearGradient id="userShirtGrad" x1="4" y1="16" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Thân người & áo polo xanh Emerald Lineal Color */}
        <path
          d="M5 21a7 7 0 0 1 14 0"
          fill="url(#userShirtGrad)"
          stroke="#065f46"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Cổ áo trắng viền ngực */}
        <path
          d="m10 16 2 2.5 2-2.5"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Nhóm đầu cử động nghiêng chào */}
        <motion.g
          animate={{
            rotate: [0, -7, 7, -4, 4, 0, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "12px 14px" }}
        >
          {/* Khuôn mặt tròn đầy sức sống */}
          <circle
            cx="12"
            cy="10"
            r="4.5"
            fill="url(#userSkinGrad)"
            stroke="#ea580c"
            strokeWidth="1.25"
          />

          {/* Mái tóc vuốt hiện đại phong cách Flaticon */}
          <path
            d="M7.5 9.5c0-2.8 2-4.5 4.5-4.5 2.8 0 4.5 1.5 4.5 3.5 0 .5-.3.8-.7.8-1 0-1.8-1-3.8-1-2 0-3.5 1-4.5 1.2Z"
            fill="url(#userHairGrad)"
            stroke="#3730a3"
            strokeWidth="1.2"
          />

          {/* Tai nhỏ 2 bên */}
          <circle cx="7.2" cy="10" r="1.1" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.8" />
          <circle cx="16.8" cy="10" r="1.1" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.8" />

          {/* 2 mắt hạt tiêu chớp mắt thân thiện */}
          <motion.ellipse
            cx="10.2"
            cy="9.8"
            rx="0.7"
            ry="0.9"
            fill="#1e1b4b"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              times: [0, 0.45, 0.5, 0.55, 1],
            }}
            style={{ transformOrigin: "10.2px 9.8px" }}
          />
          <motion.ellipse
            cx="13.8"
            cy="9.8"
            rx="0.7"
            ry="0.9"
            fill="#1e1b4b"
            animate={{
              scaleY: [1, 1, 0.1, 1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              times: [0, 0.45, 0.5, 0.55, 1],
            }}
            style={{ transformOrigin: "13.8px 9.8px" }}
          />

          {/* Má hồng hào tươi tắn */}
          <circle cx="9" cy="11.2" r="0.9" fill="#f43f5e" opacity="0.45" />
          <circle cx="15" cy="11.2" r="0.9" fill="#f43f5e" opacity="0.45" />

          {/* Nụ cười mỉm đáng yêu */}
          <path
            d="M10.8 12c.5.5 1.9.5 2.4 0"
            stroke="#991b1b"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Hào quang nhỏ lấp lánh cạnh người dùng */}
        <motion.circle
          cx="19.5"
          cy="6.5"
          r="1.2"
          fill="#facc15"
          animate={{
            scale: [0.5, 1.3, 0.5],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.svg>
    </div>
  );
});
