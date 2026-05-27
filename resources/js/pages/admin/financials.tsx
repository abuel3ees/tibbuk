import { Head, Link } from '@inertiajs/react';
import LedgerLayout from '@/layouts/ledger-layout';

interface Financials { total_revenue: number; total_cost: number; net_profit: number; delivered_count: number }
interface OrderItem { id: number; product_name: string; quantity: number; unit_price: string; cost_price: string | null }
interface Order { id: number; customer_name: string; total_amount: string; created_at: string; items: OrderItem[] }
interface Props { financials: Financials; orders: Order[] }

export default function Financials({ financials, orders }: Props) {
    const margin = financials.total_revenue > 0
        ? ((financials.net_profit / financials.total_revenue) * 100).toFixed(1)
        : '0.0';

    return (
        <LedgerLayout active="financials" title={<>The <em>Financials</em></>} eyebrow={`${financials.delivered_count} delivered orders`}>
            <Head title="Financials — Admin" />

            <div className="grid">
                {/* ── Metric cards ── */}
                <div className="w c-3">
                    <div className="w-head"><span className="w-eyebrow">Revenue</span></div>
                    <div className="stat">
                        <div className="stat-val">{financials.total_revenue.toFixed(2)}</div>
                        <div className="stat-cap">JOD · Delivered orders</div>
                    </div>
                </div>
                <div className="w c-3">
                    <div className="w-head"><span className="w-eyebrow">Cost of Goods</span></div>
                    <div className="stat">
                        <div className="stat-val" style={{ color: 'var(--ink-soft)' }}>{financials.total_cost.toFixed(2)}</div>
                        <div className="stat-cap">JOD · Total COGS</div>
                    </div>
                </div>
                <div className="w c-3">
                    <div className="w-head"><span className="w-eyebrow">Net Profit</span></div>
                    <div className="stat">
                        <div className="stat-val" style={{ color: financials.net_profit >= 0 ? 'var(--accent)' : 'rgb(185,28,28)' }}>
                            {financials.net_profit.toFixed(2)}
                        </div>
                        <div className="stat-cap">JOD · {financials.net_profit >= 0 ? 'Positive' : 'Negative'} margin</div>
                    </div>
                </div>
                <div className="w c-3">
                    <div className="w-head"><span className="w-eyebrow">Profit Margin</span></div>
                    <div className="stat">
                        <div className="stat-val" style={{ color: Number(margin) >= 0 ? 'var(--accent)' : 'rgb(185,28,28)' }}>
                            {margin}%
                        </div>
                        <div className="stat-cap">Revenue margin ratio</div>
                    </div>
                </div>

                {/* ── Breakdown panel ── */}
                <div className="w c-12" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>
                    <div className="w-head">
                        <span className="w-eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>01 · Profit Breakdown</span>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
                            <span style={{ fontFamily: 'var(--font-text)', fontSize: 13, opacity: .8 }}>Gross Revenue</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{financials.total_revenue.toFixed(2)} JOD</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
                            <span style={{ fontFamily: 'var(--font-text)', fontSize: 13, opacity: .8 }}>− Cost of Goods</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, opacity: .6 }}>({financials.total_cost.toFixed(2)} JOD)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 20, marginTop: 4 }}>
                            <span style={{ fontFamily: 'var(--font-text)', fontWeight: 600, fontSize: 14 }}>Net Profit</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing: '-.025em', lineHeight: 1 }}>
                                {financials.net_profit.toFixed(2)} <span style={{ fontSize: 16, opacity: .7 }}>JOD · {margin}%</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Per-order table ── */}
                <div className="w c-12">
                    <div className="w-head">
                        <span className="w-eyebrow">02 · Delivered Orders</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th style={{ textAlign: 'right' }}>Revenue</th>
                                    <th style={{ textAlign: 'right' }}>Cost</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const rev = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
                                    const cost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);
                                    const profit = rev - cost;
                                    return (
                                        <tr key={order.id}>
                                            <td>
                                                <Link href={`/admin/orders/${order.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                                    #{String(order.id).padStart(5, '0')}
                                                </Link>
                                            </td>
                                            <td><span className="nm">{order.customer_name}</span></td>
                                            <td><span className="num" style={{ display: 'block', textAlign: 'right' }}>{rev.toFixed(2)}</span></td>
                                            <td><span className="num" style={{ display: 'block', textAlign: 'right', color: 'var(--ink-mute)' }}>{cost.toFixed(2)}</span></td>
                                            <td>
                                                <span className="num" style={{ color: profit >= 0 ? 'var(--accent)' : 'rgb(185,28,28)', fontWeight: 600 }}>
                                                    {profit.toFixed(2)} <span style={{ fontSize: 10, fontWeight: 400, opacity: .6 }}>JOD</span>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
                                            No delivered orders yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </LedgerLayout>
    );
}
