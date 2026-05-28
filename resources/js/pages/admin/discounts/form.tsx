import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { useState } from 'react';
import LedgerLayout from '@/layouts/ledger-layout';

interface Product { id: number; name: string; sku: string | null; featured_image: string | null }
interface Discount {
    id: number; name: string; description: string | null; type: string; value: string;
    applies_to: string; max_uses: number | null; starts_at: string | null; ends_at: string | null;
    is_active: boolean; show_banner: boolean; banner_text: string | null;
}

interface Props {
    products: Product[];
    categories: string[];
    discount?: Discount;
    selectedIds?: number[];
}

export default function DiscountForm({ products, categories, discount, selectedIds = [] }: Props) {
    const isEdit = !!discount;

    const { data, setData, post, put, processing, errors } = useForm({
        name:        discount?.name ?? '',
        description: discount?.description ?? '',
        type:        discount?.type ?? 'percentage',
        value:       discount?.value ?? '',
        applies_to:  discount?.applies_to ?? 'all',
        product_ids: selectedIds as number[],
        categories:  (discount as any)?.categories as string[] ?? [],
        max_uses:    discount?.max_uses != null ? String(discount.max_uses) : '',
        starts_at:   discount?.starts_at ? discount.starts_at.slice(0, 16) : '',
        ends_at:     discount?.ends_at   ? discount.ends_at.slice(0, 16)   : '',
        is_active:   discount?.is_active ?? false,
        show_banner: discount?.show_banner ?? false,
        banner_text: discount?.banner_text ?? '',
    });

    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = productSearch
        ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase()))
        : products;

    function toggleProduct(id: number) {
        setData('product_ids', data.product_ids.includes(id)
            ? data.product_ids.filter(i => i !== id)
            : [...data.product_ids, id]);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/discounts/${discount.id}`);
        } else {
            post('/admin/discounts');
        }
    }

    const valueLabel = data.type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (JD)';
    const valueMax   = data.type === 'percentage' ? 100 : undefined;

    return (
        <LedgerLayout
            active="discounts"
            title={isEdit ? <><em>Edit</em> Discount</> : <>New <em>Discount</em></>}
        >
            <Head title={`${isEdit ? 'Edit' : 'New'} Discount — Admin`} />

            <Link href="/admin/discounts" className="back-link">
                <ArrowLeft size={14} /> All Discounts
            </Link>

            <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
                {/* ── Basic Info ── */}
                <div className="form-card">
                    <div className="form-section">
                        <div className="form-section-title">Discount Info</div>
                        <div className="form-field">
                            <label className="form-lbl">Name</label>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className="form-inp" placeholder="e.g. Summer Sale" />
                            {errors.name && <p className="form-err">{errors.name}</p>}
                        </div>
                        <div className="form-field">
                            <label className="form-lbl">Description (internal)</label>
                            <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="form-inp" rows={2} placeholder="Optional note for your reference" />
                        </div>
                    </div>

                    {/* ── Value ── */}
                    <div className="form-section">
                        <div className="form-section-title">Discount Value</div>
                        <div className="form-grid-2">
                            <div className="form-field">
                                <label className="form-lbl">Type</label>
                                <select value={data.type} onChange={e => setData('type', e.target.value)} className="form-inp">
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (JD)</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">{valueLabel}</label>
                                <input type="number" min="0.01" step="0.01" max={valueMax} value={data.value} onChange={e => setData('value', e.target.value)} className="form-inp" placeholder={data.type === 'percentage' ? '20' : '5.00'} />
                                {errors.value && <p className="form-err">{errors.value}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── Scope ── */}
                    <div className="form-section">
                        <div className="form-section-title">Applies To</div>
                        <div className="form-field">
                            <select value={data.applies_to} onChange={e => setData('applies_to', e.target.value)} className="form-inp">
                                <option value="all">All products</option>
                                <option value="categories">Specific categories</option>
                                <option value="products">Specific products</option>
                            </select>
                        </div>

                        {data.applies_to === 'categories' && (
                            <div className="form-field" style={{ marginTop: 12 }}>
                                <div style={{ border: '.5px solid var(--rule)', borderRadius: 3 }}>
                                    {categories.length === 0 && (
                                        <p style={{ padding: '16px 12px', fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--ink-mute)' }}>No categories found — add products with categories first.</p>
                                    )}
                                    {categories.map(cat => (
                                        <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: data.categories.includes(cat) ? 'rgba(31,91,74,.06)' : 'transparent', transition: 'background .1s', borderBottom: '.5px solid var(--hair)' }}>
                                            <input type="checkbox" checked={data.categories.includes(cat)} onChange={() => setData('categories', data.categories.includes(cat) ? data.categories.filter(c => c !== cat) : [...data.categories, cat])} style={{ width: 14, height: 14, accentColor: 'var(--accent)', flexShrink: 0 }} />
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{cat}</span>
                                        </label>
                                    ))}
                                </div>
                                {data.categories.length > 0 && (
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', marginTop: 6 }}>{data.categories.length} categor{data.categories.length !== 1 ? 'ies' : 'y'} selected</p>
                                )}
                            </div>
                        )}

                        {data.applies_to === 'products' && (
                            <div className="form-field" style={{ marginTop: 12 }}>
                                <div style={{ position: 'relative', marginBottom: 8 }}>
                                    <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)' }} />
                                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products…" className="form-inp" style={{ paddingLeft: 30, fontSize: 12 }} />
                                </div>
                                <div style={{ border: '.5px solid var(--rule)', borderRadius: 3, maxHeight: 260, overflowY: 'auto' }}>
                                    {filteredProducts.map(p => (
                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: data.product_ids.includes(p.id) ? 'rgba(31,91,74,.06)' : 'transparent', transition: 'background .1s' }}>
                                            <input type="checkbox" checked={data.product_ids.includes(p.id)} onChange={() => toggleProduct(p.id)} style={{ width: 14, height: 14, accentColor: 'var(--accent)', flexShrink: 0 }} />
                                            <div style={{ width: 28, height: 28, borderRadius: 2, overflow: 'hidden', background: 'var(--bg-sunk)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {p.featured_image ? <img src={p.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={12} style={{ color: 'var(--ink-mute)' }} />}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                {p.sku && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>{p.sku}</div>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {data.product_ids.length > 0 && (
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', marginTop: 6 }}>{data.product_ids.length} product{data.product_ids.length !== 1 ? 's' : ''} selected</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Limits ── */}
                    <div className="form-section">
                        <div className="form-section-title">Limits & Schedule</div>
                        <div className="form-grid-3">
                            <div className="form-field">
                                <label className="form-lbl">Max uses (leave blank for unlimited)</label>
                                <input type="number" min="1" value={data.max_uses} onChange={e => setData('max_uses', e.target.value)} className="form-inp" placeholder="e.g. 10" />
                                {errors.max_uses && <p className="form-err">{errors.max_uses}</p>}
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">Start date (optional)</label>
                                <input type="datetime-local" value={data.starts_at} onChange={e => setData('starts_at', e.target.value)} className="form-inp" />
                            </div>
                            <div className="form-field">
                                <label className="form-lbl">End date (optional)</label>
                                <input type="datetime-local" value={data.ends_at} onChange={e => setData('ends_at', e.target.value)} className="form-inp" />
                                {errors.ends_at && <p className="form-err">{errors.ends_at}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── Banner ── */}
                    <div className="form-section">
                        <div className="form-section-title">Homepage Banner</div>
                        <label className="form-check">
                            <input type="checkbox" checked={data.show_banner} onChange={e => setData('show_banner', e.target.checked)} />
                            <div>
                                <span className="form-check-lbl">Show sale banner on the homepage</span>
                                <span className="form-check-sub">Displays a prominent strip at the top of the store when this discount is active.</span>
                            </div>
                        </label>
                        {data.show_banner && (
                            <div className="form-field" style={{ marginTop: 12 }}>
                                <label className="form-lbl">Banner text</label>
                                <input value={data.banner_text} onChange={e => setData('banner_text', e.target.value)} className="form-inp" placeholder="e.g. 20% OFF — First 10 orders only!" />
                                {errors.banner_text && <p className="form-err">{errors.banner_text}</p>}
                            </div>
                        )}
                    </div>

                    {/* ── Active ── */}
                    <div className="form-section">
                        <label className="form-check">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            <div>
                                <span className="form-check-lbl">Active</span>
                                <span className="form-check-sub">Discount will be applied to qualifying orders immediately.</span>
                            </div>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                        <button type="submit" disabled={processing} className="btn">
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Discount'}
                        </button>
                        <Link href="/admin/discounts" className="btn btn-ghost">Cancel</Link>
                    </div>
                </div>
            </form>
        </LedgerLayout>
    );
}
