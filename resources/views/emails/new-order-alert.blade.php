<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Georgia', serif; background: #fafaf8; color: #1a1a1a; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border: 1px solid #e5e0d8; }
        .header { background: #1a1a1a; color: #fff; padding: 32px 40px; }
        .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.1em; font-weight: 400; text-transform: uppercase; }
        .header p { margin: 4px 0 0; font-size: 12px; color: #a09080; letter-spacing: 0.05em; }
        .body { padding: 40px; }
        .order-meta { display: flex; gap: 32px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e0d8; }
        .meta-item label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
        .meta-item span { font-size: 15px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; padding: 8px 0; border-bottom: 1px solid #e5e0d8; }
        td { padding: 12px 0; border-bottom: 1px solid #f0ece4; font-size: 14px; }
        .total-row td { font-weight: 600; font-size: 15px; border-bottom: none; padding-top: 20px; }
        .footer { background: #f5f3ef; padding: 24px 40px; font-size: 12px; color: #888; border-top: 1px solid #e5e0d8; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>MedStore Jordan</h1>
        <p>New Order Received</p>
    </div>
    <div class="body">
        <div class="order-meta">
            <div class="meta-item">
                <label>Order</label>
                <span>#{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
            <div class="meta-item">
                <label>Date</label>
                <span>{{ $order->created_at->format('d M Y, H:i') }}</span>
            </div>
            <div class="meta-item">
                <label>Status</label>
                <span style="text-transform: capitalize;">{{ $order->status }}</span>
            </div>
        </div>

        <h3 style="font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:8px;">Customer</h3>
        <p style="margin:0 0 4px; font-size:15px; font-weight:600;">{{ $order->customer_name }}</p>
        <p style="margin:0 0 4px; font-size:14px; color:#555;">{{ $order->customer_phone }}</p>
        @if($order->customer_facebook)
            <p style="margin:0 0 4px; font-size:14px;">
                <a href="{{ $order->customer_facebook }}" style="color:#1877f2;">{{ $order->customer_facebook }}</a>
            </p>
        @endif
        <p style="margin:0 0 24px; font-size:14px; color:#555;">{{ $order->delivery_address }}</p>

        <h3 style="font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:8px;">Items</h3>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Price</th>
                    <th style="text-align:right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>
                        {{ $item->product_name }}
                        @if($item->selected_size)
                            <br><span style="font-size:12px;color:#888;">Size: {{ $item->selected_size }}</span>
                        @endif
                        @if($item->selected_gender)
                            <br><span style="font-size:12px;color:#888;">{{ ucfirst($item->selected_gender) }}</span>
                        @endif
                        @if($item->selected_color)
                            <br><span style="font-size:12px;color:#888;">Color: {{ $item->selected_color }}</span>
                        @endif
                        @if($item->engraving_text)
                            <br><span style="font-size:12px;color:#888;">✎ Engraving: {{ $item->engraving_text }}</span>
                        @endif
                        @if($item->stitching_text)
                            <br><span style="font-size:12px;color:#888;">✦ Stitching: {{ $item->stitching_text }}</span>
                        @endif
                    </td>
                    <td style="text-align:center;">{{ $item->quantity }}</td>
                    <td style="text-align:right;">{{ number_format($item->unit_price, 2) }} JOD</td>
                    <td style="text-align:right;">{{ number_format($item->unit_price * $item->quantity, 2) }} JOD</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="3">Total</td>
                    <td style="text-align:right;">{{ number_format($order->total_amount, 2) }} JOD</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top:32px;">
            <a href="{{ url('/admin/orders/' . $order->id) }}"
               style="display:inline-block; background:#1a1a1a; color:#fff; padding:12px 28px; text-decoration:none; font-size:13px; letter-spacing:0.08em; text-transform:uppercase;">
                View Order
            </a>
        </div>
    </div>
    <div class="footer">
        MedStore Jordan &mdash; Medical Equipment &mdash; Amman, Jordan
    </div>
</div>
</body>
</html>
