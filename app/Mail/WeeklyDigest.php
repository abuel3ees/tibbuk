<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyDigest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly int $total_orders_week,
        public readonly float $revenue_week,
        public readonly int $new_customers_week,
        public readonly int $low_stock_count,
        public readonly string $top_product_name,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tibbuk Weekly Digest — ' . now()->format('M d, Y'));
    }

    public function content(): Content
    {
        return new Content(view: 'emails.weekly-digest');
    }
}
