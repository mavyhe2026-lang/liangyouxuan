'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, formatPrice } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { ChevronRight, Star, Truck, ShieldCheck } from 'lucide-react';

const HERO = {
  zh: { title: '品质粮食，直达您家', sub: '精选东北大米·新疆大枣，新鲜直送，品质保证', btn: '立即选购', featured: '精选产品', why: '为什么选择我们' },
  en: { title: 'Premium Grains, Delivered to Your Door', sub: 'Northeast Rice & Xinjiang Dates — Fresh, Quality Guaranteed', btn: 'Shop Now', featured: 'Featured Products', why: 'Why Choose Us' },
  ko: { title: '프리미엄 곡물, 집까지 배달', sub: '동북 쌀 & 신장 대추 — 신선하고 품질 보장', btn: '지금 쇼핑하기', featured: '추천 상품', why: '왜 저희를 선택해야 할까요' },
};

const FEATURES = {
  zh: [
    { icon: <ShieldCheck size={28} className="text-red-500" />, title: '品质保证', desc: '严格把控原材料质量，让您吃得放心' },
    { icon: <Truck size={28} className="text-red-500" />, title: '京东物流', desc: '24小时发货，全程物流追踪' },
    { icon: <Star size={28} className="text-red-500" />, title: '好评如潮', desc: '万余名顾客好评，值得信赖' },
  ],
  en: [
    { icon: <ShieldCheck size={28} className="text-red-500" />, title: 'Quality Assured', desc: 'Strict quality control, eat with confidence' },
    { icon: <Truck size={28} className="text-red-500" />, title: 'JD Logistics', desc: '24h shipping, full tracking' },
    { icon: <Star size={28} className="text-red-500" />, title: 'Top Rated', desc: '10,000+ happy customers' },
  ],
  ko: [
    { icon: <ShieldCheck size={28} className="text-red-500" />, title: '품질 보장', desc: '엄격한 품질 관리' },
    { icon: <Truck size={28} className="text-red-500" />, title: '징둥 물류', desc: '24시간 내 발송, 전체 추적' },
    { icon: <Star size={28} className="text-red-500" />, title: '높은 평점', desc: '만 명 이상의 만족 고객' },
  ],
};

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale as 'zh' | 'en' | 'ko';
  const t = HERO[locale] || HERO.zh;
  const features = FEATURES[locale] || FEATURES.zh;
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    getProducts().then(r => setProducts(r.data.data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-500 to-orange-400 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">🌾</div>
          <div className="absolute bottom-10 right-10 text-9xl">🍚</div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">{t.title}</h1>
          <p className="text-lg sm:text-xl text-red-100 mb-10 max-w-2xl mx-auto">{t.sub}</p>
          <Link href={`/${locale}/products`}
            className="inline-flex items-center gap-2 bg-white text-red-600 font-bold px-8 py-4 rounded-full text-lg hover:bg-red-50 transition-colors shadow-lg">
            {t.btn} <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">{t.why}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t.featured}</h2>
          <Link href={`/${locale}/products`} className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
            {locale === 'en' ? 'View All' : locale === 'ko' ? '전체 보기' : '查看全部'} <ChevronRight size={16} />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {locale === 'en' ? 'Loading products...' : locale === 'ko' ? '로딩 중...' : '加载中...'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} locale={locale} />)}
          </div>
        )}
      </section>
    </div>
  );
}
