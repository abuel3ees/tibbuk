import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, ShoppingBag, ArrowRight, Search, X, Filter, Download } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem { id: number; product_name: string; quantity: number; unit_price: string }
interface Order { id: number; customer_name: string; customer_phone: string; customer_email: string | null; delivery_address: string; status: string; total_amount: string; created_at: string; items: OrderItem[] }
interface PaginatedOrders { data: Order[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] }
interface Props { orders: PaginatedOrders; filters: { search?: string; status?: string } }

function buildExportQuery(search: string, status: string): string {
    const p = new URLSearchParams();
    if (search) p.set('filter[search]', search);
    if (status) p.set('filter[status]', status);
    const qs = p.toString();
    return qs ? `?${qs}` : '';
}

const STATUS_STYLES: Record<string, string> = {
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

const inputCls = 'border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#16201D] dark:text-[#EAE6DE] text-sm focus:outline-none focus:border-[#1F5B4A] dark:focus:border-[#3D9E7A] transition-colors placeholder-[#B8B2A8] dark:placeholder-[#3A4A45]';

export default function OrdersIndex({ orders, filters }: Props) {
    const [updating, setUpdating] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function applyFilters(overrides: Record<string, string>) {
        const s = overrides.search !== undefined ? overrides.search : search;
        const st = overrides.status !== undefined ? overrides.status : status;
        const p = overrides.page;
        const params: Record<string, string> = {};
        if (s)  params['filter[search]'] = s;
        if (st) params['filter[status]'] = st;
        if (p)  params['page'] = p;
        router.get('/admin/orders', params, { preserveState: true, preserveScroll: true, replace: true });
    }

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilters({ search: value }), 350);
    }, [status]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const hasFilters = search || status;

    function updateStatus(orderId: number, status: string) {
        setUpdating(orderId);
        router.patch(`/admin/orders/${orderId}/status`, { status }, { onFinish: () => setUpdating(null), preserveScroll: true });
    }

    function deleteOrder(orderId: number) {
        if (!confirm(`Delete order #${String(orderId).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${orderId}`, { preserveScroll: true });
    }

    return (
        <AdminLayout>
            <Head title="Orders — Admin" />

            <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                    <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight">Orders</h1>
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">{orders.total} total orders</p>
                </div>
                <a
                    href={`/admin/orders/export${buildExportQuery(search, status)}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] text-xs font-semibold hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-colors"
                >
                    <Download className="w-3.5 h-3.5" /> Export XLSX
                </a>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 mb-5">
                <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B2A8] dark:text-[#3A4A45]" />
                    <input value={search} onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search by name or phone…"
                        className={`${inputCls} pl-10 pr-9 py-2.5 rounded-lg w-full`} />
                    {search && (
                        <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B2A8] dark:text-[#3A4A45] hover:text-[#6A746F]">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                    className={`${inputCls} px-3 py-2.5 rounded-lg min-w-36`}>
                    <option value="">All statuses</option>
                    {statuses.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                {hasFilters && (
                    <button onClick={() => { setSearch(''); setStatus(''); router.get('/admin/orders', {}, { preserveState: true, replace: true }); }}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-[#6A746F] dark:text-[#4A5A55] border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] hover:text-[#16201D] dark:hover:text-[#EAE6DE] hover:border-[#6A746F] dark:hover:border-[#4A5A55] transition-all">
                        <Filter className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#F2EDE0] dark:border-[#1C2822]">
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Order</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Customer</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold hidden md:table-cell">Items</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Total</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Status</th>
                            <th className="px-6 py-3.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                        {orders.data.map(order => (
                            <tr key={order.id} className="hover:bg-[#F8F5EE] dark:hover:bg-[#141C19] transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-[#16201D] dark:text-[#EAE6DE] font-mono">#{String(order.id).padStart(5, '0')}</p>
                                    <p className="text-[11px] text-[#6A746F] dark:text-[#4A5A55] mt-0.5">{new Date(order.created_at).toLocaleDateString('en-JO')}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">{order.customer_name}</p>
                                    <p className="text-[11px] text-[#6A746F] dark:text-[#4A5A55]">{order.customer_phone}</p>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell text-[#6A746F] dark:text-[#4A5A55] text-xs">
                                    {order.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ').slice(0, 55)}{order.items.length > 1 ? '…' : ''}
                                </td>
                                <td className="px-6 py-4 font-semibold text-[#16201D] dark:text-[#EAE6DE] font-mono tabular-nums">
                                    {Number(order.total_amount).toFixed(2)} <span className="text-[11px] font-normal text-[#6A746F] dark:text-[#4A5A55]">JOD</span>
                                </td>
                                <td className="px-6 py-4">
                                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} disabled={updating === order.id}
                                        className={`text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-full font-semibold cursor-pointer focus:outline-none border-0 transition-all disabled:opacity-50 ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/admin/orders/${order.id}`}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#1F5B4A]/10 dark:hover:bg-[#3D9E7A]/15 hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-all">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                        <button onClick={() => deleteOrder(order.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-[#D7CFBE] dark:text-[#2A3530]" />
                                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No orders yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {orders.last_page > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-7">
                    {orders.links.map((link, i) => link.url ? (
                        <Link key={i} href={link.url}
                            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${link.active ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white shadow-sm' : 'border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] bg-white dark:bg-[#141C19]'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }} />
                    ) : (
                        <span key={i} className="px-3.5 py-2 rounded-lg text-xs text-[#B8B2A8] dark:text-[#3A4A45]" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
