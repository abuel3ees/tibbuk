import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, X, Link2, Check, Search, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface MediaItem {
    id: number;
    path: string;
    filename: string;
    size: number | null;
    url: string;
    created_at: string;
}

interface ProductItem {
    id: number;
    name: string;
    featured_image: string | null;
}

interface PaginatedMedia {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    media: PaginatedMedia;
    products: ProductItem[];
    filters: { search?: string };
}

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
    const [search, setSearch] = useState(filters.search ?? '');
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    return (
        <AdminLayout>
            <Head title="Media Library — Admin" />

            {/* Header */}
            <div className="flex items-start justify-between mb-7 gap-4">
                <div>
                    <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight">Media Library</h1>
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">{media.total} image{media.total !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors shadow-sm"
                >
                    <Upload className="w-3.5 h-3.5" /> Upload Images
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B2A8] dark:text-[#3A4A45]" />
                <input
                    value={search}
                    onChange={e => applySearch(e.target.value)}
                    placeholder="Search by filename…"
                    className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] bg-white dark:bg-[#141C19] text-[#16201D] dark:text-[#EAE6DE] text-sm placeholder-[#B8B2A8] dark:placeholder-[#3A4A45] focus:outline-none focus:border-[#1F5B4A] dark:focus:border-[#3D9E7A] transition-colors"
                />
                {search && (
                    <button onClick={() => applySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8B2A8] dark:text-[#3A4A45] hover:text-[#6A746F]">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {uploadOpen && <UploadPanel onClose={() => setUploadOpen(false)} />}

            {/* Grid */}
            {media.data.length === 0 ? (
                <div className="text-center py-24">
                    <Images className="w-10 h-10 mx-auto mb-4 text-[#D7CFBE] dark:text-[#2A3530]" />
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">No images yet. Upload some to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {media.data.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                selected?.id === item.id
                                    ? 'border-[#1F5B4A] dark:border-[#3D9E7A] shadow-lg'
                                    : 'border-transparent hover:border-[#D7CFBE] dark:hover:border-[#2A3530]'
                            } bg-[#F2EDE0] dark:bg-[#1C2822]`}
                        >
                            <img
                                src={item.url}
                                alt={item.filename}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end gap-1">
                                    <button
                                        onClick={e => { e.stopPropagation(); copyUrl(item); }}
                                        className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                                        title="Copy URL"
                                    >
                                        {copied === item.id ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(item); }}
                                        disabled={deleting === item.id}
                                        className="w-7 h-7 rounded-lg bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-600 transition-colors disabled:opacity-40"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/80 truncate leading-tight">{item.filename}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {media.last_page > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                    <button
                        onClick={() => goPage(media.links[0]?.url)}
                        disabled={media.current_page === 1}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] disabled:opacity-30 transition-all bg-white dark:bg-[#141C19]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-[#6A746F] dark:text-[#4A5A55] px-3">
                        {media.current_page} / {media.last_page}
                    </span>
                    <button
                        onClick={() => goPage(media.links[media.links.length - 1]?.url)}
                        disabled={media.current_page === media.last_page}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] disabled:opacity-30 transition-all bg-white dark:bg-[#141C19]"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Image detail panel */}
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
        </AdminLayout>
    );
}

/* ─── Upload panel ─────────────────────────────────────────────── */

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
        <div className="mb-7 rounded-2xl border border-[#E8E1D0] dark:border-[#1C2822] bg-white dark:bg-[#0E1512] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <span className="font-semibold text-sm text-[#16201D] dark:text-[#EAE6DE]">Upload Images</span>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#F2EDE0] dark:hover:bg-[#1C2822]">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-[#1F5B4A] dark:border-[#3D9E7A] bg-[#1F5B4A]/5 dark:bg-[#3D9E7A]/10' : 'border-[#D7CFBE] dark:border-[#2A3530] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A]'}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                >
                    <Upload className={`w-7 h-7 mx-auto mb-2 transition-colors ${dragOver ? 'text-[#1F5B4A] dark:text-[#3D9E7A]' : 'text-[#B8B2A8] dark:text-[#3A4A45]'}`} />
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">Drop images here or click to browse</p>
                    <p className="text-xs text-[#B8B2A8] dark:text-[#3A4A45] mt-1">PNG, JPG, WebP — up to 20 MB each</p>
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>

                {previews.length > 0 && (
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {previews.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-[#F2EDE0] dark:bg-[#1C2822]">
                                <img src={src} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeFile(i)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {progress && (
                    <div className="w-full bg-[#F2EDE0] dark:bg-[#1C2822] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1F5B4A] dark:bg-[#3D9E7A] h-full transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={data.images.length === 0 || processing}
                        className="px-6 py-2.5 rounded-lg bg-[#1F5B4A] dark:bg-[#3D9E7A] text-white text-xs font-semibold hover:bg-[#2D7A65] dark:hover:bg-[#52B892] transition-colors disabled:opacity-40">
                        {processing ? 'Uploading…' : `Upload ${data.images.length > 0 ? data.images.length + ' file' + (data.images.length !== 1 ? 's' : '') : ''}`}
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-5 py-2.5 rounded-lg text-xs font-semibold border border-[#D7CFBE] dark:border-[#2A3530] text-[#6A746F] dark:text-[#4A5A55] hover:border-[#6A746F] dark:hover:border-[#4A5A55] hover:text-[#16201D] dark:hover:text-[#EAE6DE] transition-all">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ─── Image detail side panel ──────────────────────────────────── */

function ImagePanel({ item, products, copied, deleting, onCopy, onDelete, onClose }: {
    item: MediaItem;
    products: ProductItem[];
    copied: boolean;
    deleting: boolean;
    onCopy: () => void;
    onDelete: () => void;
    onClose: () => void;
}) {
    const [assignOpen, setAssignOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [assignedTo, setAssignedTo] = useState<number | null>(null);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    function handleAssign(productId: number) {
        setAssigning(true);
        router.post(`/admin/media/${item.id}/assign`, { product_id: productId }, {
            onSuccess: () => {
                setAssignedTo(productId);
                setAssignOpen(false);
                setTimeout(() => setAssignedTo(null), 2500);
            },
            onFinish: () => setAssigning(false),
        });
    }

    const assignedProduct = assignedTo ? products.find(p => p.id === assignedTo) : null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-80 flex flex-col bg-white dark:bg-[#0E1512] border-l border-[#E8E1D0] dark:border-[#1C2822] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <span className="font-semibold text-sm text-[#16201D] dark:text-[#EAE6DE] truncate pr-3">{item.filename}</span>
                <button onClick={onClose} className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[#6A746F] dark:text-[#4A5A55] hover:bg-[#F2EDE0] dark:hover:bg-[#1C2822]">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Image preview */}
            <div className="p-5 border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <div className="aspect-square rounded-xl overflow-hidden bg-[#F2EDE0] dark:bg-[#1C2822]">
                    <img src={item.url} alt={item.filename} className="w-full h-full object-contain" />
                </div>
            </div>

            {/* Meta */}
            <div className="px-5 py-4 border-b border-[#E8E1D0] dark:border-[#1C2822] space-y-2">
                <MetaRow label="Size" value={formatBytes(item.size)} />
                <MetaRow label="Uploaded" value={new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6A746F] dark:text-[#4A5A55] mb-1">URL</p>
                    <p className="text-[11px] text-[#16201D] dark:text-[#EAE6DE] font-mono break-all leading-relaxed bg-[#F8F5EE] dark:bg-[#141C19] rounded-lg px-2.5 py-2">{item.url}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 space-y-2.5 flex-1 overflow-y-auto">
                {assignedProduct && (
                    <p className="text-xs text-[#1F5B4A] dark:text-[#3D9E7A] flex items-center gap-1.5 mb-2">
                        <Check className="w-3.5 h-3.5" /> Assigned to "{assignedProduct.name}"
                    </p>
                )}

                <button
                    onClick={onCopy}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] text-sm text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-all text-left"
                >
                    {copied ? <Check className="w-4 h-4 text-[#1F5B4A] dark:text-[#3D9E7A]" /> : <Link2 className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy URL'}
                </button>

                <button
                    onClick={() => setAssignOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#D7CFBE] dark:border-[#2A3530] text-sm text-[#6A746F] dark:text-[#4A5A55] hover:border-[#1F5B4A] dark:hover:border-[#3D9E7A] hover:text-[#1F5B4A] dark:hover:text-[#3D9E7A] transition-all text-left"
                >
                    <Images className="w-4 h-4" />
                    Assign to product
                </button>

                {assignOpen && (
                    <div className="rounded-xl border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden">
                        <div className="p-2.5 border-b border-[#E8E1D0] dark:border-[#1C2822] relative">
                            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B8B2A8] dark:text-[#3A4A45]" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products…"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F5EE] dark:bg-[#141C19] rounded-lg border border-[#E8E1D0] dark:border-[#2A3530] text-[#16201D] dark:text-[#EAE6DE] placeholder-[#B8B2A8] dark:placeholder-[#3A4A45] focus:outline-none focus:border-[#1F5B4A] dark:focus:border-[#3D9E7A]"
                            />
                        </div>
                        <ul className="max-h-52 overflow-y-auto divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                            {filtered.length === 0 && (
                                <li className="px-4 py-3 text-xs text-[#6A746F] dark:text-[#4A5A55]">No products found.</li>
                            )}
                            {filtered.map(p => (
                                <li key={p.id}>
                                    <button
                                        onClick={() => handleAssign(p.id)}
                                        disabled={assigning}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs hover:bg-[#F8F5EE] dark:hover:bg-[#141C19] transition-colors disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-md overflow-hidden bg-[#F2EDE0] dark:bg-[#1C2822] flex-shrink-0 flex items-center justify-center">
                                            {p.featured_image
                                                ? <img src={p.featured_image} alt="" className="w-full h-full object-cover" />
                                                : <span className="text-[8px] text-[#B8B2A8] dark:text-[#3A4A45]">—</span>}
                                        </div>
                                        <span className="text-[#16201D] dark:text-[#EAE6DE] font-medium truncate">{p.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-900/40 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-all text-left disabled:opacity-40"
                >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting…' : 'Delete image'}
                </button>
            </div>
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] uppercase tracking-wider text-[#6A746F] dark:text-[#4A5A55]">{label}</span>
            <span className="text-xs text-[#16201D] dark:text-[#EAE6DE] text-right">{value}</span>
        </div>
    );
}
