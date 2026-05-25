import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Upload, X, Plus, List, ChevronDown, ChevronUp } from 'lucide-react';

interface Variant {
    value: string;
    price: string;
    image: File | null;
    current_image: string | null;
}

interface StoredVariant {
    value: string;
    price: string;
    image: string | null;
}

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
    featured_image: string | null;
    is_active: boolean;
    allows_engraving: boolean;
    engraving_price: string;
    allows_stitching: boolean;
    stitching_price: string;
    allows_sizes: boolean;
    available_sizes: string[];
    allows_gender: boolean;
    allows_color: boolean;
    available_colors: string[];
    variants: StoredVariant[] | null;
}

interface Props {
    product: Product | null;
    categories: string[];
}

function toFormVariant(sv: StoredVariant): Variant {
    return { value: sv.value ?? '', price: sv.price ?? '', image: null, current_image: sv.image ?? null };
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
    featured_image: null as File | null,
    is_active: true,
    allows_engraving: false,
    engraving_price: '',
    allows_stitching: false,
    stitching_price: '',
    allows_sizes: false,
    available_sizes: [] as string[],
    allows_gender: false,
    allows_color: false,
    available_colors: [] as string[],
    variants: [] as Variant[],
};

export default function ProductForm({ product, categories }: Props) {
    const isEdit = !!product;
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(product?.featured_image ?? null);
    const [dragOver, setDragOver] = useState(false);

    // Profit margin is displayed/entered as JD amount; stored as cost_price in DB
    const [profitMargin, setProfitMargin] = useState<string>(() => {
        if (!product?.cost_price || !product?.price) return '';
        const ep = product.sale_price && Number(product.sale_price) < Number(product.price)
            ? Number(product.sale_price)
            : Number(product.price);
        const margin = ep - Number(product.cost_price);
        return margin > 0 ? String(margin.toFixed(2)) : '';
    });

    function getEffectivePrice(price: string, salePrice: string): number {
        const sp = Number(salePrice);
        const p = Number(price);
        return sp > 0 && sp < p ? sp : p;
    }

    function applyMargin(margin: string, price: string, salePrice: string) {
        const ep = getEffectivePrice(price, salePrice);
        if (margin && ep > 0) {
            const cost = Math.max(0, ep - Number(margin));
            return String(cost.toFixed(2));
        }
        return '';
    }

    const { data, setData, post, put, processing, errors } = useForm(
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
            quantity: String(product.quantity ?? ''),
            featured_image: null as File | null,
            is_active: product.is_active ?? true,
            allows_engraving: product.allows_engraving ?? false,
            engraving_price: product.engraving_price ?? '',
            allows_stitching: product.allows_stitching ?? false,
            stitching_price: product.stitching_price ?? '',
            allows_sizes: product.allows_sizes ?? false,
            available_sizes: product.available_sizes ?? [],
            allows_gender: product.allows_gender ?? false,
            allows_color: product.allows_color ?? false,
            available_colors: product.available_colors ?? [],
            variants: (product.variants ?? []).map(toFormVariant),
        } : defaultValues
    );

    function addVariant() {
        setData('variants', [...data.variants, { value: '', price: '', image: null, current_image: null }]);
    }
    function removeVariant(i: number) {
        setData('variants', data.variants.filter((_, idx) => idx !== i));
    }
    function setVariantText(i: number, field: 'value' | 'price', val: string) {
        setData('variants', data.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
    }
    function setVariantImage(i: number, file: File) {
        setData('variants', data.variants.map((v, idx) =>
            idx === i ? { ...v, image: file, current_image: v.current_image } : v
        ));
    }
    function clearVariantImage(i: number) {
        setData('variants', data.variants.map((v, idx) =>
            idx === i ? { ...v, image: null, current_image: null } : v
        ));
    }

    function handleFile(file: File) {
        setData('featured_image', file);
        setPreview(URL.createObjectURL(file));
    }

    function clearImage() {
        setData('featured_image', null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const opts = { forceFormData: true };
        if (isEdit && product?.id) {
            put(`/admin/products/${product.id}`, opts);
        } else {
            post('/admin/products', opts);
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
                                <div className="flex gap-3">
                                    <select
                                        value={categories.includes(data.category) ? data.category : '__custom__'}
                                        onChange={e => {
                                            if (e.target.value !== '__custom__') setData('category', e.target.value);
                                        }}
                                        className={inputClass}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__custom__">+ Custom…</option>
                                    </select>
                                    {(!categories.includes(data.category) || data.category === '') && (
                                        <input
                                            value={categories.includes(data.category) ? '' : data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className={inputClass}
                                            placeholder="or type a custom category"
                                        />
                                    )}
                                </div>
                            </Field>
                            <Field label="Short Description" error={errors.excerpt} className="md:col-span-2">
                                <textarea
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    className={inputClass + ' resize-none'}
                                    rows={2}
                                    placeholder="Brief description shown on product cards"
                                />
                            </Field>
                            <Field label="Full Description" error={errors.description} className="md:col-span-2">
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className={inputClass + ' resize-none'}
                                    rows={5}
                                    placeholder="Full product details shown on product page"
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-8">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Pricing (JD)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Field label="Selling Price *" error={errors.price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price}
                                    onChange={e => {
                                        setData('price', e.target.value);
                                        setData('cost_price', applyMargin(profitMargin, e.target.value, data.sale_price));
                                    }}
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
                                    onChange={e => {
                                        setData('sale_price', e.target.value);
                                        setData('cost_price', applyMargin(profitMargin, data.price, e.target.value));
                                    }}
                                    className={inputClass}
                                    placeholder="Leave blank if no sale"
                                />
                            </Field>
                            <Field label="Profit Margin (JD)" error={errors.cost_price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={profitMargin}
                                    onChange={e => {
                                        setProfitMargin(e.target.value);
                                        setData('cost_price', applyMargin(e.target.value, data.price, data.sale_price));
                                    }}
                                    className={inputClass}
                                    placeholder="How much you make per sale"
                                />
                            </Field>
                        </div>
                        {(() => {
                            const ep = getEffectivePrice(data.price, data.sale_price);
                            const margin = Number(profitMargin);
                            const hasSale = data.sale_price && Number(data.sale_price) < Number(data.price);
                            const pct = ep > 0 && margin > 0 ? (margin / ep * 100).toFixed(0) : null;
                            if (!margin || !ep) return null;
                            return (
                                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-lg text-sm">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                        Profit: JD {margin.toFixed(2)} per sale{pct ? ` · ${pct}% margin` : ''}
                                    </span>
                                    {hasSale && (
                                        <span className="text-emerald-600 dark:text-emerald-500 text-xs ml-2">
                                            (on sale price of JD {Number(data.sale_price).toFixed(2)})
                                        </span>
                                    )}
                                    {data.variants.length > 0 && (
                                        <p className="text-emerald-600 dark:text-emerald-500 text-xs mt-1">
                                            Variants have individual prices — this margin is for the base item only.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Inventory & Image */}
                    <div className="p-8">
                        <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Inventory & Image</h2>
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
                        </div>

                        {/* Image upload */}
                        <div className="mt-6">
                            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-3">Product Image</label>

                            {preview ? (
                                <div className="flex items-start gap-4">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="h-32 w-32 object-cover border border-stone-200 shrink-0"
                                        onError={e => (e.currentTarget.style.display = 'none')}
                                    />
                                    <div className="flex flex-col gap-2 pt-1">
                                        <p className="text-xs text-stone-500">{data.featured_image?.name ?? 'Current image'}</p>
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" /> Replace image
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Remove image
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`border-2 border-dashed text-center py-10 px-6 cursor-pointer transition-colors ${dragOver ? 'border-stone-500 bg-stone-50' : 'border-stone-200 hover:border-stone-400'}`}
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                >
                                    <Upload className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                                    <p className="text-sm text-stone-400">Drop an image or click to browse</p>
                                    <p className="text-xs text-stone-300 mt-1">JPG, PNG, WebP — max 20 MB</p>
                                </div>
                            )}

                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            />
                            {errors.featured_image && <p className="text-red-500 text-xs mt-2">{errors.featured_image}</p>}
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="w-4 h-4 accent-stone-900"
                            />
                            <label htmlFor="is_active" className="text-sm text-stone-700">Active — visible to customers in the store</label>
                        </div>
                    </div>

                    {/* Customizations */}
                    <CustomizationsSection data={data} setData={setData} errors={errors as Record<string, string>} />

                    {/* Variants */}
                    <VariantsSection
                        variants={data.variants}
                        errors={errors as Record<string, string>}
                        onAdd={addVariant}
                        onRemove={removeVariant}
                        onText={setVariantText}
                        onImage={setVariantImage}
                        onClearImage={clearVariantImage}
                        onBulkAdd={(newVariants) => setData('variants', [...data.variants, ...newVariants])}
                    />
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

const inputClass = 'w-full border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-stone-500 transition-colors bg-white';

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function TagEditor({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
    const [input, setInput] = useState('');

    function add() {
        const val = input.trim();
        if (val && !tags.includes(val)) onChange([...tags, val]);
        setInput('');
    }

    return (
        <div>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    className={inputClass + ' flex-1'}
                    placeholder={placeholder ?? 'Type and press Enter'}
                />
                <button type="button" onClick={add}
                    className="px-4 py-3 border border-stone-200 text-xs text-stone-500 hover:border-stone-400 hover:text-stone-900 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200">
                            {t}
                            <button type="button" onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="text-stone-400 hover:text-red-500 ml-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

type FormData = {
    allows_engraving: boolean;
    engraving_price: string;
    allows_stitching: boolean;
    stitching_price: string;
    allows_sizes: boolean;
    available_sizes: string[];
    allows_gender: boolean;
    allows_color: boolean;
    available_colors: string[];
    [key: string]: unknown;
};

function CustomizationsSection({ data, setData, errors }: {
    data: FormData;
    setData: (key: string, val: unknown) => void;
    errors: Record<string, string>;
}) {
    return (
        <div className="p-8">
            <h2 className="text-xs tracking-widest uppercase text-stone-400 mb-6">Customizations</h2>
            <div className="space-y-6">

                {/* Engraving */}
                <div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="allows_engraving" checked={data.allows_engraving as boolean}
                            onChange={e => setData('allows_engraving', e.target.checked)}
                            className="w-4 h-4 accent-stone-900" />
                        <label htmlFor="allows_engraving" className="text-sm font-medium text-stone-700">Engraving</label>
                        <span className="text-xs text-stone-400">— customer types a name/text to engrave</span>
                    </div>
                    {data.allows_engraving && (
                        <div className="mt-3 ml-7 max-w-xs">
                            <Field label="Engraving Price (JD) — blank = free" error={errors.engraving_price}>
                                <input type="number" step="0.01" min="0" value={data.engraving_price as string}
                                    onChange={e => setData('engraving_price', e.target.value)}
                                    className={inputClass} placeholder="0.00 (free)" />
                            </Field>
                        </div>
                    )}
                </div>

                {/* Stitching */}
                <div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="allows_stitching" checked={data.allows_stitching as boolean}
                            onChange={e => setData('allows_stitching', e.target.checked)}
                            className="w-4 h-4 accent-stone-900" />
                        <label htmlFor="allows_stitching" className="text-sm font-medium text-stone-700">Stitching</label>
                        <span className="text-xs text-stone-400">— customer types text to stitch onto the product</span>
                    </div>
                    {data.allows_stitching && (
                        <div className="mt-3 ml-7 max-w-xs">
                            <Field label="Stitching Price (JD) — blank = free" error={errors.stitching_price}>
                                <input type="number" step="0.01" min="0" value={data.stitching_price as string}
                                    onChange={e => setData('stitching_price', e.target.value)}
                                    className={inputClass} placeholder="0.00 (free)" />
                            </Field>
                        </div>
                    )}
                </div>

                {/* Sizes */}
                <div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="allows_sizes" checked={data.allows_sizes as boolean}
                            onChange={e => setData('allows_sizes', e.target.checked)}
                            className="w-4 h-4 accent-stone-900" />
                        <label htmlFor="allows_sizes" className="text-sm font-medium text-stone-700">Sizes</label>
                        <span className="text-xs text-stone-400">— show a size picker at checkout</span>
                    </div>
                    {data.allows_sizes && (
                        <div className="mt-3 ml-7">
                            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">Available Sizes</label>
                            <TagEditor tags={data.available_sizes as string[]} onChange={v => setData('available_sizes', v)} placeholder="e.g. S, M, L, XL" />
                        </div>
                    )}
                </div>

                {/* Gender */}
                <div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="allows_gender" checked={data.allows_gender as boolean}
                            onChange={e => setData('allows_gender', e.target.checked)}
                            className="w-4 h-4 accent-stone-900" />
                        <label htmlFor="allows_gender" className="text-sm font-medium text-stone-700">Gender toggle</label>
                        <span className="text-xs text-stone-400">— show Male / Female selector at checkout</span>
                    </div>
                </div>

                {/* Colors */}
                <div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="allows_color" checked={data.allows_color as boolean}
                            onChange={e => setData('allows_color', e.target.checked)}
                            className="w-4 h-4 accent-stone-900" />
                        <label htmlFor="allows_color" className="text-sm font-medium text-stone-700">Color options</label>
                        <span className="text-xs text-stone-400">— show a color picker at checkout</span>
                    </div>
                    {data.allows_color && (
                        <div className="mt-3 ml-7">
                            <label className="block text-xs tracking-widest uppercase text-stone-400 mb-2">Available Colors</label>
                            <TagEditor tags={data.available_colors as string[]} onChange={v => setData('available_colors', v)} placeholder="e.g. Black, Navy, Red" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function VariantRow({ v, i, errors, onRemove, onText, onImage, onClearImage }: {
    v: Variant;
    i: number;
    errors: Record<string, string>;
    onRemove: () => void;
    onText: (field: 'value' | 'price', val: string) => void;
    onImage: (file: File) => void;
    onClearImage: () => void;
}) {
    const imgRef = useRef<HTMLInputElement>(null);
    const imgPreview = v.image ? URL.createObjectURL(v.image) : v.current_image ?? null;

    return (
        <div className="border border-stone-100 p-5">
            <div className="flex items-start gap-3">
                {/* Image thumbnail */}
                <div className="shrink-0">
                    {imgPreview ? (
                        <div className="relative w-20 h-20">
                            <img src={imgPreview} alt="" className="w-20 h-20 object-cover border border-stone-200" />
                            <button
                                type="button"
                                onClick={onClearImage}
                                className="absolute -top-1.5 -right-1.5 bg-white border border-stone-200 rounded-full p-0.5 text-stone-400 hover:text-red-500 transition-colors"
                                aria-label="Remove image"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => imgRef.current?.click()}
                            className="w-20 h-20 border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors flex flex-col items-center justify-center gap-1 text-stone-300 hover:text-stone-400"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="text-[10px]">Image</span>
                        </button>
                    )}
                    <input
                        ref={imgRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) onImage(f); }}
                    />
                    {imgPreview && (
                        <button
                            type="button"
                            onClick={() => imgRef.current?.click()}
                            className="mt-1 text-[10px] text-stone-400 hover:text-stone-600 w-full text-center"
                        >
                            Replace
                        </button>
                    )}
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <Field label="Label *" error={errors[`variants.${i}.value`]}>
                        <input
                            value={v.value}
                            onChange={e => onText('value', e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Black"
                        />
                    </Field>
                    <Field label="Price (JD) *" error={errors[`variants.${i}.price`]}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.price}
                            onChange={e => onText('price', e.target.value)}
                            className={inputClass}
                            placeholder="0.00"
                        />
                    </Field>
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="mt-7 shrink-0 text-stone-300 hover:text-red-400 transition-colors"
                    aria-label="Remove variant"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function VariantsSection({ variants, errors, onAdd, onRemove, onText, onImage, onClearImage, onBulkAdd }: {
    variants: Variant[];
    errors: Record<string, string>;
    onAdd: () => void;
    onRemove: (i: number) => void;
    onText: (i: number, field: 'value' | 'price', val: string) => void;
    onImage: (i: number, file: File) => void;
    onClearImage: (i: number) => void;
    onBulkAdd: (variants: Variant[]) => void;
}) {
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');

    function applyBulk() {
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        const parsed: Variant[] = [];
        for (const line of lines) {
            // Support: "Label, price" or "Label" (uses shared price)
            const comma = line.lastIndexOf(',');
            let value = line;
            let price = bulkPrice;
            if (comma !== -1) {
                const maybePx = line.slice(comma + 1).trim();
                if (/^\d/.test(maybePx)) { value = line.slice(0, comma).trim(); price = maybePx; }
            }
            if (value) parsed.push({ value, price, image: null, current_image: null });
        }
        if (parsed.length) { onBulkAdd(parsed); setBulkText(''); setBulkPrice(''); setBulkOpen(false); }
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xs tracking-widest uppercase text-stone-400">Variants</h2>
                    <p className="text-xs text-stone-400 mt-1">e.g. Black / Navy / Red — each with its own price and image.</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <button type="button" onClick={() => setBulkOpen(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors border border-stone-200 px-3 py-1.5 hover:border-stone-400">
                        <List className="w-3.5 h-3.5" /> Bulk add
                    </button>
                    <button type="button" onClick={onAdd}
                        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors border border-stone-200 px-3 py-1.5 hover:border-stone-400">
                        <Plus className="w-3.5 h-3.5" /> Add one
                    </button>
                </div>
            </div>

            {bulkOpen && (
                <div className="mb-6 p-5 border border-stone-200 bg-stone-50 space-y-3">
                    <p className="text-xs text-stone-500 leading-relaxed">
                        One variant per line. Format: <code className="bg-white border border-stone-200 px-1 rounded text-[11px]">Label, price</code> or just <code className="bg-white border border-stone-200 px-1 rounded text-[11px]">Label</code> (uses shared price below).
                    </p>
                    <textarea
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                        rows={5}
                        placeholder={"Black, 15.00\nRed, 15.00\nNavy Blue, 17.00\nWhite"}
                        className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-500 resize-none font-mono"
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="block text-[11px] text-stone-400 mb-1">Shared price (used when no price in line)</label>
                            <input type="number" step="0.01" min="0" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-500" />
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button type="button" onClick={applyBulk}
                                className="bg-stone-900 text-white px-5 py-2 text-xs tracking-widest uppercase hover:bg-stone-700 transition-colors">
                                Add
                            </button>
                            <button type="button" onClick={() => { setBulkOpen(false); setBulkText(''); setBulkPrice(''); }}
                                className="px-4 py-2 text-xs tracking-widest uppercase border border-stone-200 text-stone-500 hover:border-stone-400 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {variants.length === 0 && !bulkOpen && (
                <p className="text-sm text-stone-300 italic">No variants — product has a single price and image.</p>
            )}

            <div className="space-y-4">
                {variants.map((v, i) => (
                    <VariantRow key={i} v={v} i={i} errors={errors}
                        onRemove={() => onRemove(i)}
                        onText={(field, val) => onText(i, field, val)}
                        onImage={file => onImage(i, file)}
                        onClearImage={() => onClearImage(i)}
                    />
                ))}
            </div>

            {variants.length > 0 && (
                <div className="mt-5 pt-5 border-t border-stone-50">
                    <div className="text-xs text-stone-400 mb-2">Preview:</div>
                    <div className="flex flex-wrap gap-2">
                        {variants.filter(v => v.value).map((v, i) => (
                            <span key={i} className="text-xs px-3 py-1.5 border border-stone-200 text-stone-600">
                                {v.value}
                                {v.price && <span className="text-stone-400 ml-1.5">JD {v.price}</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
