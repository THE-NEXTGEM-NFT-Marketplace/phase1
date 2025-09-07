import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/useAppStore';
import { Copy, Users, ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReferralsView() {
  const { 
    user, 
    referralStats, 
    setCurrentView, 
    loadUserData,
    walletAddress 
  } = useAppStore();
  const [referralLink, setReferralLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.referral_code) {
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/?ref=${user.referral_code}`);
    }
  }, [user]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on SuiLFG',
          text: 'Check out this prediction market platform!',
          url: referralLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRefreshStats = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      await loadUserData(walletAddress);
      toast.success('Stats refreshed!');
    } catch (error) {
      toast.error('Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMarkets = () => {
    setCurrentView('markets');
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Referrals</h1>
          <p className="text-muted-foreground">Please connect your wallet to view referral information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToMarkets}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Referrals</h1>
      </div>

      <div className="space-y-6">
        {/* Referral Stats Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Your Referral Stats</CardTitle>
            <CardDescription>
              Track how many users you've referred to SuiLFG
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {referralStats}
            </div>
            <p className="text-muted-foreground mb-4">
              {referralStats === 1 ? 'user referred' : 'users referred'}
            </p>
            <Button 
              onClick={handleRefreshStats}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Refreshing...' : 'Refresh Stats'}
            </Button>
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link to invite others to join SuiLFG
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono break-all">
                {referralLink}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink}
                className="flex-1"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                onClick={handleShareLink}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works Card */}
        <Card>
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Share Your Link</p>
                <p className="text-sm text-muted-foreground">
                  Copy and share your unique referral link with friends
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">They Join</p>
                <p className="text-sm text-muted-foreground">
                  When someone clicks your link and connects their wallet, they become your referral
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Track Your Impact</p>
                <p className="text-sm text-muted-foreground">
                  Monitor how many users you've brought to the platform
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

