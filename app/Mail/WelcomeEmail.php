<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS', 'notifications@chatwazungu.com'), env('MAIL_FROM_NAME', 'Chatwazungu')),
            replyTo:[
                new Address(env('MAIL_FROM_ADDRESS', 'notifications@chatwazungu.com'), env('MAIL_FROM_NAME', 'Chatwazungu')),
            ],
            subject: 'Welcome to Chatwazungu! 🚀',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
        );
    }
}