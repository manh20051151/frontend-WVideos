'use client';

import { CategoryStats } from '@/lib/apis/dashboard.api';

interface TopCategoriesCardProps {
  categories: CategoryStats[];
}

export default function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  const maxVideoCount = Math.max(...categories.map(c => c.videoCount));

  return (
    <div className='bg-secondary rounded-xl p-6 border border-accent shadow-sm'>
      <h3 className='text-lg font-semibold text-foreground mb-4'>
        🏆 Top Thể loại
      </h3>
      
      <div className='space-y-4'>
        {categories.map((category, index) => {
          const percentage = maxVideoCount > 0 ? (category.videoCount / maxVideoCount) * 100 : 0;
          
          return (
            <div key={category.categoryId} className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-foreground'>
                {index + 1}
              </div>
              
              <div className='flex-1'>
                <div className='flex items-center space-x-2 mb-1'>
                  <span className='text-lg'>{category.categoryIcon}</span>
                  <span className='font-medium text-foreground'>{category.categoryName}</span>
                </div>
                
                <div className='flex items-center space-x-2'>
                  <div className='flex-1 bg-primary rounded-full h-2 overflow-hidden'>
                    <div 
                      className='h-full rounded-full transition-all duration-500 ease-out'
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: category.categoryColor || 'var(--color-accent)'
                      }}
                    />
                  </div>
                  <div className='text-sm text-foreground opacity-70 min-w-0'>
                    {category.videoCount} video
                  </div>
                </div>
                
                <div className='text-xs text-foreground opacity-50 mt-1'>
                  👁️ {category.totalViews.toLocaleString('vi-VN')} lượt xem
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {categories.length === 0 && (
        <div className='text-center py-8 text-foreground opacity-50'>
          <div className='text-4xl mb-2'>📂</div>
          <p>Chưa có thể loại nào</p>
        </div>
      )}
    </div>
  );
}