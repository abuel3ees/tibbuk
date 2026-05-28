import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import LedgerLayout from '@/layouts/ledger-layout';

interface Discount {
    id: number;
    name: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    value: string;
    applies_to: 'all' | 'products';
    products_count: number;
    max_uses: number | null;
    uses_count: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    show_banner: boolean;
    banner_text: string | null;
}

interface Props { discounts: Discount[] }

function statusLabel(d: Discount): { label: string; cls: string } {
    if (!d.is_active) return { label: 'Inactive', cls: 'hidden-tag' };
    if (d.ends_at && new Date(d.ends_at) < new Date()) return { label: 'Expired', cls: 'cancelled' };
    if (d.starts_at && new Date(d.starts_at) > new Date()) return { label: 'Scheduled', cls: 'processing' };
    if (d.max_uses !== null && d.uses_count >= d.max_uses) return { label: 'Exhausted', cls: 'pending' };
    return { label: 'Active', cls: 'active' };
}

export default function DiscountsIndex({ discounts }: Props) {
    const [toggling, setToggling] = useState<number | null>(null);

    function handleToggle(d: Discount) {
        setToggling(d.id);
        fetch(`/admin/discounts/${d.id}/toggle`, {
            method: 'PATCH',
            headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
        }).then(() => {
            router.reload({ only: ['discounts'] });
        }).finally(() => setToggling(null));
    }

    function handleDelete(d: Discount) {
        if (!confirm(`Delete discount "${d.name}"? This cannot be undone.`)) return;
        router.delete(`/admin/discounts/${d.id}`, { preserveScroll: true });
    }

    const actions = (
        <Link href="/admin/discounts/create" className="btn" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> New Discount
        </Link>
    );

    return (
        <LedgerLayout
            active="discounts"
            title={<>The <em>Discounts</em></>}
            eyebrow={`${discounts.length} total`}
            actions={actions}
        >
            <Head title="Discounts — Admin" />

            <div className="w" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                        <colgroup>
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Discount</th>
                                <th>Value</th>
                                <th>Scope</th>
                                <th>Uses</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map(d => {
                                const { label, cls } = statusLabel(d);
                                return (
                                    <tr key={d.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 3, background: 'rgba(31,91,74,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Tag size={14} style={{ color: 'var(--accent)' }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <span className="nm" style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                                    {d.banner_text && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>📢 {d.banner_text}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="num" style={{ fontWeight: 600 }}>
                                                {d.type === 'percentage' ? `${Number(d.value).toFixed(0)}%` : `${Number(d.value).toFixed(2)} JD`}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                                            {d.applies_to === 'all' ? 'All' : `${d.products_count} product${d.products_count !== 1 ? 's' : ''}`}
                                        </td>
                                        <td>
                                            <span className="num" style={{ fontSize: 12 }}>
                                                {d.uses_count}
                                                {d.max_uses !== null ? <span style={{ color: 'var(--ink-mute)' }}> / {d.max_uses}</span> : <span style={{ color: 'var(--ink-mute)' }}> / ∞</span>}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                                            {d.starts_at ? new Date(d.starts_at).toLocaleDateString() : '—'}
                                            {(d.starts_at || d.ends_at) && ' → '}
                                            {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : d.starts_at ? '∞' : ''}
                                        </td>
                                        <td>
                                            <span className={`tbl tag ${cls}`}>{label}</span>
                                        </td>
                                        <td>
                                            <div className="tbl-actions">
                                                <button
                                                    onClick={() => handleToggle(d)}
                                                    disabled={toggling === d.id}
                                                    className="tbl-icon-btn"
                                                    title={d.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {d.is_active ? <ToggleRight size={14} style={{ color: 'var(--accent)' }} /> : <ToggleLeft size={14} />}
                                                </button>
                                                <Link href={`/admin/discounts/${d.id}/edit`} className="tbl-icon-btn">
                                                    <Pencil size={13} />
                                                </Link>
                                                <button onClick={() => handleDelete(d)} className="tbl-icon-btn danger">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {discounts.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
                                        <Tag size={28} style={{ margin: '0 auto 12px', color: 'var(--ink-mute)', display: 'block' }} />
                                        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 17 }}>No discounts yet.</p>
                                        <Link href="/admin/discounts/create" style={{ display: 'inline-block', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                                            Create your first discount →
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </LedgerLayout>
    );
}
