import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Link/router tự thêm prefix locale vào URL (vi không có prefix)
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
