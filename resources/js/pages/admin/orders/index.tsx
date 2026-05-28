import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, ArrowRight, Search, X, Download, RotateCcw } from 'lucide-react';
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
