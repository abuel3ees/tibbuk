import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, ArrowRight, Search, X, Download, RotateCcw, MessageCircle, Printer } from 'lucide-react';
import LedgerLayout from '@/layouts/ledger-layout';

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

const statuses = ['pending', 'processing', 'delivered', 'cancelled'];

function formatWhatsAppPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('962')) return digits;
    if (digits.startsWith('0')) return '962' + digits.slice(1);
    return '962' + digits;
}

function openWhatsApp(order: Order) {
    const phone = formatWhatsAppPhone(order.customer_phone);
    const orderNo = String(order.id).padStart(5, '0');
    const itemLines = order.items
        .map(i => `• ${i.product_name} ×${i.quantity} (${Number(i.unit_price).toFixed(2)} JD)`)
        .join('\n');
    const msg = [
        `Hello ${order.customer_name}! 👋`,
        ``,
        `Your Tibbuk order #${orderNo} details:`,
        ``,
        itemLines,
        ``,
        `Total: ${Number(order.total_amount).toFixed(2)} JD`,
    ].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function printSlips(orders: Order[]) {
    const slips = orders.map(order => {
        const orderNo = String(order.id).padStart(5, '0');
        const date = new Date(order.created_at).toLocaleString('en-JO', { dateStyle: 'medium', timeStyle: 'short' });
        const subtotal = order.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
        const delivery = Number(order.total_amount) - subtotal;
        const rows = order.items.map(i => `
            <tr>
                <td style="padding:7px 0;border-bottom:1px solid #eee;">${i.product_name}</td>
                <td style="padding:7px 4px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
                <td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">${(Number(i.unit_price) * i.quantity).toFixed(2)}</td>
            </tr>`).join('');
        return `
        <div class="slip">
            <div class="slip-header">
                <div>
                    <div class="brand">Tibbuk <span>طِبّك</span></div>
                    <div class="sub">Packing Slip</div>
                </div>
                <div style="text-align:right;">
                    <div class="order-no">#${orderNo}</div>
                    <div class="meta">${date}</div>
                    <div class="status-badge ${order.status}">${order.status}</div>
                </div>
            </div>
            <div class="info-grid">
                <div class="info-block">
                    <div class="section-title">Customer</div>
                    <div class="name">${order.customer_name}</div>
                    <div class="meta">📞 ${order.customer_phone}</div>
                    ${order.customer_email ? `<div class="meta">✉ ${order.customer_email}</div>` : ''}
                </div>
                <div class="info-block">
                    <div class="section-title">Delivery Address</div>
                    <div class="meta" style="margin-top:4px;">${order.delivery_address}</div>
                </div>
            </div>
            <div class="section-title" style="margin-bottom:8px;">Items</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr>
                    <th style="text-align:left;padding:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:2px solid #eee;">Product</th>
                    <th style="text-align:center;padding:0 4px 6px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:2px solid #eee;">Qty</th>
                    <th style="text-align:right;padding:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:2px solid #eee;">Total</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="totals">
                ${delivery > 0 ? `<div class="totals-row"><span>Subtotal</span><span>${subtotal.toFixed(2)} JD</span></div><div class="totals-row"><span>Delivery</span><span>${delivery.toFixed(2)} JD</span></div>` : ''}
                <div class="totals-row total"><span>Total</span><span>${Number(order.total_amount).toFixed(2)} JD</span></div>
            </div>
            ${order.notes ? `<div class="notes">📝 ${order.notes}</div>` : ''}
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Packing Slips</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
.slip { padding: 36px 40px; max-width: 680px; margin: 0 auto; page-break-after: always; }
.slip:last-child { page-break-after: avoid; }
.slip-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #111; margin-bottom: 20px; }
.brand { font-size: 20px; font-weight: 700; }
.brand span { font-weight: 300; color: #555; margin-left: 4px; }
.sub { font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
.order-no { font-size: 18px; font-weight: 300; font-family: monospace; }
.meta { font-size: 11px; color: #888; margin-top: 2px; }
.name { font-weight: 700; font-size: 14px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.info-block { background: #f9f9f9; border-radius: 6px; padding: 12px 14px; }
.section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; margin-bottom: 8px; }
.totals { margin-top: 12px; border-top: 2px solid #111; padding-top: 12px; }
.totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; padding: 3px 0; }
.totals-row.total { font-size: 16px; font-weight: 700; color: #111; margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee; }
.notes { margin-top: 14px; padding: 10px 12px; background: #fffbf0; border: 1px solid #fde68a; border-radius: 6px; font-size: 12px; }
.status-badge { display: inline-block; margin-top: 5px; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; padding: 2px 7px; border-radius: 3px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.status-badge.cancelled { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.status-badge.pending { background: #fffbeb; color: #92400e; border-color: #fde68a; }
.status-badge.processing { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
@media print { body { background: #fff; } @page { margin: 8mm; } }
</style>
</head>
<body>${slips}</body>
</html>`;

    const w = window.open('', '_blank', 'width=750,height=900');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
}

export default function OrdersIndex({ orders, filters }: Props) {
    const [updating, setUpdating] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('processing');
    const [bulking, setBulking] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setSelected(new Set()); }, [orders.current_page]);

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

    function updateStatus(orderId: number, newStatus: string) {
        setUpdating(orderId);
        router.patch(`/admin/orders/${orderId}/status`, { status: newStatus }, { onFinish: () => setUpdating(null), preserveScroll: true });
    }

    function deleteOrder(orderId: number) {
        if (!confirm(`Delete order #${String(orderId).padStart(5, '0')}? This cannot be undone.`)) return;
        router.delete(`/admin/orders/${orderId}`, { preserveScroll: true });
    }

    const allIds = orders.data.map(o => o.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someSelected = selected.size > 0;

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(allIds));
    }

    function toggleOne(id: number) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelected(next);
    }

    function applyBulkStatus() {
        if (!someSelected) return;
        if (!confirm(`Set ${selected.size} order${selected.size !== 1 ? 's' : ''} to "${bulkStatus}"?`)) return;
        setBulking(true);
        router.post('/admin/orders/bulk-status', { ids: [...selected], status: bulkStatus }, {
            preserveScroll: true,
            onFinish: () => { setBulking(false); setSelected(new Set()); },
        });
    }

    function applyBulkDelete() {
        if (!someSelected) return;
        if (!confirm(`Delete ${selected.size} order${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
        setBulking(true);
        router.delete('/admin/orders/bulk', {
            data: { ids: [...selected] },
            preserveScroll: true,
            onFinish: () => { setBulking(false); setSelected(new Set()); },
        });
    }

    return (
        <LedgerLayout
            active="orders"
            title={<>The <em>Orders</em></>}
            eyebrow={`${orders.total} total`}
            actions={
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <a href={`/admin/orders/export${buildExportQuery(search, status)}`} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={13} /> Export XLSX
                    </a>
                    <button
                        className="btn btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                            if (!confirm('This will permanently delete ALL orders and reset the ID counter to 1. This cannot be undone — continue?')) return;
                            fetch('/admin/orders/reset-sequence', {
                                method: 'POST',
                                headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
                            }).then(r => r.json()).then(d => {
                                if (d.ok) { alert('All orders deleted and ID sequence reset to 1.'); window.location.reload(); }
                                else alert(d.error ?? 'Failed.');
                            });
                        }}
                    >
                        <RotateCcw size={13} /> Reset IDs
                    </button>
                </div>
            }
            counts={{ orders: orders.total }}
        >
            <Head title="Orders — Admin" />

            {/* ── Filters ── */}
            <div className="tbl-filters">
                <div className="tbl-search">
                    <Search className="search-ic" size={14} />
                    <input
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search by name or phone…"
                        className="tbl-input"
                    />
                    {search && (
                        <button onClick={() => handleSearchChange('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'flex' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }} className="tbl-select">
                    <option value="">All statuses</option>
                    {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                {hasFilters && (
                    <button
                        onClick={() => { setSearch(''); setStatus(''); router.get('/admin/orders', {}, { preserveState: true, replace: true }); }}
                        className="tbl-chip"
                    >
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* ── Bulk bar ── */}
            {someSelected && (
                <div className="bulk-bar">
                    <span className="bulk-count">{selected.size} selected</span>
                    <span className="bulk-spacer" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Set to</span>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="tbl-select" style={{ minWidth: 120 }}>
                        {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <button onClick={applyBulkStatus} disabled={bulking} className="btn" style={{ padding: '6px 14px' }}>
                        {bulking ? 'Updating…' : 'Apply'}
                    </button>
                    <button onClick={applyBulkDelete} disabled={bulking} className="btn" style={{ padding: '6px 14px', background: 'rgb(185,28,28)', borderColor: 'rgb(185,28,28)' }}>
                        Delete
                    </button>
                    <button
                        onClick={() => printSlips(orders.data.filter(o => selected.has(o.id)))}
                        disabled={bulking}
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                        <Printer size={12} /> Print Slips
                    </button>
                    <button onClick={() => setSelected(new Set())} className="btn btn-ghost" style={{ padding: '6px 14px' }}>
                        Clear
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="w" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th style={{ width: 36, textAlign: 'center' }}>
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                                </th>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.data.map(order => (
                                <tr key={order.id} className={selected.has(order.id) ? 'selected' : ''}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)}
                                            style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                                    </td>
                                    <td>
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.04em' }}>#{String(order.id).padStart(5, '0')}</span>
                                            <span className="nm" style={{ display: 'block', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                                                {new Date(order.created_at).toLocaleDateString('en-JO')}
                                            </span>
                                        </Link>
                                    </td>
                                    <td>
                                        <span className="nm">{order.customer_name}</span>
                                        <span style={{ display: 'block', fontFamily: 'var(--font-text)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{order.customer_phone}</span>
                                    </td>
                                    <td style={{ color: 'var(--ink-soft)', fontSize: 12 }}>
                                        {order.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ').slice(0, 55)}{order.items.length > 1 ? '…' : ''}
                                    </td>
                                    <td>
                                        <span className="num">{Number(order.total_amount).toFixed(2)}</span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-mute)', marginLeft: 4 }}>JOD</span>
                                    </td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={e => updateStatus(order.id, e.target.value)}
                                            disabled={updating === order.id}
                                            className={`tbl tag ${order.status}`}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 2, outline: 'none', opacity: updating === order.id ? .5 : 1 }}
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button
                                                onClick={() => openWhatsApp(order)}
                                                className="tbl-icon-btn"
                                                title={`WhatsApp ${order.customer_name}`}
                                                style={{ color: '#25D366' }}
                                            >
                                                <MessageCircle size={14} />
                                            </button>
                                            <Link href={`/admin/orders/${order.id}`} className="tbl-icon-btn">
                                                <ArrowRight size={14} />
                                            </Link>
                                            <button onClick={() => deleteOrder(order.id)} className="tbl-icon-btn danger">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '64px var(--pad-card)', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>
                                        No orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ── */}
            {orders.last_page > 1 && (
                <div className="pager">
                    {orders.links.map((link, i) => link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            className={`pager-item${link.active ? ' active' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span key={i} className="pager-item disabled" dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </LedgerLayout>
    );
}
