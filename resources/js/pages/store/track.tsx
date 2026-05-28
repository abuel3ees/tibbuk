import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Package, MapPin, Clock, CheckCircle, XCircle, Truck, Clipboard } from 'lucide-react';

interface OrderItem { product_name: string; quantity: number; unit_price: string }
interface Order {
    id: number;
    tracking_token: string;
    status: string;
    customer_name: string;
    delivery_address: string;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}
interface Props { order: Order }

const STEPS: { key: string; label: string; labelAr: string; icon: React.ElementType }[] = [
    { key: 'pending',    label: 'Order Placed',    labelAr: 'تم استلام الطلب',  icon: Package },
    { key: 'processing', label: 'Processing',       labelAr: 'قيد التجهيز',      icon: Clock },
    { key: 'delivered',  label: 'Delivered',        labelAr: 'تم التسليم',       icon: CheckCircle },
];

const STATUS_CANCELLED = 'cancelled';

export default function TrackOrder({ order }: Props) {
    const isCancelled = order.status === STATUS_CANCELLED;
    const currentStep = isCancelled ? -1 : STEPS.findIndex(s => s.key === order.status);
    const orderNo = String(order.id).padStart(5, '0');
    const placedAt = new Date(order.created_at);
    const [copied, setCopied] = useState(false);

    function copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {});
    }

    return (
        <div className="min-h-screen bg-[#F7F4ED] dark:bg-[#0A0F0D] flex flex-col">
            <Head title={`Track Order #${orderNo}`} />

            {/* Header */}
            <header className="bg-white dark:bg-[#0E1512] border-b border-[#E8E1D0] dark:border-[#1C2822]">
                <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
                    <a href="/">
                        <img src="/images/logo.jpg" alt="Tibbuk" style={{ height: 38, width: 38, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                    </a>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">

                {/* Order number + date */}
                <div className="mb-8">
                    <p className="text-xs tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] mb-1">Order Tracking</p>
                    <h1 className="text-3xl font-light text-[#16201D] dark:text-[#EAE6DE] tracking-tight font-mono">
                        #{orderNo}
                    </h1>
                    <p className="text-sm text-[#6A746F] dark:text-[#4A5A55] mt-1">
                        Placed {placedAt.toLocaleString('en-JO', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                    <button onClick={copyLink} className="mt-3 inline-flex items-center gap-2 text-xs text-[#1F5B4A] dark:text-[#3D9E7A] hover:underline font-medium">
                        <Clipboard className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy tracking link'}
                    </button>
                </div>

                {/* Status stepper */}
                {isCancelled ? (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 p-6 mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
                            <p className="text-sm text-red-600/70 dark:text-red-400/60 mt-0.5">This order has been cancelled.</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] p-6 mb-6 shadow-sm">
                        <div className="flex items-start gap-0">
                            {STEPS.map((step, idx) => {
                                const StepIcon = step.icon;
                                const done = idx <= currentStep;
                                const active = idx === currentStep;
                                const isLast = idx === STEPS.length - 1;
                                return (
                                    <div key={step.key} className="flex-1 flex flex-col items-center">
                                        <div className="flex items-center w-full">
                                            {idx > 0 && (
                                                <div className={`flex-1 h-0.5 ${idx <= currentStep ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A]' : 'bg-[#E8E1D0] dark:bg-[#1C2822]'}`} />
                                            )}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                active ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A] ring-4 ring-[#1F5B4A]/20 dark:ring-[#3D9E7A]/20'
                                                : done ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A]'
                                                : 'bg-[#F2EDE0] dark:bg-[#1C2822]'
                                            }`}>
                                                <StepIcon className={`w-5 h-5 ${done ? 'text-white' : 'text-[#B8B2A8] dark:text-[#3A4A45]'}`} />
                                            </div>
                                            {!isLast && (
                                                <div className={`flex-1 h-0.5 ${idx < currentStep ? 'bg-[#1F5B4A] dark:bg-[#3D9E7A]' : 'bg-[#E8E1D0] dark:bg-[#1C2822]'}`} />
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className={`text-[11px] font-semibold ${active ? 'text-[#1F5B4A] dark:text-[#3D9E7A]' : done ? 'text-[#16201D] dark:text-[#EAE6DE]' : 'text-[#B8B2A8] dark:text-[#3A4A45]'}`}>
                                                {step.label}
                                            </p>
                                            <p className={`text-[10px] mt-0.5 ${active ? 'text-[#1F5B4A]/70 dark:text-[#3D9E7A]/70' : 'text-[#B8B2A8] dark:text-[#3A4A45]'}`}>
                                                {step.labelAr}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {order.status === 'processing' && (
                            <div className="mt-6 pt-5 border-t border-[#F2EDE0] dark:border-[#1C2822] flex items-center gap-3 text-sm text-[#6A746F] dark:text-[#4A5A55]">
                                <Truck className="w-4 h-4 shrink-0 text-[#1F5B4A] dark:text-[#3D9E7A]" />
                                <span>Your order is being prepared and will be delivered soon.</span>
                            </div>
                        )}
                        {order.status === 'delivered' && (
                            <div className="mt-6 pt-5 border-t border-[#F2EDE0] dark:border-[#1C2822] flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>Your order has been delivered. Thank you!</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Customer + address */}
                <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] p-6 mb-4 shadow-sm">
                    <p className="text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold mb-3">Delivery</p>
                    <p className="font-semibold text-[#16201D] dark:text-[#EAE6DE]">{order.customer_name}</p>
                    <div className="flex items-start gap-2 mt-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#B8B2A8] dark:text-[#3A4A45] mt-0.5" />
                        <p className="text-sm text-[#6A746F] dark:text-[#4A5A55]">{order.delivery_address}</p>
                    </div>
                </div>

                {/* Items */}
                <div className="rounded-xl bg-white dark:bg-[#0E1512] border border-[#E8E1D0] dark:border-[#1C2822] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[#F2EDE0] dark:border-[#1C2822]">
                        <p className="text-[11px] tracking-widest uppercase text-[#6A746F] dark:text-[#4A5A55] font-semibold">
                            Items <span className="ml-2">{order.items.length}</span>
                        </p>
                    </div>
                    <div className="divide-y divide-[#F8F5EE] dark:divide-[#141C19]">
                        {order.items.map((item, i) => (
                            <div key={i} className="px-6 py-4 flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-[#F2EDE0] dark:bg-[#1C2822] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#6A746F] dark:text-[#4A5A55]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE] truncate">{item.product_name}</p>
                                    <p className="text-xs text-[#6A746F] dark:text-[#4A5A55]">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-[#16201D] dark:text-[#EAE6DE] font-mono tabular-nums">
                                    {(Number(item.unit_price) * item.quantity).toFixed(2)} <span className="text-[10px] font-normal text-[#6A746F]">JOD</span>
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 border-t border-[#E8E1D0] dark:border-[#1C2822] flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#6A746F] dark:text-[#4A5A55]">Total</p>
                        <p className="text-xl font-light font-mono text-[#16201D] dark:text-[#EAE6DE] tabular-nums">
                            {Number(order.total_amount).toFixed(2)} <span className="text-sm text-[#6A746F] dark:text-[#4A5A55]">JOD</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
