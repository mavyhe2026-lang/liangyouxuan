import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '粮优选 - 品质粮食直送',
  description: '精选东北大米、新疆大枣，新鲜直送',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
