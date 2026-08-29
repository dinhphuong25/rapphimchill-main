"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      className={cn(
        "fixed bottom-20 md:bottom-24 right-6 z-40 p-3 rounded-full",
        "bg-primary text-black font-bold shadow-lg shadow-primary/20",
        "hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

export { ScrollToTop as ScrollToTopFAB };
