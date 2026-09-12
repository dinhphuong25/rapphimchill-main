import type { Movie, MovieListItem, MovieEpisode, Pagination } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hiphim.biz";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const REFERER = APP_URL;

import { normalizeImageUrl } from "@/lib/image-helper";

function normalizeCdnUrl(url: string | undefined, cdnDomain: string): string {
  return normalizeImageUrl(url, cdnDomain);
}

function normalizeItems(items: any[], cdnDomain: string): any[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    thumb_url: normalizeCdnUrl(item.thumb_url, cdnDomain),
    poster_url: normalizeCdnUrl(item.poster_url, cdnDomain),
  }));
}

export default class PhimApi {
  private apiUrl = "https://phimapi.com";
  private defaultCdnDomain = "https://phimimg.com";

  private fetchHeaders() {
    return {
      Referer: REFERER,
      "User-Agent": USER_AGENT,
    };
  }

  async get(slug: string): Promise<{ movie: Movie; server: MovieEpisode[] }> {
    const url = `${this.apiUrl}/phim/${slug}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 600 }, // Cache 10 phút — phục vụ hàng nghìn user tức thì
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    // Normalize movie image URLs
    const cdnDomain = this.defaultCdnDomain;
    const movie = {
      ...data.movie,
      thumb_url: normalizeCdnUrl(data.movie?.thumb_url, cdnDomain),
      poster_url: normalizeCdnUrl(data.movie?.poster_url, cdnDomain),
    };

    return {
      movie,
      server: data.episodes || [],
    };
  }

  listTopics(): Array<{ name: string; slug: string }> {
    return [
      { name: "Phim Chiếu Rạp", slug: "phim-chieu-rap" },
      { name: "Phim Bộ", slug: "phim-bo" },
      { name: "Phim Lẻ", slug: "phim-le" },
      { name: "Phim Hoạt Hình", slug: "hoat-hinh" },
    ];
  }

  async listCategories(): Promise<any[]> {
    const url = `${this.apiUrl}/the-loai`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 86400 }, // Cache 24 giờ
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data?.items)) return data.data.items;
    return [];
  }

  async listCountries(): Promise<any[]> {
    const url = `${this.apiUrl}/quoc-gia`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 86400 }, // Cache 24 giờ
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data?.items)) return data.data.items;
    return [];
  }

  async getList(
    isCategory: boolean | null | undefined,
    slug: string | null | undefined,
    index: number = 1
  ): Promise<[MovieListItem[], Pagination]> {
    if (isCategory === true && slug) return this.byCategory(slug, index);
    if (isCategory === false && slug) return this.byTopic(slug, index);
    return this.newAdding(index);
  }

  async newAdding(index: number = 1, limit: number = 24): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/phim-moi-cap-nhat?page=${index}&limit=${limit}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 60 }, // Cache 60s để luôn cập nhật tập mới
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    const items = data?.data?.items || data?.items || [];
    const pagination = data?.data?.params?.pagination || data?.pagination;
    return [normalizeItems(items, cdnDomain), pagination];
  }

  async search(query: string, index: number = 1): Promise<[MovieListItem[], Pagination | null]> {
    const url = `${this.apiUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=20&page=${index}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination || null];
  }

  async byCategory(slug: string, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/the-loai/${slug}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async byTopic(slug: string, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/${slug}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async byYear(year: string | number, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/nam-phat-hanh/${year}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async getTopicItems(slug: string, limit: number = 6): Promise<MovieListItem[]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/${slug}?page=1&limit=${limit}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return normalizeItems((data?.data?.items || []).slice(0, limit), cdnDomain);
  }

  async getFilteredList(params: {
    typeList?: string;
    page?: number;
    sortField?: string;
    sortType?: string;
    sortLang?: string;
    category?: string;
    country?: string;
    year?: number | string;
    limit?: number;
  }): Promise<[MovieListItem[], Pagination]> {
    const {
      typeList = "phim-bo",
      page = 1,
      sortField = "modified.time",
      sortType = "desc",
      sortLang,
      category,
      country,
      year,
      limit = 20,
    } = params;

    let url = `${this.apiUrl}/v1/api/danh-sach/${typeList}?page=${page}&sort_field=${sortField}&sort_type=${sortType}&limit=${limit}`;
    if (sortLang) url += `&sort_lang=${sortLang}`;
    if (category) url += `&category=${category}`;
    if (country) url += `&country=${country}`;
    if (year) url += `&year=${year}`;

    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 900 }, // Cache 15 phút
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }
}
