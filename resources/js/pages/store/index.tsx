import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { ShoppingCart, X, Search, Menu, ChevronDown } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    sale_price: string | null;
    category: string | null;
    stock_status: string;
    featured_image: string | null;
    excerpt: string | null;
}

interface CartItem extends Product {
    quantity: number;
}

interface Props {
    products: Product[];
    categories: string[];
}

function formatJOD(amount: string | number) {
    return `${Number(amount).toFixed(2)} JOD`;
}

export default function StoreIndex({ products, categories }: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchCat = !activeCategory || p.category === activeCategory;
            const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, activeCategory, search]);

    const cartTotal = cart.reduce((sum, item) => {
        const price = item.sale_price ?? item.price;
        return sum + Number(price) * item.quantity;
    }, 0);

    const cartCount = cart.reduce((n, i) => n + i.quantity, 0);

    function addToCart(product: Product) {
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setCartOpen(true);
    }

    function removeFromCart(id: number) {
        setCart(prev => prev.filter(i => i.id !== id));
    }

    function updateQty(id: number, delta: number) {
        setCart(prev => prev.map(i => {
            if (i.id !== id) return i;
            const qty = i.quantity + delta;
            return qty <= 0 ? null : { ...i, quantity: qty };
        }).filter(Boolean) as CartItem[]);
    }

    function validatePhone(phone: string) {
        return /^(\+?962|0)7[789]\d{7}$/.test(phone);
    }

    function handleCheckout(e: React.FormEvent) {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.customer_name.trim()) newErrors.customer_name = 'Full name is required.';
        if (!form.customer_phone.trim()) {
            newErrors.customer_phone = 'Phone number is required.';
        } else if (!validatePhone(form.customer_phone)) {
            newErrors.customer_phone = 'Enter a valid Jordanian phone number (e.g. 07XXXXXXXX).';
        }
        if (!form.delivery_address.trim()) newErrors.delivery_address = 'Delivery address is required.';
        if (cart.length === 0) newErrors.items = 'Your cart is empty.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        router.post('/orders', {
            ...form,
            items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }, {
            onError: (errs) => {
                setErrors(errs);
                setSubmitting(false);
            },
            onSuccess: () => {
                setCart([]);
                setCartOpen(false);
                setCheckoutOpen(false);
            },
        });
    }

    return (
        <>
            <Head title="MedStore Jordan — Medical Equipment" />

            {/* NAV */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
                    <Link href="/" className="text-xl font-light tracking-[0.2em] uppercase text-stone-900">
                        MedStore<span className="font-semibold">Jo</span>
                    </Link>

                    {/* Desktop categories */}
                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`text-xs tracking-widest uppercase transition-colors ${!activeCategory ? 'text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`text-xs tracking-widest uppercase transition-colors ${activeCategory === cat ? 'text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-700'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products…"
                                className="pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-stone-400 w-48 transition-all focus:w-64"
                            />
                        </div>
                        {/* Cart */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900 transition-colors"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {/* Mobile menu */}
                        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                            <Menu className="w-5 h-5 text-stone-700" />
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-stone-100 bg-white px-6 py-4 flex flex-col gap-3">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full px-4 py-2 text-sm border border-stone-200 focus:outline-none"
                        />
                        <button onClick={() => { setActiveCategory(null); setMenuOpen(false); }} className="text-left text-xs tracking-widest uppercase text-stone-600">All</button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => { setActiveCategory(cat); setMenuOpen(false); }} className="text-left text-xs tracking-widest uppercase text-stone-600">{cat}</button>
                        ))}
                    </div>
                )}
            </nav>

            {/* HERO */}
            <section className="pt-16">
                <div className="bg-stone-900 text-white px-6 lg:px-10 py-24 lg:py-36">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-4">Jordan's Premier Medical Equipment Supplier</p>
                        <h1 className="text-5xl lg:text-7xl font-light leading-tight max-w-3xl">
                            Precision Tools<br />for Medical Professionals
                        </h1>
                        <p className="mt-6 text-stone-400 text-lg max-w-xl">
                            Curated stethoscopes, clinical equipment, and medical literature — delivered across Jordan.
                        </p>
                        <button
                            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                            className="mt-10 inline-flex items-center gap-2 text-xs tracking-widest uppercase border border-white/30 px-8 py-4 hover:bg-white hover:text-stone-900 transition-colors"
                        >
                            Browse Collection <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* PRODUCTS GRID */}
            <section id="products" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-2xl font-light tracking-wide text-stone-900">
                            {activeCategory ?? 'All Products'}
                        </h2>
                        <p className="text-sm text-stone-400 mt-1">{filtered.length} items</p>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-24 text-stone-400">No products found.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-stone-100">
                        {filtered.map(product => (
                            <ProductCard key={product.id} product={product} onAdd={addToCart} />
                        ))}
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="border-t border-stone-100 px-6 lg:px-10 py-16 bg-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                        <div className="text-lg font-light tracking-[0.2em] uppercase text-stone-900 mb-4">MedStore<span className="font-semibold">Jo</span></div>
                        <p className="text-sm text-stone-400 leading-relaxed">Your trusted source for professional medical equipment in Jordan. Quality without compromise.</p>
                    </div>
                    <div>
                        <h4 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Contact</h4>
                        <p className="text-sm text-stone-600">Amman, Jordan</p>
                        <p className="text-sm text-stone-600">info@medstore-jo.com</p>
                    </div>
                    <div>
                        <h4 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Hours</h4>
                        <p className="text-sm text-stone-600">Sun – Thu: 9:00 – 18:00</p>
                        <p className="text-sm text-stone-600">Fri – Sat: Closed</p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-stone-100 flex justify-between items-center">
                    <p className="text-xs text-stone-400">© {new Date().getFullYear()} MedStore Jordan. All rights reserved.</p>
                    <Link href="/admin" className="text-xs text-stone-300 hover:text-stone-500 transition-colors">Admin</Link>
                </div>
            </footer>

            {/* CART DRAWER */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
                    <div className="w-full max-w-md bg-white flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
                            <h2 className="text-sm tracking-widest uppercase font-medium">Your Cart ({cartCount})</h2>
                            <button onClick={() => setCartOpen(false)}><X className="w-5 h-5 text-stone-400 hover:text-stone-900" /></button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">Your cart is empty</div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-16 h-16 bg-stone-50 flex items-center justify-center text-2xl shrink-0">
                                                🏥
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                                                <p className="text-xs text-stone-400 mt-0.5">{formatJOD(item.sale_price ?? item.price)} each</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 border border-stone-200 text-xs flex items-center justify-center hover:bg-stone-50">−</button>
                                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 border border-stone-200 text-xs flex items-center justify-center hover:bg-stone-50">+</button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatJOD(Number(item.sale_price ?? item.price) * item.quantity)}</p>
                                                <button onClick={() => removeFromCart(item.id)} className="text-xs text-stone-400 hover:text-red-500 mt-1">Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-8 py-6 border-t border-stone-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs tracking-widest uppercase text-stone-500">Total</span>
                                        <span className="text-xl font-light">{formatJOD(cartTotal)}</span>
                                    </div>
                                    <button
                                        onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                                        className="w-full bg-stone-900 text-white py-4 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* CHECKOUT MODAL */}
            {checkoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-8 py-6 border-b border-stone-100">
                            <h2 className="text-sm tracking-widest uppercase font-medium">Checkout</h2>
                            <button onClick={() => setCheckoutOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
                        </div>

                        <form onSubmit={handleCheckout} className="px-8 py-8 space-y-6">
                            <FormField
                                label="Full Name *"
                                value={form.customer_name}
                                onChange={v => setForm(f => ({ ...f, customer_name: v }))}
                                error={errors.customer_name}
                                placeholder="Your full name"
                            />
                            <FormField
                                label="Phone Number *"
                                value={form.customer_phone}
                                onChange={v => setForm(f => ({ ...f, customer_phone: v }))}
                                error={errors.customer_phone}
                                placeholder="07XXXXXXXX or +96279XXXXXXX"
                                type="tel"
                            />
                            <FormField
                                label="Email Address"
                                value={form.customer_email}
                                onChange={v => setForm(f => ({ ...f, customer_email: v }))}
                                error={errors.customer_email}
                                placeholder="Optional"
                                type="email"
                            />
                            <FormField
                                label="Delivery Address *"
                                value={form.delivery_address}
                                onChange={v => setForm(f => ({ ...f, delivery_address: v }))}
                                error={errors.delivery_address}
                                placeholder="Full delivery address in Jordan"
                                multiline
                            />
                            <FormField
                                label="Order Notes"
                                value={form.notes}
                                onChange={v => setForm(f => ({ ...f, notes: v }))}
                                error={errors.notes}
                                placeholder="Any special requests…"
                                multiline
                            />

                            {/* Order summary */}
                            <div className="border-t border-stone-100 pt-6">
                                <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Order Summary</p>
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1.5">
                                        <span className="text-stone-600">{item.name} × {item.quantity}</span>
                                        <span>{formatJOD(Number(item.sale_price ?? item.price) * item.quantity)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm font-medium pt-3 border-t border-stone-100 mt-3">
                                    <span>Total</span>
                                    <span>{formatJOD(cartTotal)}</span>
                                </div>
                            </div>

                            {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-stone-900 text-white py-4 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Placing Order…' : 'Place Order'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
    const price = Number(product.price);
    const salePrice = product.sale_price ? Number(product.sale_price) : null;
    const inStock = product.stock_status === 'in_stock';

    return (
        <div className="bg-white p-6 flex flex-col group hover:shadow-md transition-shadow">
            {/* Product image placeholder */}
            <div className="aspect-square bg-stone-50 flex items-center justify-center mb-6 text-5xl group-hover:bg-stone-100 transition-colors">
                {getCategoryEmoji(product.category)}
            </div>

            <div className="flex-1">
                {product.category && (
                    <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">{product.category}</p>
                )}
                <h3 className="text-sm font-medium text-stone-900 leading-tight mb-2">{product.name}</h3>
                {product.excerpt && (
                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 mb-4">{product.excerpt}</p>
                )}
            </div>

            <div className="flex items-end justify-between mt-4">
                <div>
                    {salePrice && salePrice < price ? (
                        <>
                            <p className="text-xs line-through text-stone-300">{price.toFixed(2)} JOD</p>
                            <p className="text-base font-medium text-stone-900">{salePrice.toFixed(2)} JOD</p>
                        </>
                    ) : (
                        <p className="text-base font-medium text-stone-900">{price.toFixed(2)} JOD</p>
                    )}
                </div>
                <button
                    onClick={() => onAdd(product)}
                    disabled={!inStock}
                    className="text-xs tracking-widest uppercase px-4 py-2.5 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {inStock ? 'Add' : 'Out of Stock'}
                </button>
            </div>
        </div>
    );
}

function FormField({
    label, value, onChange, error, placeholder, type = 'text', multiline = false
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
}) {
    const classes = "w-full border-b border-stone-200 bg-transparent py-3 text-sm focus:outline-none focus:border-stone-700 transition-colors placeholder:text-stone-300";
    return (
        <div>
            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">{label}</label>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className={classes + " resize-none"}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={classes}
                />
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function getCategoryEmoji(category: string | null) {
    const map: Record<string, string> = {
        'Stethoscopes': '🩺',
        'Books': '📚',
        'Equipment': '🔬',
        'Accessories': '🧰',
        'Lab Coats & Scrubs': '🥼',
        'Subscriptions': '📱',
        'Name Tags': '🏷️',
    };
    return category ? (map[category] ?? '⚕️') : '⚕️';
}
