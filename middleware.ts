// Security & Performance Middleware for Next.js
// Protects against common attacks and optimizes performance

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Blocked user agents (common scraper bots)
const BLOCKED_USER_AGENTS = [
    'httrack',
    'wget',
    'curl',
    'scrapy',
    'python-requests',
    'go-http-client',
    'java/',
    'libwww-perl',
    'apache-httpclient',
    'http.rb',
    'gptbot',
    'chatgpt-user',
    'ccbot',
    'anthropic-ai',
    'claude-web',
];

// Blocked paths - prevent access to sensitive files
const BLOCKED_PATHS = [
    '/.env',
    '/.git',
    '/wp-admin',
    '/wp-login',
    '/phpmyadmin',
    '/admin.php',
    '/.htaccess',
    '/config.php',
    '/xmlrpc.php',
];

// Cache-friendly paths (static assets that can be cached aggressively)
const CACHE_ASSET_PATHS = [
    /^\/_next\/static\//,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
];

function isBlockedUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;

    const lowerUA = userAgent.toLowerCase();
    return BLOCKED_USER_AGENTS.some(blocked => lowerUA.includes(blocked));
}

function isBlockedPath(pathname: string): boolean {
    const lowerPath = pathname.toLowerCase();
    return BLOCKED_PATHS.some(blocked => lowerPath.startsWith(blocked));
}

function isCacheableAsset(pathname: string): boolean {
    return CACHE_ASSET_PATHS.some(pattern => pattern.test(pathname));
}

// -------------------------------------------------------------
// IN-MEMORY RATE LIMITER (Hoạt động độc lập trên mỗi Edge Node)
// -------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 10000; // 10 giây
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests / 10s (~6 req/s)

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Flush cache cũ để không bị memory leak trên quá trình chạy dài
    if (rateLimitMap.size > 5000) {
        const entriesToDelete: string[] = [];
        rateLimitMap.forEach((data, key) => {
            if (data.resetTime < now) entriesToDelete.push(key);
        });
        entriesToDelete.forEach(key => rateLimitMap.delete(key));
        
        // Nếu vẫn đầy sau khi xóa, clear trắng luôn để cứu memory
        if (rateLimitMap.size > 5000) rateLimitMap.clear();
    }

    const requestData = rateLimitMap.get(ip);
    
    if (!requestData || requestData.resetTime < now) {
        // IP mới hoặc đã qua window cũ
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (requestData.count >= MAX_REQUESTS_PER_WINDOW) {
        // Block
        return false;
    }

    // Tăng count
    requestData.count++;
    rateLimitMap.set(ip, requestData);
    return true;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // 1. Restrict HTTP Methods to GET, POST, HEAD, OPTIONS (Block PUT, DELETE, PATCH, TRACE, CONNECT)
    const ALLOWED_METHODS = ['GET', 'POST', 'HEAD', 'OPTIONS'];
    if (!ALLOWED_METHODS.includes(request.method.toUpperCase())) {
        return new NextResponse('Method Not Allowed', { status: 405 });
    }

    // Canonical host normalization: redirect www to apex so Google indexes one URL set only.
    if (request.nextUrl.hostname === 'www.rapphimchill.app') {
        const canonicalUrl = request.nextUrl.clone();
        canonicalUrl.hostname = 'rapphimchill.app';
        return NextResponse.redirect(canonicalUrl, 308);
    }

    // Anti-DDoS Rate Limiting
    if (ip !== 'unknown' && !checkRateLimit(ip)) {
        return new NextResponse('Too Many Requests - Anti DDoS Triggered', { 
            status: 429,
            headers: {
                'Retry-After': '10',
                'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
                'X-RateLimit-Remaining': '0',
            }
        });
    }

    // Block suspicious paths
    if (isBlockedPath(pathname)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Block known scraper bots
    if (isBlockedUserAgent(userAgent)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 2. Open Redirect Mitigation: Sanitize suspicious redirect parameters (Exclude /api/ routes which proxy internal/external APIs)
    const url = request.nextUrl.clone();
    let hasModifiedParams = false;
    
    if (!pathname.startsWith('/api/')) {
        const redirectParams = ['url', 'redirect', 'next', 'goto', 'target', 'dest'];
        redirectParams.forEach(param => {
            const value = url.searchParams.get(param);
            if (value) {
                // If the redirect parameter points to an absolute external domain, strip it to prevent open redirect
                if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
                    try {
                        const parsed = new URL(value, request.nextUrl.origin);
                        const isAllowedHost = 
                            parsed.hostname === request.nextUrl.hostname ||
                            parsed.hostname === 'rapphimchill.app' ||
                            parsed.hostname.endsWith('phimapi.com');
                        if (!isAllowedHost) {
                            url.searchParams.delete(param);
                            hasModifiedParams = true;
                        }
                    } catch {
                        url.searchParams.delete(param);
                        hasModifiedParams = true;
                    }
                }
            }
        });
    }

    // Strip URL tracking parameters to ensure ISR cache hit (Facebook fbclid issue)
    const trackingParams = [
        'fbclid', 'gclid', 'wbraid', 'gbraid', 'ref', 'source',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
    ];
    
    trackingParams.forEach(param => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasModifiedParams = true;
        }
    });

    if (hasModifiedParams) {
        // Redirect to the clean URL so it hits the static Next.js cache and prevents open redirect
        return NextResponse.redirect(url, 307);
    }

    // Continue with request
    const response = NextResponse.next();

    // Add security headers (Resolves Security Headers Audit P1 findings)
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    
    // Add compression headers for better performance
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Add cache headers for static assets
    if (isCacheableAsset(pathname)) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Add performance timing header for monitoring
    response.headers.set('X-Response-Time', new Date().getTime().toString());

    return response;
}

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
