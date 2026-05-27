import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import LedgerLayout from '@/layouts/ledger-layout';
import { ArrowLeft, Upload, X, Plus, List, Images, Search } from 'lucide-react';

interface Variant { value: string; price: string; stock: string; image: File | null; current_image: string | null }
interface StoredVariant { value: string; price: string; stock: string | null; image: string | null }

interface Product {
    id?: number; name: string; sku: string; description: string; excerpt: string;
    price: string; sale_price: string; cost_price: string; category: string;
    stock_status: string; quantity: string; featured_image: string | null; is_active: boolean;
    allows_engraving: boolean; engraving_price: string; allows_stitching: boolean; stitching_price: string;
    allows_sizes: boolean; available_sizes: string[]; allows_gender: boolean;
    allows_color: boolean; available_colors: string[];
    variants: StoredVariant[] | null; meta_title?: string | null; meta_description?: string | null;
}

interface MediaItem { id: number; path: string; url: string; filename: string }
interface Props { product: Product | null; categories: string[]; media: MediaItem[] }

function toFormVariant(sv: StoredVariant): Variant {
    return { value: sv.value ?? '', price: sv.price ?? '', stock: sv.stock ?? '', image: null, current_image: sv.image ?? null };
}

const defaultValues = {
    name: '', sku: '', description: '', excerpt: '', price: '', sale_price: '', cost_price: '',
    category: '', stock_status: 'in_stock', quantity: '', featured_image: null as File | null,
    gallery_image_path: '', is_active: true, allows_engraving: false, engraving_price: '',
    allows_stitching: false, stitching_price: '', allows_sizes: false, available_sizes: [] as string[],
    allows_gender: false, allows_color: false, available_colors: [] as string[],
    variants: [] as Variant[], meta_title: '', meta_description: '',
};

export default function ProductForm({ product, categories, media }: Props) {
    const isEdit = !!product;
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(product?.featured_image ?? null);
    const [dragOver, setDragOver] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);

    const [profitMargin, setProfitMargin] = useState<string>(() => {
        if (!product?.cost_price || !product?.price) return '';
        const ep = product.sale_price && Number(product.sale_price) < Number(product.price)
            ? Number(product.sale_price) : Number(product.price);
        const margin = ep - Number(product.cost_price);
        return margin > 0 ? String(margin.toFixed(2)) : '';
    });

    function getEffectivePrice(price: string, salePrice: string): number {
        const sp = Number(salePrice); const p = Number(price);
        return sp > 0 && sp < p ? sp : p;
    }

    function applyMargin(margin: string, price: string, salePrice: string) {
        const ep = getEffectivePrice(price, salePrice);
        if (margin && ep > 0) return String(Math.max(0, ep - Number(margin)).toFixed(2));
        return '';
    }

    const { data, setData, post, put, processing, errors } = useForm(
        product ? {
            name: product.name ?? '', sku: product.sku ?? '', description: product.description ?? '',
            excerpt: product.excerpt ?? '', price: product.price ?? '', sale_price: product.sale_price ?? '',
            cost_price: product.cost_price ?? '', category: product.category ?? '',
            stock_status: product.stock_status ?? 'in_stock', quantity: String(product.quantity ?? ''),
            featured_image: null as File | null, gallery_image_path: '', is_active: product.is_active ?? true,
            allows_engraving: product.allows_engraving ?? false, engraving_price: product.engraving_price ?? '',
            allows_stitching: product.allows_stitching ?? false, stitching_price: product.stitching_price ?? '',
            allows_sizes: product.allows_sizes ?? false, available_sizes: product.available_sizes ?? [],
            allows_gender: product.allows_gender ?? false, allows_color: product.allows_color ?? false,
            available_colors: product.available_colors ?? [],
            variants: (product.variants ?? []).map(toFormVariant),
            meta_title: product.meta_title ?? '', meta_description: product.meta_description ?? '',
        } : defaultValues
    );

    function addVariant() { setData('variants', [...data.variants, { value: '', price: '', stock: '', image: null, current_image: null }]); }
    function removeVariant(i: number) { setData('variants', data.variants.filter((_, idx) => idx !== i)); }
    function setVariantText(i: number, field: 'value' | 'price' | 'stock', val: string) {
        setData('variants', data.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
    }
    function setVariantImage(i: number, file: File) {
        setData('variants', data.variants.map((v, idx) => idx === i ? { ...v, image: file, current_image: v.current_image } : v));
    }
    function clearVariantImage(i: number) {
        setData('variants', data.variants.map((v, idx) => idx === i ? { ...v, image: null, current_image: null } : v));
    }

    function handleFile(file: File) {
        setData(d => ({ ...d, featured_image: file, gallery_image_path: '' }));
        setPreview(URL.createObjectURL(file));
    }
    function handleGalleryPick(item: MediaItem) {
        setData(d => ({ ...d, featured_image: null, gallery_image_path: item.path }));
        setPreview(item.url); setGalleryOpen(false);
        if (fileRef.current) fileRef.current.value = '';
    }
    function clearImage() {
        setData(d => ({ ...d, featured_image: null, gallery_image_path: '' }));
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const opts = { forceFormData: true };
        if (isEdit && product?.id) put(`/admin/products/${product.id}`, opts);
        else post('/admin/products', opts);
    }

    return (
        <LedgerLayout
            active="products"
            title={isEdit ? <><em>Edit</em> Product</> : <>New <em>Product</em></>}
            eyebrow={isEdit ? product?.name : 'Add to catalogue'}
        >
            <Head title={`${isEdit ? 'Edit' : 'Add'} Product — Admin`} />

            <Link href="/admin/products" className="back-link">
                <ArrowLeft size={12} /> Back to Products
            </Link>

            <form onSubmit={handleSubmit} style={{ maxWidth: 780 }}>
                {/* ── Basic Info ── */}
                <div className="form-card">
                    <div className="form-section">
                        <div className="form-section-title">Basic Information</div>
                        <div className="form-grid-2">
                            <div className="form-field">
                                <label className="form-lbl">Product Name *</label>
                                <input value={data.name} onChange={e => setData('name', e.target.value)} className="form-inp" placeholder="e.g. Littmann Classic 3" />
                                {errors.name && <span className="form-err">{errors.name}</span>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">SKU</label>
                                <input value={data.sku} onChange={e => setData('sku', e.target.value)} className="form-inp mono" placeholder="e.g. LITT-CL3-BLK" />
                                {errors.sku && <span className="form-err">{errors.sku}</span>}
                            </div>
                            <div className="form-field span-2">
                                <label className="form-lbl">Category</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select
                                        value={categories.includes(data.category) ? data.category : '__custom__'}
                                        onChange={e => { if (e.target.value !== '__custom__') setData('category', e.target.value); }}
                                        className="form-inp" style={{ flex: 1 }}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__custom__">+ Custom…</option>
                                    </select>
                                    {(!categories.includes(data.category) || data.category === '') && (
                                        <input value={categories.includes(data.category) ? '' : data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="form-inp" style={{ flex: 1 }} placeholder="or type a custom category" />
                                    )}
                                </div>
                                {errors.category && <span className="form-err">{errors.category}</span>}
                            </div>
                            <div className="form-field span-2">
                                <label className="form-lbl">Short Description</label>
                                <textarea value={data.excerpt} onChange={e => setData('excerpt', e.target.value)} className="form-inp" rows={2} style={{ resize: 'none' }} placeholder="Brief description shown on product cards" />
                                {errors.excerpt && <span className="form-err">{errors.excerpt}</span>}
                            </div>
                            <div className="form-field span-2">
                                <label className="form-lbl">Full Description</label>
                                <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="form-inp" rows={5} style={{ resize: 'none' }} placeholder="Full product details shown on product page" />
                                {errors.description && <span className="form-err">{errors.description}</span>}
                            </div>
                        </div>
                    </div>

                    {/* ── Pricing ── */}
                    <div className="form-section">
                        <div className="form-section-title">Pricing (JD)</div>
                        <div className="form-grid-3">
                            <div className="form-field">
                                <label className="form-lbl">Selling Price *</label>
                                <input type="number" step="0.01" min="0" value={data.price}
                                    onChange={e => { setData('price', e.target.value); setData('cost_price', applyMargin(profitMargin, e.target.value, data.sale_price)); }}
                                    className="form-inp mono" placeholder="0.00" />
                                {errors.price && <span className="form-err">{errors.price}</span>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Sale Price</label>
                                <input type="number" step="0.01" min="0" value={data.sale_price}
                                    onChange={e => { setData('sale_price', e.target.value); setData('cost_price', applyMargin(profitMargin, data.price, e.target.value)); }}
                                    className="form-inp mono" placeholder="Leave blank if no sale" />
                                {errors.sale_price && <span className="form-err">{errors.sale_price}</span>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Profit Margin (JD)</label>
                                <input type="number" step="0.01" min="0" value={profitMargin}
                                    onChange={e => { setProfitMargin(e.target.value); setData('cost_price', applyMargin(e.target.value, data.price, data.sale_price)); }}
                                    className="form-inp mono" placeholder="How much you make per sale" />
                                {errors.cost_price && <span className="form-err">{errors.cost_price}</span>}
                            </div>
                        </div>
                        {(() => {
                            const ep = getEffectivePrice(data.price, data.sale_price);
                            const margin = Number(profitMargin);
                            const hasSale = data.sale_price && Number(data.sale_price) < Number(data.price);
                            const pct = ep > 0 && margin > 0 ? (margin / ep * 100).toFixed(0) : null;
                            if (!margin || !ep) return null;
                            return (
                                <div className="form-profit-bar">
                                    Profit: JD {margin.toFixed(2)} per sale{pct ? ` · ${pct}% margin` : ''}
                                    {hasSale && <span style={{ opacity: .75, marginLeft: 8 }}>(on sale price of JD {Number(data.sale_price).toFixed(2)})</span>}
                                    {data.variants.length > 0 && <div style={{ marginTop: 4, opacity: .75 }}>Variants have individual prices — this margin is for the base item only.</div>}
                                </div>
                            );
                        })()}
                    </div>

                    {/* ── Inventory & Image ── */}
                    <div className="form-section">
                        <div className="form-section-title">Inventory & Image</div>
                        <div className="form-grid-3" style={{ marginBottom: 20 }}>
                            <div className="form-field">
                                <label className="form-lbl">Stock Status *</label>
                                <select value={data.stock_status} onChange={e => setData('stock_status', e.target.value)} className="form-inp">
                                    <option value="in_stock">In Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                                {errors.stock_status && <span className="form-err">{errors.stock_status}</span>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Quantity</label>
                                <input type="number" min="0" value={data.quantity} onChange={e => setData('quantity', e.target.value)} className="form-inp mono" placeholder="Leave blank for unlimited" />
                                {errors.quantity && <span className="form-err">{errors.quantity}</span>}
                            </div>
                        </div>

                        <div className="form-field" style={{ marginBottom: 16 }}>
                            <label className="form-lbl">Product Image</label>
                            {preview ? (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    <img src={preview} alt="Preview" style={{ width: 112, height: 112, objectFit: 'cover', borderRadius: 3, border: '.5px solid var(--rule)', flexShrink: 0 }}
                                        onError={e => (e.currentTarget.style.display = 'none')} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>
                                            {data.featured_image?.name ?? (data.gallery_image_path ? 'From gallery' : 'Current image')}
                                        </span>
                                        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
                                            <Upload size={12} /> Upload new
                                        </button>
                                        <button type="button" onClick={() => setGalleryOpen(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
                                            <Images size={12} /> Pick from gallery
                                        </button>
                                        <button type="button" onClick={clearImage} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', color: 'rgb(185,28,28)', borderColor: 'rgba(185,28,28,.3)' }}>
                                            <X size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div
                                        className="upload-zone"
                                        style={dragOver ? { borderColor: 'var(--accent)', background: 'rgba(31,91,74,.04)' } : {}}
                                        onClick={() => fileRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                                    >
                                        <Upload size={20} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--ink-mute)' }} />
                                        <p>Drop an image or click to upload</p>
                                        <p style={{ marginTop: 2 }}>JPG, PNG, WebP — max 20 MB · Also saves to gallery</p>
                                    </div>
                                    <button type="button" onClick={() => setGalleryOpen(true)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Images size={13} /> Pick from gallery
                                    </button>
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                            {errors.featured_image && <span className="form-err">{errors.featured_image}</span>}
                        </div>

                        {galleryOpen && <GalleryPickerModal media={media} onPick={handleGalleryPick} onClose={() => setGalleryOpen(false)} />}

                        <label className="form-check">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            <span className="form-check-lbl">Active</span>
                            <span className="form-check-sub">— visible to customers in the store</span>
                        </label>
                    </div>

                    {/* ── Customizations ── */}
                    <CustomizationsSection data={data} setData={setData} errors={errors as Record<string, string>} />

                    {/* ── Variants ── */}
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

                    {/* ── SEO ── */}
                    <div className="form-section">
                        <div className="form-section-title">SEO</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-field">
                                <label className="form-lbl">Meta Title</label>
                                <input value={(data as unknown as Record<string, string>).meta_title ?? ''}
                                    onChange={e => setData('meta_title' as never, e.target.value as never)}
                                    className="form-inp" placeholder={data.name || 'Defaults to product name'} maxLength={255} />
                                {(errors as Record<string, string>).meta_title && <span className="form-err">{(errors as Record<string, string>).meta_title}</span>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Meta Description</label>
                                <textarea value={(data as unknown as Record<string, string>).meta_description ?? ''}
                                    onChange={e => setData('meta_description' as never, e.target.value as never)}
                                    className="form-inp" rows={3} style={{ resize: 'none' }}
                                    placeholder={data.excerpt || 'Defaults to product excerpt or description'} />
                                {(errors as Record<string, string>).meta_description && <span className="form-err">{(errors as Record<string, string>).meta_description}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={processing} className="btn">
                        {processing ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    <Link href="/admin/products" className="btn btn-ghost">Cancel</Link>
                </div>
            </form>
        </LedgerLayout>
    );
}

/* ─── TagEditor ─────────────────────────────────────────────────────────── */

function TagEditor({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
    const [input, setInput] = useState('');
    function add() {
        const val = input.trim();
        if (val && !tags.includes(val)) onChange([...tags, val]);
        setInput('');
    }
    return (
        <div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    className="form-inp" style={{ flex: 1 }} placeholder={placeholder ?? 'Type and press Enter'} />
                <button type="button" onClick={add} className="btn btn-ghost" style={{ padding: '0 14px' }}>
                    <Plus size={13} />
                </button>
            </div>
            {tags.length > 0 && (
                <div className="tag-wrap">
                    {tags.map((t, i) => (
                        <span key={i} className="tag-pill">
                            {t}
                            <button type="button" onClick={() => onChange(tags.filter((_, idx) => idx !== i))}><X size={10} /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── CustomizationsSection ─────────────────────────────────────────────── */

type FormData = {
    allows_engraving: boolean; engraving_price: string; allows_stitching: boolean; stitching_price: string;
    allows_sizes: boolean; available_sizes: string[]; allows_gender: boolean;
    allows_color: boolean; available_colors: string[]; [key: string]: unknown;
};

function CustomizationsSection({ data, setData, errors }: { data: FormData; setData: (key: string, val: unknown) => void; errors: Record<string, string> }) {
    return (
        <div className="form-section">
            <div className="form-section-title">Customizations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Engraving */}
                <div>
                    <label className="form-check">
                        <input type="checkbox" checked={data.allows_engraving as boolean} onChange={e => setData('allows_engraving', e.target.checked)} />
                        <span className="form-check-lbl">Engraving</span>
                        <span className="form-check-sub">— customer types a name/text to engrave</span>
                    </label>
                    {data.allows_engraving && (
                        <div style={{ marginTop: 10, marginLeft: 24, maxWidth: 240 }} className="form-field">
                            <label className="form-lbl">Engraving Price (JD) — blank = free</label>
                            <input type="number" step="0.01" min="0" value={data.engraving_price as string}
                                onChange={e => setData('engraving_price', e.target.value)} className="form-inp mono" placeholder="0.00 (free)" />
                            {errors.engraving_price && <span className="form-err">{errors.engraving_price}</span>}
                        </div>
                    )}
                </div>
                {/* Stitching */}
                <div>
                    <label className="form-check">
                        <input type="checkbox" checked={data.allows_stitching as boolean} onChange={e => setData('allows_stitching', e.target.checked)} />
                        <span className="form-check-lbl">Stitching</span>
                        <span className="form-check-sub">— customer types text to stitch onto the product</span>
                    </label>
                    {data.allows_stitching && (
                        <div style={{ marginTop: 10, marginLeft: 24, maxWidth: 240 }} className="form-field">
                            <label className="form-lbl">Stitching Price (JD) — blank = free</label>
                            <input type="number" step="0.01" min="0" value={data.stitching_price as string}
                                onChange={e => setData('stitching_price', e.target.value)} className="form-inp mono" placeholder="0.00 (free)" />
                            {errors.stitching_price && <span className="form-err">{errors.stitching_price}</span>}
                        </div>
                    )}
                </div>
                {/* Sizes */}
                <div>
                    <label className="form-check">
                        <input type="checkbox" checked={data.allows_sizes as boolean} onChange={e => setData('allows_sizes', e.target.checked)} />
                        <span className="form-check-lbl">Sizes</span>
                        <span className="form-check-sub">— show a size picker at checkout</span>
                    </label>
                    {data.allows_sizes && (
                        <div style={{ marginTop: 10, marginLeft: 24 }} className="form-field">
                            <label className="form-lbl">Available Sizes</label>
                            <TagEditor tags={data.available_sizes as string[]} onChange={v => setData('available_sizes', v)} placeholder="e.g. S, M, L, XL" />
                        </div>
                    )}
                </div>
                {/* Gender */}
                <div>
                    <label className="form-check">
                        <input type="checkbox" checked={data.allows_gender as boolean} onChange={e => setData('allows_gender', e.target.checked)} />
                        <span className="form-check-lbl">Gender toggle</span>
                        <span className="form-check-sub">— show Male / Female selector at checkout</span>
                    </label>
                </div>
                {/* Colors */}
                <div>
                    <label className="form-check">
                        <input type="checkbox" checked={data.allows_color as boolean} onChange={e => setData('allows_color', e.target.checked)} />
                        <span className="form-check-lbl">Color options</span>
                        <span className="form-check-sub">— show a color picker at checkout</span>
                    </label>
                    {data.allows_color && (
                        <div style={{ marginTop: 10, marginLeft: 24 }} className="form-field">
                            <label className="form-lbl">Available Colors</label>
                            <TagEditor tags={data.available_colors as string[]} onChange={v => setData('available_colors', v)} placeholder="e.g. Black, Navy, Red" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── GalleryPickerModal ────────────────────────────────────────────────── */

function GalleryPickerModal({ media, onPick, onClose }: { media: MediaItem[]; onPick: (item: MediaItem) => void; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const filtered = search ? media.filter(m => m.filename.toLowerCase().includes(search.toLowerCase())) : media;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', padding: 16 }}>
            <div style={{ background: 'var(--bg-elev)', width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 6, border: '.5px solid var(--rule)', boxShadow: '0 32px 80px rgba(0,0,0,.25)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '.5px solid var(--hair)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Pick from Gallery</span>
                    <button onClick={onClose} className="tbl-icon-btn"><X size={14} /></button>
                </div>
                <div style={{ padding: '10px 20px', borderBottom: '.5px solid var(--hair)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)' }} />
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search gallery…" className="tbl-input" style={{ paddingLeft: 28 }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {filtered.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 16 }}>
                            {media.length === 0 ? 'No images in gallery yet.' : 'No images match your search.'}
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                            {filtered.map(item => (
                                <button key={item.id} type="button" onClick={() => onPick(item)} title={item.filename}
                                    style={{ aspectRatio: '1', borderRadius: 3, overflow: 'hidden', border: '.5px solid var(--rule)', background: 'var(--bg-sunk)', cursor: 'pointer', transition: 'border-color .12s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}>
                                    <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {media.length === 0 && (
                    <div style={{ padding: '12px 20px', borderTop: '.5px solid var(--hair)', textAlign: 'center' }}>
                        <Link href="/admin/media" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'underline' }}>
                            Go to Media Library to upload images
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── VariantRow ────────────────────────────────────────────────────────── */

function VariantRow({ v, i, errors, onRemove, onText, onImage, onClearImage }: {
    v: Variant; i: number; errors: Record<string, string>;
    onRemove: () => void; onText: (field: 'value' | 'price' | 'stock', val: string) => void;
    onImage: (file: File) => void; onClearImage: () => void;
}) {
    const imgRef = useRef<HTMLInputElement>(null);
    const imgPreview = v.image ? URL.createObjectURL(v.image) : v.current_image ?? null;

    return (
        <div className="variant-card">
            <div style={{ flexShrink: 0 }}>
                {imgPreview ? (
                    <div style={{ position: 'relative', width: 72, height: 72 }}>
                        <img src={imgPreview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 2, border: '.5px solid var(--rule)' }} />
                        <button type="button" onClick={onClearImage}
                            style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-elev)', border: '.5px solid var(--rule)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}>
                            <X size={9} />
                        </button>
                        <button type="button" onClick={() => imgRef.current?.click()}
                            style={{ marginTop: 4, width: '100%', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                            Replace
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => imgRef.current?.click()}
                        style={{ width: 72, height: 72, border: '1.5px dashed var(--rule)', borderRadius: 2, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--ink-mute)', transition: 'border-color .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink-mute)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}>
                        <Upload size={14} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>Image</span>
                    </button>
                )}
                <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) onImage(f); }} />
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-field">
                    <label className="form-lbl">Label *</label>
                    <input value={v.value} onChange={e => onText('value', e.target.value)} className="form-inp" placeholder="e.g. Black" />
                    {errors[`variants.${i}.value`] && <span className="form-err">{errors[`variants.${i}.value`]}</span>}
                </div>
                <div className="form-field">
                    <label className="form-lbl">Price (JD) *</label>
                    <input type="number" step="0.01" min="0" value={v.price} onChange={e => onText('price', e.target.value)} className="form-inp mono" placeholder="0.00" />
                    {errors[`variants.${i}.price`] && <span className="form-err">{errors[`variants.${i}.price`]}</span>}
                </div>
                <div className="form-field">
                    <label className="form-lbl">Stock</label>
                    <input type="number" min="0" value={v.stock} onChange={e => onText('stock', e.target.value)} className="form-inp mono" placeholder="∞ unlimited" />
                    {errors[`variants.${i}.stock`] && <span className="form-err">{errors[`variants.${i}.stock`]}</span>}
                </div>
            </div>

            <button type="button" onClick={onRemove} className="tbl-icon-btn danger" style={{ alignSelf: 'flex-start', marginTop: 20 }}>
                <X size={14} />
            </button>
        </div>
    );
}

/* ─── VariantsSection ───────────────────────────────────────────────────── */

function VariantsSection({ variants, errors, onAdd, onRemove, onText, onImage, onClearImage, onBulkAdd }: {
    variants: Variant[]; errors: Record<string, string>; onAdd: () => void;
    onRemove: (i: number) => void; onText: (i: number, field: 'value' | 'price' | 'stock', val: string) => void;
    onImage: (i: number, file: File) => void; onClearImage: (i: number) => void;
    onBulkAdd: (variants: Variant[]) => void;
}) {
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');

    function applyBulk() {
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
        const parsed: Variant[] = [];
        for (const line of lines) {
            const comma = line.lastIndexOf(',');
            let value = line; let price = bulkPrice;
            if (comma !== -1) {
                const maybePx = line.slice(comma + 1).trim();
                if (/^\d/.test(maybePx)) { value = line.slice(0, comma).trim(); price = maybePx; }
            }
            if (value) parsed.push({ value, price, stock: '', image: null, current_image: null });
        }
        if (parsed.length) { onBulkAdd(parsed); setBulkText(''); setBulkPrice(''); setBulkOpen(false); }
    }

    return (
        <div className="form-section">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <div className="form-section-title" style={{ marginBottom: 2 }}>Variants</div>
                    <div className="form-hint">e.g. Black / Navy / Red — each with its own price and image.</div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                    <button type="button" onClick={() => setBulkOpen(v => !v)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <List size={12} /> Bulk add
                    </button>
                    <button type="button" onClick={onAdd} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Plus size={12} /> Add one
                    </button>
                </div>
            </div>

            {bulkOpen && (
                <div style={{ marginBottom: 16, padding: 16, border: '.5px solid var(--rule)', borderRadius: 3, background: 'var(--bg-sunk)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-hint">
                        One variant per line. Format: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-elev)', padding: '1px 5px', borderRadius: 2 }}>Label, price</code> or just <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-elev)', padding: '1px 5px', borderRadius: 2 }}>Label</code> (uses shared price below).
                    </div>
                    <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5}
                        placeholder={"Black, 15.00\nRed, 15.00\nNavy Blue, 17.00\nWhite"}
                        className="form-inp mono" style={{ resize: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                        <div className="form-field" style={{ flex: 1 }}>
                            <label className="form-lbl">Shared price (used when no price in line)</label>
                            <input type="number" step="0.01" min="0" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} className="form-inp mono" placeholder="0.00" />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" onClick={applyBulk} className="btn">Add</button>
                            <button type="button" onClick={() => { setBulkOpen(false); setBulkText(''); setBulkPrice(''); }} className="btn btn-ghost">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {variants.length === 0 && !bulkOpen && (
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 14 }}>No variants — product has a single price and image.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '.5px solid var(--hair)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 8 }}>Preview</div>
                    <div className="tag-wrap">
                        {variants.filter(v => v.value).map((v, i) => (
                            <span key={i} className="tag-pill">
                                {v.value}{v.price && <span style={{ opacity: .6, marginLeft: 4 }}>JD {v.price}</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
