'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/api';
import Navbar from '@/components/Navbar';

const T: Record<string, any> = {
  zh: { title: '购物车', empty: '购物车是空的', continue: '继续购物', qty: '数量', subtotal: '小计', total: '合计', checkout: '去结算', remove: '删除' },
  en: { title: 'Cart', empty: 'Your cart is empty', continue: 'Continue Shopping', qty: 'Qty', subtotal: 'Subtotal', total: 'Total', checkout: 'Checkout', remove: 'Remove' },
  ko: { title: '장바구니', empty: '장바구니가 비어 있습니다', continue: '쇼핑 계속', qty: '수량', subtotal: '소계', total: '합계', checkout: '결제하기', remove: '삭제' },
};

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'zh';
  const t = T[locale] || T.zh;
  const { items, removeItem, updateQty, total } = useCartStore();

  return (
    <>
      <Navbar locale={locale} />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-6">{t.empty}</p>
            <Link href={`/${locale}/products`} className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">{t.continue}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <img src={item.image || `https://picsum.photos/seed/${item.productId}/120/120`} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-50" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                  <p className="text-red-600 font-bold mt-1">¥{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)} className="w-8 h-8 rounded-full border border-gray-200 font-bold hover:border-red-400 transition-colors">-</button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)} className="w-8 h-8 rounded-full border border-gray-200 font-bold hover:border-red-400 transition-colors">+</button>
                </div>
                <p className="font-bold text-gray-900 w-20 text-right">¥{formatPrice(item.price * item.quantity)}</p>
                <button onClick={() => removeItem(item.productId, item.variantId)} className="text-gray-300 hover:text-red-500 transition-colors ml-2 text-xl">×</button>
              </div>
            ))}
            <div className="flex justify-between items-center border-t pt-6 mt-6">
              <Link href={`/${locale}/products`} className="text-gray-500 hover:text-red-600 text-sm">{t.continue}</Link>
              <div className="flex items-center gap-6">
                <span className="text-xl font-bold text-gray-900">{t.total}: <span className="text-red-600">¥{formatPrice(total())}</span></span>
                <button onClick={() => router.push(`/${locale}/checkout`)} className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">{t.checkout}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
