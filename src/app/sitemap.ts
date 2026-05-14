import { MetadataRoute } from 'next';

const tools = [
  'compress-pdf', 'merge-pdf', 'split-pdf', 'rotate-pdf',
  'remove-pages', 'pdf-to-image', 'image-to-pdf', 'add-watermark',
  'add-page-numbers', 'encrypt-pdf', 'decrypt-pdf', 'html-to-pdf',
  'compress-image', 'convert-image', 'image-to-ico',
  'compress-pdf-to-500kb', 'compress-pdf-to-1mb', 'compress-pdf-to-2mb',
  'pdf-to-png', 'pdf-to-jpg', 'jpg-to-pdf', 'png-to-pdf',
];

const locales = ['en', 'zh'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vavc.cn';
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    });

    for (const tool of tools) {
      entries.push({
        url: `${baseUrl}/${locale}/tools/${tool}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  return entries;
}
