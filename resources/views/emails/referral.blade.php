<div style="background-color: #0d0415; color: white; padding: 40px; font-family: sans-serif; text-align: center; border-radius: 10px;">
    <h1 style="color: #10b981;">New Referral Bonus! 🎉</h1>
    <p style="color: #cbd5e1; font-size: 16px;">Hello <strong>{{ $referrer->username }}</strong>,</p>
    <p style="color: #cbd5e1;"><strong>{{ $newMemberName }}</strong> just joined and activated their account using your link!</p>
    <div style="background-color: #1a0e29; border: 1px solid #d904f9; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 300px;">
        <p style="margin: 0; color: #94a3b8;">Commission Earned:</p>
        <h2 style="margin: 5px 0; color: #10b981;">+ KSh {{ $commission }}</h2>
        <hr style="border-color: #334155;">
        <p style="margin: 0; color: #94a3b8;">New Team Balance:</p>
        <h2 style="margin: 5px 0; color: #d904f9;">KSh {{ $newBalance }}</h2>
    </div>
</div>