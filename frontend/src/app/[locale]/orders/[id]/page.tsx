'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder, formatPrice } from '@/lib/api';
import Navbar from '@/components/Navbar';

const T: Record<string, any> = {
  zh: { title: '订单详情', order_no: '订单号', status: '订单状态', payment: '支付状态', items: '商品', logistics: '物流信息', no_logistics: '暂无物流信息', back: '继续购物',
    status_map: { pending: '待付款', processing: '处理中', shipped: '已发货', delivered: '已完成', cancelled: '已取消' },
    pay_map: { paid: '已支付', unpaid: '未支付' } },
  en: { title: 'Order Details', order_no: 'Order #', status: 'Status', payment: 'Payment', items: 'Items', logistics: 'Logistics', no_logistics: 'No tracking info yet', back: 'Continue Shopping',
    status_map: { pending: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
    pay_map: { paid: 'Paid', unpaid: 'Unpaid' } },
  ko: { title: '주문 상세', order_no: '주문번호', status: '주문 상태', payment: '결제 상태', items: '상품', logistics: '배송 정보', no_logistics: '배송 정보 없음', back: '쇼핑 계속',
    status_map: { pending: '결제 대기', processing: '처리 중', shipped: '배송 중', delivered: '배송 완료', cancelled: '취소됨' },
    pay_map: { paid: '결제 완료', unpaid: '미결제' } },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'zh';
  const id = params.id as string;
  const t = T[locale] || T.zh;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    getOrder(id).then(r => setOrder(r.data.data));
  }, [id]);

  if (!order) return (
    <><Navbar locale={locale} />
    <div className="flex items-center justify-center h-64 text-gray-400">
      {locale === 'en' ? 'Loading...' : locale === 'ko' ? '로딩 중...' : '加载中...'}
    </div></>
  );

  const logistics = order.logistics_events || [];

  return (
    <>
      <Navbar locale={locale} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <Link href={`/${locale}/products`} className="text-sm text-gray-500 hover:text-red-600">{t.back}</Link>
        </div>
        {/* Status Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{t.order_no}</p>
              <p className="font-mono font-bold text-gray-900">{order.id}</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {t.status_map[order.status] || order.status}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {t.pay_map[order.payment_status] || order.payment_status}
            </span>
          </div>
        </div>
        {/* Items */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">{t.items}</h2>
          <div className="space-y-3">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{item.product_name || item.name} {item.variant_spec && <span className="text-gray-400">({item.variant_spec})</span>} ×{item.quantity}</span>
                <span className="font-bold">¥{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-red-600">¥{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
        {/* Logistics */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">🚚 {t.logistics}</h2>
          {order.tracking_number && (
            <p className="text-xs text-gray-400 mb-4">
              {locale === 'zh' ? '运单号' : locale === 'ko' ? '운송장번호' : 'Tracking #'}: 
              <span className="font-mono ml-1 text-gray-700">{order.tracking_number}</span>
            </p>
          )}
          {logistics.length === 0 ? (
            <p className="text-gray-400 text-sm">{t.no_logistics}</p>
          ) : (
            <div className="relative">
              <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {logistics.map((ev: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 z-10 mt-0.5 ${i === 0 ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`} />
                    <div>
                      <p className={`text-sm font-medium ${i === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{ev.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
