"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);

      // Check footer position to avoid overlapping on mobile/desktop
      const footer = document.querySelector("footer");
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (footerRect.top < windowHeight) {
          // Footer is in viewport, stay 16px above footer's top edge
          const overlap = windowHeight - footerRect.top;
          setBottomOffset(overlap + 16);
        } else {
          setBottomOffset(null);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      style={bottomOffset !== null ? { bottom: `${bottomOffset}px` } : undefined}
      className={cn(
        "fixed right-5 sm:right-6 z-40 p-3 rounded-full",
        bottomOffset === null ? "bottom-6 md:bottom-10" : "",
        "bg-primary text-black font-bold shadow-lg shadow-primary/20",
        "hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

export { ScrollToTop as ScrollToTopFAB };
