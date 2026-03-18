'use client';
import { useEffect, useState } from 'react';
import { getProducts, formatPrice } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

const T = {
  zh: { title: '全部产品', all: '全部', rice: '大米', dates: '大枣' },
  en: { title: 'All Products', all: 'All', rice: 'Rice', dates: 'Dates' },
  ko: { title: '전체 상품', all: '전체', rice: '쌀', dates: '대추' },
};

export default function ProductsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as keyof typeof T;
  const t = T[locale] || T.zh;
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (filter !== 'all') params.category = filter;
    getProducts(params).then(r => setProducts(r.data.data)).finally(() => setLoading(false));
  }, [filter]);

  const filters = [
    { key: 'all', label: t.all },
    { key: 'rice', label: t.rice },
    { key: 'dates', label: t.dates },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>
      <div className="flex gap-3 mb-8">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${filter === f.key ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          {locale === 'en' ? 'Loading...' : locale === 'ko' ? '로딩 중...' : '加载中...'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
