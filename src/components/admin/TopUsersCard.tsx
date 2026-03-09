'use client';

import { UserStats } from '@/lib/apis/dashboard.api';

interface TopUsersCardProps {
  users: UserStats[];
}

export default function TopUsersCard({ users }: TopUsersCardProps) {
  const maxVideoCount = Math.max(...users.map(u => u.videoCount));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getAvatarColor = (username: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className='bg-secondary rounded-xl p-6 border border-accent shadow-sm'>
      <h3 className='text-lg font-semibold text-foreground mb-4'>
        👥 Top Người dùng
      </h3>
      
      <div className='space-y-4'>
        {users.map((user, index) => {
          const percentage = maxVideoCount > 0 ? (user.videoCount / maxVideoCount) * 100 : 0;
          
          return (
            <div key={user.userId} className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-sm font-bold text-foreground'>
                {index + 1}
              </div>
              
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold ${getAvatarColor(user.username)}`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-1'>
                  <div>
                    <p className='font-medium text-foreground truncate'>{user.username}</p>
                    <p className='text-xs text-foreground opacity-50 truncate'>{user.email}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-foreground'>{user.videoCount} video</p>
                    <p className='text-xs text-foreground opacity-50'>
                      👁️ {user.totalViews.toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                <div className='flex items-center space-x-2'>
                  <div className='flex-1 bg-primary rounded-full h-2 overflow-hidden'>
                    <div 
                      className='bg-accent h-full rounded-full transition-all duration-500 ease-out'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className='text-xs text-foreground opacity-50 mt-1'>
                  Tham gia: {formatDate(user.joinDate)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {users.length === 0 && (
        <div className='text-center py-8 text-foreground opacity-50'>
          <div className='text-4xl mb-2'>👤</div>
          <p>Chưa có người dùng nào</p>
        </div>
      )}
    </div>
  );
}