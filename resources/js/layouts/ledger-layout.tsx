import '../../css/ledger.css';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
    title: React.ReactNode;
    active: 'dashboard' | 'orders' | 'products' | 'financials' | 'media' | 'discounts';
    eyebrow?: string;
    actions?: React.ReactNode;
    counts?: { orders?: number; products?: number; pending?: number; lowStock?: number };
}

interface Notification { id: string; data: { message: string; order_id: number; customer_name: string; total_amount: string }; created_at: string; read_at: string | null }

const CMD_ITEMS = [
    { ic: '◎', label: 'Dashboard', sub: 'Overview', href: '/admin', keys: 'G D' },
    { ic: '⊡', label: 'Orders', sub: 'All orders', href: '/admin/orders', keys: 'G O' },
    { ic: '⊟', label: 'Products', sub: 'Catalogue', href: '/admin/products', keys: 'G P' },
    { ic: '↗', label: 'Financials', sub: 'Revenue report', href: '/admin/financials', keys: '' },
    { ic: '▦', label: 'Media', sub: 'File library', href: '/admin/media', keys: '' },
    { ic: '%', label: 'Discounts', sub: 'Promotions & sales', href: '/admin/discounts', keys: '' },
    { ic: '⊕', label: 'New Product', sub: 'Add to catalogue', href: '/admin/products/create', keys: '' },
];

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function fmtDate(d: Date) { return `${DAYS[d.getDay()]} · ${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtClock(d: Date) {
    let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0'); const s = String(d.getSeconds()).padStart(2,'0');
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${h}:${m}:${s} ${ap}`;
}

export default function LedgerLayout({ children, title, active, eyebrow, actions, counts }: Props) {
    const [dark, setDark] = useState<boolean>(() => { try { return localStorage.getItem('tbk_admin_dark') !== 'false'; } catch { return true; } });
    const [now, setNow] = useState(new Date());
    const [cmdOpen, setCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => { try { localStorage.setItem('tbk_admin_dark', dark ? 'true' : 'false'); } catch {} }, [dark]);
    useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
    useEffect(() => {
        fetchUnreadCount();
        const id = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); setCmdQuery(''); }
            if (e.key === 'Escape') { setCmdOpen(false); setNotifOpen(false); }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    async function fetchUnreadCount() {
        try { const res = await fetch('/admin/notifications/unread-count'); const d = await res.json(); setUnreadCount(d.count); } catch {}
    }
    async function openNotifications() {
        setNotifOpen(true);
        try {
            const res = await fetch('/admin/notifications');
            const d = await res.json();
            setNotifications(d);
            await fetch('/admin/notifications/read', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' } });
            setUnreadCount(0);
        } catch {}
    }

    const filteredCmd = cmdQuery
        ? CMD_ITEMS.filter(i => i.label.toLowerCase().includes(cmdQuery.toLowerCase()) || i.sub.toLowerCase().includes(cmdQuery.toLowerCase()))
        : CMD_ITEMS;

    return (
        <div className="ledger-app" data-dark={dark ? '1' : '0'}>

            {/* ── SIDEBAR ─────────────────────────────────────────── */}
            <aside className="sb">
                <div className="sb-mark">
                    <img src="/images/logo.jpg" alt="Tibbuk" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div className="tag" style={{ marginTop: 4 }}>Admin Dashboard</div>
                </div>

                <div className="sb-section">
                    <div className="sb-section-label">Navigate</div>
                    <Link href="/admin" className="sb-item" data-active={active === 'dashboard' ? '1' : '0'}>
                        <span className="sb-label">Dashboard</span>
                    </Link>
                    <Link href="/admin/orders" className="sb-item" data-active={active === 'orders' ? '1' : '0'}>
                        <span className="sb-label">Orders</span>
                        {counts?.orders !== undefined && <span className="sb-count">{counts.orders}</span>}
                    </Link>
                    <Link href="/admin/products" className="sb-item" data-active={active === 'products' ? '1' : '0'}>
                        <span className="sb-label">Products</span>
                        {counts?.products !== undefined && <span className="sb-count">{counts.products}</span>}
                    </Link>
                    <Link href="/admin/financials" className="sb-item" data-active={active === 'financials' ? '1' : '0'}>
                        <span className="sb-label">Financials</span>
                    </Link>
                    <Link href="/admin/media" className="sb-item" data-active={active === 'media' ? '1' : '0'}>
                        <span className="sb-label">Media</span>
                    </Link>
                    <Link href="/admin/discounts" className="sb-item" data-active={active === 'discounts' ? '1' : '0'}>
                        <span className="sb-label">Discounts</span>
                    </Link>
                </div>

                <div className="sb-section">
                    <div className="sb-section-label">Alerts</div>
                    {(counts?.pending ?? 0) > 0 && (
                        <Link href="/admin/orders?filter[status]=pending" className="sb-item" data-active="0">
                            <span className="sb-label">Pending</span>
                            <span className="sb-count">{counts!.pending}</span>
                        </Link>
                    )}
                    {(counts?.lowStock ?? 0) > 0 && (
                        <Link href="/admin/products?filter[stock]=out" className="sb-item" data-active="0">
                            <span className="sb-label">Low Stock</span>
                            <span className="sb-count">{counts!.lowStock}</span>
                        </Link>
                    )}
                    <div className="sb-item" data-active="0" onClick={openNotifications} style={{ cursor: 'pointer' }}>
                        <span className="sb-label">Notifications</span>
                        {unreadCount > 0 && <span className="sb-count">{unreadCount}</span>}
                    </div>
                </div>

                <div className="sb-section">
                    <div className="sb-section-label">Store</div>
                    <Link href="/" target="_blank" className="sb-item" data-active="0">
                        <span className="sb-label">View Store</span>
                    </Link>
                    <div className="sb-item" data-active="0" onClick={() => setDark(d => !d)} style={{ cursor: 'pointer' }}>
                        <span className="sb-label">{dark ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                </div>

                <div className="sb-user">
                    <div className="sb-avatar">A</div>
                    <div>
                        <div className="name">Admin</div>
                        <div className="role">Store Manager</div>
                    </div>
                </div>
            </aside>

            {/* ── MAIN ────────────────────────────────────────────── */}
            <div className="main">

                {/* Masthead */}
                <header className="mh">
                    <div className="mh-left">
                        <span>Tibbuk Admin</span>
                        <span className="mh-pipe" />
                        <span>{fmtDate(now)}</span>
                        {eyebrow && <><span className="mh-pipe" /><span>{eyebrow}</span></>}
                    </div>
                    <h1 className="mh-center">{title}</h1>
                    <div className="mh-right">
                        {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
                        <div className="mh-search" onClick={() => setCmdOpen(true)}>
                            <span className="ph">Search…</span>
                            <span className="kbd">⌘K</span>
                        </div>
                    </div>
                </header>

                <div className="mh-range" style={{ borderTop: 0, borderBottom: '.5px dashed var(--hair)', padding: '10px 36px' }}>
                    <div className="mh-live">
                        <span className="mh-dot" />
                        <span>Live · {fmtClock(now)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <Link href="/admin" className="mh-pill" data-active={active === 'dashboard' ? '1' : '0'}>Dashboard</Link>
                        <Link href="/admin/orders" className="mh-pill" data-active={active === 'orders' ? '1' : '0'}>Orders</Link>
                        <Link href="/admin/products" className="mh-pill" data-active={active === 'products' ? '1' : '0'}>Products</Link>
                        <Link href="/admin/financials" className="mh-pill" data-active={active === 'financials' ? '1' : '0'}>Financials</Link>
                    </div>
                </div>

                {/* Canvas */}
                <div className="canvas">
                    {children}
                </div>
            </div>

            {/* ── Command palette ──────────────────────────────────── */}
            {cmdOpen && (
                <div className="cp-back" onClick={() => setCmdOpen(false)}>
                    <div className="cp" onClick={e => e.stopPropagation()}>
                        <input autoFocus className="cp-input" placeholder="Go anywhere…"
                            value={cmdQuery} onChange={e => setCmdQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Escape') setCmdOpen(false);
                                if (e.key === 'Enter' && filteredCmd[0]?.href) { router.visit(filteredCmd[0].href); setCmdOpen(false); }
                            }} />
                        <div className="cp-list">
                            <div className="cp-sect">Quick navigation</div>
                            {filteredCmd.map((item, i) => (
                                <Link key={item.label} href={item.href} className="cp-row" data-on={i === 0 ? '1' : '0'} onClick={() => setCmdOpen(false)}>
                                    <span className="cp-ic">{item.ic}</span>
                                    <span className="cp-lbl">{item.label}<span className="sub">{item.sub}</span></span>
                                    {item.keys && <span className="cp-kbd">{item.keys}</span>}
                                </Link>
                            ))}
                        </div>
                        <div className="cp-foot"><span>↑↓ navigate</span><span>↵ open · Esc close</span></div>
                    </div>
                </div>
            )}

            {/* ── Notifications drawer ─────────────────────────────── */}
            {notifOpen && (
                <>
                    <div className="notif-back" onClick={() => setNotifOpen(false)} />
                    <div className="notif-drawer">
                        <div className="notif-head">
                            <h3>Notifications</h3>
                            <button className="notif-close" onClick={() => setNotifOpen(false)}>Close</button>
                        </div>
                        {notifications.length === 0 ? (
                            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16, padding: '24px 0' }}>No notifications yet.</p>
                        ) : notifications.map(n => (
                            <div key={n.id} className={`notif-item${!n.read_at ? ' unread' : ''}`}>
                                <div className="notif-msg">{n.data.message}</div>
                                <div className="notif-meta">{Number(n.data.total_amount).toFixed(2)} JD · {new Date(n.created_at).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
