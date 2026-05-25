import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, X, Filter, Upload, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    price: string;
    sale_price: string | null;
    stock_status: string;
    is_active: boolean;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    products: PaginatedProducts;
    categories: string[];
    filters: { search?: string; category?: string; stock?: string };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [stock, setStock] = useState(filters.stock ?? '');
    const [deleting, setDeleting] = useState<number | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function applyFilters(overrides: Record<string, string>) {
        const params = Object.fromEntries(
            Object.entries({ search, category, stock, ...overrides }).filter(([, v]) => v !== '')
        );
        router.get('/admin/products', params, { preserveState: true, preserveScroll: true, replace: true });
    }

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applyFilters({ search: value }), 350);
    }, [category, stock]);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    function handleCategoryChange(value: string) {
        setCategory(value);
        applyFilters({ category: value });
    }

    function handleStockChange(value: string) {
        setStock(value);
        applyFilters({ stock: value });
    }

    function clearFilters() {
        setSearch(''); setCategory(''); setStock('');
        router.get('/admin/products', {}, { preserveState: true, replace: true });
    }

    const hasFilters = search || category || stock;

    function handleDelete(product: Product) {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeleting(product.id);
        router.delete(`/admin/products/${product.id}`, {
            onFinish: () => setDeleting(null),
        });
    }

    function handleBulkVisibility(active: boolean) {
        const label = active ? 'active (visible to customers)' : 'hidden';
        if (!confirm(`Set ALL products as ${label}?`)) return;
        router.post('/admin/products/bulk-visibility', { active });
    }

    return (
        <AdminLayout>
            <Head title="Products — Admin" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-light text-stone-900">Products</h1>
                    <p className="text-sm text-stone-400 mt-0.5">{products.total} total products</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleBulkVisibility(true)}
                        title="Set all products as active"
                        className="flex items-center gap-2 border border-stone-200 bg-white text-stone-600 px-4 py-3 text-xs tracking-widest uppercase hover:border-green-400 hover:text-green-700 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        All Active
                    </button>
                    <button
                        onClick={() => handleBulkVisibility(false)}
                        title="Set all products as hidden"
                        className="flex items-center gap-2 border border-stone-200 bg-white text-stone-600 px-4 py-3 text-xs tracking-widest uppercase hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                        <EyeOff className="w-4 h-4" />
                        All Hidden
                    </button>
                    <button
                        onClick={() => setImportOpen(true)}
                        className="flex items-center gap-2 border border-stone-200 bg-white text-stone-600 px-5 py-3 text-xs tracking-widest uppercase hover:border-stone-400 hover:text-stone-900 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </button>
                    <Link
                        href="/admin/products/create"
                        className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </Link>
                </div>
            </div>

            {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}

            {/* Filters bar */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search name, SKU, category…"
                        className="w-full pl-11 pr-10 py-3 bg-white border border-stone-200 text-sm text-stone-900 focus:outline-none focus:border-stone-500 transition-colors"
                    />
                    {search && (
                        <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <select
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-500 transition-colors min-w-44"
                >
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={stock}
                    onChange={e => handleStockChange(e.target.value)}
                    className="border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-500 transition-colors"
                >
                    <option value="">All stock</option>
                    <option value="in">In stock</option>
                    <option value="out">Out of stock</option>
                </select>

                {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-3 text-sm text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-700 transition-colors bg-white">
                        <Filter className="w-4 h-4" /> Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-stone-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-100">
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Product</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal hidden md:table-cell">Category</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal">Price</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal hidden sm:table-cell">Stock</th>
                            <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-normal hidden lg:table-cell">Status</th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {products.data.map(product => (
                            <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-stone-900">{product.name}</p>
                                    {product.sku && <p className="text-xs text-stone-400 mt-0.5 font-mono">{product.sku}</p>}
                                </td>
                                <td className="px-6 py-4 text-stone-500 hidden md:table-cell">{product.category ?? '—'}</td>
                                <td className="px-6 py-4 font-mono">
                                    {product.sale_price ? (
                                        <div>
                                            <span className="text-stone-400 line-through text-xs mr-1">{Number(product.price).toFixed(2)}</span>
                                            <span className="font-medium">{Number(product.sale_price).toFixed(2)} JD</span>
                                        </div>
                                    ) : (
                                        <span>{Number(product.price).toFixed(2)} JD</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <span className={`text-[10px] tracking-widest uppercase px-2 py-1 border ${product.stock_status === 'in_stock' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                        {product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className={`text-[10px] tracking-widest uppercase px-2 py-1 border ${product.is_active ? 'border-stone-200 text-stone-600' : 'border-red-200 text-red-500'}`}>
                                        {product.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="text-stone-400 hover:text-stone-900 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            disabled={deleting === product.id}
                                            className="text-stone-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-stone-400">
                                    No products match your filters.
                                    {hasFilters && (
                                        <button onClick={clearFilters} className="ml-2 underline hover:text-stone-600">Clear filters</button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {products.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {products.links.map((link, i) => {
                        if (!link.url) {
                            return <span key={i} className="px-4 py-2 text-xs border border-stone-100 text-stone-300" dangerouslySetInnerHTML={{ __html: link.label }} />;
                        }
                        const page = new URL(link.url).searchParams.get('page') ?? '1';
                        return (
                            <button
                                key={i}
                                onClick={() => applyFilters({ page })}
                                className={`px-4 py-2 text-xs border transition-colors ${link.active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-500'}`}
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
    const { data, setData, post, processing, errors, progress } = useForm<{ csv_file: File | null }>({
        csv_file: null,
    });
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFile(file: File) {
        setData('csv_file', file);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!data.csv_file) return;
        post('/admin/products/import', {
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    const fileName = data.csv_file?.name;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white w-full max-w-lg">
                <div className="flex items-center justify-between px-8 py-6 border-b border-stone-100">
                    <h2 className="text-sm font-medium text-stone-900">Import Products via CSV</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
                </div>
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    <p className="text-xs text-stone-500 leading-relaxed">
                        Upload a CSV file with these columns (header row required):<br />
                        <code className="text-[11px] bg-stone-50 px-1 py-0.5 rounded text-stone-700">
                            name, sku, price, sale_price, cost_price, category, stock_status, quantity, description, excerpt, featured_image, is_active
                        </code><br />
                        <span className="mt-1 inline-block">Only <strong>name</strong> and <strong>price</strong> are required. Existing products are matched by SKU and updated.</span>
                    </p>

                    <div
                        className={`border-2 border-dashed rounded-sm text-center py-10 px-6 cursor-pointer transition-colors ${dragOver ? 'border-stone-500 bg-stone-50' : 'border-stone-200 hover:border-stone-400'}`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    >
                        <Upload className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                        {fileName ? (
                            <p className="text-sm text-stone-700 font-medium">{fileName}</p>
                        ) : (
                            <>
                                <p className="text-sm text-stone-500">Drop a CSV file here or click to browse</p>
                                <p className="text-xs text-stone-400 mt-1">Max 5 MB</p>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </div>

                    {errors.csv_file && <p className="text-red-500 text-xs">{errors.csv_file}</p>}

                    {progress && (
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-stone-900 h-full transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={!data.csv_file || processing}
                            className="bg-stone-900 text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40"
                        >
                            {processing ? 'Importing…' : 'Import'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-xs tracking-widest uppercase border border-stone-200 text-stone-600 hover:border-stone-500 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
