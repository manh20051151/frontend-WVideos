import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trang không tồn tại',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className='min-h-[60vh] flex items-center justify-center px-4'>
      <div className='text-center max-w-md'>
        <p className='text-6xl font-extrabold text-accent mb-4'>404</p>
        <h1 className='text-xl font-bold text-foreground mb-2'>Trang không tồn tại</h1>
        <p className='text-foreground opacity-70 mb-6'>
          Trang bạn tìm có thể đã bị xóa, đổi đường dẫn hoặc chưa từng tồn tại.
        </p>
        <Link href='/' className='btn-accent font-medium py-2 px-6 rounded-lg transition-colors'>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
