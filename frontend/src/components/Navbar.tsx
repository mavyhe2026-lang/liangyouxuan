'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Globe, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useState } from 'react';

const LOCALES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'ko', label: '한국어' },
];

const NAV_LABELS: Record<string, Record<string, string>> = {
  zh: { home: '首页', products: '产品', cart: '购物车', admin: '后台' },
  en: { home: 'Home', products: 'Products', cart: 'Cart', admin: 'Admin' },
  ko: { home: '홈', products: '상품', cart: '장바구니', admin: '관리자' },
};

export default function Navbar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCartStore(s => s.count());
  const [open, setOpen] = useState(false);
  const t = NAV_LABELS[locale] || NAV_LABELS['zh'];

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/') || '/');
  };

  const navLinks = [
    { href: `/${locale}`, label: t.home },
    { href: `/${locale}/products`, label: t.products },
    { href: `/${locale}/admin`, label: t.admin },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-xl text-gray-900">粮优选</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className={`text-sm font-medium transition-colors hover:text-red-600 ${pathname === l.href ? 'text-red-600' : 'text-gray-700'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                <Globe size={18} />
                <span className="text-sm hidden sm:block">{LOCALES.find(l => l.code === locale)?.label}</span>
              </button>
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity min-w-[100px] z-50">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => switchLocale(l.code)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${locale === l.code ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <Link href={`/${locale}/cart`} className="relative p-2 text-gray-700 hover:text-red-600">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {/* Mobile menu */}
            <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden border-t py-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
