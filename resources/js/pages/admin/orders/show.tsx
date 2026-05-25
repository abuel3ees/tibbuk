import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Trash2, MapPin, Phone, Mail, Facebook, FileText, Package, Download } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    cost_price: string | null;
    engraving_text: string | null;
    stitching_text: string | null;
    selected_size: string | null;
    selected_gender: string | null;
    selected_color: string | null;
    product: { id: number; name: string } | null;
}
interface Order { id: number; customer_name: string; customer_phone: string; customer_email: string | null; customer_facebook: string | null; delivery_address: string; status: string; notes: string | null; total_amount: string; created_at: string; items: OrderItem[] }
interface Props { order: Order }

const STATUS_STYLES: Record<string, string> = {
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

function printReceipt(order: Order) {
    const orderNo = String(order.id).padStart(5, '0');
    const date = new Date(order.created_at).toLocaleString('en-JO', { dateStyle: 'long', timeStyle: 'short' });
    const subtotal = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const shipping = 3;
    const total = subtotal + shipping;

    const itemRows = order.items.map(i => {
        const details = [
            i.selected_size   ? `Size: ${i.selected_size}`   : '',
            i.selected_gender ? (i.selected_gender === 'male' ? 'Male' : 'Female') : '',
            i.selected_color  ? `Color: ${i.selected_color}` : '',
            i.engraving_text  ? `✎ Engraving: ${i.engraving_text}` : '',
            i.stitching_text  ? `✦ Stitching: ${i.stitching_text}` : '',
        ].filter(Boolean);
        return `
        <tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">
                ${i.product_name}
                ${details.map(d => `<br><span style="font-size:11px;color:#888;font-style:italic;">${d}</span>`).join('')}
            </td>
            <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">${Number(i.unit_price).toFixed(2)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600;">${(Number(i.unit_price) * i.quantity).toFixed(2)}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt — Order #${orderNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 48px; max-width: 680px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #111; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .brand span { font-weight: 300; margin-left: 4px; color: #555; }
  .order-meta { text-align: right; }
  .order-meta .order-no { font-size: 20px; font-weight: 300; font-family: monospace; }
  .order-meta .order-date { font-size: 11px; color: #888; margin-top: 4px; }
  .status { display: inline-block; margin-top: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .block { background: #f9f9f9; border-radius: 8px; padding: 16px; }
  .block p { font-size: 13px; line-height: 1.6; color: #333; }
  .block .name { font-weight: 700; font-size: 14px; color: #111; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; padding: 0 0 10px; border-bottom: 2px solid #eee; text-align: left; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
  thead th:nth-child(2) { text-align: center; }
  .totals { margin-top: 16px; border-top: 2px solid #111; padding-top: 16px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #555; }
  .totals-row.big { font-size: 18px; font-weight: 700; color: #111; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
  .notes-block { margin-top: 24px; background: #fffbf0; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
  @media print {
    body { padding: 24px; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Tibbuk <span>طِبّك</span></div>
    <div class="order-meta">
      <div class="order-no">Order #${orderNo}</div>
      <div class="order-date">${date}</div>
      <div class="status">${order.status}</div>
    </div>
  </div>

  <div class="grid">
    <div class="block">
      <div class="section-title">Customer</div>
      <div class="name">${order.customer_name}</div>
      <p>📞 ${order.customer_phone}</p>
      ${order.customer_email ? `<p>✉ ${order.customer_email}</p>` : ''}
      ${order.customer_facebook ? `<p>🔗 ${order.customer_facebook}</p>` : ''}
    </div>
    <div class="block">
      <div class="section-title">Delivery Address</div>
      <p style="margin-top:4px;">${order.delivery_address}</p>
    </div>
  </div>

  <div class="section-title">Order Items</div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span style="font-family:monospace;">${subtotal.toFixed(2)} JOD</span></div>
    <div class="totals-row"><span>Shipping</span><span style="font-family:monospace;">${shipping.toFixed(2)} JOD</span></div>
    <div class="totals-row big"><span>Total</span><span style="font-family:monospace;">${total.toFixed(2)} JOD</span></div>
  </div>

  ${order.notes ? `<div class="notes-block"><div class="section-title" style="margin-bottom:6px;">Order Notes</div><p>${order.notes}</p></div>` : ''}

  <div class="footer">
    <span>Tibbuk — Medical equipment for Jordan's medical students</span>
    <span>Generated ${new Date().toLocaleDateString('en-JO')}</span>
  </div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=750,height=900');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
}

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
                        <button onClick={() => printReceipt(order)}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-[#E8E1D0] dark:border-[#1C2822] text-[#16201D] dark:text-[#EAE6DE] hover:bg-[#F2EDE0] dark:hover:bg-[#141C19] transition-all">
                            <Download className="w-3.5 h-3.5" /> Export PDF
                        </button>
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
                                            <div>
                                                <span className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">{item.product_name}</span>
                                                <div className="flex flex-wrap gap-x-3 mt-0.5">
                                                    {item.selected_size   && <span className="text-[11px] text-[#6A746F] dark:text-[#4A5A55]">Size: {item.selected_size}</span>}
                                                    {item.selected_gender && <span className="text-[11px] text-[#6A746F] dark:text-[#4A5A55]">{item.selected_gender === 'male' ? 'Male' : 'Female'}</span>}
                                                    {item.selected_color  && <span className="text-[11px] text-[#6A746F] dark:text-[#4A5A55]">Color: {item.selected_color}</span>}
                                                    {item.engraving_text  && <span className="text-[11px] text-[#6A746F] dark:text-[#4A5A55] italic">✎ {item.engraving_text}</span>}
                                                    {item.stitching_text  && <span className="text-[11px] text-[#6A746F] dark:text-[#4A5A55] italic">✦ {item.stitching_text}</span>}
                                                </div>
                                            </div>
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
