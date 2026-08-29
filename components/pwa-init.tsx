"use client";

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.unregister());
        });
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
        }
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (confirm('Có phiên bản mới! Tải lại trang?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch {
          // SW registration failed silently
        }
      });
    }
  }, []);

  return null;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only report vitals - no console spam in production
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const report = (metric: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Vitals] ${metric.name}:`, Math.round(metric.value), 'ms');
        }
        // GTM integration
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: 'web_vitals',
            metric_name: metric.name,
            metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          });
        }
      };
      onCLS(report);
      onINP(report);
      onFCP(report);
      onLCP(report);
      onTTFB(report);
    });
  }, []);

  return null;
}
