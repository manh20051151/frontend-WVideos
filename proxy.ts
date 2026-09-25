import createMiddleware from 'next-intl/middleware';
import {routing} from './src/i18n/routing';

// Phát hiện ngôn ngữ từ Accept-Language/cookie rồi redirect về đúng prefix.
// /admin và các file tĩnh (có dấu chấm) bị loại trừ - admin giữ 1 ngôn ngữ.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
};
