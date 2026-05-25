import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Package, ShoppingBag, TrendingUp, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
    children: React.ReactNode;
}

const nav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/financials', label: 'Financials', icon: TrendingUp },
];

const LIGHT = {
    bg:          '#F2EDE0',
    sidebar:     '#FBF8F2',
    border:      '#D7CFBE',
    ink:         '#16201D',
    inkMute:     '#6A746F',
    inkSoft:     '#3D4A45',
    hover:       '#E8E1D0',
    active:      '#1F5B4A',
    activeText:  '#FBF8F2',
    green:       '#1F5B4A',
};

const DARK = {
    bg:          '#0E1512',
    sidebar:     '#111A17',
    border:      '#2A3530',
    ink:         '#EAE6DE',
    inkMute:     '#7A7570',
    inkSoft:     '#B8B2A8',
    hover:       '#1C2822',
    active:      '#3D9E7A',
    activeText:  '#0E1512',
    green:       '#3D9E7A',
};

export default function AdminLayout({ children }: Props) {
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem('tbk_admin_dark') !== 'false'; } catch { return true; }
    });

    useEffect(() => {
        try { localStorage.setItem('tbk_admin_dark', dark ? 'true' : 'false'); } catch {}
    }, [dark]);

    const c = dark ? DARK : LIGHT;

    return (
        <div className="min-h-screen flex" style={{ background: c.bg }}>
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-60 flex flex-col
                transform transition-transform duration-200
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:flex
            `} style={{ background: c.sidebar, borderRight: `1px solid ${c.border}` }}>

                {/* Brand */}
                <div className="px-7 py-7" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <Link href="/" className="block">
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: c.ink, lineHeight: 1, letterSpacing: '-0.01em' }}>
                            Tibbuk
                            <span style={{ display: 'inline-block', width: 5, height: 5, background: c.green, borderRadius: '50%', margin: '0 5px 2px', verticalAlign: 'middle' }} />
                            <span style={{ fontFamily: "'Amiri', serif", color: c.green }}>طِبّك</span>
                        </div>
                        <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.inkMute, marginTop: 5 }}>Admin Panel</p>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-0.5">
                    {nav.map(item => {
                        const active = url === item.href || (item.href !== '/admin' && url.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                style={active
                                    ? { background: c.active, color: c.activeText, borderRadius: 4 }
                                    : { color: c.inkSoft, borderRadius: 4 }
                                }
                                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = c.hover; }}
                                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-3 py-5" style={{ borderTop: `1px solid ${c.border}` }}>
                    <button
                        onClick={() => setDark(d => !d)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors mb-1"
                        style={{ color: c.inkMute, borderRadius: 4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.hover; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {dark ? 'Light mode' : 'Dark mode'}
                    </button>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors"
                        style={{ color: c.inkMute, borderRadius: 4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.hover; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 text-xs transition-colors"
                        style={{ color: c.inkMute }}
                    >
                        ← Back to Store
                    </Link>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile header */}
                <header className="lg:hidden px-6 py-4 flex items-center justify-between" style={{ background: c.sidebar, borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: c.ink }}>
                        Tibbuk <span style={{ fontFamily: "'Amiri', serif", color: c.green }}>طِبّك</span>
                    </span>
                    <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: c.ink }}>
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </header>

                <main
                    className="flex-1 px-6 lg:px-12 py-10 max-w-7xl w-full mx-auto"
                    style={{ color: c.ink }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
