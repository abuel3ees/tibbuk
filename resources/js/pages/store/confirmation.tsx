import { Head, Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_address: string;
    status: string;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}

interface Props {
    order: Order;
}

export default function Confirmation({ order }: Props) {
    const orderNo = String(order.id).padStart(5, '0');

    return (
        <>
            <Head title={`Order #${orderNo} Confirmed — MedStore Jordan`} />

            <div className="min-h-screen bg-stone-50 flex flex-col">
                {/* Nav */}
                <nav className="bg-white border-b border-stone-100 px-6 lg:px-10">
                    <div className="max-w-7xl mx-auto flex items-center h-16">
                        <Link href="/" className="text-xl font-light tracking-[0.2em] uppercase text-stone-900">
                            MedStore<span className="font-semibold">Jo</span>
                        </Link>
                    </div>
                </nav>

                <div className="flex-1 flex items-center justify-center px-6 py-20">
                    <div className="w-full max-w-2xl">
                        {/* Success header */}
                        <div className="text-center mb-12">
                            <CheckCircle className="w-16 h-16 text-stone-700 mx-auto mb-6" strokeWidth={1} />
                            <h1 className="text-3xl font-light text-stone-900 mb-2">Order Confirmed</h1>
                            <p className="text-stone-400">Thank you, {order.customer_name}. Your order has been received.</p>
                        </div>

                        {/* Order detail card */}
                        <div className="bg-white border border-stone-100">
                            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Order Number</p>
                                    <p className="text-2xl font-light text-stone-900">#{orderNo}</p>
                                </div>
                                <span className="text-xs tracking-widest uppercase px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700">
                                    {order.status}
                                </span>
                            </div>

                            <div className="px-8 py-6 grid grid-cols-2 gap-6 border-b border-stone-100">
                                <div>
                                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Phone</p>
                                    <p className="text-sm text-stone-700">{order.customer_phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">Delivery Address</p>
                                    <p className="text-sm text-stone-700">{order.delivery_address}</p>
                                </div>
                            </div>

                            <div className="px-8 py-6">
                                <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Items Ordered</p>
                                <div className="space-y-3">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-stone-700">{item.product_name} <span className="text-stone-400">× {item.quantity}</span></span>
                                            <span className="text-stone-900">{(Number(item.unit_price) * item.quantity).toFixed(2)} JOD</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium text-sm border-t border-stone-100 mt-4 pt-4">
                                    <span>Total</span>
                                    <span>{Number(order.total_amount).toFixed(2)} JOD</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-10">
                            <p className="text-sm text-stone-400 mb-6">We will contact you on <strong className="text-stone-700">{order.customer_phone}</strong> to confirm delivery details.</p>
                            <Link
                                href="/"
                                className="inline-block text-xs tracking-widest uppercase border border-stone-900 px-10 py-4 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
