export default function robots() {
  const baseUrl = "https://rapphimchill.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/private/",
        ],
      },
      // Block known scrapers only (not search engines)
      { userAgent: "HTTrack", disallow: "/" },
      { userAgent: "WebCopier", disallow: "/" },
      { userAgent: "SiteSnagger", disallow: "/" },
      { userAgent: "TeleportPro", disallow: "/" },
      { userAgent: "WebZIP", disallow: "/" },
      { userAgent: "WebStripper", disallow: "/" },
      { userAgent: "WebCapture", disallow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
