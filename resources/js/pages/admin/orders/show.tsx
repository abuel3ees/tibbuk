import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Trash2, MapPin, Phone, Mail, Facebook, FileText, Package } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem { id: number; product_name: string; quantity: number; unit_price: string; cost_price: string | null; product: { id: number; name: string } | null }
interface Order { id: number; customer_name: string; customer_phone: string; customer_email: string | null; customer_facebook: string | null; delivery_address: string; status: string; notes: string | null; total_amount: string; created_at: string; items: OrderItem[] }
interface Props { order: Order }

const STATUS_STYLES: Record<string, string> = {
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

export default function OrderShow({ order }: Props) {
    const [updating, setUpdating] = useState(false);

    function updateStatus(status: string) {
        setUpdating(true);
        router.patch(`/admin/orders/${order.id}/status`, { status }, { onFinish: () => setUpdating(false), preserveScroll: true });
    }

    function deleteOrder() {
        if (!confirm(`Delete order #${String(order.id).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${order.id}`);
    }

    const totalRevenue = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const totalCost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);

    return (
        <AdminLayout>
            <Head title={`Order #${String(order.id).padStart(5, '0')} — Admin`} />

            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs text-[#6A746F] dark:text-[#4A5A55] hover:text-[#16201D] dark:hover:text-[#EAE6DE] transition-colors mb-5 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mb-1">Order</p>
                        <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight font-mono">#{String(order.id).padStart(5, '0')}</h1>
                        <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">{new Date(order.created_at).toLocaleString('en-JO', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <select value={order.status} onChange={e => updateStatus(e.target.value)} disabled={updating}
                            className={`text-[10px] tracking-wider uppercase px-3.5 py-2.5 rounded-lg font-semibold cursor-pointer focus:outline-none border-0 transition-all disabled:opacity-50 ${STATUS_STYLES[order.status] ?? ''}`}>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={deleteOrder}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-400 dark:hover:border-red-600 transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Customer card */}
                <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] p-6 shadow-sm">
                    <h2 className="text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold mb-4">Customer</h2>

                    <p className="font-semibold text-[#16201D] dark:text-[#EAE6DE] text-base">{order.customer_name}</p>

                    <div className="mt-4 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-[#6A746F] dark:text-[#4A5A55]">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45]" />
                            <span>{order.customer_phone}</span>
                        </div>
                        {order.customer_email && (
                            <div className="flex items-center gap-2.5 text-sm text-[#6A746F] dark:text-[#4A5A55]">
                                <Mail className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45]" />
                                <span className="truncate">{order.customer_email}</span>
                            </div>
                        )}
                        {order.customer_facebook && (
                            <div className="flex items-center gap-2.5 text-sm">
                                <Facebook className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45]" />
                                <a href={order.customer_facebook} target="_blank" rel="noopener noreferrer"
                                    className="text-[#1F5B4A] dark:text-[#3D9E7A] hover:underline truncate">{order.customer_facebook}</a>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 pt-5 border-t border-[#F2EDE0] dark:border-[#1C2822]">
                        <div className="flex items-start gap-2.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45] mt-0.5" />
                            <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] leading-relaxed">{order.delivery_address}</p>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="mt-4 pt-4 border-t border-[#F2EDE0] dark:border-[#1C2822]">
                            <div className="flex items-start gap-2.5">
                                <FileText className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45] mt-0.5" />
                                <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] italic leading-relaxed">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Items card */}
                <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[#F2EDE0] dark:border-[#1C2822]">
                        <h2 className="text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">
                            Items <span className="ml-2 text-[#B8B2A8] dark:text-[#3A4A45]">{order.items.length}</span>
                        </h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#F8F5EE] dark:border-[#141C19]">
                                <th className="text-left px-6 py-3 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Product</th>
                                <th className="text-center px-6 py-3 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Qty</th>
                                <th className="text-right px-6 py-3 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Price</th>
                                <th className="text-right px-6 py-3 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                            {order.items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-[#F2EDE0] dark:bg-[#1C2822] flex items-center justify-center shrink-0">
                                                <Package className="w-3.5 h-3.5 text-[#6A746F] dark:text-[#4A5A55]" />
                                            </div>
                                            <span className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">{item.product_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-[#6A746F] dark:text-[#4A5A55] font-mono">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-[#6A746F] dark:text-[#4A5A55] font-mono tabular-nums">{Number(item.unit_price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-[#16201D] dark:text-[#EAE6DE] font-mono tabular-nums">
                                        {(Number(item.unit_price) * item.quantity).toFixed(2)} <span className="text-[10px] font-normal text-[#6A746F] dark:text-[#4A5A55]">JOD</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-[#E8E1D0] dark:border-[#1C2822]">
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-[#6A746F] dark:text-[#4A5A55]">Total</td>
                                <td className="px-6 py-4 text-right text-2xl font-light text-[#16201D] dark:text-[#EAE6DE] font-mono tabular-nums">
                                    {Number(order.total_amount).toFixed(2)} <span className="text-sm text-[#6A746F] dark:text-[#4A5A55]">JOD</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {order.status === 'delivered' && totalCost > 0 && (
                        <div className="px-6 py-5 border-t border-[#E8E1D0] dark:border-[#1C2822] bg-[#F8F5EE] dark:bg-[#141C19] grid grid-cols-3 gap-4">
                            {[
                                { label: 'Revenue', value: totalRevenue, cls: 'text-[#16201D] dark:text-[#EAE6DE]' },
                                { label: 'Cost', value: totalCost, cls: 'text-[#6A746F] dark:text-[#4A5A55]' },
                                { label: 'Profit', value: totalRevenue - totalCost, cls: totalRevenue - totalCost >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
                            ].map(({ label, value, cls }) => (
                                <div key={label}>
                                    <p className="text-[10px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mb-1 font-semibold">{label}</p>
                                    <p className={`text-sm font-semibold font-mono tabular-nums ${cls}`}>{value.toFixed(2)} <span className="text-[10px] font-normal opacity-60">JOD</span></p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
