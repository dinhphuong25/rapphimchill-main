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
      // Block known scrapers and content harvesters
      { userAgent: "HTTrack", disallow: "/" },
      { userAgent: "WebCopier", disallow: "/" },
      { userAgent: "SiteSnagger", disallow: "/" },
      { userAgent: "TeleportPro", disallow: "/" },
      { userAgent: "WebZIP", disallow: "/" },
      { userAgent: "WebStripper", disallow: "/" },
      { userAgent: "WebCapture", disallow: "/" },
      { userAgent: "Scrapy", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
