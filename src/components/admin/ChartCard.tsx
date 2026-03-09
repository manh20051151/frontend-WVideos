'use client';

import { DailyStats } from '@/lib/apis/dashboard.api';

interface ChartCardProps {
  title: string;
  data: DailyStats[];
  type: 'users' | 'videos' | 'views';
}

export default function ChartCard({ title, data, type }: ChartCardProps) {
  const getDataValue = (item: DailyStats) => {
    switch (type) {
      case 'users': return item.newUsers;
      case 'videos': return item.newVideos;
      case 'views': return item.totalViews;
      default: return 0;
    }
  };

  const maxValue = Math.max(...data.map(getDataValue));
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className='bg-secondary rounded-xl p-6 border border-accent shadow-sm'>
      <h3 className='text-lg font-semibold text-foreground mb-4'>{title}</h3>
      
      <div className='space-y-3'>
        {data.slice().reverse().map((item, index) => {
          const value = getDataValue(item);
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={item.date} className='flex items-center space-x-3'>
              <div className='w-16 text-xs text-foreground opacity-70'>
                {formatDate(item.date)}
              </div>
              <div className='flex-1'>
                <div className='bg-primary rounded-full h-2 overflow-hidden'>
                  <div 
                    className='bg-accent h-full rounded-full transition-all duration-500 ease-out'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className='w-12 text-right text-sm font-medium text-foreground'>
                {value.toLocaleString('vi-VN')}
              </div>
            </div>
          );
        })}
      </div>
      
      {data.length === 0 && (
        <div className='text-center py-8 text-foreground opacity-50'>
          <div className='text-4xl mb-2'>📊</div>
          <p>Chưa có dữ liệu</p>
        </div>
      )}
    </div>
  );
}