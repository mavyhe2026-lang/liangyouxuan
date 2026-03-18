'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useState } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Variant { id: string; spec: string; price: number; original_price: number; stock: number; }
interface Product {
  id: string; name_zh: string; name_en: string; name_ko: string;
  description_zh: string; image_url: string; category: string;
  variants: Variant[];
}

export default function ProductCard({ product, locale }: { product: Product; locale: string; }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0]);
  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();

  const getName = () => {
    if (locale === 'en') return product.name_en;
    if (locale === 'ko') return product.name_ko;
    return product.name_zh;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedVariant || selectedVariant.stock === 0) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: getName(),
      variantName: selectedVariant.spec,
      price: selectedVariant.price,
      quantity: 1,
      image: product.image_url || `https://picsum.photos/seed/${product.id}/400/400`,
    });
  };

  const addToCartLabel = locale === 'en' ? 'Add to Cart' : locale === 'ko' ? '장바구니' : '加入购物车';
  const buyNowLabel = locale === 'en' ? 'Buy Now' : locale === 'ko' ? '바로구매' : '立即购买';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group">
      <Link href={`/${locale}/products/${product.id}`}>
        <div className="relative h-56 bg-gray-50 overflow-hidden">
          <img
            src={product.image_url}
            alt={getName()}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {selectedVariant?.original_price && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              {locale === 'en' ? 'SALE' : locale === 'ko' ? '할인' : '特惠'}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/${locale}/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 text-base mb-3 hover:text-red-600 transition-colors">{getName()}</h3>
        </Link>

        {/* Variant selector */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.variants.map(v => (
            <button key={v.id} onClick={() => setSelectedVariant(v)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedVariant?.id === v.id ? 'border-red-500 bg-red-50 text-red-600 font-medium' : 'border-gray-200 text-gray-600 hover:border-red-300'} ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={v.stock === 0}>
              {v.spec}
            </button>
          ))}
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-red-600">{formatPrice(selectedVariant?.price || 0)}</span>
          {selectedVariant?.original_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(selectedVariant.original_price)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-500 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
            disabled={!selectedVariant || selectedVariant.stock === 0}>
            <ShoppingCart size={15} />
            {addToCartLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
