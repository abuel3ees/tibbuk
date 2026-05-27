import { Head, Link, router, useForm, Deferred } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, Upload, Eye, EyeOff, Package, ImagePlus, Download, AlertTriangle, Copy } from 'lucide-react';
import LedgerLayout from '@/layouts/ledger-layout';

interface Product { id: number; name: string; sku: string | null; category: string | null; price: string; sale_price: string | null; stock_status: string; quantity: number | null; is_active: boolean; featured_image: string | null }
interface PaginatedProducts { data: Product[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] }
interface Props { products: PaginatedProducts; categories: string[]; filters: { search?: string; category?: string; stock?: string }; all_products?: Product[]; velocity?: Record<number, number> }

interface UndoToast { id: number; name: string; timeoutId: ReturnType<typeof setTimeout> }

function StockCell({ product }: { product: Product }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(String(product.quantity ?? ''));
    const [localQty, setLocalQty] = useState(product.quantity);

    function save() {
        setEditing(false);
        const qty = value === '' ? null : parseInt(value, 10);
        if (isNaN(qty as number) && value !== '') return;
        setLocalQty(qty);
        fetch(`/admin/products/${product.id}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
            body: JSON.stringify({ quantity: qty, stock_status: product.stock_status }),
        }).catch(() => {});
    }

    if (editing) {
        return (
            <input type="number" min="0" value={value} onChange={e => setValue(e.target.value)}
                onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus className="tbl-input no-icon" style={{ width: 64, padding: '3px 8px', fontSize: 12 }} />
        );
    }

    const qty = localQty;
    const status = product.stock_status;

    if (status === 'in_stock' && qty !== null && qty <= 5) {
        return (
            <button onClick={() => setEditing(true)} className="tbl tag low-stock" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', border: 'none' }}>
                <AlertTriangle size={10} /> Low ({qty})
            </button>
        );
    }
    return (
        <button onClick={() => setEditing(true)} className={`tbl tag ${status === 'in_stock' ? 'active' : 'out-stock'}`} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
            {status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
        </button>
    );
}

export default function ProductsIndex({ products, categories, filters, all_products, velocity }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [stock, setStock] = useState(filters.stock ?? '');
    const [importOpen, setImportOpen] = useState(false);
    const [bulkImageOpen, setBulkImageOpen] = useState(false);
    const [undoToasts, setUndoToasts] = useState<UndoToast[]>([]);
    const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function applyFilters(overrides: Record<string, string>) {
        const s = overrides.search   !== undefined ? overrides.search   : search;
        const c = overrides.category !== undefined ? overrides.category : category;
        const k = overrides.stock    !== undefined ? overrides.stock    : stock;
        const p = overrides.page;
        const params: Record<string, string> = {};
        if (s) params['filter[search]']   = s;
        if (c) params['filter[category]'] = c;
        if (k) params['filter[stock]']    = k;
        if (p) params['page']             = p;
        router.get('/admin/products', params, { preserveState: true, preserveScroll: true, replace: true });
    }

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilters({ search: value }), 350);
    }, [category, stock]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const hasFilters = search || category || stock;

    function handleDelete(product: Product) {
        const tid = setTimeout(() => {
            router.delete(`/admin/products/${product.id}`, {
                onSuccess: () => {
                    setHiddenIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
                    setUndoToasts(prev => prev.filter(t => t.id !== product.id));
                },
            });
        }, 5000);
        setHiddenIds(prev => new Set([...prev, product.id]));
        setUndoToasts(prev => [...prev.filter(t => t.id !== product.id), { id: product.id, name: product.name, timeoutId: tid }]);
    }

    function handleUndo(toast: UndoToast) {
        clearTimeout(toast.timeoutId);
        setHiddenIds(prev => { const n = new Set(prev); n.delete(toast.id); return n; });
        setUndoToasts(prev => prev.filter(t => t.id !== toast.id));
    }

    function handleDuplicate(product: Product) {
        router.post(`/admin/products/${product.id}/duplicate`, {}, { preserveScroll: true });
    }

    function handleBulkVisibility(active: boolean) {
        if (!confirm(`Set ALL products as ${active ? 'active' : 'hidden'}?`)) return;
        router.post('/admin/products/bulk-visibility', { active });
    }

    const actions = (
        <Link href="/admin/products/create" className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Add Product
        </Link>
    );

    return (
        <LedgerLayout
            active="products"
            title={<>The <em>Products</em></>}
            eyebrow={`${products.total} total`}
            actions={actions}
            counts={{ products: products.total }}
        >
            <Head title="Products — Admin" />

            {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
            {bulkImageOpen && (
                <Deferred data="all_products" fallback={
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}>
                        <p style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading products…</p>
                    </div>
                }>
                    <BulkImageModal all_products={all_products ?? []} onClose={() => setBulkImageOpen(false)} />
                </Deferred>
            )}

            {/* ── Undo toasts ── */}
            {undoToasts.length > 0 && (
                <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {undoToasts.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 4, background: 'var(--ink)', color: 'var(--bg)', fontFamily: 'var(--font-text)', fontSize: 13, boxShadow: '0 8px 28px rgba(0,0,0,.3)' }}>
                            <span>Deleted &ldquo;{t.name.slice(0, 30)}{t.name.length > 30 ? '…' : ''}&rdquo;</span>
                            <button onClick={() => handleUndo(t)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '.08em' }}>UNDO</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Secondary toolbar ── */}
            <div className="page-toolbar">
                <button onClick={() => handleBulkVisibility(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={13} /> All Active
                </button>
                <button onClick={() => handleBulkVisibility(false)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <EyeOff size={13} /> All Hidden
                </button>
                <button onClick={() => setBulkImageOpen(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ImagePlus size={13} /> Bulk Images
                </button>
                <a href="/admin/products/export" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Download size={13} /> Export CSV
                </a>
                <button onClick={() => setImportOpen(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Upload size={13} /> Import CSV
                </button>
            </div>

            {/* ── Filters ── */}
            <div className="tbl-filters">
                <div className="tbl-search">
                    <Search className="search-ic" size={14} />
                    <input value={search} onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search products…" className="tbl-input" />
                    {search && (
                        <button onClick={() => handleSearchChange('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'flex' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select value={category} onChange={e => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }} className="tbl-select">
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={stock} onChange={e => { setStock(e.target.value); applyFilters({ stock: e.target.value }); }} className="tbl-select" style={{ minWidth: 120 }}>
                    <option value="">All stock</option>
                    <option value="in">In stock</option>
                    <option value="out">Out of stock</option>
                </select>
                {hasFilters && (
                    <button onClick={() => { setSearch(''); setCategory(''); setStock(''); router.get('/admin/products', {}, { preserveState: true, replace: true }); }} className="tbl-chip">
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            <div className="w" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                        <colgroup>
                            <col style={{ width: '42%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '7%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.filter(p => !hiddenIds.has(p.id)).map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunk)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {product.featured_image
                                                    ? <img src={product.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <Package size={13} style={{ color: 'var(--ink-mute)' }} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <span className="nm" style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                                                <span style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 1 }}>
                                                    {product.sku && <span>{product.sku}</span>}
                                                    {velocity && velocity[product.id] > 0 && <span>{velocity[product.id]}/mo</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{product.category ?? '—'}</td>
                                    <td>
                                        {product.sale_price ? (
                                            <div>
                                                <span className="num" style={{ color: 'var(--ink-mute)', textDecoration: 'line-through', fontSize: 10 }}>{Number(product.price).toFixed(2)}</span>
                                                <span className="num" style={{ display: 'block', fontWeight: 600 }}>{Number(product.sale_price).toFixed(2)} <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--ink-mute)' }}>JD</span></span>
                                            </div>
                                        ) : (
                                            <span className="num">{Number(product.price).toFixed(2)} <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>JD</span></span>
                                        )}
                                    </td>
                                    <td><StockCell product={product} /></td>
                                    <td>
                                        <span className={`tbl tag ${product.is_active ? 'active' : 'hidden-tag'}`}>
                                            {product.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="tbl-actions">
                                            <button onClick={() => handleDuplicate(product)} className="tbl-icon-btn" title="Duplicate"><Copy size={13} /></button>
                                            <Link href={`/admin/products/${product.id}/edit`} className="tbl-icon-btn"><Pencil size={13} /></Link>
                                            <button onClick={() => handleDelete(product)} className="tbl-icon-btn danger"><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
                                        <Package size={28} style={{ margin: '0 auto 12px', color: 'var(--ink-mute)', display: 'block' }} />
                                        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 17 }}>No products match your filters.</p>
                                        {hasFilters && (
                                            <button onClick={() => { setSearch(''); setCategory(''); setStock(''); router.get('/admin/products', {}, { preserveState: true, replace: true }); }}
                                                style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ── */}
            {products.last_page > 1 && (
                <div className="pager">
                    {products.links.map((link, i) => {
                        if (!link.url) return <span key={i} className="pager-item disabled" dangerouslySetInnerHTML={{ __html: link.label }} />;
                        const page = new URL(link.url).searchParams.get('page') ?? '1';
                        return (
                            <button key={i} onClick={() => applyFilters({ page })}
                                className={`pager-item${link.active ? ' active' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            )}
        </LedgerLayout>
    );
}

/* ─── BulkImageModal ──────────────────────────────────────────────────── */

function BulkImageModal({ all_products: allProducts, onClose }: { all_products: Product[]; onClose: () => void }) {
    const { data, setData, post, processing, progress } = useForm<{ images: Record<string, File> }>({ images: {} });
    const [previews, setPreviews] = useState<Record<number, string>>({});
    const [showAll, setShowAll] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');

    const base = showAll ? allProducts : allProducts.filter(p => !p.featured_image);
    const displayed = bulkSearch
        ? base.filter(p => p.name.toLowerCase().includes(bulkSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(bulkSearch.toLowerCase()))
        : base;

    function pickFile(productId: number, file: File) {
        setData('images', { ...data.images, [productId]: file });
        const url = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [productId]: url }));
    }

    function removeFile(productId: number) {
        const imgs = { ...data.images }; delete imgs[productId];
        setData('images', imgs);
        setPreviews(prev => {
            if (prev[productId]) URL.revokeObjectURL(prev[productId]);
            const n = { ...prev }; delete n[productId]; return n;
        });
    }

    useEffect(() => () => { Object.values(previews).forEach(URL.revokeObjectURL); }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (Object.keys(data.images).length === 0) return;
        post('/admin/products/bulk-image', { forceFormData: true, onSuccess: onClose });
    }

    const pendingCount = Object.keys(data.images).length;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', padding: 16 }}>
            <div style={{ background: 'var(--bg-elev)', width: '100%', maxWidth: 640, maxHeight: '90vh', borderRadius: 6, border: '.5px solid var(--rule)', boxShadow: '0 32px 80px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '.5px solid var(--hair)' }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 2 }}>Bulk Image Upload</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.1em' }}>
                            {displayed.length} product{displayed.length !== 1 ? 's' : ''} shown
                            {!showAll && allProducts.some(p => p.featured_image) && (
                                <button onClick={() => setShowAll(true)} style={{ marginLeft: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit' }}>show all</button>
                            )}
                            {showAll && (
                                <button onClick={() => setShowAll(false)} style={{ marginLeft: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit' }}>show missing only</button>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="tbl-icon-btn"><X size={14} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 24px', borderBottom: '.5px solid var(--hair)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)' }} />
                            <input value={bulkSearch} onChange={e => setBulkSearch(e.target.value)} placeholder="Search products…"
                                className="tbl-input" style={{ paddingLeft: 28, fontSize: 12 }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {displayed.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
                                All products already have images.{' '}
                                <button type="button" onClick={() => setShowAll(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontStyle: 'inherit', fontSize: 'inherit' }}>Show all</button>
                            </p>
                        )}
                        {displayed.map(product => (
                            <BulkImageRow key={product.id} product={product} preview={previews[product.id]} current={product.featured_image}
                                hasNew={!!data.images[product.id]} onPick={pickFile} onRemove={removeFile} />
                        ))}
                    </div>
                    <div style={{ padding: '14px 24px', borderTop: '.5px solid var(--hair)', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                        {progress && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--hair)', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--accent)', height: '100%', width: `${progress.percentage}%`, transition: 'width .3s' }} />
                            </div>
                        )}
                        <button type="submit" disabled={pendingCount === 0 || processing} className="btn">
                            {processing ? 'Uploading…' : `Upload${pendingCount > 0 ? ` ${pendingCount} image${pendingCount !== 1 ? 's' : ''}` : ''}`}
                        </button>
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        {pendingCount > 0 && (
                            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>{pendingCount} selected</span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function BulkImageRow({ product, preview, current, hasNew, onPick, onRemove }: {
    product: Product; preview?: string; current: string | null;
    hasNew: boolean; onPick: (id: number, file: File) => void; onRemove: (id: number) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const displayImage = preview ?? current;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 3, border: `.5px solid ${hasNew ? 'var(--accent)' : 'var(--rule)'}`, background: hasNew ? 'rgba(31,91,74,.04)' : 'var(--bg-elev)', transition: 'border-color .12s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunk)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayImage ? <img src={displayImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={16} style={{ color: 'var(--ink-mute)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                {product.sku && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>{product.sku}</div>}
                {hasNew && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', marginTop: 1 }}>New image selected</div>}
            </div>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 2, border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--rule)'}`, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-mute)', background: dragOver ? 'rgba(31,91,74,.06)' : 'transparent', transition: 'all .12s', flexShrink: 0 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onPick(product.id, f); }}
            >
                <ImagePlus size={12} /> {hasNew ? 'Change' : 'Pick'}
                <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) onPick(product.id, f); e.target.value = ''; }} />
            </div>
            {hasNew && (
                <button type="button" onClick={() => onRemove(product.id)} className="tbl-icon-btn danger"><X size={13} /></button>
            )}
        </div>
    );
}

/* ─── ImportModal ──────────────────────────────────────────────────────── */

function ImportModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors, progress } = useForm<{ csv_file: File | null }>({ csv_file: null });
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)', padding: 16 }}>
            <div style={{ background: 'var(--bg-elev)', width: '100%', maxWidth: 480, borderRadius: 6, border: '.5px solid var(--rule)', boxShadow: '0 32px 80px rgba(0,0,0,.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '.5px solid var(--hair)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Import Products via CSV</div>
                    <button onClick={onClose} className="tbl-icon-btn"><X size={14} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); if (!data.csv_file) return; post('/admin/products/import', { forceFormData: true, onSuccess: onClose }); }}
                    style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
                        Required columns: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-sunk)', padding: '1px 6px', borderRadius: 2 }}>name</code> and <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-sunk)', padding: '1px 6px', borderRadius: 2 }}>price</code>. Existing products matched by SKU are updated.
                    </p>
                    <div
                        className="upload-zone"
                        style={dragOver ? { borderColor: 'var(--accent)', background: 'rgba(31,91,74,.04)' } : {}}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setData('csv_file', f); }}
                    >
                        <Upload size={20} style={{ margin: '0 auto 8px', display: 'block', color: dragOver ? 'var(--accent)' : 'var(--ink-mute)' }} />
                        {data.csv_file ? (
                            <p style={{ color: 'var(--ink)', fontSize: 13 }}>{data.csv_file.name}</p>
                        ) : (
                            <>
                                <p>Drop a CSV file or click to browse</p>
                                <p style={{ marginTop: 2 }}>Max 5 MB</p>
                            </>
                        )}
                        <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) setData('csv_file', f); }} />
                    </div>
                    {errors.csv_file && <p className="form-err">{errors.csv_file}</p>}
                    {progress && (
                        <div style={{ width: '100%', height: 2, background: 'var(--hair)', borderRadius: 1, overflow: 'hidden' }}>
                            <div style={{ background: 'var(--accent)', height: '100%', transition: 'width .3s', width: `${progress.percentage}%` }} />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={!data.csv_file || processing} className="btn">
                            {processing ? 'Importing…' : 'Import'}
                        </button>
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
