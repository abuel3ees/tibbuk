import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Trash2, MapPin, Phone, Mail, Facebook, FileText, Package, Download, ExternalLink, Clipboard, ArrowRight, Pencil, X, Plus, Check } from 'lucide-react';
import LedgerLayout from '@/layouts/ledger-layout';

interface ProductVariant { value: string; price: string }
interface AvailableProduct {
    id: number; name: string; sku: string | null;
    price: string; sale_price: string | null; cost_price: string | null;
    variants: ProductVariant[] | null;
    allows_engraving: boolean; engraving_price: number | null;
    allows_stitching: boolean; stitching_price: number | null;
    allows_sizes: boolean; available_sizes: string[] | null;
    allows_gender: boolean;
    allows_color: boolean; available_colors: string[] | null;
}
interface OrderItem {
    id: number; product_name: string; quantity: number; unit_price: string; cost_price: string | null;
    engraving_text: string | null; stitching_text: string | null; selected_size: string | null;
    selected_gender: string | null; selected_color: string | null; product: { id: number; name: string } | null;
}
interface StatusLog { id: number; from_status: string | null; to_status: string; note: string | null; created_at: string }
interface Order {
    id: number; customer_name: string; customer_phone: string; customer_email: string | null;
    customer_facebook: string | null; delivery_address: string; status: string; notes: string | null;
    admin_notes: string | null; total_amount: string; created_at: string; tracking_token: string;
    items: OrderItem[]; status_logs?: StatusLog[];
}
interface Props { order: Order; products: AvailableProduct[] }

interface EditItem {
    id: number | null;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_price: string;
    engraving_text: string;
    stitching_text: string;
    selected_size: string;
    selected_gender: string;
    selected_color: string;
}

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
  @media print { body { padding: 24px; } @page { margin: 12mm; } }
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
    <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
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

function itemToEdit(item: OrderItem): EditItem {
    return {
        id: item.id,
        product_id: item.product?.id ?? null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price).toFixed(2),
        engraving_text: item.engraving_text ?? '',
        stitching_text: item.stitching_text ?? '',
        selected_size: item.selected_size ?? '',
        selected_gender: item.selected_gender ?? '',
        selected_color: item.selected_color ?? '',
    };
}

function blankItem(): EditItem {
    return { id: null, product_id: null, product_name: '', quantity: 1, unit_price: '0.00', engraving_text: '', stitching_text: '', selected_size: '', selected_gender: '', selected_color: '' };
}

/* ── Inline field helpers ──────────────────────────────────────────────────── */
const inp = { className: 'form-inp', style: { fontSize: 12, padding: '5px 8px' } };

export default function OrderShow({ order, products }: Props) {
    const [updating, setUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const notesForm = useForm({ admin_notes: order.admin_notes ?? '' });

    /* ── Edit state ── */
    const [editCustomer, setEditCustomer] = useState({
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email ?? '',
        customer_facebook: order.customer_facebook ?? '',
        delivery_address: order.delivery_address,
        notes: order.notes ?? '',
    });
    const [editItems, setEditItems] = useState<EditItem[]>(order.items.map(itemToEdit));
    const [addingProduct, setAddingProduct] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    function startEdit() {
        setEditCustomer({
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_email: order.customer_email ?? '',
            customer_facebook: order.customer_facebook ?? '',
            delivery_address: order.delivery_address,
            notes: order.notes ?? '',
        });
        setEditItems(order.items.map(itemToEdit));
        setEditing(true);
    }

    function cancelEdit() {
        setEditing(false);
        setAddingProduct(false);
        setProductSearch('');
    }

    function setItemField(idx: number, field: keyof EditItem, value: string | number) {
        setEditItems(items => items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    }

    function removeItem(idx: number) {
        setEditItems(items => items.filter((_, i) => i !== idx));
    }

    function pickProduct(p: AvailableProduct, variant?: ProductVariant) {
        const price = variant ? Number(variant.price) : Number(p.sale_price ?? p.price);
        const name = p.name + (variant ? ` — ${variant.value}` : '');
        setEditItems(items => [...items, {
            id: null,
            product_id: p.id,
            product_name: name,
            quantity: 1,
            unit_price: price.toFixed(2),
            engraving_text: '',
            stitching_text: '',
            selected_size: '',
            selected_gender: '',
            selected_color: '',
        }]);
        setAddingProduct(false);
        setProductSearch('');
    }

    function saveEdit() {
        setSaving(true);
        router.put(`/admin/orders/${order.id}`, {
            ...editCustomer,
            items: editItems.map(it => ({
                id: it.id,
                product_id: it.product_id,
                product_name: it.product_name,
                quantity: it.quantity,
                unit_price: it.unit_price,
                engraving_text: it.engraving_text || null,
                stitching_text: it.stitching_text || null,
                selected_size: it.selected_size || null,
                selected_gender: it.selected_gender || null,
                selected_color: it.selected_color || null,
            })),
        }, {
            onSuccess: () => { setEditing(false); setSaving(false); },
            onError: () => setSaving(false),
            preserveScroll: true,
        });
    }

    function copyTrackingLink() {
        const url = window.location.origin + '/track/' + order.tracking_token;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }

    function updateStatus(status: string) {
        setUpdating(true);
        router.patch(`/admin/orders/${order.id}/status`, { status }, { onFinish: () => setUpdating(false), preserveScroll: true });
    }

    function deleteOrder() {
        if (!confirm(`Delete order #${String(order.id).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${order.id}`);
    }

    function saveNotes(e: React.FormEvent) {
        e.preventDefault();
        notesForm.patch(`/admin/orders/${order.id}/notes`, { preserveScroll: true });
    }

    const totalRevenue = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const totalCost = order.items.reduce((s, i) => s + (i.cost_price ? Number(i.cost_price) * i.quantity : 0), 0);
    const orderNo = String(order.id).padStart(5, '0');

    const editTotal = editItems.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);

    const filteredProducts = productSearch
        ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase()))
        : products;

    const actions = (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {editing ? (
                <>
                    <button onClick={saveEdit} disabled={saving} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check size={12} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={cancelEdit} disabled={saving} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <X size={12} /> Cancel
                    </button>
                </>
            ) : (
                <>
                    <select
                        value={order.status}
                        onChange={e => updateStatus(e.target.value)}
                        disabled={updating}
                        className={`tbl tag ${order.status}`}
                        style={{ background: 'transparent', border: '.5px solid var(--rule)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '6px 10px', borderRadius: 2, outline: 'none', opacity: updating ? .5 : 1 }}
                    >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={startEdit} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Pencil size={12} /> Edit Order
                    </button>
                    <a href={`/track/${order.tracking_token}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ExternalLink size={12} /> Track
                    </a>
                    <button onClick={copyTrackingLink} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clipboard size={12} /> {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <button onClick={() => printReceipt(order)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Download size={12} /> Export PDF
                    </button>
                    <button onClick={deleteOrder} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgb(185,28,28)', borderColor: 'rgb(185,28,28)' }}>
                        <Trash2 size={12} /> Delete
                    </button>
                </>
            )}
        </div>
    );

    return (
        <LedgerLayout
            active="orders"
            title={<>Order <em>#{orderNo}</em></>}
            eyebrow={new Date(order.created_at).toLocaleString('en-JO', { dateStyle: 'long', timeStyle: 'short' })}
            actions={actions}
        >
            <Head title={`Order #${orderNo} — Admin`} />

            <Link href="/admin/orders" className="back-link">
                <ArrowLeft size={12} /> Back to Orders
            </Link>

            <div className="grid">
                {/* ── Customer card ── */}
                <div className="w c-4">
                    <div className="w-head"><span className="w-eyebrow">Customer</span></div>

                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="form-field">
                                <label className="form-lbl">Name</label>
                                <input {...inp} value={editCustomer.customer_name} onChange={e => setEditCustomer(c => ({ ...c, customer_name: e.target.value }))} />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Phone</label>
                                <input {...inp} value={editCustomer.customer_phone} onChange={e => setEditCustomer(c => ({ ...c, customer_phone: e.target.value }))} />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Email</label>
                                <input {...inp} value={editCustomer.customer_email} onChange={e => setEditCustomer(c => ({ ...c, customer_email: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Facebook</label>
                                <input {...inp} value={editCustomer.customer_facebook} onChange={e => setEditCustomer(c => ({ ...c, customer_facebook: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Delivery Address</label>
                                <textarea {...inp} rows={3} value={editCustomer.delivery_address} onChange={e => setEditCustomer(c => ({ ...c, delivery_address: e.target.value }))} style={{ ...inp.style, resize: 'none', width: '100%' }} />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Order Notes</label>
                                <textarea {...inp} rows={2} value={editCustomer.notes} onChange={e => setEditCustomer(c => ({ ...c, notes: e.target.value }))} placeholder="Optional" style={{ ...inp.style, resize: 'none', width: '100%' }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="nm" style={{ fontSize: 20, marginBottom: 16 }}>{order.customer_name}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-soft)' }}>
                                    <Phone size={13} style={{ color: 'var(--ink-mute)', flexShrink: 0 }} />
                                    <span>{order.customer_phone}</span>
                                </div>
                                {order.customer_email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-soft)' }}>
                                        <Mail size={13} style={{ color: 'var(--ink-mute)', flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer_email}</span>
                                    </div>
                                )}
                                {order.customer_facebook && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                        <Facebook size={13} style={{ color: 'var(--ink-mute)', flexShrink: 0 }} />
                                        <a href={order.customer_facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer_facebook}</a>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '.5px solid var(--hair)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <MapPin size={13} style={{ color: 'var(--ink-mute)', flexShrink: 0, marginTop: 2 }} />
                                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{order.delivery_address}</p>
                                </div>
                            </div>
                            {order.notes && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '.5px solid var(--hair)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <FileText size={13} style={{ color: 'var(--ink-mute)', flexShrink: 0, marginTop: 2 }} />
                                        <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.6 }}>{order.notes}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Items card ── */}
                <div className="w c-8" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px var(--pad-card) 16px', borderBottom: '.5px solid var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="w-eyebrow">Items · {editing ? editItems.length : order.items.length}</span>
                        {editing && (
                            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                                onClick={() => setAddingProduct(v => !v)}>
                                <Plus size={11} /> Add product
                            </button>
                        )}
                    </div>

                    {/* Product picker */}
                    {editing && addingProduct && (
                        <div style={{ padding: '12px var(--pad-card)', borderBottom: '.5px solid var(--hair)', background: 'var(--bg-sunk)' }}>
                            <input
                                autoFocus
                                placeholder="Search products…"
                                className="form-inp"
                                style={{ fontSize: 12, padding: '6px 10px', marginBottom: 8 }}
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                            />
                            <div style={{ maxHeight: 220, overflowY: 'auto', border: '.5px solid var(--rule)', borderRadius: 3, background: 'var(--bg)' }}>
                                {filteredProducts.map(p => (
                                    <div key={p.id}>
                                        <button
                                            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '.5px solid var(--hair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            onClick={() => pickProduct(p)}
                                        >
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{Number(p.sale_price ?? p.price).toFixed(2)} JOD</span>
                                        </button>
                                        {p.variants && p.variants.map(v => (
                                            <button key={v.value}
                                                style={{ width: '100%', textAlign: 'left', padding: '6px 12px 6px 24px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '.5px solid var(--hair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onClick={() => pickProduct(p, v)}
                                            >
                                                <span style={{ fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--ink-soft)' }}>{p.name} — {v.value}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{Number(v.price).toFixed(2)} JOD</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-mute)' }}>No products found</div>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        {editing ? (
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Details</th>
                                        <th style={{ textAlign: 'right' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Price</th>
                                        <th style={{ textAlign: 'right' }}>Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editItems.map((item, idx) => {
                                        const prod = products.find(p => p.id === item.product_id);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ minWidth: 160 }}>
                                                    <input {...inp} value={item.product_name} onChange={e => setItemField(idx, 'product_name', e.target.value)} style={{ ...inp.style, width: '100%' }} />
                                                </td>
                                                <td style={{ minWidth: 300 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {/* Engraving */}
                                                        {(item.engraving_text || prod?.allows_engraving) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 60 }}>✎ Engrave</span>
                                                                <input {...inp} value={item.engraving_text} onChange={e => setItemField(idx, 'engraving_text', e.target.value)} placeholder="Name to engrave" style={{ ...inp.style, flex: 1 }} />
                                                            </div>
                                                        )}
                                                        {/* Stitching */}
                                                        {(item.stitching_text || prod?.allows_stitching) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 60 }}>✦ Stitch</span>
                                                                <input {...inp} value={item.stitching_text} onChange={e => setItemField(idx, 'stitching_text', e.target.value)} placeholder="Text to stitch" style={{ ...inp.style, flex: 1 }} />
                                                            </div>
                                                        )}
                                                        {/* Size */}
                                                        {(item.selected_size || prod?.allows_sizes) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 60 }}>Size</span>
                                                                {prod?.available_sizes?.length ? (
                                                                    <select {...inp} value={item.selected_size} onChange={e => setItemField(idx, 'selected_size', e.target.value)} style={{ ...inp.style, flex: 1 }}>
                                                                        <option value="">—</option>
                                                                        {prod.available_sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <input {...inp} value={item.selected_size} onChange={e => setItemField(idx, 'selected_size', e.target.value)} style={{ ...inp.style, flex: 1 }} />
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Gender */}
                                                        {(item.selected_gender || prod?.allows_gender) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 60 }}>Gender</span>
                                                                <select {...inp} value={item.selected_gender} onChange={e => setItemField(idx, 'selected_gender', e.target.value)} style={{ ...inp.style, flex: 1 }}>
                                                                    <option value="">—</option>
                                                                    <option value="male">Male</option>
                                                                    <option value="female">Female</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                        {/* Color */}
                                                        {(item.selected_color || prod?.allows_color) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 60 }}>Color</span>
                                                                {prod?.available_colors?.length ? (
                                                                    <select {...inp} value={item.selected_color} onChange={e => setItemField(idx, 'selected_color', e.target.value)} style={{ ...inp.style, flex: 1 }}>
                                                                        <option value="">—</option>
                                                                        {prod.available_colors.map(c => <option key={c} value={c}>{c}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <input {...inp} value={item.selected_color} onChange={e => setItemField(idx, 'selected_color', e.target.value)} style={{ ...inp.style, flex: 1 }} />
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Add engraving toggle if product allows but not yet set */}
                                                        {!item.engraving_text && !prod?.allows_engraving && (
                                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 11, textAlign: 'left', padding: 0 }}
                                                                onClick={() => setItemField(idx, 'engraving_text', ' ')}>
                                                                + Add engraving
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                                    <input {...inp} type="number" min={1} value={item.quantity} onChange={e => setItemField(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ ...inp.style, width: 60, textAlign: 'right' }} />
                                                </td>
                                                <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                                    <input {...inp} type="number" min={0} step={0.01} value={item.unit_price} onChange={e => setItemField(idx, 'unit_price', e.target.value)} style={{ ...inp.style, width: 80, textAlign: 'right' }} />
                                                </td>
                                                <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                                    <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(185,28,28)', padding: 6, display: 'flex', alignItems: 'center' }}>
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '.5px solid var(--rule)' }}>
                                        <td colSpan={4} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>New Total</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400 }}>{editTotal.toFixed(2)}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginLeft: 4 }}>JOD</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th className="center">Qty</th>
                                        <th style={{ textAlign: 'right' }}>Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 3, background: 'var(--bg-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Package size={13} style={{ color: 'var(--ink-mute)' }} />
                                                    </div>
                                                    <div>
                                                        <span className="nm" style={{ fontSize: 15 }}>{item.product_name}</span>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px', marginTop: 2 }}>
                                                            {item.selected_size   && <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Size: {item.selected_size}</span>}
                                                            {item.selected_gender && <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{item.selected_gender === 'male' ? 'Male' : 'Female'}</span>}
                                                            {item.selected_color  && <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Color: {item.selected_color}</span>}
                                                            {item.engraving_text  && <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontStyle: 'italic' }}>✎ {item.engraving_text}</span>}
                                                            {item.stitching_text  && <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontStyle: 'italic' }}>✦ {item.stitching_text}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="center"><span className="num">{item.quantity}</span></td>
                                            <td><span className="num" style={{ display: 'block', textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</span></td>
                                            <td>
                                                <span className="num">{(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-mute)', marginLeft: 4 }}>JOD</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '.5px solid var(--rule)' }}>
                                        <td colSpan={3} style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Total</td>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-.02em' }}>{Number(order.total_amount).toFixed(2)}</span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginLeft: 4 }}>JOD</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                    {!editing && order.status === 'delivered' && totalCost > 0 && (
                        <div style={{ padding: '16px var(--pad-card)', borderTop: '.5px solid var(--hair)', background: 'var(--bg-sunk)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                            {[
                                { label: 'Revenue', value: totalRevenue, color: 'var(--ink)' },
                                { label: 'Cost', value: totalCost, color: 'var(--ink-mute)' },
                                { label: 'Profit', value: totalRevenue - totalCost, color: totalRevenue - totalCost >= 0 ? 'var(--accent)' : 'rgb(185,28,28)' },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontVariantNumeric: 'tabular-nums', color }}>{value.toFixed(2)} JOD</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Admin Notes ── */}
                <div className="w c-12">
                    <div className="w-head"><span className="w-eyebrow">Admin Notes</span></div>
                    <form onSubmit={saveNotes} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <textarea
                            value={notesForm.data.admin_notes}
                            onChange={e => notesForm.setData('admin_notes', e.target.value)}
                            rows={3}
                            placeholder="Internal notes — not visible to customer…"
                            className="form-inp"
                            style={{ resize: 'none' }}
                        />
                        <div>
                            <button type="submit" disabled={notesForm.processing} className="btn">
                                {notesForm.processing ? 'Saving…' : 'Save Notes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Status Timeline ── */}
                {order.status_logs && order.status_logs.length > 0 && (
                    <div className="w c-12">
                        <div className="w-head"><span className="w-eyebrow">Status Timeline</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {order.status_logs.map((log, i) => (
                                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 4, flexShrink: 0 }} />
                                        {i < order.status_logs!.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--hair)', marginTop: 4, minHeight: 20 }} />}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                                            {log.from_status ? (
                                                <>
                                                    <span style={{ color: 'var(--ink-mute)', textTransform: 'capitalize' }}>{log.from_status}</span>
                                                    <ArrowRight size={10} style={{ color: 'var(--ink-mute)' }} />
                                                    <span style={{ color: 'var(--ink)', textTransform: 'capitalize', fontWeight: 500 }}>{log.to_status}</span>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--ink)', textTransform: 'capitalize', fontWeight: 500 }}>Created as {log.to_status}</span>
                                            )}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>
                                            {new Date(log.created_at).toLocaleString('en-JO', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                        {log.note && <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: 2 }}>{log.note}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </LedgerLayout>
    );
}
