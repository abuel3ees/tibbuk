import '../../../css/tibbak.css';
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    engraving_text: string | null;
    stitching_text: string | null;
    selected_size: string | null;
    selected_gender: string | null;
    selected_color: string | null;
}

interface Order {
    id: number;
    tracking_token: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_address: string;
    status: string;
    total_amount: string;
    created_at: string;
    items: OrderItem[];
}

interface Props { order: Order; }

export default function Confirmation({ order }: Props) {
    const orderNo = String(order.id).padStart(5, '0');

    useEffect(() => {
        document.documentElement.classList.add('tibbak');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        return () => document.documentElement.classList.remove('tibbak');
    }, []);

    return (
        <div className="tbk" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
            <Head title={`Order #${orderNo} Confirmed — Tibbak`} />

            <header className="site-header" style={{ position: 'relative' }}>
                <div className="wrap site-header__bar">
                    <Link href="/" className="brand" style={{ alignItems: 'center' }}>
                        <img src="/images/logo.jpg" alt="Tibbuk" style={{ height: 38, width: 38, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                    </Link>
                    <div />
                    <div />
                </div>
            </header>

            <div className="wrap" style={{ paddingBlock: '80px 96px', maxWidth: 720 }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 20px',
                        borderRadius: '50%', background: 'var(--primary-3)',
                        display: 'grid', placeItems: 'center', color: 'var(--primary)',
                    }}>
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12.5 9.5 18 20 6.5"/>
                        </svg>
                    </div>
                    <h1 className="h2" style={{ marginBottom: 12 }}>Order Confirmed</h1>
                    <p className="body-lg">Thank you, {order.customer_name}. Your order has been received and will be processed shortly.</p>
                </div>

                <div style={{ border: '1px solid var(--rule)', borderRadius: 'var(--tbk-radius-lg)', overflow: 'hidden', background: 'var(--paper)' }}>
                    <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="eyebrow" style={{ marginBottom: 4 }}>Order Number</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500 }}>#{orderNo}</div>
                        </div>
                        <span className="pill">{order.status}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid var(--rule)' }}>
                        <div style={{ padding: '20px 28px', borderInlineEnd: '1px solid var(--rule)' }}>
                            <div className="eyebrow" style={{ marginBottom: 6 }}>Phone</div>
                            <div className="body" style={{ color: 'var(--ink)' }}>{order.customer_phone}</div>
                        </div>
                        <div style={{ padding: '20px 28px' }}>
                            <div className="eyebrow" style={{ marginBottom: 6 }}>Delivery Address</div>
                            <div className="body" style={{ color: 'var(--ink)' }}>{order.delivery_address}</div>
                        </div>
                    </div>

                    <div style={{ padding: '20px 28px' }}>
                        <div className="eyebrow" style={{ marginBottom: 16 }}>Items Ordered</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {order.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, gap: 12 }}>
                                    <div>
                                        <span style={{ color: 'var(--ink-soft)' }}>
                                            {item.product_name} <span style={{ color: 'var(--ink-mute)' }}>× {item.quantity}</span>
                                        </span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 2 }}>
                                            {item.selected_size   && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Size: {item.selected_size}</span>}
                                            {item.selected_gender && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{item.selected_gender === 'male' ? 'Male' : 'Female'}</span>}
                                            {item.selected_color  && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Color: {item.selected_color}</span>}
                                            {item.engraving_text  && <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontStyle: 'italic' }}>✎ {item.engraving_text}</span>}
                                            {item.stitching_text  && <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontStyle: 'italic' }}>✦ {item.stitching_text}</span>}
                                        </div>
                                    </div>
                                    <span className="num" style={{ color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        JD {(Number(item.unit_price) * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--rule)', fontWeight: 600 }}>
                            <span>Total</span>
                            <span className="num">JD {Number(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: 28, padding: '20px 28px',
                    border: '1px solid var(--rule)', borderRadius: 'var(--tbk-radius-lg)',
                    background: 'var(--primary-3)', display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    <div>
                        <p className="eyebrow" style={{ marginBottom: 4 }}>What happens next?</p>
                        <p className="body" style={{ color: 'var(--ink)', fontWeight: 600 }}>We'll be in touch to confirm your delivery</p>
                        <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
                            We'll call <strong>{order.customer_phone}</strong> to confirm delivery details.
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                    <Link href="/" className="btn btn--lg">
                        Continue Shopping
                    </Link>
                    <a href={`/track/${order.tracking_token}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--ink-mute)', textDecoration: 'underline', cursor: 'pointer' }}>
                        Track your order →
                    </a>
                </div>
            </div>
        </div>
    );
}
