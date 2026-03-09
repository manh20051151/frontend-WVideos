'use client';

interface VideoStatusChartProps {
  uploading: number;
  processing: number;
  ready: number;
  failed: number;
}

export default function VideoStatusChart({ uploading, processing, ready, failed }: VideoStatusChartProps) {
  const total = uploading + processing + ready + failed;
  
  const statuses = [
    { label: 'Sẵn sàng', value: ready, color: 'bg-green-500', icon: '✅' },
    { label: 'Đang xử lý', value: processing, color: 'bg-blue-500', icon: '⏳' },
    { label: 'Đang upload', value: uploading, color: 'bg-yellow-500', icon: '📤' },
    { label: 'Thất bại', value: failed, color: 'bg-red-500', icon: '❌' },
  ];

  return (
    <div className='bg-secondary rounded-xl p-6 border border-accent shadow-sm'>
      <h3 className='text-lg font-semibold text-foreground mb-4'>
        📊 Trạng thái Video
      </h3>
      
      {total > 0 ? (
        <>
          {/* Donut Chart */}
          <div className='flex items-center justify-center mb-6'>
            <div className='relative w-32 h-32'>
              <svg className='w-32 h-32 transform -rotate-90' viewBox='0 0 36 36'>
                <path
                  className='text-primary'
                  stroke='currentColor'
                  strokeWidth='3'
                  fill='transparent'
                  d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                />
                
                {/* Render each segment */}
                {(() => {
                  let cumulativePercentage = 0;
                  return statuses.map((status, index) => {
                    if (status.value === 0) return null;
                    
                    const percentage = (status.value / total) * 100;
                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                    const strokeDashoffset = -cumulativePercentage;
                    
                    cumulativePercentage += percentage;
                    
                    return (
                      <path
                        key={index}
                        className={status.color.replace('bg-', 'text-')}
                        stroke='currentColor'
                        strokeWidth='3'
                        fill='transparent'
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                      />
                    );
                  });
                })()}
              </svg>
              
              {/* Center text */}
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-center'>
                  <div className='text-xl font-bold text-foreground'>{total}</div>
                  <div className='text-xs text-foreground opacity-50'>Video</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className='space-y-3'>
            {statuses.map((status, index) => {
              const percentage = total > 0 ? ((status.value / total) * 100).toFixed(1) : '0';
              
              return (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className='text-sm text-foreground'>{status.icon} {status.label}</span>
                  </div>
                  <div className='text-right'>
                    <span className='text-sm font-medium text-foreground'>{status.value}</span>
                    <span className='text-xs text-foreground opacity-50 ml-1'>({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className='text-center py-8 text-foreground opacity-50'>
          <div className='text-4xl mb-2'>📹</div>
          <p>Chưa có video nào</p>
        </div>
      )}
    </div>
  );
}