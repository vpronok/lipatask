<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Setting;

class RestoreMissingBonuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:restore-bonuses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scans active users and retroactively credits missing signup and referral bonuses.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting database scan for missing bonuses...');

        // Fetch current bonus rates
        $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
        $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;

        if ($signupBonus == 0 && $refBonus == 0) {
            $this->error('Both Signup and Referral bonuses are currently set to 0. Please update your Admin Settings first.');
            return;
        }

        // Get all users who have successfully activated their accounts
        $activeUsers = User::where('is_active', true)->get();
        $restoredSignupCount = 0;
        $restoredReferralCount = 0;

        foreach ($activeUsers as $user) {
            
            // 1. RESTORE MISSING SIGNUP BONUSES
            if ($signupBonus > 0 && !$user->transactions()->where('description', 'Welcome Signup Bonus')->exists()) {
                $user->transactions()->create([
                    'amount' => $signupBonus,
                    'type' => 'bonus',
                    'wallet' => 'main',
                    'status' => 'completed',
                    'description' => 'Welcome Signup Bonus'
                ]);
                $this->line("<fg=green>Restored Signup Bonus (Ksh {$signupBonus}) for: @{$user->username}</>");
                $restoredSignupCount++;
            }

            // 2. RESTORE MISSING REFERRAL COMMISSIONS TO THE UPLINE
            if ($user->referred_by && $refBonus > 0) {
                $referrer = User::find($user->referred_by);
                
                if ($referrer) {
                    $expectedDescription = 'Activation commission for ' . $user->username;

                    // Check if the referrer already got paid for this specific user
                    if (!$referrer->transactions()->where('description', $expectedDescription)->exists()) {
                        
                        $referrer->transactions()->create([
                            'amount' => $refBonus,
                            'type' => 'commission',
                            'wallet' => 'team',
                            'status' => 'completed',
                            'description' => $expectedDescription
                        ]);
                        
                        $this->line("<fg=blue>Restored Referral Bonus (Ksh {$refBonus}) to @{$referrer->username} for inviting @{$user->username}</>");
                        $restoredReferralCount++;
                    }
                }
            }
        }

        $this->newLine();
        $this->info("Scan Complete!");
        $this->info("Restored {$restoredSignupCount} missing Signup Bonuses.");
        $this->info("Restored {$restoredReferralCount} missing Referral Commissions.");
    }
}