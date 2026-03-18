'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { createOrder, formatPrice } from '@/lib/api';
import Navbar from '@/components/Navbar';

const T: Record<string, any> = {
  zh: { title: '结账', contact: '联系信息', name: '姓名', phone: '手机号', email: '邮箱（选填）', address: '收货地址', province: '省份', city: '城市', detail: '详细地址', postal: '邮政编码', payment: '支付方式', wechat: '微信支付', alipay: '支付宝', summary: '订单摘要', submit: '提交订单', note: '备注（选填）', total: '合计', loading: '提交中...' },
  en: { title: 'Checkout', contact: 'Contact Info', name: 'Name', phone: 'Phone', email: 'Email (optional)', address: 'Shipping Address', province: 'Province', city: 'City', detail: 'Address', postal: 'Postal Code', payment: 'Payment Method', wechat: 'WeChat Pay', alipay: 'Alipay', summary: 'Order Summary', submit: 'Place Order', note: 'Note (optional)', total: 'Total', loading: 'Submitting...' },
  ko: { title: '결제', contact: '연락처 정보', name: '이름', phone: '전화번호', email: '이메일(선택)', address: '배송 주소', province: '성', city: '시', detail: '상세 주소', postal: '우편번호', payment: '결제 방법', wechat: '위챗페이', alipay: '알리페이', summary: '주문 요약', submit: '주문하기', note: '메모(선택)', total: '합계', loading: '처리 중...' },
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'zh';
  const t = T[locale] || T.zh;
  const { items, total, clearCart } = useCartStore();
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', province: '', city: '', address: '', postal: '', note: '' });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createOrder({
        customer: { name: form.name, phone: form.phone, email: form.email },
        shipping_address: { province: form.province, city: form.city, address: form.address, postal_code: form.postal },
        payment_method: payMethod,
        note: form.note,
        items: items.map(i => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity, price: i.price })),
      });
      clearCart();
      router.push(`/${locale}/payment/${res.data.data.id}?method=${payMethod}&amount=${total()}`);
    } catch (err) {
      alert(locale === 'en' ? 'Order failed, please try again' : locale === 'ko' ? '주문 실패, 다시 시도해주세요' : '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const input = (label: string, key: string, type = 'text', required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input type={type} value={(form as any)[key]} onChange={e => set(key, e.target.value)} required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
    </div>
  );

  return (
    <>
      <Navbar locale={locale} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">{t.contact}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {input(t.name, 'name')}
                  {input(t.phone, 'phone', 'tel')}
                  <div className="sm:col-span-2">{input(t.email, 'email', 'email', false)}</div>
                </div>
              </div>
              {/* Address */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">{t.address}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {input(t.province, 'province')}
                  {input(t.city, 'city')}
                  <div className="sm:col-span-2">{input(t.detail, 'address')}</div>
                  {input(t.postal, 'postal')}
                </div>
              </div>
              {/* Payment */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">{t.payment}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(['wechat', 'alipay'] as const).map(m => (
                    <button type="button" key={m} onClick={() => setPayMethod(m)}
                      className={`flex items-center gap-3 border-2 rounded-xl p-4 transition-all ${payMethod === m ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                      <span className="text-2xl">{m === 'wechat' ? '💚' : '🔵'}</span>
                      <span className="font-medium text-gray-800">{m === 'wechat' ? t.wechat : t.alipay}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Note */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.note}</label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              </div>
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">{t.summary}</h2>
                <div className="space-y-3 mb-4">
                  {items.map(i => (
                    <div key={`${i.productId}-${i.variantId}`} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{i.name} {i.variantName} ×{i.quantity}</span>
                      <span className="font-medium ml-2">¥{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>{t.total}</span>
                  <span className="text-red-600">¥{formatPrice(total())}</span>
                </div>
                <button type="submit" disabled={loading || items.length === 0}
                  className="mt-6 w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                  {loading ? t.loading : t.submit}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
