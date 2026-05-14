'use client';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle';
}

export default function AdBanner({ slot = '', format = 'horizontal' }: AdBannerProps) {
  // Hidden until AdSense approval
  return null;
}
