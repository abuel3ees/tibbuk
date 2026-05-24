import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    children: React.ReactNode;
}

const nav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/financials', label: 'Financials', icon: TrendingUp },
];

export default function AdminLayout({ children }: Props) {
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white flex flex-col
                transform transition-transform duration-200
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:flex
            `}>
                <div className="px-8 py-8 border-b border-stone-800">
                    <Link href="/" className="text-lg font-light tracking-[0.2em] uppercase">
                        MedStore<span className="font-semibold">Jo</span>
                    </Link>
                    <p className="text-[10px] tracking-widest uppercase text-stone-500 mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {nav.map(item => {
                        const active = url === item.href || (item.href !== '/admin' && url.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-none ${
                                    active ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'
                                }`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 py-6 border-t border-stone-800">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Link>
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 text-xs text-stone-500 hover:text-stone-300 transition-colors mt-1">
                        ← Back to Store
                    </Link>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile header */}
                <header className="lg:hidden bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-lg font-light tracking-[0.2em] uppercase text-stone-900">
                        MedStore<span className="font-semibold">Jo</span>
                    </Link>
                    <button onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </header>

                <main className="flex-1 px-6 lg:px-12 py-10 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
