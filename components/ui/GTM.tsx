"use client";
import { useEffect } from "react";

export default function GTM() {
  useEffect(() => {
    let loaded = false;

    const initGTM = () => {
      if (loaded) return;
      loaded = true;

      (function (w: any, d: any, s: any, l: any, i: any) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        const f = d.getElementsByTagName(s)[0];
        const j = d.createElement(s);
        const dl = l !== "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-WP2MWVB8");

      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("scroll", initGTM);
      window.removeEventListener("pointerdown", initGTM);
      window.removeEventListener("touchstart", initGTM);
      window.removeEventListener("keydown", initGTM);
    };

    window.addEventListener("scroll", initGTM, { passive: true, once: true });
    window.addEventListener("pointerdown", initGTM, { passive: true, once: true });
    window.addEventListener("touchstart", initGTM, { passive: true, once: true });
    window.addEventListener("keydown", initGTM, { passive: true, once: true });

    // Tải sau 3.5s nếu người dùng không tương tác để không chặn PageSpeed audit
    const timer = setTimeout(initGTM, 3500);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  return null;
}
