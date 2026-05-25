import { Head, Link } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, Percent } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Financials { total_revenue: number; total_cost: number; net_profit: number; delivered_count: number }
interface OrderItem { id: number; product_name: string; quantity: number; unit_price: string; cost_price: string | null }
interface Order { id: number; customer_name: string; total_amount: string; created_at: string; items: OrderItem[] }
interface Props { financials: Financials; orders: Order[] }

export default function Financials({ financials, orders }: Props) {
    const margin = financials.total_revenue > 0
        ? ((financials.net_profit / financials.total_revenue) * 100).toFixed(1)
        : '0.0';

    return (
        <AdminLayout>
            <Head title="Financials — Admin" />

            <div className="mb-8">
                <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mb-1">Overview</p>
                <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight">Financials</h1>
                <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">Based on {financials.delivered_count} delivered orders</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard icon={DollarSign} label="Total Revenue" value={financials.total_revenue.toFixed(2)} accent="teal" />
                <MetricCard icon={TrendingDown} label="Total Cost" value={financials.total_cost.toFixed(2)} accent="neutral" />
                <MetricCard icon={TrendingUp} label="Net Profit" value={financials.net_profit.toFixed(2)} accent={financials.net_profit >= 0 ? 'green' : 'red'} />
                <MetricCard icon={Percent} label="Profit Margin" value={`${margin}%`} accent={Number(margin) >= 0 ? 'green' : 'red'} suffix="" />
            </div>

            {/* Breakdown panel */}
            <div className="rounded-xl bg-[#16201D] dark:bg-[#0E1512] border border-[#1F5B4A]/30 dark:border-[#3D9E7A]/20 p-7 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1F5B4A]/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#1F5B4A]/40 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#3D9E7A]" />
                        </div>
                        <p className="text-xs tracking-widest uppercase text-[#4A5A55] font-semibold">Profit Breakdown</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-[#6A746F]">Gross Revenue</span>
                            <span className="text-[#B8C4BE] font-mono tabular-nums">{financials.total_revenue.toFixed(2)} JOD</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-[#6A746F]">− Cost of Goods</span>
                            <span className="text-[#4A5A55] font-mono tabular-nums">({financials.total_cost.toFixed(2)} JOD)</span>
                        </div>
                        <div className="border-t border-[#1C2822] pt-4 flex items-center justify-between">
                            <span className="text-white font-semibold">Net Profit</span>
                            <span className={`text-2xl font-light font-mono tabular-nums ${financials.net_profit >= 0 ? 'text-[#3D9E7A]' : 'text-red-400'}`}>
                                {financials.net_profit.toFixed(2)} <span className="text-sm text-[#4A5A55]">JOD</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#4A5A55]">Margin</span>
                            <span className="text-xs text-[#4A5A55] font-mono">{margin}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-order table */}
            <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#F2EDE0] dark:border-[#1C2822] flex items-center justify-between">
                    <h2 className="text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Delivered Orders Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#F8F5EE] dark:border-[#141C19]">
                                <th className="text-left px-6 py-3.5 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Order</th>
                                <th className="text-left px-6 py-3.5 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Customer</th>
                                <th className="text-right px-6 py-3.5 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Revenue</th>
                                <th className="text-right px-6 py-3.5 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Cost</th>
                                <th className="text-right px-6 py-3.5 text-[10px] tracking-widest uppercase text-[#B8B2A8] dark:text-[#3A4A45] font-semibold">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                            {orders.map(order => {
                                const rev = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
                                const cost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);
                                const profit = rev - cost;
                                return (
                                    <tr key={order.id} className="hover:bg-[#F8F5EE] dark:hover:bg-[#141C19] transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/orders/${order.id}`} className="font-mono text-[#6A746F] dark:text-[#4A5A55] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-colors">
                                                #{String(order.id).padStart(5, '0')}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-[#16201D] dark:text-[#EAE6DE]">{order.customer_name}</td>
                                        <td className="px-6 py-4 text-right text-[#6A746F] dark:text-[#4A5A55] font-mono tabular-nums">{rev.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-[#B8B2A8] dark:text-[#3A4A45] font-mono tabular-nums">{cost.toFixed(2)}</td>
                                        <td className={`px-6 py-4 text-right font-semibold font-mono tabular-nums ${profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {profit.toFixed(2)} <span className="text-[10px] font-normal opacity-60">JOD</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[#D7CFBE] dark:text-[#2A3530]" />
                                        <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No delivered orders yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ icon: Icon, label, value, accent, suffix = ' JOD' }: { icon: React.ElementType; label: string; value: string; accent: string; suffix?: string }) {
    const ACCENTS: Record<string, { bg: string; icon: string; num: string; dot: string }> = {
        teal:    { bg: 'bg-[#1F5B4A]/10 dark:bg-[#3D9E7A]/10', icon: 'text-[#1F5B4A] dark:text-[#3D9E7A]', num: 'text-[#16201D] dark:text-[#EAE6DE]', dot: 'bg-[#1F5B4A] dark:bg-[#3D9E7A]' },
        neutral: { bg: 'bg-[#F2EDE0] dark:bg-[#1C2822]', icon: 'text-[#6A746F] dark:text-[#4A5A55]', num: 'text-[#16201D] dark:text-[#EAE6DE]', dot: 'bg-[#6A746F]' },
        green:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', num: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
        red:     { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-500 dark:text-red-400', num: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    };
    const a = ACCENTS[accent] ?? ACCENTS.neutral;
    return (
        <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] p-6 shadow-sm hover:shadow-md dark:hover:border-[#2A3530] transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}>
                    <Icon className={`w-5 h-5 ${a.icon}`} />
                </div>
                <span className={`w-2 h-2 rounded-full ${a.dot} opacity-60`} />
            </div>
            <p className={`text-3xl font-light tabular-nums font-mono ${a.num}`}>{value}</p>
            {suffix && <p className="text-[11px] text-[#6A746F] dark:text-[#4A5A55] mt-0.5">{suffix.trim()}</p>}
            <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mt-2 font-semibold">{label}</p>
        </div>
    );
}
