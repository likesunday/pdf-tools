'use client';

import { Link } from '@/i18n/routing';

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

export default function ToolCard({ title, description, href, icon, color }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#4B83FF] active:border-[#4B83FF] active:bg-blue-50 transition-all duration-200"
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <span>{icon}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#4B83FF] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
