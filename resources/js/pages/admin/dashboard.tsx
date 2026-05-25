import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Package, ShoppingBag, Clock, CheckCircle, TrendingUp, Bell, ImagePlus, X } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Stats {
    total_products: number;
    total_orders: number;
    pending_orders: number;
    delivered_orders: number;
}

interface Financials {
    total_revenue: number;
    total_cost: number;
    net_profit: number;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    status: string;
    total_amount: string;
    created_at: string;
}

interface Notification {
    id: string;
    data: { message: string; order_id: number; customer_name: string; total_amount: string };
    created_at: string;
    read_at: string | null;
}

interface HeroContent {
    pill_en: string | null; pill_ar: string | null;
    title_en: string | null; title_ar: string | null;
    lede_en: string | null; lede_ar: string | null;
}

interface Props {
    stats: Stats;
    financials: Financials;
    recentOrders: Order[];
    hero_image: string | null;
    hero_content: HeroContent;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function Dashboard({ stats, financials, recentOrders, hero_image, hero_content }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchUnreadCount() {
        try {
            const res = await fetch('/admin/notifications/unread-count');
            const data = await res.json();
            setUnreadCount(data.count);
        } catch {}
    }

    async function openNotifications() {
        setNotifOpen(true);
        try {
            const res = await fetch('/admin/notifications');
            const data = await res.json();
            setNotifications(data);
            // Mark as read
            await fetch('/admin/notifications/read', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' } });
            setUnreadCount(0);
        } catch {}
    }

    return (
        <AdminLayout>
            <Head title="Admin Dashboard — MedStore Jordan" />

            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-light text-stone-900 tracking-wide">Dashboard</h1>
                    <p className="text-sm text-stone-400 mt-1">Welcome back, Admin</p>
                </div>
                <button
                    onClick={openNotifications}
                    className="relative flex items-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-stone-400 transition-colors"
                >
                    <Bell className="w-4 h-4 text-stone-600" />
                    <span className="text-xs text-stone-600">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 mb-8">
                <StatCard icon={<Package className="w-5 h-5" />} label="Products" value={stats.total_products} />
                <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Total Orders" value={stats.total_orders} />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending_orders} accent="amber" />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Delivered" value={stats.delivered_orders} accent="green" />
            </div>

            {/* Financials */}
            <div className="bg-stone-900 text-white p-8 mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-stone-400" />
                    <h2 className="text-xs tracking-widest uppercase text-stone-400">Financial Summary — Delivered Orders</h2>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <FinancialItem label="Total Revenue" value={financials.total_revenue} />
                    <FinancialItem label="Total Cost" value={financials.total_cost} />
                    <FinancialItem label="Net Profit" value={financials.net_profit} highlight />
                </div>
                <div className="mt-6 pt-6 border-t border-stone-700">
                    <Link href="/admin/financials" className="text-xs tracking-widest uppercase text-stone-400 hover:text-white transition-colors">
                        Detailed Report →
                    </Link>
                </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white border border-stone-100">
                <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-stone-900">Recent Orders</h2>
                    <Link href="/admin/orders" className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors">
                        View all →
                    </Link>
                </div>
                <div className="divide-y divide-stone-50">
                    {recentOrders.length === 0 ? (
                        <p className="px-8 py-12 text-sm text-stone-400 text-center">No orders yet.</p>
                    ) : recentOrders.map(order => (
                        <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center px-8 py-5 hover:bg-stone-50 transition-colors gap-6">
                            <div className="w-16 text-xs text-stone-400">#{String(order.id).padStart(5, '0')}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900">{order.customer_name}</p>
                                <p className="text-xs text-stone-400">{order.customer_phone}</p>
                            </div>
                            <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 border ${statusColors[order.status] ?? 'bg-stone-50 text-stone-500'}`}>
                                {order.status}
                            </span>
                            <div className="text-sm font-medium text-stone-900 w-28 text-right">
                                {Number(order.total_amount).toFixed(2)} JOD
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Hero image */}
            <HeroImageCard current={hero_image} />

            {/* Hero content */}
            <HeroContentCard content={hero_content} />

            {/* Notifications panel */}
            {notifOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1" onClick={() => setNotifOpen(false)} />
                    <div className="w-full max-w-sm bg-white shadow-2xl border-l border-stone-100 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                            <h3 className="text-sm font-medium">Notifications</h3>
                            <button onClick={() => setNotifOpen(false)} className="text-stone-400 hover:text-stone-700 text-lg leading-none">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
                            {notifications.length === 0 ? (
                                <p className="px-6 py-12 text-sm text-stone-400 text-center">No notifications</p>
                            ) : notifications.map(n => (
                                <div key={n.id} className={`px-6 py-4 ${!n.read_at ? 'bg-stone-50' : ''}`}>
                                    <p className="text-sm text-stone-800">{n.data.message}</p>
                                    <p className="text-xs text-stone-400 mt-1">{Number(n.data.total_amount).toFixed(2)} JOD</p>
                                    <p className="text-xs text-stone-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function HeroImageCard({ current }: { current: string | null }) {
    const { data, setData, post, processing, errors } = useForm<{ hero_image: File | null }>({ hero_image: null });
    const [preview, setPreview] = useState<string | null>(current);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFile(file: File) {
        setData('hero_image', file);
        setPreview(URL.createObjectURL(file));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.hero_image) return;
        post('/admin/settings/hero-image', {
            forceFormData: true,
            onSuccess: () => setData('hero_image', null),
        });
    }

    function handleRemove() {
        if (!confirm('Remove the hero image? The default image will be shown.')) return;
        router.delete('/admin/settings/hero-image');
        setPreview(null);
    }

    return (
        <div className="bg-white border border-stone-100 mt-8">
            <div className="px-8 py-6 border-b border-stone-100">
                <h2 className="text-sm font-medium text-stone-900">Hero Image</h2>
                <p className="text-xs text-stone-400 mt-0.5">The large image shown on the store homepage. Replaces the default if set.</p>
            </div>
            <div className="px-8 py-6 flex flex-col sm:flex-row gap-6 items-start">
                <div
                    className="relative w-48 h-32 border border-stone-200 bg-stone-50 flex items-center justify-center cursor-pointer hover:border-stone-400 transition-colors shrink-0 overflow-hidden"
                    onClick={() => inputRef.current?.click()}
                >
                    {preview ? (
                        <img src={preview} alt="Hero" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-300">
                            <ImagePlus className="w-8 h-8" />
                            <span className="text-xs">Click to upload</span>
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    {errors.hero_image && <p className="text-red-500 text-xs">{errors.hero_image}</p>}
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <button
                            type="submit"
                            disabled={!data.hero_image || processing}
                            className="bg-stone-900 text-white px-6 py-2.5 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40"
                        >
                            {processing ? 'Saving…' : 'Save Image'}
                        </button>
                        {preview && current && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-xs tracking-widest uppercase border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Remove
                            </button>
                        )}
                    </form>
                    <p className="text-xs text-stone-400">Recommended: 1200×800px or wider. Max 8 MB.</p>
                </div>
            </div>
        </div>
    );
}

function HeroContentCard({ content }: { content: HeroContent }) {
    const { data, setData, post, processing } = useForm({
        pill_en:  content.pill_en  ?? '',
        pill_ar:  content.pill_ar  ?? '',
        title_en: content.title_en ?? '',
        title_ar: content.title_ar ?? '',
        lede_en:  content.lede_en  ?? '',
        lede_ar:  content.lede_ar  ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/hero-content');
    }

    const field = (label: string, key: keyof typeof data, rows = 1) => (
        <div>
            <label className="block text-xs text-stone-400 mb-1">{label}</label>
            {rows > 1 ? (
                <textarea
                    rows={rows}
                    value={data[key]}
                    onChange={e => setData(key, e.target.value)}
                    className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-500 resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={data[key]}
                    onChange={e => setData(key, e.target.value)}
                    className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-500"
                />
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-100 mt-6">
            <div className="px-8 py-6 border-b border-stone-100">
                <h2 className="text-sm font-medium text-stone-900">Hero Text</h2>
                <p className="text-xs text-stone-400 mt-0.5">Leave blank to use the default copy. Title overrides the full heading.</p>
            </div>
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <p className="text-xs font-semibold tracking-widest uppercase text-stone-400">English</p>
                    {field('Pill / badge', 'pill_en')}
                    {field('Title (overrides default)', 'title_en')}
                    {field('Lede / subtitle', 'lede_en', 3)}
                </div>
                <div className="space-y-4">
                    <p className="text-xs font-semibold tracking-widest uppercase text-stone-400">Arabic / عربي</p>
                    {field('Pill / badge', 'pill_ar')}
                    {field('Title (overrides default)', 'title_ar')}
                    {field('Lede / subtitle', 'lede_ar', 3)}
                </div>
            </div>
            <div className="px-8 pb-6">
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-stone-900 text-white px-8 py-2.5 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40"
                >
                    {processing ? 'Saving…' : 'Save Text'}
                </button>
            </div>
        </form>
    );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: string }) {
    const accentClass = accent === 'amber' ? 'text-amber-600' : accent === 'green' ? 'text-green-600' : 'text-stone-900';
    return (
        <div className="bg-white p-8">
            <div className="text-stone-400 mb-4">{icon}</div>
            <p className={`text-3xl font-light ${accentClass}`}>{value}</p>
            <p className="text-xs tracking-widest uppercase text-stone-400 mt-1">{label}</p>
        </div>
    );
}

function FinancialItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs tracking-widest uppercase text-stone-500 mb-2">{label}</p>
            <p className={`text-2xl font-light ${highlight ? 'text-white' : 'text-stone-300'}`}>
                {value.toFixed(2)} <span className="text-sm text-stone-500">JOD</span>
            </p>
        </div>
    );
}
