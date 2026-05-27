import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, X, Link2, Check, Search, ChevronLeft, ChevronRight, Images, RefreshCw } from 'lucide-react';
import LedgerLayout from '@/layouts/ledger-layout';

interface MediaItem { id: number; path: string; filename: string; size: number | null; url: string; created_at: string }
interface ProductItem { id: number; name: string; featured_image: string | null }
interface PaginatedMedia { data: MediaItem[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] }
interface Props { media: PaginatedMedia; products: ProductItem[]; filters: { search?: string } }

function formatBytes(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaIndex({ media, products, filters }: Props) {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selected, setSelected] = useState<MediaItem | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [copied, setCopied] = useState<number | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleSync() {
        if (!confirm('Scan DigitalOcean Spaces and import any images not yet in the library?')) return;
        setSyncing(true);
        router.post('/admin/media/sync', {}, { onFinish: () => setSyncing(false) });
    }

    function applySearch(value: string) {
        setSearch(value);
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => {
            const params: Record<string, string> = {};
            if (value) params['filter[search]'] = value;
            router.get('/admin/media', params, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
    }

    function handleDelete(item: MediaItem) {
        if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return;
        setDeleting(item.id);
        if (selected?.id === item.id) setSelected(null);
        router.delete(`/admin/media/${item.id}`, { onFinish: () => setDeleting(null) });
    }

    function copyUrl(item: MediaItem) {
        navigator.clipboard.writeText(item.url).then(() => {
            setCopied(item.id);
            setTimeout(() => setCopied(null), 1800);
        });
    }

    function goPage(url: string | null) {
        if (!url) return;
        const page = new URL(url).searchParams.get('page') ?? '1';
        router.get('/admin/media', { page }, { preserveState: true, preserveScroll: true, replace: true });
    }

    const actions = (
        <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSync} disabled={syncing} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync from Spaces'}
            </button>
            <button onClick={() => setUploadOpen(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={13} /> Upload Images
            </button>
        </div>
    );

    return (
        <LedgerLayout active="media" title={<>The <em>Media</em></>} eyebrow={`${media.total} image${media.total !== 1 ? 's' : ''}`} actions={actions}>
            <Head title="Media Library — Admin" />

            {/* ── Search ── */}
            <div className="tbl-filters" style={{ paddingBottom: 20 }}>
                <div className="tbl-search" style={{ maxWidth: 360 }}>
                    <Search className="search-ic" size={14} />
                    <input
                        value={search}
                        onChange={e => applySearch(e.target.value)}
                        placeholder="Search by filename…"
                        className="tbl-input"
                    />
                    {search && (
                        <button onClick={() => applySearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'flex' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Upload panel ── */}
            {uploadOpen && <UploadPanel onClose={() => setUploadOpen(false)} />}

            {/* ── Grid ── */}
            {media.data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Images size={36} style={{ margin: '0 auto 16px', color: 'var(--ink-mute)', display: 'block' }} />
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-mute)', fontSize: 18 }}>No images yet.</p>
                    <p style={{ fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--ink-mute)', marginTop: 6 }}>
                        Upload new images, or click <strong>Sync from Spaces</strong> to import from your bucket.
                    </p>
                </div>
            ) : (
                <div className="media-grid">
                    {media.data.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className="media-item"
                            style={selected?.id === item.id ? { borderColor: 'var(--accent)' } : {}}
                        >
                            <img src={item.url} alt={item.filename} loading="lazy" />
                            <div className="media-overlay">
                                <button
                                    onClick={e => { e.stopPropagation(); copyUrl(item); }}
                                    style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Copy URL"
                                >
                                    {copied === item.id ? <Check size={13} /> : <Link2 size={13} />}
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(item); }}
                                    disabled={deleting === item.id}
                                    style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(220,38,38,.75)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === item.id ? .4 : 1 }}
                                    title="Delete"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className="media-name">{item.filename}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {media.last_page > 1 && (
                <div className="pager">
                    <button onClick={() => goPage(media.links[0]?.url)} disabled={media.current_page === 1} className={`pager-item${media.current_page === 1 ? ' disabled' : ''}`}>
                        <ChevronLeft size={14} />
                    </button>
                    <span className="pager-item" style={{ cursor: 'default' }}>{media.current_page} / {media.last_page}</span>
                    <button onClick={() => goPage(media.links[media.links.length - 1]?.url)} disabled={media.current_page === media.last_page} className={`pager-item${media.current_page === media.last_page ? ' disabled' : ''}`}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* ── Image detail panel ── */}
            {selected && (
                <ImagePanel
                    item={selected}
                    products={products}
                    copied={copied === selected.id}
                    deleting={deleting === selected.id}
                    onCopy={() => copyUrl(selected)}
                    onDelete={() => handleDelete(selected)}
                    onClose={() => setSelected(null)}
                />
            )}
        </LedgerLayout>
    );
}

/* ─── Upload panel ─────────────────────────────────────────────────────── */

function UploadPanel({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, progress } = useForm<{ images: File[] }>({ images: [] });
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function addFiles(newFiles: FileList | null) {
        if (!newFiles) return;
        const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        setData('images', [...data.images, ...arr]);
        setPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
    }

    function removeFile(i: number) {
        URL.revokeObjectURL(previews[i]);
        setData('images', data.images.filter((_, idx) => idx !== i));
        setPreviews(prev => prev.filter((_, idx) => idx !== i));
    }

    useEffect(() => () => previews.forEach(URL.revokeObjectURL), []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (data.images.length === 0) return;
        post('/admin/media', { forceFormData: true, onSuccess: onClose });
    }

    return (
        <div className="w" style={{ marginBottom: 24 }}>
            <div className="w-head">
                <span className="w-eyebrow">Upload Images</span>
                <button onClick={onClose} className="w-action">Close</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                    className="upload-zone"
                    style={dragOver ? { borderColor: 'var(--accent)', background: 'rgba(31,91,74,.04)' } : {}}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                >
                    <Upload size={24} style={{ margin: '0 auto', display: 'block', color: dragOver ? 'var(--accent)' : 'var(--ink-mute)' }} />
                    <p>Drop images here or click to browse</p>
                    <p style={{ marginTop: 2 }}>PNG, JPG, WebP — up to 20 MB each</p>
                    <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>

                {previews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                        {previews.map((src, i) => (
                            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunk)' }}>
                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => removeFile(i)}
                                    style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {progress && (
                    <div style={{ width: '100%', height: 2, background: 'var(--hair)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--accent)', height: '100%', transition: 'width .3s', width: `${progress.percentage}%` }} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={data.images.length === 0 || processing} className="btn">
                        {processing ? 'Uploading…' : `Upload${data.images.length > 0 ? ` ${data.images.length} file${data.images.length !== 1 ? 's' : ''}` : ''}`}
                    </button>
                    <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                </div>
            </form>
        </div>
    );
}

/* ─── Image detail side panel ──────────────────────────────────────────── */

function ImagePanel({ item, products, copied, deleting, onCopy, onDelete, onClose }: {
    item: MediaItem; products: ProductItem[]; copied: boolean; deleting: boolean;
    onCopy: () => void; onDelete: () => void; onClose: () => void;
}) {
    const [assignOpen, setAssignOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [assignedTo, setAssignedTo] = useState<number | null>(null);

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    function handleAssign(productId: number) {
        setAssigning(true);
        router.post(`/admin/media/${item.id}/assign`, { product_id: productId }, {
            onSuccess: () => { setAssignedTo(productId); setAssignOpen(false); setTimeout(() => setAssignedTo(null), 2500); },
            onFinish: () => setAssigning(false),
        });
    }

    const assignedProduct = assignedTo ? products.find(p => p.id === assignedTo) : null;

    return (
        <div style={{ position: 'fixed', insetBlock: 0, right: 0, zIndex: 50, width: 'min(320px, 92vw)', display: 'flex', flexDirection: 'column', background: 'var(--bg-elev)', borderLeft: '.5px solid var(--rule)', boxShadow: '-8px 0 32px rgba(0,0,0,.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '.5px solid var(--hair)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{item.filename}</span>
                <button onClick={onClose} className="tbl-icon-btn"><X size={14} /></button>
            </div>

            <div style={{ padding: '16px 20px', borderBottom: '.5px solid var(--hair)' }}>
                <div style={{ aspectRatio: '1', borderRadius: 3, overflow: 'hidden', background: 'var(--bg-sunk)' }}>
                    <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: '.5px solid var(--hair)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {item.size && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Size</span>
                        <span style={{ fontFamily: 'var(--font-text)', fontSize: 12 }}>{formatBytes(item.size)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Uploaded</span>
                    <span style={{ fontFamily: 'var(--font-text)', fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 4 }}>URL</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--bg-sunk)', padding: '6px 10px', borderRadius: 2, border: '.5px solid var(--hair)', wordBreak: 'break-all', lineHeight: 1.5 }}>{item.url}</div>
                </div>
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                {assignedProduct && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={12} /> Assigned to "{assignedProduct.name}"
                    </p>
                )}
                <button onClick={onCopy} className="btn btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                    {copied ? <Check size={13} /> : <Link2 size={13} />}
                    {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <button onClick={() => setAssignOpen(o => !o)} className="btn btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                    <Images size={13} /> Assign to product
                </button>
                {assignOpen && (
                    <div style={{ border: '.5px solid var(--rule)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ padding: 8, borderBottom: '.5px solid var(--hair)', position: 'relative' }}>
                            <Search size={12} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)' }} />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products…"
                                className="tbl-input"
                                style={{ paddingLeft: 28, fontSize: 12 }}
                            />
                        </div>
                        <ul style={{ maxHeight: 200, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
                            {filtered.length === 0 && <li style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-mute)' }}>No products found.</li>}
                            {filtered.map(p => (
                                <li key={p.id} style={{ borderTop: '.5px solid var(--hair)' }}>
                                    <button
                                        onClick={() => handleAssign(p.id)}
                                        disabled={assigning}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: 'var(--ink)', transition: 'background .1s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-sunk)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        <div style={{ width: 28, height: 28, borderRadius: 2, overflow: 'hidden', background: 'var(--bg-sunk)', flexShrink: 0 }}>
                                            {p.featured_image ? <img src={p.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                        </div>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <button onClick={onDelete} disabled={deleting} className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start', background: 'transparent', color: 'rgb(185,28,28)', borderColor: 'rgba(185,28,28,.3)', opacity: deleting ? .4 : 1 }}>
                    <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete image'}
                </button>
            </div>
        </div>
    );
}
