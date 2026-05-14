'use client';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle';
}

export default function AdBanner({ slot = '', format = 'horizontal' }: AdBannerProps) {
  const sizeClasses = {
    horizontal: 'h-24 w-full',
    vertical: 'w-40 h-[600px]',
    rectangle: 'w-[300px] h-[250px]',
  };

  return (
    <div className={`${sizeClasses[format]} bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center`}>
      <span className="text-gray-400 text-sm">Ad Space</span>
    </div>
  );
}
