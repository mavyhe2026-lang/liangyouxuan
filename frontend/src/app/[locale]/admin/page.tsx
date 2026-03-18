'use client';
import { useState, useEffect } from 'react';
import { adminLogin, getStats, getProducts, getOrders, updateOrderStatus, createLogistics, syncLogistics, updateProductStatus, formatPrice } from '@/lib/api';
import { LayoutDashboard, Package, ShoppingBag, Truck, LogOut, RefreshCw, ChevronRight } from 'lucide-react';

type Tab = 'dashboard' | 'products' | 'orders' | 'logistics';

export default function AdminPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('admin_token'));
    }
  }, []);

  const handleLogin = (t: string) => {
    localStorage.setItem('admin_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!token) return <LoginForm onLogin={handleLogin} locale={locale} />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-bold">粮优选后台</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {([
            { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: '控制台' },
            { key: 'products', icon: <Package size={18} />, label: '产品管理' },
            { key: 'orders', icon: <ShoppingBag size={18} />, label: '订单管理' },
            { key: 'logistics', icon: <Truck size={18} />, label: '物流管理' },
          ] as any[]).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${tab === item.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800">
            <LogOut size={18} /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'products' && <ProductsAdmin />}
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'logistics' && <LogisticsAdmin />}
      </main>
    </div>
  );
}

function LoginForm({ onLogin, locale }: { onLogin: (t: string) => void; locale: string }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const r = await adminLogin(u, p);
      onLogin(r.data.data.token);
    } catch {
      setErr(locale === 'en' ? 'Invalid credentials' : '用户名或密码错误');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🌾</span>
          <h1 className="text-xl font-bold mt-2">{locale === 'en' ? 'Admin Login' : locale === 'ko' ? '관리자 로그인' : '后台管理登录'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{locale === 'en' ? 'Username' : '用户名'}</label>
            <input value={u} onChange={e => setU(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-400" placeholder="admin" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{locale === 'en' ? 'Password' : '密码'}</label>
            <input type="password" value={p} onChange={e => setP(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-400" placeholder="admin123" />
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl">
            {loading ? '...' : (locale === 'en' ? 'Login' : locale === 'ko' ? '로그인' : '登录')}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">默认: admin / admin123</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { getStats().then(r => setStats(r.data.data)).catch(() => {}); }, []);

  const cards = stats ? [
    { label: '总订单', value: stats.totalOrders, color: 'bg-blue-500' },
    { label: '待处理', value: stats.pendingOrders, color: 'bg-yellow-500' },
    { label: '处理中', value: stats.processingOrders, color: 'bg-purple-500' },
    { label: '总收入', value: formatPrice(stats.totalRevenue), color: 'bg-green-500' },
    { label: '产品数', value: stats.totalProducts, color: 'bg-red-500' },
    { label: '已发货', value: stats.shippedOrders, color: 'bg-indigo-500' },
  ] : [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">控制台</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border p-6">
            <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-lg">{typeof c.value === 'number' ? c.value : '#'}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const load = () => getProducts({ status: 'all' }).then(r => setProducts(r.data.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    await updateProductStatus(id, newStatus);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600 font-medium">产品</th>
              <th className="text-left p-4 text-gray-600 font-medium">分类</th>
              <th className="text-left p-4 text-gray-600 font-medium">规格/库存</th>
              <th className="text-left p-4 text-gray-600 font-medium">状态</th>
              <th className="text-left p-4 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                    <div>
                      <p className="font-medium text-gray-900">{p.name_zh}</p>
                      <p className="text-gray-400 text-xs">{p.name_en}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{p.category === 'rice' ? '大米' : '大枣'}</td>
                <td className="p-4">
                  <div className="space-y-1">
                    {p.variants?.map((v: any) => (
                      <div key={v.id} className="text-xs text-gray-600">
                        {v.spec} · {formatPrice(v.price)} · 库存: <span className={v.stock < 20 ? 'text-red-500 font-medium' : 'text-gray-600'}>{v.stock}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? '上架' : '下架'}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => toggleStatus(p.id, p.status)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${p.status === 'active' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {p.status === 'active' ? '下架' : '上架'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const load = () => getOrders().then(r => setOrders(r.data.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const STATUS_ZH: Record<string, string> = { pending: '待付款', processing: '处理中', shipped: '已发货', delivered: '已完成', cancelled: '已取消' };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600">
          <RefreshCw size={16} /> 刷新
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600 font-medium">订单号</th>
              <th className="text-left p-4 text-gray-600 font-medium">客户</th>
              <th className="text-left p-4 text-gray-600 font-medium">金额</th>
              <th className="text-left p-4 text-gray-600 font-medium">支付</th>
              <th className="text-left p-4 text-gray-600 font-medium">状态</th>
              <th className="text-left p-4 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono text-xs text-gray-700">{o.order_no}</td>
                <td className="p-4">
                  <p className="font-medium">{o.user_name}</p>
                  <p className="text-gray-400 text-xs">{o.user_phone}</p>
                </td>
                <td className="p-4 font-bold text-gray-900">{formatPrice(o.total_amount)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.payment_status === 'paid' ? '已支付' : '未支付'}
                  </span>
                </td>
                <td className="p-4">
                  <select value={o.order_status} onChange={async e => { await updateOrderStatus(o.id, e.target.value); load(); }}
                    className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:border-red-400">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_ZH[s]}</option>)}
                  </select>
                </td>
                <td className="p-4 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-12 text-gray-400">暂无订单</div>}
      </div>
    </div>
  );
}

function LogisticsAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const load = () => getOrders().then(r => setOrders(r.data.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (orderId: string) => {
    setSyncing(orderId);
    try { await createLogistics(orderId); await load(); } catch (e: any) { alert(e.response?.data?.error || 'Error'); }
    finally { setSyncing(null); }
  };

  const handleSync = async (orderId: string) => {
    setSyncing(orderId);
    try { await syncLogistics(orderId); await load(); } catch (e: any) { alert(e.response?.data?.error || 'Error'); }
    finally { setSyncing(null); }
  };

  const shippableOrders = orders.filter(o => o.payment_status === 'paid' || o.order_status !== 'pending');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">物流管理</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600">
          <RefreshCw size={16} /> 刷新
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-gray-600 font-medium">订单号</th>
              <th className="text-left p-4 text-gray-600 font-medium">客户/地址</th>
              <th className="text-left p-4 text-gray-600 font-medium">物流单号</th>
              <th className="text-left p-4 text-gray-600 font-medium">状态</th>
              <th className="text-left p-4 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {shippableOrders.map(o => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono text-xs">{o.order_no}</td>
                <td className="p-4">
                  <p className="font-medium">{o.user_name}</p>
                  <p className="text-gray-400 text-xs">{o.province} {o.city}</p>
                </td>
                <td className="p-4">
                  {o.logistics_no ? (
                    <div>
                      <p className="font-mono text-xs text-blue-600">{o.logistics_no}</p>
                      <p className="text-gray-400 text-xs">{o.logistics_company}</p>
                    </div>
                  ) : <span className="text-gray-400 text-xs">未创建</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.order_status === 'shipped' ? 'bg-purple-100 text-purple-700' : o.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {({ pending: '待处理', processing: '处理中', shipped: '已发货', delivered: '已完成', cancelled: '已取消' } as any)[o.order_status] || o.order_status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!o.logistics_no ? (
                      <button onClick={() => handleCreate(o.id)} disabled={syncing === o.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50">
                        {syncing === o.id ? '...' : '创建运单'}
                      </button>
                    ) : (
                      <button onClick={() => handleSync(o.id)} disabled={syncing === o.id}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
                        <RefreshCw size={12} /> {syncing === o.id ? '...' : '同步物流'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shippableOrders.length === 0 && <div className="text-center py-12 text-gray-400">暂无可处理订单</div>}
      </div>
    </div>
  );
}
