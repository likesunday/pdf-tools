import { Metadata } from 'next';
import { generateToolMetadata } from '@/lib/utils/metadata';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolMetadata(locale, 'imageToIco', 'compress-pdf');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
