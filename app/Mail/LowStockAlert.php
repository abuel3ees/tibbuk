<?php

namespace App\Mail;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Product $product, public string $alertType)
    {
    }

    public function envelope(): Envelope
    {
        $subject = $this->alertType === 'out'
            ? "Out of Stock: {$this->product->name}"
            : "Low Stock Warning: {$this->product->name}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.low-stock-alert',
            with: ['product' => $this->product, 'alertType' => $this->alertType],
        );
    }
}
