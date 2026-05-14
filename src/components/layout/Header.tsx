'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from '../shared/LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4B83FF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PDF</span>
            </div>
            <span className="font-bold text-xl text-gray-900">PDF Tools</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('home')}
            </Link>
            <Link href="/#pdf-tools" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('pdfTools')}
            </Link>
            <Link href="/#image-tools" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('imageTools')}
            </Link>
          </nav>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-gray-900 py-2"
            >
              {t('home')}
            </Link>
            <Link
              href="/#pdf-tools"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-gray-900 py-2"
            >
              {t('pdfTools')}
            </Link>
            <Link
              href="/#image-tools"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-600 hover:text-gray-900 py-2"
            >
              {t('imageTools')}
            </Link>
            <div className="pt-2 border-t border-gray-100">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
