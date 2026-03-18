'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, formatPrice } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import Navbar from '@/components/Navbar';

const T: Record<string, any> = {
  zh: { back: '返回产品列表', spec: '规格', stock: '库存', desc: '产品描述', add: '加入购物车', buy: '立即购买', added: '已加入购物车！', in_stock: '有货', out: '缺货', units: '件' },
  en: { back: 'Back to Products', spec: 'Spec', stock: 'Stock', desc: 'Description', add: 'Add to Cart', buy: 'Buy Now', added: 'Added to cart!', in_stock: 'In Stock', out: 'Out of Stock', units: 'units' },
  ko: { back: '상품 목록으로', spec: '규격', stock: '재고', desc: '상품 설명', add: '장바구니', buy: '바로 구매', added: '장바구니에 추가됨!', in_stock: '재고 있음', out: '품절', units: '개' },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'zh';
  const id = params.id as string;
  const t = T[locale] || T.zh;
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    getProduct(id).then(r => {
      setProduct(r.data.data);
      if (r.data.data?.variants?.length) setSelectedVariant(r.data.data.variants[0]);
    });
  }, [id]);

  const handleAdd = () => {
    if (!product || !selectedVariant) return;
    addItem({ productId: product.id, variantId: selectedVariant.id, name: product.name, variantName: selectedVariant.spec, price: selectedVariant.price, quantity: qty, image: product.image });
    setMsg(t.added);
    setTimeout(() => setMsg(''), 2000);
  };

  const handleBuy = () => { handleAdd(); router.push(`/${locale}/cart`); };

  if (!product) return (
    <><Navbar locale={locale} />
    <div className="flex items-center justify-center h-64 text-gray-400">
      {locale === 'en' ? 'Loading...' : locale === 'ko' ? '로딩 중...' : '加载中...'}
    </div></>
  );

  const price = selectedVariant?.price ?? 0;
  const originalPrice = selectedVariant?.original_price;

  return (
    <>
      <Navbar locale={locale} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link href={`/${locale}/products`} className="text-sm text-gray-500 hover:text-red-600 mb-6 inline-block">← {t.back}</Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-gray-50 aspect-square">
            <img src={product.image || `https://picsum.photos/seed/${product.id}/600/600`} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="inline-block bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">{product.category === 'rice' ? (locale === 'en' ? 'Rice' : locale === 'ko' ? '쌀' : '大米') : (locale === 'en' ? 'Dates' : locale === 'ko' ? '대추' : '大枣')}</span>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-red-600">¥{formatPrice(price)}</span>
              {originalPrice && <span className="text-lg text-gray-400 line-through">¥{formatPrice(originalPrice)}</span>}
            </div>
            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">{t.spec}</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedVariant?.id === v.id ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700 hover:border-red-300'}`}>
                      {v.spec}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Stock */}
            <p className="text-sm text-gray-500">
              {t.stock}: <span className={selectedVariant?.stock > 0 ? 'text-green-600' : 'text-red-500'}>{selectedVariant?.stock > 0 ? `${selectedVariant.stock} ${t.units}` : t.out}</span>
            </p>
            {/* Qty */}
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border border-gray-200 text-xl font-bold hover:border-red-400 transition-colors">-</button>
              <span className="text-xl font-semibold w-8 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 rounded-full border border-gray-200 text-xl font-bold hover:border-red-400 transition-colors">+</button>
            </div>
            {msg && <p className="text-green-600 font-medium text-sm">{msg}</p>}
            <div className="flex gap-3 mt-2">
              <button onClick={handleAdd} className="flex-1 border-2 border-red-600 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 transition-colors">{t.add}</button>
              <button onClick={handleBuy} className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors">{t.buy}</button>
            </div>
            {/* Description */}
            {product.description && (
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t.desc}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
