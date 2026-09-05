import React from 'react';

interface MovieStructuredDataProps {
  movie: {
    name: string;
    origin_name?: string;
    content: string;
    poster_url: string;
    thumb_url?: string;
    year?: number;
    episode_current?: string;
    episode_total?: string;
    time?: string;
    lang?: string;
    quality?: string;
    category?: Array<{ name: string; slug: string }>;
    country?: Array<{ name: string; slug: string }>;
    actor?: string[];
    director?: string[];
    slug: string;
  };
  url: string;
}

interface WebsiteStructuredDataProps {
  url: string;
  name?: string;
  description?: string;
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function MovieStructuredData({ movie, url }: MovieStructuredDataProps) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.name,
      "alternateName": movie.origin_name,
      "description": movie.content,
      "image": [
        movie.poster_url,
        ...(movie.thumb_url ? [movie.thumb_url] : [])
      ],
      "url": url,
      "datePublished": movie.year ? `${movie.year}-01-01` : undefined,
      "inLanguage": movie.lang || "vi",
      "genre": movie.category?.map(cat => cat.name) || [],
      "actor": movie.actor?.map(actor => ({
        "@type": "Person",
        "name": actor
      })) || [],
      "director": movie.director?.map(director => ({
        "@type": "Person",
        "name": director
      })) || [],
      "countryOfOrigin": movie.country?.[0]?.name,
      "duration": movie.time,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "ratingCount": "1000",
        "bestRating": "5",
        "worstRating": "1"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": `Xem phim ${movie.name} HD`,
      "description": movie.content || `Xem phim ${movie.name} HD miễn phí.`,
      "thumbnailUrl": [
        movie.thumb_url || movie.poster_url,
        movie.poster_url
      ],
      "uploadDate": movie.year ? `${movie.year}-01-01T08:00:00+07:00` : new Date().toISOString(),
      "contentUrl": url,
      "embedUrl": url,
      "publisher": {
        "@type": "Organization",
        "name": "Hi Phim",
        "logo": {
          "@type": "ImageObject",
          "url": "https://rapphimchill.app/favicon.png"
        }
      }
    }
  ];

  // Remove undefined fields
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanStructuredData) }}
    />
  );
}

export function WebsiteStructuredData({ url, name = "Hi Phim", description }: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": name,
    "alternateName": ["Hi Phim", "HiPhim", "hiphim.app"],
    "url": url,
    "description": description || "Hi Phim - Trang xem phim online HD miễn phí hàng đầu Việt Nam. Kho 50,000+ phim bộ, phim lẻ, anime vietsub mới nhất 2026.",
    "inLanguage": "vi-VN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${url}/search?query={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Hi Phim",
      "url": url,
      "logo": {
        "@type": "ImageObject",
        "url": `${url}/favicon.png`,
        "width": 200,
        "height": 60
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData({ url }: { url: string }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Hi Phim",
    "url": url,
    "logo": `${url}/favicon.png`,
    "description": "Website xem phim HD chất lượng cao miễn phí hàng đầu Việt Nam",
    "sameAs": [
      "https://www.facebook.com/phimanh",
      "https://twitter.com/phimanh"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["Vietnamese", "English"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}