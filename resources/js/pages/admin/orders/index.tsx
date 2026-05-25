import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_address: string;
    status: string;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    orders: PaginatedOrders;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

export default function OrdersIndex({ orders }: Props) {
    const [updating, setUpdating] = useState<number | null>(null);

    function deleteOrder(orderId: number) {
        if (!confirm(`Delete order #${String(orderId).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${orderId}`, { preserveScroll: true });
    }

    function updateStatus(orderId: number, status: string) {
        setUpdating(orderId);
        router.patch(`/admin/orders/${orderId}/status`, { status }, {
            onFinish: () => setUpdating(null),
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout>
            <Head title="Orders — Admin" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-light text-stone-900">Orders</h1>
                    <p className="text-sm text-stone-400 mt-0.5">{orders.total} total orders</p>
                </div>
            </div>

            <div className="bg-white border border-stone-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-100">
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Order</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Customer</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal hidden md:table-cell">Items</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Total</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Status</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {orders.data.map(order => (
                            <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-stone-900">#{String(order.id).padStart(5, '0')}</p>
                                    <p className="text-xs text-stone-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-JO')}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-stone-900">{order.customer_name}</p>
                                    <p className="text-xs text-stone-400">{order.customer_phone}</p>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell text-stone-500">
                                    {order.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ').slice(0, 60)}
                                    {order.items.length > 1 ? '…' : ''}
                                </td>
                                <td className="px-6 py-4 font-medium text-stone-900">
                                    {Number(order.total_amount).toFixed(2)} JOD
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={order.status}
                                        onChange={e => updateStatus(order.id, e.target.value)}
                                        disabled={updating === order.id}
                                        className={`text-xs tracking-widest uppercase px-2.5 py-1.5 border cursor-pointer focus:outline-none ${statusColors[order.status] ?? ''} disabled:opacity-50`}
                                    >
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                                        >
                                            View →
                                        </Link>
                                        <button
                                            onClick={() => deleteOrder(order.id)}
                                            className="text-stone-300 hover:text-red-400 transition-colors"
                                            title="Delete order"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-stone-400">No orders yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {orders.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {orders.links.map((link, i) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`px-4 py-2 text-xs border transition-colors ${link.active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-500'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={i} className="px-4 py-2 text-xs border border-stone-100 text-stone-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
