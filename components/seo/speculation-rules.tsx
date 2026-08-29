"use client";

import { useEffect } from "react";

/**
 * Speculation Rules API - Tối ưu hóa tốc độ phản hồi 0ms (Prerendering)
 * Công nghệ này giúp trình duyệt tải trước và dựng sẵn trang khi người dùng hover vào link.
 */
export default function SpeculationRules() {
  useEffect(() => {
    // Kiểm tra xem trình duyệt có hỗ trợ Speculation Rules không
    if (
      typeof HTMLScriptElement !== "undefined" &&
      HTMLScriptElement.supports &&
      HTMLScriptElement.supports("speculationrules")
    ) {
      const specScript = document.createElement("script");
      specScript.type = "speculationrules";
      
      // Định nghĩa các quy tắc: Prerender các trang phim và trang xem khi hover
      const rules = {
        prerender: [
          {
            source: "list",
            urls: [], // Sẽ được cập nhật động hoặc dùng document rules
            where: {
              and: [
                { href_matches: "/phim/*" },
                { href_matches: "/watch\\?slug=*" }
              ]
            },
            eagerness: "moderate" // Kích hoạt khi hover (moderate) hoặc ngay lập tức (eager)
          }
        ],
        prefetch: [
          {
            source: "document",
            where: {
              and: [
                { href_matches: "/phim/*" },
                { href_matches: "/watch\\?slug=*" }
              ]
            },
            eagerness: "conservative" // Tiết kiệm băng thông, chỉ prefetch khi bấm nhẹ hoặc hover lâu
          }
        ]
      };

      specScript.textContent = JSON.stringify(rules);
      document.head.appendChild(specScript);
    }
  }, []);

  return null;
}
