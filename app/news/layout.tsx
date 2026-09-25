import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Tin tức', template: '%s | snha' },
  description: 'Tin tức mới nhất về video, người nổi tiếng và làng giải trí Việt Nam.',
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
