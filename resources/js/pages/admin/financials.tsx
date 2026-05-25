import { Head } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Financials {
    total_revenue: number;
    total_cost: number;
    net_profit: number;
    delivered_count: number;
}

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    cost_price: string | null;
}

interface Order {
    id: number;
    customer_name: string;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}

interface Props {
    financials: Financials;
    orders: Order[];
}

export default function Financials({ financials, orders }: Props) {
    const margin = financials.total_revenue > 0
        ? ((financials.net_profit / financials.total_revenue) * 100).toFixed(1)
        : '0.0';

    return (
        <AdminLayout>
            <Head title="Financials — Admin" />

            <div className="mb-10">
                <h1 className="text-2xl font-light text-stone-900">Financials</h1>
                <p className="text-sm text-stone-400 mt-0.5">Based on {financials.delivered_count} delivered orders</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 mb-10">
                <MetricCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Total Revenue"
                    value={financials.total_revenue}
                    color="text-stone-900"
                />
                <MetricCard
                    icon={<TrendingDown className="w-5 h-5" />}
                    label="Total Cost"
                    value={financials.total_cost}
                    color="text-stone-600"
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Net Profit"
                    value={financials.net_profit}
                    color={financials.net_profit >= 0 ? 'text-green-700' : 'text-red-600'}
                />
                <div className="bg-white p-8">
                    <div className="text-stone-400 mb-4 text-xl font-light">%</div>
                    <p className={`text-3xl font-light ${Number(margin) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{margin}%</p>
                    <p className="text-xs tracking-widest uppercase text-stone-400 mt-1">Profit Margin</p>
                </div>
            </div>

            {/* Profit calculator widget */}
            <div className="bg-stone-900 text-white p-8 mb-10">
                <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Profit Breakdown</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-stone-400 text-sm">Gross Revenue</span>
                        <span className="text-white">{financials.total_revenue.toFixed(2)} JOD</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-stone-400 text-sm">− Cost of Goods</span>
                        <span className="text-stone-300">({financials.total_cost.toFixed(2)} JOD)</span>
                    </div>
                    <div className="border-t border-stone-700 pt-3 flex justify-between items-center">
                        <span className="text-white font-medium">Net Profit</span>
                        <span className={`text-xl font-light ${financials.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {financials.net_profit.toFixed(2)} JOD
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-stone-500 text-xs">Profit Margin</span>
                        <span className="text-stone-400 text-xs">{margin}%</span>
                    </div>
                </div>
            </div>

            {/* Per-order breakdown */}
            <div className="bg-white border border-stone-100">
                <div className="px-8 py-5 border-b border-stone-100">
                    <h2 className="text-xs tracking-widest uppercase text-stone-400">Delivered Orders Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-stone-50">
                                <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-300 font-normal">Order</th>
                                <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-300 font-normal">Customer</th>
                                <th className="text-right px-6 py-4 text-xs tracking-widest uppercase text-stone-300 font-normal">Revenue</th>
                                <th className="text-right px-6 py-4 text-xs tracking-widest uppercase text-stone-300 font-normal">Cost</th>
                                <th className="text-right px-6 py-4 text-xs tracking-widest uppercase text-stone-300 font-normal">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {orders.map(order => {
                                const rev = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
                                const cost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);
                                const profit = rev - cost;
                                return (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 text-stone-500">#{String(order.id).padStart(5, '0')}</td>
                                        <td className="px-6 py-4 font-medium text-stone-900">{order.customer_name}</td>
                                        <td className="px-6 py-4 text-right text-stone-700">{rev.toFixed(2)} JOD</td>
                                        <td className="px-6 py-4 text-right text-stone-400">{cost.toFixed(2)} JOD</td>
                                        <td className={`px-6 py-4 text-right font-medium ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            {profit.toFixed(2)} JOD
                                        </td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-stone-400">No delivered orders yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="bg-white p-8">
            <div className="text-stone-400 mb-4">{icon}</div>
            <p className={`text-3xl font-light ${color}`}>{value.toFixed(2)}</p>
            <p className="text-xs text-stone-400 mt-0.5">JOD</p>
            <p className="text-xs tracking-widest uppercase text-stone-400 mt-1">{label}</p>
        </div>
    );
}
