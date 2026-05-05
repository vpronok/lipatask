<?php
namespace App\Mail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReferralEarned extends Mailable
{
    use Queueable, SerializesModels;
    public $referrer;
    public $newMemberName;
    public $commission;
    public $newBalance;

    public function __construct($referrer, $newMemberName, $commission, $newBalance) {
        $this->referrer = $referrer;
        $this->newMemberName = $newMemberName;
        $this->commission = $commission;
        $this->newBalance = $newBalance;
    }

    public function build() {
        return $this->subject("You've earned a new Referral Bonus! 💰")
                    ->view('emails.referral');
    }
}


// <?php

// namespace App\Mail;

// use Illuminate\Bus\Queueable;
// use Illuminate\Contracts\Queue\ShouldQueue;
// use Illuminate\Mail\Mailable;
// use Illuminate\Mail\Mailables\Attachment;
// use Illuminate\Mail\Mailables\Content;
// use Illuminate\Mail\Mailables\Envelope;
// use Illuminate\Queue\SerializesModels;

// class ReferralEarned extends Mailable
// {
//     use Queueable, SerializesModels;

//     /**
//      * Create a new message instance.
//      */
//     public function __construct()
//     {
//         //
//     }

//     /**
//      * Get the message envelope.
//      */
//     public function envelope(): Envelope
//     {
//         return new Envelope(
//             subject: 'Referral Earned',
//         );
//     }

//     /**
//      * Get the message content definition.
//      */
//     public function content(): Content
//     {
//         return new Content(
//             view: 'view.name',
//         );
//     }

//     /**
//      * Get the attachments for the message.
//      *
//      * @return array<int, Attachment>
//      */
//     public function attachments(): array
//     {
//         return [];
//     }
// }
