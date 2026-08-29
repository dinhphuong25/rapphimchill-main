/**
 * Popular Country Helper & Metadata
 * Provides flags, popularity sorting, and comprehensive country list
 */

export interface CountryItem {
  name: string;
  slug: string;
  code?: string;
  popular?: boolean;
}

// Danh sách các quốc gia điện ảnh hàng đầu theo thứ tự ưu tiên
export const POPULAR_COUNTRIES: CountryItem[] = [
  { name: "Trung Quốc", slug: "trung-quoc", code: "CN", popular: true },
  { name: "Hàn Quốc", slug: "han-quoc", code: "KR", popular: true },
  { name: "Âu Mỹ", slug: "au-my", code: "US", popular: true },
  { name: "Nhật Bản", slug: "nhat-ban", code: "JP", popular: true },
  { name: "Thái Lan", slug: "thai-lan", code: "TH", popular: true },
  { name: "Việt Nam", slug: "viet-nam", code: "VN", popular: true },
  { name: "Hồng Kông", slug: "hong-kong", code: "HK", popular: true },
  { name: "Ấn Độ", slug: "an-do", code: "IN", popular: true },
  { name: "Đài Loan", slug: "dai-loan", code: "TW", popular: true },
  { name: "Pháp", slug: "phap", code: "FR", popular: true },
  { name: "Anh", slug: "anh", code: "GB", popular: true },
  { name: "Đức", slug: "duc", code: "DE", popular: true },
];

export const COUNTRY_CODE_MAP: Record<string, string> = {
  "trung-quoc": "CN",
  "han-quoc": "KR",
  "au-my": "US",
  "my": "US",
  "nhat-ban": "JP",
  "thai-lan": "TH",
  "viet-nam": "VN",
  "hong-kong": "HK",
  "an-do": "IN",
  "dai-loan": "TW",
  "phap": "FR",
  "anh": "GB",
  "duc": "DE",
  "y": "IT",
  "tây-ban-nha": "ES",
  "tay-ban-nha": "ES",
  "canada": "CA",
  "uc": "AU",
  "ha-lan": "NL",
  "bi": "BE",
  "thuy-dien": "SE",
  "thuy-si": "CH",
  "na-uy": "NO",
  "dan-mach": "DK",
  "nga": "RU",
  "mexico": "MX",
  "brazil": "BR",
  "philippines": "PH",
  "malaysia": "MY",
  "indonesia": "ID",
  "tho-nhi-ky": "TR",
  "singapore": "SG",
};

export function getCountryCode(slug: string): string {
  return COUNTRY_CODE_MAP[slug] || "WW";
}

export function sortCountriesByPopularity(rawCountries: { name: string; slug: string }[]): CountryItem[] {
  if (!Array.isArray(rawCountries) || rawCountries.length === 0) {
    return POPULAR_COUNTRIES;
  }

  const popularSlugs = new Set(POPULAR_COUNTRIES.map((c) => c.slug));
  const popularList: CountryItem[] = [];
  const remainingList: CountryItem[] = [];

  // Match popular ones first in defined order
  POPULAR_COUNTRIES.forEach((pop) => {
    const matched = rawCountries.find((c) => c.slug === pop.slug || (pop.slug === "au-my" && c.slug === "my"));
    if (matched) {
      popularList.push({
        name: matched.name,
        slug: matched.slug,
        code: pop.code,
        popular: true,
      });
    } else {
      popularList.push(pop);
    }
  });

  // Collect other countries
  rawCountries.forEach((c) => {
    if (!popularSlugs.has(c.slug) && c.slug !== "my") {
      remainingList.push({
        name: c.name,
        slug: c.slug,
        code: getCountryCode(c.slug),
        popular: false,
      });
    }
  });

  // Sort remaining alphabetically by Vietnamese collator
  remainingList.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return [...popularList, ...remainingList];
}
