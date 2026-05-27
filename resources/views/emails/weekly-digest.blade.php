<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tibbuk Weekly Digest</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f5f5f0; color: #111; }
  .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e1d0; }
  .header { background: #1F5B4A; color: #fff; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
  .header p { font-size: 13px; opacity: 0.7; margin-top: 4px; }
  .body { padding: 28px 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .stat { background: #f8f5ee; border-radius: 10px; padding: 16px; }
  .stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; margin-bottom: 6px; }
  .stat .value { font-size: 24px; font-weight: 300; color: #111; font-family: monospace; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; margin-bottom: 12px; }
  .top-product { background: #f0fdf4; border-radius: 10px; padding: 16px; border: 1px solid #bbf7d0; }
  .top-product .name { font-size: 15px; font-weight: 600; color: #166534; }
  .footer { padding: 20px 32px; border-top: 1px solid #e8e1d0; text-align: center; font-size: 11px; color: #aaa; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Tibbuk Weekly Digest</h1>
    <p>Week ending {{ now()->format('M d, Y') }}</p>
  </div>
  <div class="body">
    <p class="section-title">Last 7 days</p>
    <div class="grid">
      <div class="stat">
        <div class="label">Orders</div>
        <div class="value">{{ $total_orders_week }}</div>
      </div>
      <div class="stat">
        <div class="label">Revenue</div>
        <div class="value">{{ number_format($revenue_week, 2) }} JD</div>
      </div>
      <div class="stat">
        <div class="label">New Customers</div>
        <div class="value">{{ $new_customers_week }}</div>
      </div>
      <div class="stat">
        <div class="label">Low Stock Items</div>
        <div class="value" style="{{ $low_stock_count > 0 ? 'color:#b45309;' : '' }}">{{ $low_stock_count }}</div>
      </div>
    </div>
    @if($top_product_name)
    <p class="section-title">Top Product</p>
    <div class="top-product">
      <div class="name">{{ $top_product_name }}</div>
    </div>
    @endif
  </div>
  <div class="footer">Tibbuk — Medical equipment for Jordan's medical students</div>
</div>
</body>
</html>
