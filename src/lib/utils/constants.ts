export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const VIDEO_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  UPLOAD: '/upload',
  ADMIN: '/admin',
} as const;
