import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import GTM from "@/components/ui/GTM";
import { LoadingProvider } from "@/components/ui/loading-context";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import EnhancedGTMTracking from "@/components/seo/enhanced-gtm";
import HydrationFix from "@/components/ui/hydration-fix";
import { SplashScreen } from "@/components/ui/splash-screen";
import { PWAInstaller, PerformanceMonitor } from "@/components/pwa-init";
import SecurityGuard from "@/components/ui/security-guard";
import PipWrapper from "@/components/player/pip-wrapper";
import NotificationBanner from "@/components/ui/notification-banner";
import SpeculationRules from "@/components/seo/speculation-rules";
import { Toaster } from "sonner";

// Be Vietnam Pro — font hỗ trợ tiếng Việt tốt nhất, sans-serif hiện đại
const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});


export const metadata: Metadata = {
  title: {
    default: "Hi Phim - Xem Phim Online HD Miễn Phí Mới Nhất 2026",
    template: "%s | Hi Phim",
  },
  description:
    "Hi Phim - Trang xem phim online HD miễn phí tốc độ cao #1 Việt Nam. Kho 50,000+ phim bộ, phim lẻ, anime vietsub mới nhất 2026. Cập nhật hàng ngày, không quảng cáo.",
  keywords: [
    "hi phim",
    "hiphim",
    "xem phim online",
    "phim HD miễn phí",
    "phim mới nhất 2026",
    "phim bộ hay",
    "phim lẻ chiếu rạp",
    "anime vietsub",
    "phim Hàn Quốc",
    "phim Trung Quốc",
    "phim Thái Lan",
    "phim hành động",
    "phim tình cảm",
    "phim kinh dị",
    "xem phim HD",
    "phim hay",
    "phim chất lượng cao",
    "phim vietsub",
    "phim thuyết minh",
  ],
  metadataBase: new URL("https://rapphimchill.app"),
  openGraph: {
    title: "Hi Phim - Xem Phim Online HD Miễn Phí #1 Việt Nam",
    description:
      "Kho 50,000+ phim HD mới nhất 2026. Phim bộ, phim lẻ, anime vietsub cập nhật hàng ngày. Xem miễn phí tại Hi Phim",
    url: "https://rapphimchill.app",
    siteName: "Hi Phim",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hi Phim - Xem Phim Online HD Miễn Phí",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hiphim",
    title: "Hi Phim - Xem Phim Online HD Miễn Phí",
    description: "Kho 50,000+ phim HD. Phim bộ, phim lẻ, anime vietsub mới nhất 2026.",
    images: ["/og-image.png"],
  },
  applicationName: "Hi Phim",
  referrer: "origin-when-cross-origin",
  creator: "Hi Phim Team",
  publisher: "Hi Phim",
  category: "Entertainment",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "https://rapphimchill.app" },
  verification: {
    google: "oOs1HYmXd-muliYGGR8v91joJyTEVTbr-mRtnIpXrPY",
    other: {
      "dmca-site-verification": "MkFjU1d2RTgwK1BXdndRaHRUMUpOd1BxdEFPRmg3RUhzRHIxWjFYM1BlMD01",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <head>
        {/* DMCA Site Verification */}
        <meta name="dmca-site-verification" content="MkFjU1d2RTgwK1BXdndRaHRUMUpOd1BxdEFPRmg3RUhzRHIxWjFYM1BlMD01" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hi Phim" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* DNS Preconnect — giảm độ trễ kết nối */}
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://phimapi.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://phimimg.com" />
        <link rel="dns-prefetch" href="https://img.ophim.live" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://player.phimapi.com" />

        {/* Facebook App ID */}
        <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID || "10000000000000"} />

        {/* Critical inline CSS — show body ngay lập tức */}
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              *,*::before,*::after{box-sizing:border-box}
              html{line-height:1.5;-webkit-text-size-adjust:100%;overflow-x:hidden}
              body{min-height:100dvh;background:#050a0f;color:#f7f8f9;margin:0}
            `,
          }}
        />

        {/* Theme init — blocking để tránh flash */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  var t=localStorage.getItem('rpc_theme')||'dark';
                  document.documentElement.classList.toggle('dark',t==='dark');
                  window.__INITIAL_THEME__=t;
                }catch(e){
                  document.documentElement.classList.add('dark');
                  window.__INITIAL_THEME__='dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${beVietnam.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <SplashScreen />

        {/* Google Tag Manager */}
        <GTM />
        <EnhancedGTMTracking />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WP2MWVB8"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Frontend Security */}
        <SecurityGuard />

        {/* Structured Data SEO */}
        <WebsiteStructuredData url="https://rapphimchill.app" />
        <OrganizationStructuredData url="https://rapphimchill.app" />

        <HydrationFix />

        {/* Main App — không còn MUI Provider */}
        <LoadingProvider>{children}</LoadingProvider>

        {/* Lazy-init sau khi page load */}
        <PWAInstaller />
        <PerformanceMonitor />

        {/* Global PiP player — persist across navigation */}
        <PipWrapper />

        {/* PWA Notification prompt */}
        <NotificationBanner />

        {/* Speculation Rules cho instant navigation */}
        <SpeculationRules />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: "hsl(217 19% 10%)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
