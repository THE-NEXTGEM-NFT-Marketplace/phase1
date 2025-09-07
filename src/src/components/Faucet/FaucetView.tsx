import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@suiet/wallet-kit";
import { createFaucetTx } from "@/services/suiLfgService";
import { useAppStore } from "@/stores/useAppStore";
import toast from "react-hot-toast";
import { ArrowLeft, Coins } from "lucide-react";

export function FaucetView() {
  const { connected, signAndExecuteTransactionBlock } = useWallet();
  const { setCurrentView, hasClaimedToday, setHasClaimedToday, usdcBalance, setUsdcBalance, lastClaimTimestamp, setLastClaimTimestamp } = useAppStore();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState("00:00:00");

  // Check if 24 hours have passed since last claim and reset if needed
  useEffect(() => {
    if (lastClaimTimestamp && hasClaimedToday) {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (now - lastClaimTimestamp >= twentyFourHours) {
        setHasClaimedToday(false);
        setLastClaimTimestamp(null);
      }
    }
  }, [lastClaimTimestamp, hasClaimedToday, setHasClaimedToday, setLastClaimTimestamp]);

  // Real-time countdown timer
  useEffect(() => {
    if (!lastClaimTimestamp || !hasClaimedToday) {
      setTimeUntilNextClaim("00:00:00");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeDiff = lastClaimTimestamp + 24 * 60 * 60 * 1000 - now;

      if (timeDiff <= 0) {
        setTimeUntilNextClaim("00:00:00");
        setHasClaimedToday(false);
        setLastClaimTimestamp(null);
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilNextClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [lastClaimTimestamp, hasClaimedToday, setHasClaimedToday, setLastClaimTimestamp]);

  // Check if user is eligible to claim
  const isEligibleToClaim = () => {
    if (!lastClaimTimestamp) return true;
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - lastClaimTimestamp >= twentyFourHours;
  };

  const handleClaim = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if eligible to claim (either never claimed or 24 hours have passed)
    if (hasClaimedToday && !isEligibleToClaim()) {
      toast.error("You have already claimed today. Come back tomorrow!");
      return;
    }

    setIsClaimLoading(true);
    const loadingToast = toast.loading("Claiming testnet USDC...");

    try {
      // 1. Create the transaction block using our service
      const txb = createFaucetTx();

      // 2. Use the wallet to sign and execute this block
      const result = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });

      // --- THE CORE CHANGE ---
      // Check for the existence of the transaction digest as a success signal
      if (result && (result.digest || (result as any).transactionDigest)) {
        const digest = (result as any).digest || (result as any).transactionDigest;
        console.log("Faucet claim successful with digest:", digest);

        // If successful, update our local state to start the 24h cooldown
        const now = Date.now();
        setUsdcBalance(usdcBalance + 1000);
        setHasClaimedToday(true);
        setLastClaimTimestamp(now);
        
        toast.dismiss(loadingToast);
        toast.success("Successfully claimed 1,000 USDC!");
      } else {
        // This will trigger if the user rejects or a genuine network/wallet error occurs
        throw new Error("Transaction was not confirmed.");
      }

    } catch (error: any) {
      console.error("Faucet error:", error);
      toast.dismiss(loadingToast);
      const message: string = typeof error?.message === 'string' ? error.message : '';
      const errorMessage = message.includes("User rejected") || message.includes("User Rejected")
        ? "Transaction rejected by user."
        : "Claim failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsClaimLoading(false);
    }
  };

  const handleBackToMarkets = () => {
    setCurrentView('markets');
  };



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
        <h1 className="text-2xl font-bold">Testnet Faucet</h1>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Get Testnet USDC</CardTitle>
          <CardDescription>
            Claim free testnet USDC to start trading on SuiLFG Preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You can claim <span className="font-semibold text-foreground">1,000 USDC</span> once per day
            </p>
            <p className="text-xs text-muted-foreground">
              Current balance: <span className="font-mono">{usdcBalance.toLocaleString()} USDC</span>
            </p>
          </div>

          {!connected ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Connect your Sui wallet to claim testnet USDC
              </p>
            </div>
          ) : (hasClaimedToday && !isEligibleToClaim()) ? (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ You've already claimed today! Come back tomorrow for more USDC.
              </p>
              {lastClaimTimestamp && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Next claim available in: {timeUntilNextClaim}
                </p>
              )}
            </div>
          ) : (
            <Button
              onClick={handleClaim}
              disabled={isClaimLoading}
              className="w-full"
              size="lg"
            >
              {isClaimLoading ? "Claiming..." : "Claim 1,000 USDC"}
            </Button>
          )}

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>⚠️ This is testnet USDC with no real value</p>
            <p>Use it to test the SuiLFG prediction markets</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}