import {defineRouting} from 'next-intl/routing';

// Danh sách ngôn ngữ hệ thống hỗ trợ. 'vi' là mặc định (không prefix trên URL,
// giữ nguyên mọi link đang được Google index), các ngôn ngữ khác có prefix /en, /zh...
export const routing = defineRouting({
  locales: ['vi', 'en', 'zh', 'ja', 'ko', 'hi', 'th', 'lo', 'km'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];

// Tên hiển thị ngôn ngữ (dùng cho menu chọn ngôn ngữ)
export const LOCALE_NAMES: Record<AppLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文 (简体)',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  th: 'ไทย',
  lo: 'ລາວ',
  km: 'ភាសាខ្មែរ',
};

// Map locale UI -> locale bản dịch video (Gemini dùng mã BCP-47 đầy đủ)
export const CONTENT_LOCALE_MAP: Record<string, string> = {
  vi: 'vi',
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  hi: 'hi',
  th: 'th',
  lo: 'lo',
  km: 'km',
};
