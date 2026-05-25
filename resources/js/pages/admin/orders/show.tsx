import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    cost_price: string | null;
    product: { id: number; name: string } | null;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    customer_facebook: string | null;
    delivery_address: string;
    status: string;
    notes: string | null;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}

interface Props {
    order: Order;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

export default function OrderShow({ order }: Props) {
    const [updating, setUpdating] = useState(false);

    function deleteOrder() {
        if (!confirm(`Delete order #${String(order.id).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${order.id}`);
    }

    function updateStatus(status: string) {
        setUpdating(true);
        router.patch(`/admin/orders/${order.id}/status`, { status }, {
            onFinish: () => setUpdating(false),
            preserveScroll: true,
        });
    }

    const totalRevenue = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const totalCost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);

    return (
        <AdminLayout>
            <Head title={`Order #${String(order.id).padStart(5, '0')} — Admin`} />

            <div className="mb-8">
                <Link href="/admin/orders" className="flex items-center gap-2 text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 mb-4">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Orders
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-light text-stone-900">Order #{String(order.id).padStart(5, '0')}</h1>
                        <p className="text-sm text-stone-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-JO')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={order.status}
                            onChange={e => updateStatus(e.target.value)}
                            disabled={updating}
                            className={`text-xs tracking-widest uppercase px-3 py-2 border cursor-pointer focus:outline-none ${statusColors[order.status] ?? ''} disabled:opacity-50`}
                        >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                            onClick={deleteOrder}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer info */}
                <div className="bg-white border border-stone-100 p-6">
                    <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Customer</h2>
                    <p className="font-medium text-stone-900">{order.customer_name}</p>
                    <p className="text-sm text-stone-500 mt-1">{order.customer_phone}</p>
                    {order.customer_email && <p className="text-sm text-stone-500">{order.customer_email}</p>}
                    {order.customer_facebook && (
                        <a href={order.customer_facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {order.customer_facebook}
                        </a>
                    )}
                    <div className="mt-4 pt-4 border-t border-stone-50">
                        <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Delivery Address</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{order.delivery_address}</p>
                    </div>
                    {order.notes && (
                        <div className="mt-4 pt-4 border-t border-stone-50">
                            <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Notes</p>
                            <p className="text-sm text-stone-600 italic">{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* Order items */}
                <div className="lg:col-span-2 bg-white border border-stone-100">
                    <div className="px-6 py-4 border-b border-stone-50">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400">Items</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-stone-50">
                                <th className="text-left px-6 py-3 text-xs tracking-widest uppercase text-stone-300 font-normal">Product</th>
                                <th className="text-center px-6 py-3 text-xs tracking-widest uppercase text-stone-300 font-normal">Qty</th>
                                <th className="text-right px-6 py-3 text-xs tracking-widest uppercase text-stone-300 font-normal">Price</th>
                                <th className="text-right px-6 py-3 text-xs tracking-widest uppercase text-stone-300 font-normal">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {order.items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 font-medium text-stone-900">{item.product_name}</td>
                                    <td className="px-6 py-4 text-center text-stone-500">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-stone-600">{Number(item.unit_price).toFixed(2)} JOD</td>
                                    <td className="px-6 py-4 text-right font-medium">{(Number(item.unit_price) * item.quantity).toFixed(2)} JOD</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-stone-100">
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium">Total</td>
                                <td className="px-6 py-4 text-right text-lg font-light">{Number(order.total_amount).toFixed(2)} JOD</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Profit insight if delivered */}
                    {order.status === 'delivered' && totalCost > 0 && (
                        <div className="px-6 py-5 bg-stone-50 border-t border-stone-100 grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Revenue</p>
                                <p className="text-sm font-medium text-stone-900">{totalRevenue.toFixed(2)} JOD</p>
                            </div>
                            <div>
                                <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Cost</p>
                                <p className="text-sm font-medium text-stone-900">{totalCost.toFixed(2)} JOD</p>
                            </div>
                            <div>
                                <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Profit</p>
                                <p className={`text-sm font-medium ${totalRevenue - totalCost >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                    {(totalRevenue - totalCost).toFixed(2)} JOD
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
