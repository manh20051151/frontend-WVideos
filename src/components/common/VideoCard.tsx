import Link from 'next/link';
import Image from 'next/image';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  views: number;
  duration: string;
  createdAt: string;
}

export default function VideoCard({
  id,
  title,
  thumbnail,
  author,
  views,
  duration,
  createdAt,
}: VideoCardProps) {
  return (
    <Link href={`/videos/${id}`} className='group'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow'>
        <div className='relative aspect-video'>
          <Image
            src={thumbnail}
            alt={title}
            fill
            className='object-cover group-hover:scale-105 transition-transform'
          />
          <span className='absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded'>
            {duration}
          </span>
        </div>
        <div className='p-4'>
          <h3 className='font-semibold text-lg line-clamp-2 mb-2'>{title}</h3>
          <p className='text-sm text-gray-600'>{author}</p>
          <div className='flex items-center justify-between mt-2 text-sm text-gray-500'>
            <span>{views.toLocaleString()} lượt xem</span>
            <span>{new Date(createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
