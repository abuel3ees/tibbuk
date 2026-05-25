import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, Upload, Eye, EyeOff, Filter, Package } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Product { id: number; name: string; sku: string | null; category: string | null; price: string; sale_price: string | null; stock_status: string; is_active: boolean }
interface PaginatedProducts { data: Product[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] }
interface Props { products: PaginatedProducts; categories: string[]; filters: { search?: string; category?: string; stock?: string } }

const inputCls = 'w-full border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#16201D] dark:text-[#EAE6DE] text-sm focus:outline-none focus:border-[#1F5B4A] dark:focus:border-[#3D9E7A] transition-colors placeholder-[#B8B2A8] dark:placeholder-[#3A4A45]';

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [stock, setStock] = useState(filters.stock ?? '');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function applyFilters(overrides: Record<string, string>) {
        const params = Object.fromEntries(Object.entries({ search, category, stock, ...overrides }).filter(([, v]) => v !== ''));
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
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeleting(product.id);
        router.delete(`/admin/products/${product.id}`, { onFinish: () => setDeleting(null) });
    }

    function handleBulkVisibility(active: boolean) {
        if (!confirm(`Set ALL products as ${active ? 'active' : 'hidden'}?`)) return;
        router.post('/admin/products/bulk-visibility', { active });
    }

    return (
        <AdminLayout>
            <Head title="Products — Admin" />

            <div className="flex items-start justify-between mb-7 gap-4">
                <div>
                    <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight">Products</h1>
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">{products.total} total products</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    <button onClick={() => handleBulkVisibility(true)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#6A746F] dark:text-[#9AA8A3] text-xs font-semibold hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm">
                        <Eye className="w-3.5 h-3.5" /> All Active
                    </button>
                    <button onClick={() => handleBulkVisibility(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#6A746F] dark:text-[#9AA8A3] text-xs font-semibold hover:border-red-300 hover:text-red-500 dark:hover:text-red-400 transition-all shadow-sm">
                        <EyeOff className="w-3.5 h-3.5" /> All Hidden
                    </button>
                    <button onClick={() => setImportOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#6A746F] dark:text-[#9AA8A3] text-xs font-semibold hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-all shadow-sm">
                        <Upload className="w-3.5 h-3.5" /> Import CSV
                    </button>
                    <Link href="/admin/products/create"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </Link>
                </div>
            </div>

            {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 mb-5">
                <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B2A8] dark:text-[#3A4A45]" />
                    <input value={search} onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search products…"
                        className={`${inputCls} pl-10 pr-9 py-2.5 rounded-lg`} />
                    {search && (
                        <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B2A8] dark:text-[#3A4A45] hover:text-[#6A746F] dark:hover:text-[#9AA8A3]">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <select value={category} onChange={e => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
                    className={`${inputCls} px-3 py-2.5 rounded-lg min-w-40`}>
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={stock} onChange={e => { setStock(e.target.value); applyFilters({ stock: e.target.value }); }}
                    className={`${inputCls} px-3 py-2.5 rounded-lg`}>
                    <option value="">All stock</option>
                    <option value="in">In stock</option>
                    <option value="out">Out of stock</option>
                </select>
                {hasFilters && (
                    <button onClick={() => { setSearch(''); setCategory(''); setStock(''); router.get('/admin/products', {}, { preserveState: true, replace: true }); }}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm text-[#6A746F] dark:text-[#4A5A55] border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] hover:text-[#16201D] dark:hover:text-[#EAE6DE] hover:border-[#6A746F] dark:hover:border-[#4A5A55] transition-all">
                        <Filter className="w-3.5 h-3.5" /> Clear
                    </button>
                )}
            </div>

            {/* Table card */}
            <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#F2EDE0] dark:border-[#1C2822]">
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Product</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold hidden md:table-cell">Category</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">Price</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold hidden sm:table-cell">Stock</th>
                            <th className="text-left px-6 py-3.5 text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold hidden lg:table-cell">Status</th>
                            <th className="px-6 py-3.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                        {products.data.map(product => (
                            <tr key={product.id} className="hover:bg-[#F8F5EE] dark:hover:bg-[#141C19] transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">{product.name}</p>
                                    {product.sku && <p className="text-[11px] text-[#6A746F] dark:text-[#4A5A55] mt-0.5 font-mono">{product.sku}</p>}
                                </td>
                                <td className="px-6 py-4 text-[#6A746F] dark:text-[#4A5A55] hidden md:table-cell">{product.category ?? '—'}</td>
                                <td className="px-6 py-4 font-mono tabular-nums">
                                    {product.sale_price ? (
                                        <div>
                                            <span className="text-[#B8B2A8] dark:text-[#3A4A45] line-through text-xs">{Number(product.price).toFixed(2)}</span>
                                            <span className="ml-1.5 font-semibold text-[#16201D] dark:text-[#EAE6DE]">{Number(product.sale_price).toFixed(2)} <span className="text-[10px] font-normal text-[#6A746F] dark:text-[#4A5A55]">JD</span></span>
                                        </div>
                                    ) : (
                                        <span className="text-[#16201D] dark:text-[#EAE6DE]">{Number(product.price).toFixed(2)} <span className="text-[10px] font-normal text-[#6A746F] dark:text-[#4A5A55]">JD</span></span>
                                    )}
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full font-semibold ${product.stock_status === 'in_stock' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full font-semibold ${product.is_active ? 'bg-[#1F5B4A]/10 text-[#1F5B4A] dark:bg-[#3D9E7A]/15 dark:text-[#3D9E7A]' : 'bg-[#F2EDE0] text-[#6A746F] dark:bg-[#1C2822] dark:text-[#4A5A55]'}`}>
                                        {product.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/admin/products/${product.id}/edit`}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#1F5B4A]/10 dark:hover:bg-[#3D9E7A]/15 hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-all">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Link>
                                        <button onClick={() => handleDelete(product)} disabled={deleting === product.id}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-30">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <Package className="w-8 h-8 mx-auto mb-3 text-[#D7CFBE] dark:text-[#2A3530]" />
                                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No products match your filters.</p>
                                    {hasFilters && (
                                        <button onClick={() => { setSearch(''); setCategory(''); setStock(''); router.get('/admin/products', {}, { preserveState: true, replace: true }); }}
                                            className="mt-2 text-xs text-[#1F5B4A] dark:text-[#3D9E7A] hover:underline">Clear filters</button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {products.last_page > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-7">
                    {products.links.map((link, i) => {
                        if (!link.url) return (
                            <span key={i} className="px-3.5 py-2 rounded-lg text-xs text-[#B8B2A8] dark:text-[#3A4A45]" dangerouslySetInnerHTML={{ __html: link.label }} />
                        );
                        const page = new URL(link.url).searchParams.get('page') ?? '1';
                        return (
                            <button key={i} onClick={() => applyFilters({ page })}
                                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${link.active ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white shadow-sm' : 'border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] bg-white dark:bg-[#141C19]'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    })}
                </div>
            )}
        </AdminLayout>
    );
}

function ImportModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors, progress } = useForm<{ csv_file: File | null }>({ csv_file: null });
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0E1512] w-full max-w-lg rounded-2xl border border-[#E8E1D0] dark:border-[#1C2822] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-7 py-5 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                    <h2 className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">Import Products via CSV</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#F2EDE0] dark:hover:bg-[#1C2822] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={e => { e.preventDefault(); if (!data.csv_file) return; post('/admin/products/import', { forceFormData: true, onSuccess: onClose }); }}
                    className="px-7 py-6 space-y-5">
                    <p className="text-xs text-[#6A746F] dark:text-[#4A5A55] leading-relaxed">
                        Required columns: <code className="text-[11px] bg-[#F8F5EE] dark:bg-[#141C19] px-1.5 py-0.5 rounded text-[#16201D] dark:text-[#9AA8A3] border border-[#E8E1D0] dark:border-[#2A3530]">name</code> and <code className="text-[11px] bg-[#F8F5EE] dark:bg-[#141C19] px-1.5 py-0.5 rounded text-[#16201D] dark:text-[#9AA8A3] border border-[#E8E1D0] dark:border-[#2A3530]">price</code>. Existing products matched by SKU are updated.
                    </p>
                    <div
                        className={`border-2 border-dashed rounded-xl text-center py-10 px-6 cursor-pointer transition-all ${dragOver ? 'border-[#1F5B4A] dark:border-[#3D9E7A] bg-[#1F5B4A]/5 dark:bg-[#3D9E7A]/10' : 'border-[#D7CFBE] dark:border-[#2A3530] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A]'}`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setData('csv_file', f); }}
                    >
                        <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${dragOver ? 'text-[#1F5B4A] dark:text-[#3D9E7A]' : 'text-[#B8B2A8] dark:text-[#3A4A45]'}`} />
                        {data.csv_file ? (
                            <p className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE]">{data.csv_file.name}</p>
                        ) : (
                            <>
                                <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">Drop a CSV file or click to browse</p>
                                <p className="text-xs text-[#B8B2A8] dark:text-[#3A4A45] mt-1">Max 5 MB</p>
                            </>
                        )}
                        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setData('csv_file', f); }} />
                    </div>
                    {errors.csv_file && <p className="text-red-500 dark:text-red-400 text-xs">{errors.csv_file}</p>}
                    {progress && (
                        <div className="w-full bg-[#F2EDE0] dark:bg-[#1C2822] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#1F5B4A] dark:bg-[#3D9E7A] h-full transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}
                    <div className="flex gap-3 pt-1">
                        <button type="submit" disabled={!data.csv_file || processing}
                            className="px-7 py-2.5 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors disabled:opacity-40">
                            {processing ? 'Importing…' : 'Import'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-xs font-semibold border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#6A746F] dark:hover:border-[#4A5A55] hover:text-[#16201D] dark:hover:text-[#EAE6DE] transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
