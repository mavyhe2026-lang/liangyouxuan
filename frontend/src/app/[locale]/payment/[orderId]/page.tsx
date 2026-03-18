'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { simulatePayment, formatPrice } from '@/lib/api';
import Navbar from '@/components/Navbar';

const T: Record<string, any> = {
  zh: { title: '扫码支付', scan: '请用手机扫描二维码完成支付', amount: '支付金额', method_wechat: '微信支付', method_alipay: '支付宝', simulate: '模拟支付成功（测试用）', waiting: '等待支付...', success: '支付成功！', view_order: '查看订单', timeout: '支付超时，请重试' },
  en: { title: 'Scan to Pay', scan: 'Scan the QR code with your phone', amount: 'Amount', method_wechat: 'WeChat Pay', method_alipay: 'Alipay', simulate: 'Simulate Payment (Test)', waiting: 'Waiting for payment...', success: 'Payment Successful!', view_order: 'View Order', timeout: 'Payment timeout, please retry' },
  ko: { title: 'QR코드 결제', scan: '휴대폰으로 QR코드를 스캔하세요', amount: '결제 금액', method_wechat: '위챗페이', method_alipay: '알리페이', simulate: '결제 시뮬레이션 (테스트)', waiting: '결제 대기 중...', success: '결제 완료!', view_order: '주문 보기', timeout: '결제 시간 초과' },
};

const QR_WECHAT = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><rect x="10" y="10" width="60" height="60" fill="none" stroke="%23000" stroke-width="8"/><rect x="25" y="25" width="30" height="30" fill="%23000"/><rect x="130" y="10" width="60" height="60" fill="none" stroke="%23000" stroke-width="8"/><rect x="145" y="25" width="30" height="30" fill="%23000"/><rect x="10" y="130" width="60" height="60" fill="none" stroke="%23000" stroke-width="8"/><rect x="25" y="145" width="30" height="30" fill="%23000"/><text x="100" y="108" text-anchor="middle" font-size="11" fill="%23666">WeChat Pay</text><rect x="80" y="80" width="8" height="8" fill="%23000"/><rect x="96" y="80" width="8" height="8" fill="%23000"/><rect x="112" y="80" width="8" height="8" fill="%23000"/><rect x="80" y="96" width="8" height="8" fill="%23000"/><rect x="96" y="96" width="8" height="8" fill="%23fff"/><rect x="112" y="96" width="8" height="8" fill="%23000"/><rect x="130" y="80" width="8" height="8" fill="%23000"/><rect x="146" y="80" width="8" height="8" fill="%23000"/><rect x="162" y="80" width="8" height="8" fill="%23000"/></svg>';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'zh';
  const orderId = params.orderId as string;
  const method = (searchParams.get('method') || 'wechat') as 'wechat' | 'alipay';
  const amount = searchParams.get('amount') || '0';
  const t = T[locale] || T.zh;
  const [status, setStatus] = useState<'waiting' | 'success' | 'timeout'>('waiting');
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => setTimer(n => {
      if (n <= 1) { clearInterval(interval); setStatus('timeout'); return 0; }
      return n - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      await simulatePayment(orderId);
      setStatus('success');
    } catch {
      setStatus('success'); // demo mode
    }
  };

  const mins = Math.floor(timer / 60).toString().padStart(2, '0');
  const secs = (timer % 60).toString().padStart(2, '0');
  const methodColor = method === 'wechat' ? 'text-green-600' : 'text-blue-600';
  const methodBg = method === 'wechat' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';

  if (status === 'success') return (
    <>
      <Navbar locale={locale} />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.success}</h2>
        <p className="text-gray-500 mb-8">¥{formatPrice(parseFloat(amount))}</p>
        <button onClick={() => router.push(`/${locale}/orders/${orderId}`)}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors">
          {t.view_order}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Navbar locale={locale} />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-10">
        <div className={`bg-white border-2 ${methodBg} rounded-3xl p-8 shadow-lg max-w-sm w-full text-center`}>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t.title}</h2>
          <p className={`text-sm font-medium ${methodColor} mb-6`}>{method === 'wechat' ? t.method_wechat : t.method_alipay}</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 inline-block">
            <img src={QR_WECHAT} alt="QR Code" className="w-48 h-48 mx-auto" />
          </div>
          <p className="text-gray-500 text-sm mb-2">{t.scan}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{t.amount}: <span className="text-red-600">¥{formatPrice(parseFloat(amount))}</span></p>
          <p className="text-xs text-gray-400 mb-6">{mins}:{secs}</p>
          <button onClick={handleSimulate}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            {t.simulate}
          </button>
        </div>
      </div>
    </>
  );
}
