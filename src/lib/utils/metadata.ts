import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateToolMetadata(
  locale: string,
  toolKey: string,
  slug: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'tools' });

  const title = t(`${toolKey}.title`);
  const description = t(`${toolKey}.description`);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/tools/${slug}`,
      languages: {
        en: `/en/tools/${slug}`,
        zh: `/zh/tools/${slug}`,
      },
    },
    openGraph: {
      title: `${title} | PDF Tools`,
      description,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
    },
  };
}
