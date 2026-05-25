import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect, createContext, useContext } from 'react';

interface Props { children: React.ReactNode }

interface ThemeCtx { dark: boolean }
const ThemeContext = createContext<ThemeCtx>({ dark: true });
export function useAdminTheme() { return useContext(ThemeContext); }

const nav = [
    { href: '/admin',            label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products',   label: 'Products',  icon: Package },
    { href: '/admin/orders',     label: 'Orders',    icon: ShoppingBag },
    { href: '/admin/financials', label: 'Financials',icon: TrendingUp },
];

export default function AdminLayout({ children }: Props) {
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem('tbk_admin_dark') !== 'false'; } catch { return true; }
    });

    useEffect(() => {
        try { localStorage.setItem('tbk_admin_dark', dark ? 'true' : 'false'); } catch {}
    }, [dark]);

    return (
        <ThemeContext.Provider value={{ dark }}>
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
