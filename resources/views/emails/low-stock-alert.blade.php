<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $alertType === 'out' ? 'Out of Stock' : 'Low Stock Warning' }}</title>
<style>
  body { font-family: Helvetica, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 32px 16px; }
  .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .header { padding: 28px 32px; background: {{ $alertType === 'out' ? '#b91c1c' : '#d97706' }}; color: #fff; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
  .header p { margin: 6px 0 0; font-size: 14px; opacity: .85; }
  .body { padding: 28px 32px; }
  .product-name { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #555; }
  .row:last-child { border-bottom: none; }
  .row strong { color: #111; }
  .footer { padding: 16px 32px; background: #f8f8f8; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>{{ $alertType === 'out' ? '⚠️ Product Out of Stock' : '⚠️ Low Stock Warning' }}</h1>
    <p>Action may be required to restock inventory.</p>
  </div>
  <div class="body">
    <div class="product-name">{{ $product->name }}</div>
    @if($product->sku)
    <div class="row"><span>SKU</span><strong>{{ $product->sku }}</strong></div>
    @endif
    @if($product->category)
    <div class="row"><span>Category</span><strong>{{ $product->category }}</strong></div>
    @endif
    <div class="row"><span>Current Quantity</span><strong>{{ $product->quantity ?? 0 }}</strong></div>
    <div class="row"><span>Status</span><strong>{{ $alertType === 'out' ? 'Out of Stock' : 'Low Stock (≤ 5 units)' }}</strong></div>
  </div>
  <div class="footer">Tibbuk — طِبّك · This is an automated inventory alert.</div>
</div>
</body>
</html>
