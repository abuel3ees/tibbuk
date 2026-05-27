import { Link, router, usePage } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp, LogOut, Menu, X, Sun, Moon, Images, Bell, Keyboard } from 'lucide-react';
import { useState, useEffect, useRef, createContext, useContext } from 'react';

interface Props { children: React.ReactNode }

interface ThemeCtx { dark: boolean }
const ThemeContext = createContext<ThemeCtx>({ dark: true });
export function useAdminTheme() { return useContext(ThemeContext); }

interface Notification {
    id: string;
    data: { message?: string; order_id?: number; customer_name?: string; total_amount?: number };
    read_at: string | null;
    created_at: string;
}

function NotificationBell() {
    const { unread_count, notifications } = usePage().props as unknown as {
        unread_count: number;
        notifications: Notification[];
    };
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function markRead() {
        router.post('/admin/notifications/read', {}, { preserveState: true, preserveScroll: true });
    }

    return (
        <div ref={ref} className="relative px-3 py-2">
            <button
                onClick={() => { setOpen(o => !o); if (!open && unread_count > 0) markRead(); }}
                className="relative flex items-center gap-2 text-[#6A746F] dark:text-[#4A5A55] hover:text-[#16201D] dark:hover:text-[#EAE6DE] transition-colors"
            >
                <Bell className="w-4 h-4" />
                {unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-[9px] flex items-center justify-center font-medium">
                        {unread_count > 9 ? '9+' : unread_count}
                    </span>
                )}
                <span className="text-sm font-medium">Notifications</span>
            </button>
            {open && (
                <div className="absolute left-0 right-0 mt-2 mx-3 z-50 bg-[#FBF8F2] dark:bg-[#0E1512] border border-[#D7CFBE] dark:border-[#1C2822] rounded-lg shadow-lg overflow-hidden">
                    {notifications.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-[#6A746F] dark:text-[#4A5A55]">No notifications</p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto divide-y divide-[#D7CFBE] dark:divide-[#1C2822]">
                            {notifications.map(n => (
                                <li key={n.id} className={`px-4 py-3 ${!n.read_at ? 'bg-[#EAE6DE]/50 dark:bg-[#1C2822]/50' : ''}`}>
                                    <p className="text-xs text-[#16201D] dark:text-[#EAE6DE] leading-snug">
                                        {n.data.message ?? `Order #${n.data.order_id}`}
                                    </p>
                                    {n.data.customer_name && (
                                        <p className="text-[10px] text-[#6A746F] dark:text-[#4A5A55] mt-0.5">
                                            {n.data.customer_name}
                                            {n.data.total_amount ? ` · ${n.data.total_amount} JOD` : ''}
                                        </p>
                                    )}
                                    <Link
                                        href={`/admin/orders/${n.data.order_id}`}
                                        className="text-[10px] text-[#1F5B4A] dark:text-[#3D9E7A] mt-1 block hover:underline"
                                        onClick={() => setOpen(false)}
                                    >
                                        View order →
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

const nav = [
    { href: '/admin',            label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products',   label: 'Products',  icon: Package },
    { href: '/admin/orders',     label: 'Orders',    icon: ShoppingBag },
    { href: '/admin/financials', label: 'Financials',icon: TrendingUp },
    { href: '/admin/media',      label: 'Media',     icon: Images },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#FBF8F2] dark:bg-[#0E1512] rounded-2xl border border-[#E8E1D0] dark:border-[#1C2822] shadow-2xl p-8 w-80" onClick={e => e.stopPropagation()}>
                <h2 className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE] mb-5">Keyboard Shortcuts</h2>
                <div className="space-y-3 text-sm">
                    {[
                        { keys: 'g → d', label: 'Go to Dashboard' },
                        { keys: 'g → o', label: 'Go to Orders' },
                        { keys: 'g → p', label: 'Go to Products' },
                        { keys: '?', label: 'Show shortcuts' },
                    ].map(s => (
                        <div key={s.keys} className="flex items-center justify-between">
                            <span className="text-[#6A746F] dark:text-[#4A5A55]">{s.label}</span>
                            <kbd className="px-2 py-1 rounded-md bg-[#F2EDE0] dark:bg-[#1C2822] text-[#16201D] dark:text-[#EAE6DE] text-xs font-mono border border-[#D7CFBE] dark:border-[#2A3530]">{s.keys}</kbd>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full px-4 py-2 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: Props) {
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem('tbk_admin_dark') !== 'false'; } catch { return true; }
    });

    useEffect(() => {
        try { localStorage.setItem('tbk_admin_dark', dark ? 'true' : 'false'); } catch {}
    }, [dark]);

    useEffect(() => {
        let pending: string | null = null;
        let pendingTimer: ReturnType<typeof setTimeout> | null = null;

        function handler(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

            if (e.key === '?') {
                setShortcutsOpen(o => !o);
                return;
            }

            if (e.key === 'g' && !pending) {
                pending = 'g';
                pendingTimer = setTimeout(() => { pending = null; }, 1000);
                return;
            }

            if (pending === 'g') {
                if (pendingTimer) clearTimeout(pendingTimer);
                pending = null;
                if (e.key === 'o') router.visit('/admin/orders');
                if (e.key === 'p') router.visit('/admin/products');
                if (e.key === 'd') router.visit('/admin');
            }
        }

        document.addEventListener('keydown', handler);
        return () => { document.removeEventListener('keydown', handler); if (pendingTimer) clearTimeout(pendingTimer); };
    }, []);

    return (
        <ThemeContext.Provider value={{ dark }}>
            {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
            <div className={dark ? 'dark' : ''}>
                <div className="min-h-screen flex bg-[#F2EDE0] dark:bg-[#0A100D] transition-colors duration-200">
                    {/* Sidebar */}
                    <aside className={`
                        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
                        transform transition-transform duration-200
                        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 lg:static lg:flex
                        bg-[#FBF8F2] dark:bg-[#0E1512]
                        border-r border-[#D7CFBE] dark:border-[#1C2822]
                    `}>
                        {/* Brand */}
                        <div className="px-7 py-6 border-b border-[#D7CFBE] dark:border-[#1C2822]">
                            <Link href="/" className="block group">
                                <div className="flex items-center gap-2">
                                    <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-[22px] font-semibold text-[#16201D] dark:text-[#EAE6DE] leading-none tracking-tight">
                                        Tibbuk
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F5B4A] dark:bg-[#3D9E7A]" />
                                    <span style={{ fontFamily: "'Amiri', serif" }} className="text-[18px] text-[#1F5B4A] dark:text-[#3D9E7A]">
                                        طِبّك
                                    </span>
                                </div>
                                <p className="text-[10px] tracking-[0.14em] uppercase text-[#6A746F] dark:text-[#4A5A55] mt-1.5">Admin Panel</p>
                            </Link>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                            {nav.map(item => {
                                const active = url === item.href || (item.href !== '/admin' && url.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all duration-150
                                            ${active
                                                ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white shadow-sm'
                                                : 'text-[#3D4A45] dark:text-[#9AA8A3] hover:bg-[#E8E1D0] dark:hover:bg-[#1C2822] hover:text-[#16201D] dark:hover:text-[#EAE6DE]'
                                            }
                                        `}
                                    >
                                        <item.icon className="w-4 h-4 shrink-0" />
                                        <span className="font-medium">{item.label}</span>
                                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="px-3 py-4 space-y-0.5 border-t border-[#D7CFBE] dark:border-[#1C2822]">
                            <NotificationBell />
                            <button
                                onClick={() => setShortcutsOpen(true)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm w-full text-left transition-all duration-150 text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#E8E1D0] dark:hover:bg-[#1C2822] hover:text-[#16201D] dark:hover:text-[#EAE6DE]"
                            >
                                <Keyboard className="w-4 h-4" />
                                Shortcuts
                            </button>
                            <button
                                onClick={() => setDark(d => !d)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm w-full text-left transition-all duration-150 text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#E8E1D0] dark:hover:bg-[#1C2822] hover:text-[#16201D] dark:hover:text-[#EAE6DE]"
                            >
                                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                {dark ? 'Light mode' : 'Dark mode'}
                            </button>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm w-full text-left transition-all duration-150 text-[#6A746F] dark:text-[#4A5A55] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </Link>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 text-xs transition-colors text-[#6A746F] dark:text-[#4A5A55] hover:text-[#16201D] dark:hover:text-[#EAE6DE]"
                            >
                                ← Back to Store
                            </Link>
                        </div>
                    </aside>

                    {/* Mobile overlay */}
                    {mobileOpen && (
                        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    )}

                    {/* Main */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        {/* Mobile header */}
                        <header className="lg:hidden px-5 py-4 flex items-center justify-between bg-[#FBF8F2] dark:bg-[#0E1512] border-b border-[#D7CFBE] dark:border-[#1C2822]">
                            <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl font-semibold text-[#16201D] dark:text-[#EAE6DE]">
                                Tibbuk <span style={{ fontFamily: "'Amiri', serif" }} className="text-[#1F5B4A] dark:text-[#3D9E7A]">طِبّك</span>
                            </span>
                            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#16201D] dark:text-[#EAE6DE] p-1">
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </header>

                        <main className="flex-1 px-5 lg:px-10 py-8 max-w-7xl w-full mx-auto text-[#16201D] dark:text-[#EAE6DE]">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </ThemeContext.Provider>
    );
}
