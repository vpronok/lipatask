<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReferralEarned extends Mailable
{
    use Queueable, SerializesModels;

    public $referrer;
    public $newMemberName;
    public $commission;
    public $newBalance;

    public function __construct($referrer, $newMemberName, $commission, $newBalance)
    {
        $this->referrer = $referrer;
        $this->newMemberName = $newMemberName;
        $this->commission = $commission;
        $this->newBalance = $newBalance;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS', 'notifications@chatwazungu.com'), env('MAIL_FROM_NAME', 'Chatwazungu')),
            replyTo:[
                new Address(env('MAIL_FROM_ADDRESS', 'notifications@chatwazungu.com'), env('MAIL_FROM_NAME', 'Chatwazungu')),
            ],
            subject: "You've earned a new Referral Bonus! 💰",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.referral',
        );
    }
}