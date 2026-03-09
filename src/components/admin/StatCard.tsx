'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'highlight' | 'secondary';
}

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary border-accent',
    accent: 'bg-accent border-highlight',
    highlight: 'bg-highlight border-accent',
    secondary: 'bg-secondary border-primary'
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('vi-VN');
    }
    return val;
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-foreground opacity-70 mb-1'>
            {title}
          </p>
          <p className='text-2xl font-bold text-foreground'>
            {formatValue(value)}
          </p>
          {trend && (
            <div className='flex items-center mt-2'>
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className='text-xs text-foreground opacity-50 ml-1'>
                so với tuần trước
              </span>
            </div>
          )}
        </div>
        <div className='text-3xl opacity-80'>
          {icon}
        </div>
      </div>
    </div>
  );
}