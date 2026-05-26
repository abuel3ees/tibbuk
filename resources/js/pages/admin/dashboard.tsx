import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Package, ShoppingBag, Clock, CheckCircle, TrendingUp, Bell, ImagePlus, X, ArrowRight, Sparkles } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Stats { total_products: number; total_orders: number; pending_orders: number; delivered_orders: number }
interface Financials { total_revenue: number; total_cost: number; net_profit: number }
interface Order { id: number; customer_name: string; customer_phone: string; status: string; total_amount: string; created_at: string }
interface Notification { id: string; data: { message: string; order_id: number; customer_name: string; total_amount: string }; created_at: string; read_at: string | null }
interface HeroContent { pill_en: string | null; pill_ar: string | null; title_en: string | null; title_ar: string | null; lede_en: string | null; lede_ar: string | null }
interface Props { stats: Stats; financials: Financials; recentOrders: Order[]; hero_images: string[]; hero_content: HeroContent }

const STATUS_STYLES: Record<string, string> = {
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function Dashboard({ stats, financials, recentOrders, hero_images, hero_content }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchUnreadCount() {
        try { const res = await fetch('/admin/notifications/unread-count'); const data = await res.json(); setUnreadCount(data.count); } catch {}
    }

    async function openNotifications() {
        setNotifOpen(true);
        try {
            const res = await fetch('/admin/notifications');
            const data = await res.json();
            setNotifications(data);
            await fetch('/admin/notifications/read', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '' } });
            setUnreadCount(0);
        } catch {}
    }

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <AdminLayout>
            <Head title="Dashboard — Admin" />

            {/* Page header */}
            <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                    <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mb-1">{greeting}, Admin</p>
                    <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight">Dashboard</h1>
                </div>
                <button
                    onClick={openNotifications}
                    className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white dark:bg-[#141C19] border border-[#D7CFBE] dark:border-[#1C2822] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] transition-all shadow-sm text-sm text-[#3D4A45] dark:text-[#9AA8A3] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A]"
                >
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-[10px] flex items-center justify-center font-semibold">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Package}    label="Products"     value={stats.total_products}  accent="teal"  />
                <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total_orders}    accent="blue"  />
                <StatCard icon={Clock}       label="Pending"      value={stats.pending_orders}  accent="amber" />
                <StatCard icon={CheckCircle} label="Delivered"    value={stats.delivered_orders} accent="green" />
            </div>

            {/* Financials */}
            <div className="rounded-xl bg-[#16201D] dark:bg-[#0E1512] border border-[#1F5B4A]/30 dark:border-[#3D9E7A]/20 p-7 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1F5B4A]/20 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#1F5B4A]/40 dark:bg-[#3D9E7A]/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-[#3D9E7A]" />
                            </div>
                            <div>
                                <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55]">Financial Summary</p>
                                <p className="text-[11px] text-[#4A5A55] dark:text-[#3A4A45]">Based on delivered orders</p>
                            </div>
                        </div>
                        <Link href="/admin/financials" className="flex items-center gap-1.5 text-xs text-[#3D9E7A] hover:text-[#52B892] transition-colors font-medium">
                            Full report <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <FinancialItem label="Revenue"   value={financials.total_revenue} />
                        <FinancialItem label="Cost"      value={financials.total_cost} dim />
                        <FinancialItem label="Net Profit" value={financials.net_profit} highlight />
                    </div>
                </div>
            </div>

            {/* Recent orders */}
            <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden mb-6 shadow-sm">
                <div className="px-6 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822] flex items-center justify-between">
                    <h2 className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">Recent Orders</h2>
                    <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-[#6A746F] dark:text-[#4A5A55] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-colors font-medium">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="divide-y divide-[#F2EDE0] dark:divide-[#1C2822]">
                    {recentOrders.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-[#D7CFBE] dark:text-[#2A3530]" />
                            <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No orders yet</p>
                        </div>
                    ) : recentOrders.map(order => (
                        <Link key={order.id} href={`/admin/orders/${order.id}`}
                            className="flex items-center px-6 py-4 hover:bg-[#F8F5EE] dark:hover:bg-[#141C19] transition-colors gap-5 group">
                            <div className="w-14 text-xs font-mono text-[#6A746F] dark:text-[#4A5A55]">
                                #{String(order.id).padStart(5, '0')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE] truncate">{order.customer_name}</p>
                                <p className="text-xs text-[#6A746F] dark:text-[#4A5A55]">{order.customer_phone}</p>
                            </div>
                            <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                                {order.status}
                            </span>
                            <div className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE] w-24 text-right tabular-nums">
                                {Number(order.total_amount).toFixed(2)} <span className="text-[11px] font-normal text-[#6A746F] dark:text-[#4A5A55]">JOD</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#D7CFBE] dark:text-[#2A3530] group-hover:text-[#1F5B4A] dark:group-hover:text-[#3D9E7A] transition-colors shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Site settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HeroImageCard images={hero_images} />
                <HeroContentCard content={hero_content} />
            </div>

            {/* Notifications drawer */}
            {notifOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
                    <div className="w-full max-w-sm bg-white dark:bg-[#0E1512] border-l border-[#E8E1D0] dark:border-[#1C2822] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                            <h3 className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">Notifications</h3>
                            <button onClick={() => setNotifOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#F2EDE0] dark:hover:bg-[#1C2822] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-[#F2EDE0] dark:divide-[#1C2822]">
                            {notifications.length === 0 ? (
                                <div className="px-6 py-14 text-center">
                                    <Bell className="w-8 h-8 mx-auto mb-3 text-[#D7CFBE] dark:text-[#2A3530]" />
                                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No notifications</p>
                                </div>
                            ) : notifications.map(n => (
                                <div key={n.id} className={`px-6 py-4 transition-colors ${!n.read_at ? 'bg-[#F8F5EE] dark:bg-[#141C19]' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        {!n.read_at && <span className="w-2 h-2 rounded-full bg-[#1F5B4A] dark:bg-[#3D9E7A] mt-1.5 shrink-0" />}
                                        <div className={!n.read_at ? '' : 'pl-5'}>
                                            <p className="text-sm text-[#16201D] dark:text-[#EAE6DE] leading-relaxed">{n.data.message}</p>
                                            <p className="text-xs font-mono text-[#1F5B4A] dark:text-[#3D9E7A] mt-1">{Number(n.data.total_amount).toFixed(2)} JOD</p>
                                            <p className="text-xs text-[#6A746F] dark:text-[#4A5A55] mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent: string }) {
    const ACCENTS: Record<string, { bg: string; icon: string; num: string; dot: string }> = {
        teal:  { bg: 'bg-[#1F5B4A]/10 dark:bg-[#3D9E7A]/10', icon: 'text-[#1F5B4A] dark:text-[#3D9E7A]', num: 'text-[#16201D] dark:text-[#EAE6DE]', dot: 'bg-[#1F5B4A] dark:bg-[#3D9E7A]' },
        blue:  { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', num: 'text-[#16201D] dark:text-[#EAE6DE]', dot: 'bg-blue-500' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400', num: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
        green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', num: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    };
    const a = ACCENTS[accent];
    return (
        <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] p-6 shadow-sm hover:shadow-md dark:hover:border-[#2A3530] transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}>
                    <Icon className={`w-5 h-5 ${a.icon}`} />
                </div>
                <span className={`w-2 h-2 rounded-full ${a.dot} opacity-60`} />
            </div>
            <p className={`text-4xl font-light tabular-nums ${a.num}`}>{value.toLocaleString()}</p>
            <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mt-2 font-medium">{label}</p>
        </div>
    );
}

function FinancialItem({ label, value, dim, highlight }: { label: string; value: number; dim?: boolean; highlight?: boolean }) {
    const cls = highlight
        ? 'text-[#3D9E7A] text-3xl font-light tabular-nums'
        : dim
        ? 'text-[#4A5A55] text-3xl font-light tabular-nums'
        : 'text-[#B8C4BE] text-3xl font-light tabular-nums';
    return (
        <div>
            <p className="text-[11px] tracking-widest uppercase text-[#4A5A55] dark:text-[#3A4A45] mb-2 font-medium">{label}</p>
            <p className={cls}>{value.toFixed(2)}</p>
            <p className="text-xs text-[#3A4A45] mt-0.5">JOD</p>
        </div>
    );
}

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
        <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <h2 className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">Hero Slideshow</h2>
                <p className="text-xs text-[#6A746F] dark:text-[#4A5A55] mt-0.5">{images.length} image{images.length !== 1 ? 's' : ''} · cycles automatically · max 8 MB each</p>
            </div>

            {/* Existing images */}
            {images.length > 0 && (
                <div className="p-4 grid grid-cols-3 gap-2 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                    {images.map((url, i) => (
                        <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-[#F2EDE0] dark:bg-[#1C2822]">
                            <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <button
                                    onClick={() => removeImage(i)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/70">{i + 1}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-[#D7CFBE] dark:border-[#2A3530] rounded-lg p-5 text-center cursor-pointer hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] transition-colors"
                >
                    <ImagePlus className="w-6 h-6 mx-auto mb-1.5 text-[#B8B2A8] dark:text-[#3A4A45]" />
                    <p className="text-xs text-[#6A746F] dark:text-[#4A5A55]">
                        {data.images.length > 0 ? `${data.images.length} file${data.images.length !== 1 ? 's' : ''} ready` : 'Click to add images'}
                    </p>
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
                </div>
                <button type="submit" disabled={!data.images.length || processing}
                    className="w-full py-2 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors disabled:opacity-40">
                    {processing ? 'Uploading…' : 'Upload & Add to Slideshow'}
                </button>
            </form>
        </div>
    );
}

function HeroContentCard({ content }: { content: HeroContent }) {
    const { data, setData, post, processing } = useForm({
        pill_en: content.pill_en ?? '', pill_ar: content.pill_ar ?? '',
        title_en: content.title_en ?? '', title_ar: content.title_ar ?? '',
        lede_en: content.lede_en ?? '', lede_ar: content.lede_ar ?? '',
    });

    const inputCls = 'w-full rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] bg-[#F8F5EE] dark:bg-[#141C19] px-3 py-2 text-sm text-[#16201D] dark:text-[#EAE6DE] placeholder-[#B8B2A8] dark:placeholder-[#3A4A45] focus:outline-none focus:border-[#1F5B4A] dark:focus:border-[#3D9E7A] transition-colors';

    const field = (label: string, key: keyof typeof data, rows = 1) => (
        <div>
            <label className="block text-[11px] tracking-wide text-[#6A746F] dark:text-[#4A5A55] mb-1.5 font-medium">{label}</label>
            {rows > 1
                ? <textarea rows={rows} value={data[key]} onChange={e => setData(key, e.target.value)} className={`${inputCls} resize-none`} />
                : <input type="text" value={data[key]} onChange={e => setData(key, e.target.value)} className={inputCls} />
            }
        </div>
    );

    return (
        <form onSubmit={e => { e.preventDefault(); post('/admin/settings/hero-content'); }}
            className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <h2 className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">Hero Text</h2>
                <p className="text-xs text-[#6A746F] dark:text-[#4A5A55] mt-0.5">Leave blank for defaults.</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-5">
                <div className="space-y-3">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-[#1F5B4A] dark:text-[#3D9E7A]">English</p>
                    {field('Pill', 'pill_en')}
                    {field('Title', 'title_en')}
                    {field('Lede', 'lede_en', 2)}
                </div>
                <div className="space-y-3">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-[#1F5B4A] dark:text-[#3D9E7A]">عربي</p>
                    {field('Pill', 'pill_ar')}
                    {field('Title', 'title_ar')}
                    {field('Lede', 'lede_ar', 2)}
                </div>
            </div>
            <div className="px-6 pb-5">
                <button type="submit" disabled={processing}
                    className="px-6 py-2 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold tracking-wide hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors disabled:opacity-40">
                    {processing ? 'Saving…' : 'Save Text'}
                </button>
            </div>
        </form>
    );
}
