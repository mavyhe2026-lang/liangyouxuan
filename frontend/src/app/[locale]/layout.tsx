import Navbar from '@/components/Navbar';
import './../../app/globals.css';

export default function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={params.locale} />
      <main>{children}</main>
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16 text-center text-sm">
        <p>© 2024 粮优选 · Premium Grains · 프리미엄 곡물</p>
        <p className="mt-1">品质保证 | Quality Guaranteed | 품질 보장</p>
      </footer>
    </div>
  );
}
