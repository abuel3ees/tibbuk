import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
}

export default function ProductsIndex({ products }: Props) {
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);

    const filtered = products.data.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    );

    function handleDelete(product: Product) {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeleting(product.id);
        router.delete(`/admin/products/${product.id}`, {
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <AdminLayout>
            <Head title="Products — Admin" />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-light text-stone-900">Products</h1>
                    <p className="text-sm text-stone-400 mt-0.5">{products.total} total products</p>
                </div>
                <Link
                    href="/admin/products/create"
                    className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products or SKU…"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 text-sm focus:outline-none focus:border-stone-500 transition-colors"
                />
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
                        {filtered.map(product => (
                            <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-stone-900">{product.name}</p>
                                    {product.sku && <p className="text-xs text-stone-400 mt-0.5">{product.sku}</p>}
                                </td>
                                <td className="px-6 py-4 text-stone-500 hidden md:table-cell">{product.category ?? '—'}</td>
                                <td className="px-6 py-4">
                                    {product.sale_price ? (
                                        <div>
                                            <span className="text-stone-400 line-through text-xs">{Number(product.price).toFixed(2)}</span>
                                            <span className="ml-1 font-medium">{Number(product.sale_price).toFixed(2)} JOD</span>
                                        </div>
                                    ) : (
                                        <span>{Number(product.price).toFixed(2)} JOD</span>
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
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-stone-400">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {products.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {products.links.map((link, i) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`px-4 py-2 text-xs border transition-colors ${link.active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-500'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={i} className="px-4 py-2 text-xs border border-stone-100 text-stone-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
