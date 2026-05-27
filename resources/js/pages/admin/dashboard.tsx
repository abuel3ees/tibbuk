import '../../../css/ledger.css';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ImagePlus } from 'lucide-react';

/* ── Interfaces ──────────────────────────────────────────────────────────── */
interface Stats {
    total_products: number; total_orders: number;
    pending_orders: number; processing_orders: number;
    delivered_orders: number; cancelled_orders: number;
}
interface Financials { total_revenue: number; total_cost: number; net_profit: number }
interface Order { id: number; customer_name: string; customer_phone: string; status: string; total_amount: string; created_at: string }
interface Notification { id: string; data: { message: string; order_id: number; customer_name: string; total_amount: string }; created_at: string; read_at: string | null }
interface HeroContent { pill_en: string | null; pill_ar: string | null; title_en: string | null; title_ar: string | null; lede_en: string | null; lede_ar: string | null }
interface DayData { date: string; label: string; count: number }
interface TopProduct { name: string; revenue: number; units: number }
interface CategoryRevenue { category: string; revenue: number }
interface LowStockProduct { id: number; name: string; quantity: number | null; stock_status: string }
interface CustomerStats { total: number; repeat: number; rate: number }

interface Props {
    stats: Stats; financials: Financials; recentOrders: Order[]; hero_images: string[]; hero_content: HeroContent;
    orders_per_day: DayData[]; top_products: TopProduct[]; revenue_by_category: CategoryRevenue[]; low_stock: LowStockProduct[];
    customer_stats?: CustomerStats;
}

/* ── Time helpers ────────────────────────────────────────────────────────── */
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function fmtDate(d: Date) { return `${DAYS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtClock(d: Date) {
    let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0'); const s = String(d.getSeconds()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${h}:${m}:${s} ${ap}`;
}

const RANGES = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'qtd', label: 'QTD' },
    { id: 'ytd', label: 'YTD' },
];
const RANGE_LABELS: Record<string, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', qtd: 'Quarter to date', ytd: 'Year to date' };

/* ── SVG area chart (sparkline) ──────────────────────────────────────────── */
function AreaSpark({ data, height = 180 }: { data: number[]; height?: number }) {
    if (data.length < 2) return null;
    const w = 900, h = height;
    const padT = 12, padB = 28;
    const minV = Math.min(...data) * 0.9;
    const maxV = (Math.max(...data) * 1.05) || 1;
    const range = maxV - minV || 1;
    const stepX = w / (data.length - 1);
    const cx = (i: number) => i * stepX;
    const cy = (v: number) => padT + (1 - (v - minV) / range) * (h - padT - padB);
    const pts = data.map((v, i) => [cx(i), cy(v)] as [number, number]);
    const path = pts.map(([px, py], i) => (i === 0 ? `M${px},${py}` : `L${px},${py}`)).join(' ');
    const area = `${path} L${w},${h - padB} L0,${h - padB} Z`;
    const grid = [0.25, 0.5, 0.75].map(g => padT + g * (h - padT - padB));
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height }}>
            {grid.map((gy, i) => (
                <line key={i} x1={0} x2={w} y1={gy} y2={gy} className="chart-grid" strokeDasharray="2 4" />
            ))}
            <path d={area} className="chart-area" />
            <path d={path} className="chart-line" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" className="chart-dot" />
        </svg>
    );
}

/* ── Pipeline funnel ─────────────────────────────────────────────────────── */
function Funnel({ stats }: { stats: Stats }) {
    const total = stats.total_orders || 1;
    const stages = [
        { ix: '01', label: 'Pending',    count: stats.pending_orders,    pct: stats.pending_orders / total * 100,    value: null },
        { ix: '02', label: 'Processing', count: stats.processing_orders, pct: stats.processing_orders / total * 100, value: null },
        { ix: '03', label: 'Delivered',  count: stats.delivered_orders,  pct: stats.delivered_orders / total * 100,  value: null },
        { ix: '04', label: 'Cancelled',  count: stats.cancelled_orders,  pct: stats.cancelled_orders / total * 100,  value: null },
    ];
    return (
        <div className="funnel">
            {stages.map(s => (
                <div key={s.ix} className="fn-col">
                    <div className="fn-stage"><span className="ix">{s.ix}</span>{s.label}</div>
                    <div className="fn-count">{s.count}</div>
                    <div className="fn-value">{s.pct.toFixed(0)}% of orders</div>
                    <div className="fn-bar"><i style={{ width: `${s.pct}%` }} /></div>
                </div>
            ))}
        </div>
    );
}

/* ── Inline HeroImage card ───────────────────────────────────────────────── */
function HeroImageCard({ images }: { images: string[] }) {
    const { data, setData, post, processing } = useForm<{ images: File[] }>({ images: [] });
    const inputRef = useRef<HTMLInputElement>(null);
    function handleFiles(files: FileList | null) {
        if (!files) return;
        setData('images', [...data.images, ...Array.from(files)]);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.images.length) return;
        post('/admin/settings/hero-images', { forceFormData: true, onSuccess: () => setData('images', []) });
    }
    function removeImage(index: number) {
        if (!confirm('Remove this hero image?')) return;
        router.delete('/admin/settings/hero-images', { data: { index }, preserveScroll: true });
    }
    return (
        <div className="settings-card">
            <div className="settings-head">
                <h3>Hero Slideshow</h3>
                <p>{images.length} image{images.length !== 1 ? 's' : ''} · cycles automatically</p>
            </div>
            <div className="settings-body">
                {images.length > 0 && (
                    <div className="img-grid" style={{ marginBottom: 16 }}>
                        {images.map((url, i) => (
                            <div key={i} className="img-thumb">
                                <img src={url} alt={`Slide ${i + 1}`} />
                                <div className="img-del">
                                    <button onClick={() => removeImage(i)}><X size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="upload-zone" onClick={() => inputRef.current?.click()}>
                        <ImagePlus size={22} style={{ margin: '0 auto', color: 'var(--ink-mute)' }} />
                        <p>{data.images.length > 0 ? `${data.images.length} file${data.images.length !== 1 ? 's' : ''} ready` : 'Click to add images'}</p>
                        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
                    </div>
                    <button type="submit" className="btn" disabled={!data.images.length || processing}>
                        {processing ? 'Uploading…' : 'Upload & Add to Slideshow'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ── Inline HeroContent card ─────────────────────────────────────────────── */
function HeroContentCard({ content }: { content: HeroContent }) {
    const { data, setData, post, processing } = useForm({
        pill_en: content.pill_en ?? '', pill_ar: content.pill_ar ?? '',
        title_en: content.title_en ?? '', title_ar: content.title_ar ?? '',
        lede_en: content.lede_en ?? '', lede_ar: content.lede_ar ?? '',
    });
    const field = (label: string, key: keyof typeof data, rows = 1) => (
        <div style={{ marginBottom: 12 }}>
            <label className="field-lbl">{label}</label>
            {rows > 1
                ? <textarea rows={rows} value={data[key]} onChange={e => setData(key, e.target.value)} className="field-inp" style={{ resize: 'none' }} />
                : <input type="text" value={data[key]} onChange={e => setData(key, e.target.value)} className="field-inp" />
            }
        </div>
    );
    return (
        <div className="settings-card">
            <div className="settings-head">
                <h3>Hero Text</h3>
                <p>Leave blank for defaults</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); post('/admin/settings/hero-content'); }}
                  className="settings-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>English</div>
                        {field('Pill', 'pill_en')}
                        {field('Title', 'title_en')}
                        {field('Lede', 'lede_en', 2)}
                    </div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>عربي</div>
                        {field('Pill', 'pill_ar')}
                        {field('Title', 'title_ar')}
                        {field('Lede', 'lede_ar', 2)}
                    </div>
                </div>
                <button type="submit" className="btn" disabled={processing}>
                    {processing ? 'Saving…' : 'Save Text'}
                </button>
            </form>
        </div>
    );
}

/* ── Main dashboard ──────────────────────────────────────────────────────── */
export default function Dashboard({
    stats, financials, recentOrders, hero_images, hero_content,
    orders_per_day, top_products, revenue_by_category, low_stock, customer_stats,
}: Props) {

    /* Dark mode — synced with existing admin preference */
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem('tbk_admin_dark') !== 'false'; } catch { return true; }
    });
    useEffect(() => {
        try { localStorage.setItem('tbk_admin_dark', dark ? 'true' : 'false'); } catch {}
    }, [dark]);

    /* Live clock */
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    /* Range selector */
    const [range, setRange] = useState('30d');

    /* Notifications */
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const id = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(id);
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

    /* Command palette */
    const [cmdOpen, setCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');

    const CMD_ITEMS = [
        { ic: '◎', label: 'Dashboard', sub: 'Overview', href: '/admin', keys: 'G D' },
        { ic: '⊡', label: 'Orders', sub: 'All orders', href: '/admin/orders', keys: 'G O' },
        { ic: '⊟', label: 'Products', sub: 'Catalogue', href: '/admin/products', keys: 'G P' },
        { ic: '↗', label: 'Financials', sub: 'Revenue report', href: '/admin/financials', keys: '' },
        { ic: '⊕', label: 'New Product', sub: 'Add to catalogue', href: '/admin/products/create', keys: '' },
        { ic: '🔔', label: 'Notifications', sub: `${unreadCount} unread`, href: null, keys: '' },
    ];

    const filteredCmd = cmdQuery
        ? CMD_ITEMS.filter(i => i.label.toLowerCase().includes(cmdQuery.toLowerCase()) || i.sub.toLowerCase().includes(cmdQuery.toLowerCase()))
        : CMD_ITEMS;

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); setCmdQuery(''); }
            if (e.key === 'Escape') { setCmdOpen(false); setNotifOpen(false); }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* Greeting */
    const h = now.getHours();
    const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const periodLabel = RANGE_LABELS[range] ?? '30 Days';

    /* Derived chart data */
    const sparkData = orders_per_day.map(d => d.count);
    const barMax = Math.max(...sparkData, 1);
    const topRevMax = top_products[0]?.revenue ?? 1;
    const catMax = revenue_by_category[0]?.revenue ?? 1;

    /* Format helpers */
    const jd = (n: number) => n.toFixed(2);
    const jdK = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0);

    return (
        <>
            <Head title="The Dashboard — Tibbuk Admin" />

            <div className="ledger-app" data-dark={dark ? '1' : '0'}>

                {/* ── SIDEBAR ───────────────────────────────────────────── */}
                <aside className="sb">
                    <div className="sb-mark">
                        <div className="mono">Tibbuk · Medical Store</div>
                        <div className="word">Tibbuk <em>·</em> طِبّك</div>
                        <div className="tag">Admin Dashboard</div>
                    </div>

                    <div className="sb-section">
                        <div className="sb-section-label">Navigate</div>
                        <Link href="/admin" className="sb-item" data-active="1">
                            <span className="sb-label">Dashboard</span>
                        </Link>
                        <Link href="/admin/orders" className="sb-item" data-active="0">
                            <span className="sb-label">Orders</span>
                            <span className="sb-count">{stats.total_orders}</span>
                        </Link>
                        <Link href="/admin/products" className="sb-item" data-active="0">
                            <span className="sb-label">Products</span>
                            <span className="sb-count">{stats.total_products}</span>
                        </Link>
                        <Link href="/admin/financials" className="sb-item" data-active="0">
                            <span className="sb-label">Financials</span>
                        </Link>
                        <Link href="/admin/media" className="sb-item" data-active="0">
                            <span className="sb-label">Media</span>
                        </Link>
                    </div>

                    <div className="sb-section">
                        <div className="sb-section-label">Alerts</div>
                        {stats.pending_orders > 0 && (
                            <Link href="/admin/orders?status=pending" className="sb-item" data-active="0">
                                <span className="sb-label">Pending</span>
                                <span className="sb-count">{stats.pending_orders}</span>
                            </Link>
                        )}
                        {low_stock.length > 0 && (
                            <Link href="/admin/products?filter[stock]=out" className="sb-item" data-active="0">
                                <span className="sb-label">Low Stock</span>
                                <span className="sb-count">{low_stock.length}</span>
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

                {/* ── MAIN ─────────────────────────────────────────────── */}
                <div className="main">

                    {/* Masthead */}
                    <header className="mh">
                        <div className="mh-left">
                            <span>Tibbuk Admin</span>
                            <span className="mh-pipe" />
                            <span>{fmtDate(now)}</span>
                        </div>
                        <h1 className="mh-center">The <em>Dashboard</em></h1>
                        <div className="mh-right">
                            <div className="mh-search" onClick={() => setCmdOpen(true)}>
                                <span className="ph">Search orders, products…</span>
                                <span className="kbd">⌘K</span>
                            </div>
                        </div>
                    </header>

                    <div className="mh-range">
                        <div className="mh-range-left">
                            <span style={{ marginRight: 10 }}>Period</span>
                            {RANGES.map(r => (
                                <button key={r.id} className="mh-pill"
                                    data-active={range === r.id ? '1' : '0'}
                                    onClick={() => setRange(r.id)}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <div className="mh-live">
                            <span className="mh-dot" />
                            <span>Live · {fmtClock(now)}</span>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="canvas">

                        {/* Greeting */}
                        <div className="greet">
                            <h2 className="greet-h">
                                {greeting},<br />
                                <em>Admin.</em> <span className="amp">·</span> The store is in motion.
                            </h2>
                            <div className="greet-sub">
                                <span className="lg">Issue {periodLabel}</span>
                                <span>{stats.total_orders} total orders</span>
                                {stats.pending_orders > 0 && <span>{stats.pending_orders} pending attention</span>}
                            </div>
                        </div>

                        {/* ── Magazine grid ─────────────────────────────── */}
                        <div className="grid">

                            {/* 01 — Revenue hero (c-7) */}
                            <div className="w c-7">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">01</span>Delivered Revenue</div>
                                    <Link href="/admin/financials" className="w-action">Full report →</Link>
                                </div>
                                <div className="hero-num">
                                    <span className="cur">JD</span>
                                    {Math.floor(financials.total_revenue).toLocaleString()}
                                    <span className="frac">.{String(Math.round((financials.total_revenue % 1) * 100)).padStart(2, '0')}</span>
                                </div>
                                <div className="hero-delta">
                                    <span>Net profit: {jd(financials.net_profit)} JD</span>
                                    <span className="vs">cost basis {jd(financials.total_cost)} JD · delivered orders only</span>
                                </div>
                                <div style={{ margin: '20px -8px 0' }}>
                                    <AreaSpark data={sparkData} height={180} />
                                </div>
                                <div className="hero-foot">
                                    {top_products.length > 0
                                        ? <>Leading product: <em>{top_products[0].name}</em> · {jd(top_products[0].revenue)} JD across {top_products[0].units} units delivered.</>
                                        : 'No delivered orders yet — revenue will appear here once orders are fulfilled.'}
                                </div>
                            </div>

                            {/* 02 — Stats column (c-5) */}
                            <div className="w c-5">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">02</span>By the Numbers</div>
                                </div>
                                <div className="stat" style={{ paddingTop: 0 }}>
                                    <span className="stat-lbl">Total Orders</span>
                                    <span className="stat-val">{stats.total_orders.toLocaleString()}</span>
                                    <span className="stat-cap">All time, across all statuses.</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-lbl">Pending<span className="delta">{stats.total_orders > 0 ? Math.round(stats.pending_orders / stats.total_orders * 100) : 0}%</span></span>
                                    <span className="stat-val">{stats.pending_orders.toLocaleString()}</span>
                                    <span className="stat-cap">Awaiting processing.</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-lbl">Delivered<span className="delta">{stats.total_orders > 0 ? Math.round(stats.delivered_orders / stats.total_orders * 100) : 0}%</span></span>
                                    <span className="stat-val">{stats.delivered_orders.toLocaleString()}</span>
                                    <span className="stat-cap">Successfully fulfilled.</span>
                                </div>
                                {customer_stats && customer_stats.total > 0 && (
                                    <div className="stat" style={{ paddingBottom: 0 }}>
                                        <span className="stat-lbl">Repeat Customers<span className="delta">{customer_stats.rate}%</span></span>
                                        <span className="stat-val">{customer_stats.repeat}<span className="unit">/{customer_stats.total}</span></span>
                                        <span className="stat-cap">Ordered more than once.</span>
                                    </div>
                                )}
                            </div>

                            {/* 03 — Pipeline funnel (c-12) */}
                            <div className="w c-12">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">03</span>The Pipeline · Four Stages</div>
                                    <Link href="/admin/orders" className="w-action">Open orders →</Link>
                                </div>
                                <h3 className="w-title">From <em>first inquiry</em> to last delivery.</h3>
                                <p className="w-deck">{stats.total_orders} orders in motion · {jdK(financials.total_revenue)} JD revenue delivered.</p>
                                <Funnel stats={stats} />
                            </div>

                            {/* 04 — Recent orders as agenda (c-7) */}
                            <div className="w c-7">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">04</span>Recent Orders</div>
                                    <Link href="/admin/orders" className="w-action">All orders →</Link>
                                </div>
                                <h3 className="w-title">Latest <em>activity</em> from customers.</h3>
                                {recentOrders.length === 0 ? (
                                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 15, padding: '16px 0' }}>No orders yet.</p>
                                ) : (
                                    <div className="agenda">
                                        {recentOrders.map(order => (
                                            <Link key={order.id} href={`/admin/orders/${order.id}`} className="ag">
                                                <span className="ag-time">#{String(order.id).padStart(4, '0')}</span>
                                                <span className="ag-who">
                                                    {order.customer_name}
                                                    <span className="t">{Number(order.total_amount).toFixed(2)} JD</span>
                                                </span>
                                                <span className="ag-status" data-s={order.status}>{order.status}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 05 — Top products as referrers (c-5) */}
                            <div className="w c-5">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">05</span>Who Sells Whom</div>
                                </div>
                                <h3 className="w-title">Top <em>products</em>, delivered.</h3>
                                {top_products.length === 0 ? (
                                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 15, padding: '16px 0' }}>No delivered orders yet.</p>
                                ) : (
                                    <div className="refs">
                                        {top_products.map((p, i) => (
                                            <div key={i} className="ref">
                                                <span className="ref-rank">{i + 1}.</span>
                                                <span className="ref-name">
                                                    {p.name}
                                                    <span className="sub">{p.units} units sold</span>
                                                </span>
                                                <span className="ref-bar">
                                                    <i style={{ width: `${(p.revenue / topRevMax) * 100}%` }} />
                                                </span>
                                                <span className="ref-n">{jd(p.revenue)} JD</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 06 — Revenue by category (c-7) */}
                            {revenue_by_category.length > 0 && (
                                <div className="w c-7">
                                    <div className="w-head">
                                        <div className="w-eyebrow"><span className="num">06</span>The Store's Inventory</div>
                                    </div>
                                    <h3 className="w-title">By <em>category</em>, by revenue.</h3>
                                    <p className="w-deck">Categories ranked by delivered revenue — your product mix at a glance.</p>
                                    <div>
                                        {revenue_by_category.map((c, i) => (
                                            <div key={i} className="treat-row">
                                                <div className="treat-name">{c.category}</div>
                                                <div className="treat-bar">
                                                    <i style={{ width: `${(c.revenue / catMax) * 100}%` }} />
                                                </div>
                                                <div className="treat-val">{jd(c.revenue)} JD</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 07 — Low stock (c-5) */}
                            {low_stock.length > 0 && (
                                <div className="w c-5">
                                    <div className="w-head">
                                        <div className="w-eyebrow"><span className="num">07</span>Low Stock Alert</div>
                                        <Link href="/admin/products?filter[stock]=out" className="w-action">View all →</Link>
                                    </div>
                                    <h3 className="w-title"><em>{low_stock.length}</em> product{low_stock.length !== 1 ? 's' : ''} need attention.</h3>
                                    <div>
                                        {low_stock.map(p => (
                                            <Link key={p.id} href={`/admin/products/${p.id}/edit`} className="stock-row">
                                                <span className="stock-name">{p.name}</span>
                                                <span className={`stock-badge ${p.stock_status === 'out_of_stock' || p.quantity === 0 ? 'out' : 'low'}`}>
                                                    {p.stock_status === 'out_of_stock' || p.quantity === 0 ? 'Out' : `${p.quantity} left`}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 08 — Orders per day bar chart (c-12) */}
                            <div className="w c-12">
                                <div className="w-head">
                                    <div className="w-eyebrow"><span className="num">08</span>Order Velocity · Last 14 Days</div>
                                </div>
                                <h3 className="w-title">Daily <em>order volume</em>, charted.</h3>
                                <div className="bar-chart" style={{ height: 100, marginTop: 12 }}>
                                    {orders_per_day.map((d, i) => (
                                        <div key={d.date} className="bar-col">
                                            <div
                                                className={`bar-fill${d.count > 0 ? ' has-val' : ''}`}
                                                style={{ height: `${Math.max((d.count / barMax) * 72, d.count > 0 ? 3 : 1)}px` }}
                                                title={`${d.label}: ${d.count} orders`}
                                            />
                                            {i % 2 === 0 && (
                                                <span className="bar-lbl">{d.label.split(' ')[1]}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 09 — Site settings */}
                            <div className="c-6">
                                <HeroImageCard images={hero_images} />
                            </div>
                            <div className="c-6">
                                <HeroContentCard content={hero_content} />
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── Command palette ───────────────────────────────────────── */}
            {cmdOpen && (
                <div className="ledger-app" data-dark={dark ? '1' : '0'} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'block', background: 'transparent', pointerEvents: 'none' }}>
                    <div className="cp-back" style={{ pointerEvents: 'auto' }} onClick={() => setCmdOpen(false)}>
                        <div className="cp" onClick={e => e.stopPropagation()}>
                            <input
                                autoFocus
                                className="cp-input"
                                placeholder="Go anywhere…"
                                value={cmdQuery}
                                onChange={e => setCmdQuery(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') setCmdOpen(false);
                                    if (e.key === 'Enter' && filteredCmd[0]?.href) {
                                        router.visit(filteredCmd[0].href);
                                        setCmdOpen(false);
                                    }
                                }}
                            />
                            <div className="cp-list">
                                <div className="cp-sect">Quick navigation</div>
                                {filteredCmd.map((item, i) => (
                                    item.href ? (
                                        <Link key={item.label} href={item.href} className="cp-row" data-on={i === 0 ? '1' : '0'}
                                              onClick={() => setCmdOpen(false)}>
                                            <span className="cp-ic">{item.ic}</span>
                                            <span className="cp-lbl">{item.label}<span className="sub">{item.sub}</span></span>
                                            {item.keys && <span className="cp-kbd">{item.keys}</span>}
                                        </Link>
                                    ) : (
                                        <div key={item.label} className="cp-row" data-on={i === 0 ? '1' : '0'}
                                             onClick={() => { openNotifications(); setCmdOpen(false); }}>
                                            <span className="cp-ic">{item.ic}</span>
                                            <span className="cp-lbl">{item.label}<span className="sub">{item.sub}</span></span>
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="cp-foot">
                                <span>↑↓ navigate</span>
                                <span>↵ open · Esc close</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Notifications drawer ──────────────────────────────────── */}
            {notifOpen && (
                <div className="ledger-app" data-dark={dark ? '1' : '0'} style={{ position: 'fixed', inset: 0, zIndex: 180, display: 'block', background: 'transparent', pointerEvents: 'none' }}>
                    <div className="notif-back" style={{ pointerEvents: 'auto' }} onClick={() => setNotifOpen(false)} />
                    <div className="notif-drawer" style={{ pointerEvents: 'auto' }}>
                        <div className="notif-head">
                            <h3>Notifications</h3>
                            <button className="notif-close" onClick={() => setNotifOpen(false)}>Close</button>
                        </div>
                        {notifications.length === 0 ? (
                            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16, padding: '24px 0' }}>No notifications yet.</p>
                        ) : notifications.map(n => (
                            <div key={n.id} className={`notif-item${!n.read_at ? ' unread' : ''}`}>
                                <div className="notif-msg">{n.data.message}</div>
                                <div className="notif-meta">
                                    {Number(n.data.total_amount).toFixed(2)} JD · {new Date(n.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
