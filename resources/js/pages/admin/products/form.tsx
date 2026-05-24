import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft } from 'lucide-react';

interface Product {
    id?: number;
    name: string;
    sku: string;
    description: string;
    excerpt: string;
    price: string;
    sale_price: string;
    cost_price: string;
    category: string;
    stock_status: string;
    quantity: string;
    featured_image: string;
    is_active: boolean;
}

interface Props {
    product: Product | null;
}

const defaultValues = {
    name: '',
    sku: '',
    description: '',
    excerpt: '',
    price: '',
    sale_price: '',
    cost_price: '',
    category: '',
    stock_status: 'in_stock',
    quantity: '',
    featured_image: '',
    is_active: true,
};

const categories = ['Stethoscopes', 'Books', 'Equipment', 'Accessories', 'Lab Coats & Scrubs', 'Subscriptions', 'Name Tags', 'Other'];

export default function ProductForm({ product }: Props) {
    const isEdit = !!product;

    const { data, setData, post, put, processing, errors } = useForm<typeof defaultValues>(
        product ? {
            name: product.name ?? '',
            sku: product.sku ?? '',
            description: product.description ?? '',
            excerpt: product.excerpt ?? '',
            price: product.price ?? '',
            sale_price: product.sale_price ?? '',
            cost_price: product.cost_price ?? '',
            category: product.category ?? '',
            stock_status: product.stock_status ?? 'in_stock',
            quantity: product.quantity ?? '',
            featured_image: product.featured_image ?? '',
            is_active: product.is_active ?? true,
        } : defaultValues
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit && product?.id) {
            put(`/admin/products/${product.id}`);
        } else {
            post('/admin/products');
        }
    }

    return (
        <AdminLayout>
            <Head title={`${isEdit ? 'Edit' : 'Add'} Product — Admin`} />

            <div className="mb-8">
                <Link href="/admin/products" className="flex items-center gap-2 text-xs tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors mb-4">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Products
                </Link>
                <h1 className="text-2xl font-light text-stone-900">
                    {isEdit ? `Edit: ${product?.name}` : 'Add New Product'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-white border border-stone-100 divide-y divide-stone-50">
                    {/* Basic info */}
                    <div className="p-8">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Product Name *" error={errors.name}>
                                <input
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. Littmann Classic 3"
                                />
                            </Field>
                            <Field label="SKU" error={errors.sku}>
                                <input
                                    value={data.sku}
                                    onChange={e => setData('sku', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g. LITT-CL3-BLK"
                                />
                            </Field>
                            <Field label="Category" error={errors.category} className="md:col-span-2">
                                <select
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <Field label="Short Description" error={errors.excerpt} className="md:col-span-2">
                                <textarea
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    className={inputClass + " resize-none"}
                                    rows={2}
                                    placeholder="Brief product description (shown on cards)"
                                />
                            </Field>
                            <Field label="Full Description" error={errors.description} className="md:col-span-2">
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className={inputClass + " resize-none"}
                                    rows={4}
                                    placeholder="Full product details"
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-8">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Pricing (JOD)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Field label="Regular Price *" error={errors.price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price}
                                    onChange={e => setData('price', e.target.value)}
                                    className={inputClass}
                                    placeholder="0.00"
                                />
                            </Field>
                            <Field label="Sale Price" error={errors.sale_price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.sale_price}
                                    onChange={e => setData('sale_price', e.target.value)}
                                    className={inputClass}
                                    placeholder="0.00 (optional)"
                                />
                            </Field>
                            <Field label="Cost Price" error={errors.cost_price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.cost_price}
                                    onChange={e => setData('cost_price', e.target.value)}
                                    className={inputClass}
                                    placeholder="0.00 (for profit calc)"
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="p-8">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Inventory</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Field label="Stock Status *" error={errors.stock_status}>
                                <select
                                    value={data.stock_status}
                                    onChange={e => setData('stock_status', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="in_stock">In Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </Field>
                            <Field label="Quantity" error={errors.quantity}>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.quantity}
                                    onChange={e => setData('quantity', e.target.value)}
                                    className={inputClass}
                                    placeholder="Leave blank for unlimited"
                                />
                            </Field>
                            <Field label="Image URL" error={errors.featured_image}>
                                <input
                                    value={data.featured_image}
                                    onChange={e => setData('featured_image', e.target.value)}
                                    className={inputClass}
                                    placeholder="https://…"
                                />
                            </Field>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="w-4 h-4 accent-stone-900"
                            />
                            <label htmlFor="is_active" className="text-sm text-stone-700">Active (visible in store)</label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-stone-900 text-white px-10 py-3.5 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    <Link href="/admin/products" className="px-6 py-3.5 text-xs tracking-widest uppercase border border-stone-200 text-stone-600 hover:border-stone-500 transition-colors">
                        Cancel
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

const inputClass = "w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors bg-white";

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
