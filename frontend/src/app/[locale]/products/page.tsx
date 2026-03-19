'use client';
import { useEffect, useState } from 'react';
import { getProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

const T = {
  zh: { title: '全部产品', all: '全部', loading: '加载中...', empty: '该分类暂无产品' },
  en: { title: 'All Products', all: 'All', loading: 'Loading...', empty: 'No products in this category' },
  ko: { title: '전체 상품', all: '전체', loading: '로딩 중...', empty: '해당 카테고리에 상품이 없습니다' },
};

interface Category {
  id: string;
  name_zh: string; name_en: string; name_ko: string;
  slug: string; icon: string;
  children?: Category[];
}

export default function ProductsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as keyof typeof T;
  const t = T[locale] || T.zh;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeL1, setActiveL1] = useState<string>('all');   // 一级分类 slug
  const [activeL2, setActiveL2] = useState<string | null>(null); // 二级分类 id
  const [loading, setLoading] = useState(true);

  // 获取分类树
  useEffect(() => {
    getCategories().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  // 获取产品
  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (activeL2) {
      params.category_id = activeL2;
    } else if (activeL1 !== 'all') {
      params.slug = activeL1;
    }
    getProducts(params)
      .then(r => setProducts(r.data.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeL1, activeL2]);

  const getName = (cat: Category) => {
    if (locale === 'en') return cat.name_en;
    if (locale === 'ko') return cat.name_ko;
    return cat.name_zh;
  };

  // 当前一级分类的二级分类列表
  const activeL1Cat = categories.find(c => c.slug === activeL1);
  const subCategories = activeL1Cat?.children || [];

  const handleL1Click = (slug: string) => {
    setActiveL1(slug);
    setActiveL2(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.title}</h1>

      {/* 一级分类 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => handleL1Click('all')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeL1 === 'all' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300'}`}
        >
          {t.all}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleL1Click(cat.slug)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeL1 === cat.slug ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-300'}`}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {getName(cat)}
          </button>
        ))}
      </div>

      {/* 二级分类（只在选中一级分类时显示）*/}
      {activeL1 !== 'all' && subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pl-2 border-l-4 border-red-100">
          <button
            onClick={() => setActiveL2(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeL2 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
          >
            {locale === 'zh' ? '全部' : locale === 'en' ? 'All' : '전체'}
          </button>
          {subCategories.map(sub => (
            <button
              key={sub.id}
              onClick={() => setActiveL2(sub.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${activeL2 === sub.id ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
            >
              {getName(sub)}
            </button>
          ))}
        </div>
      )}

      {/* 面包屑提示 */}
      {(activeL1 !== 'all' || activeL2) && (
        <div className="text-sm text-gray-400 mb-6">
          {locale === 'zh' ? '当前筛选：' : locale === 'en' ? 'Filtered by: ' : '필터: '}
          {activeL1 !== 'all' && <span className="text-red-500 font-medium">{activeL1Cat ? getName(activeL1Cat) : ''}</span>}
          {activeL2 && (
            <>
              <span className="mx-1">›</span>
              <span className="text-red-500 font-medium">
                {subCategories.find(s => s.id === activeL2) ? getName(subCategories.find(s => s.id === activeL2)!) : ''}
              </span>
            </>
          )}
        </div>
      )}

      {/* 产品列表 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">{t.loading}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">{t.empty}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
