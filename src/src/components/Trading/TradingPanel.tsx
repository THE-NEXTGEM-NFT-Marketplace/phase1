import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Market, Outcome, useAppStore } from '@/stores/useAppStore';
import { useWallet } from "@suiet/wallet-kit";
import { createGasOnlyTx } from "@/services/suiLfgService";
import { useToast } from '@/hooks/use-toast';
import toast from "react-hot-toast";
import { cn } from '@/lib/utils';
import { TradingService } from '@/services/supabaseService';

interface TradingPanelProps {
  market: Market;
}

export function TradingPanel({ market }: TradingPanelProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>('YES');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellShares, setSellShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tradeStatus, setTradeStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const { 
    buyShares, 
    sellShares: sellSharesAction, 
    positions, 
    usdcBalance, 
    lastClaimTimestamp, 
    setCurrentView,
    user 
  } = useAppStore();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const canTrade = !!lastClaimTimestamp && (now - lastClaimTimestamp < oneDay);

  const { connected, signAndExecuteTransactionBlock } = useWallet();

  const currentPrice = selectedOutcome === 'YES' ? market.yesPrice : market.noPrice;
  const sharesReceived = buyAmount ? (parseFloat(buyAmount) / currentPrice) : 0;

  const userPosition = positions.find(p => p.marketId === market.id && p.outcome === selectedOutcome);
  const availableShares = userPosition?.shares || 0;

  const handleBuy = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!user) {
      toast.error("User not found. Please refresh and try again.");
      return;
    }

    const amount = parseFloat(buyAmount);
    if (amount <= 0 || amount > usdcBalance) {
      toast.error("Invalid amount");
      return;
    }

    setIsLoading(true);
    setTradeStatus('pending');
    const loadingToast = toast.loading("Processing trade...");

    try {
      // Use the Supabase-integrated buyShares method
      await buyShares(market.id, selectedOutcome, amount);
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully bought ${sharesReceived.toFixed(2)} ${selectedOutcome} shares!`);
      setTradeStatus('completed');
      
      // Clear the input
      setBuyAmount('');
      
      // Reset status after 3 seconds
      setTimeout(() => setTradeStatus('idle'), 3000);
      
    } catch (error: any) {
      console.error('Buy error:', error);
      toast.dismiss(loadingToast);
      toast.error("Trade failed. Please try again.");
      setTradeStatus('failed');
      
      // Reset status after 3 seconds
      setTimeout(() => setTradeStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!user) {
      toast.error("User not found. Please refresh and try again.");
      return;
    }

    const shares = parseFloat(sellShares);
    if (shares <= 0 || shares > availableShares) {
      toast.error("Invalid number of shares");
      return;
    }

    setIsLoading(true);
    setTradeStatus('pending');
    const loadingToast = toast.loading("Processing trade...");

    try {
      // Use the Supabase-integrated sellShares method
      await sellSharesAction(market.id, selectedOutcome, shares);
      
      const saleAmount = shares * currentPrice;
      toast.dismiss(loadingToast);
      toast.success(`Successfully sold ${shares.toFixed(2)} ${selectedOutcome} shares for $${saleAmount.toFixed(2)}`);
      setTradeStatus('completed');
      
      // Clear the input
      setSellShares('');
      
      // Reset status after 3 seconds
      setTimeout(() => setTradeStatus('idle'), 3000);
      
    } catch (error: any) {
      console.error('Sell error:', error);
      toast.dismiss(loadingToast);
      toast.error("Trade failed. Please try again.");
      setTradeStatus('failed');
      
      // Reset status after 3 seconds
      setTimeout(() => setTradeStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canTrade) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Trading Locked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You must claim your daily USDC from the Faucet before you can trade.
          </p>
          <Button onClick={() => setCurrentView('faucet')}>Go to Faucet</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm md:w-80">
      <CardHeader>
        <CardTitle>Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            {/* Outcome Selection */}
            <div className="space-y-2">
              <Label>Outcome</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedOutcome === 'YES' ? 'yes' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOutcome('YES')}
                  className="flex-1"
                >
                  YES
                </Button>
                <Button
                  variant={selectedOutcome === 'NO' ? 'no' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOutcome('NO')}
                  className="flex-1"
                >
                  NO
                </Button>
              </div>
            </div>

            {/* Price Display */}
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className={cn(
                  "font-bold",
                  selectedOutcome === 'YES' ? 'text-yes' : 'text-no'
                )}>
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="buy-amount">Amount (USDC)</Label>
              <Input
                id="buy-amount"
                type="number"
                placeholder="0.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                max={usdcBalance}
              />
              <p className="text-xs text-muted-foreground">
                Available: ${usdcBalance.toFixed(2)} USDC
              </p>
            </div>

            {/* Shares Calculation */}
            {buyAmount && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Shares you'll receive:</span>
                  <span className="font-semibold">~{sharesReceived.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleBuy}
              variant="default"
              disabled={
                !buyAmount || 
                parseFloat(buyAmount) <= 0 || 
                parseFloat(buyAmount) > usdcBalance ||
                isLoading
              }
            >
              {isLoading ? "Processing..." : "Buy Shares"}
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            {/* Outcome Selection for Selling */}
            <div className="space-y-2">
              <Label>Sell Outcome</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedOutcome === 'YES' ? 'yes' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOutcome('YES')}
                  className="flex-1"
                >
                  YES
                </Button>
                <Button
                  variant={selectedOutcome === 'NO' ? 'no' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOutcome('NO')}
                  className="flex-1"
                >
                  NO
                </Button>
              </div>
            </div>

            {/* Available Shares */}
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available shares:</span>
                <span className="font-semibold">{availableShares.toFixed(2)}</span>
              </div>
            </div>

            {/* Shares to Sell Input */}
            <div className="space-y-2">
              <Label htmlFor="sell-shares">Shares to Sell</Label>
              <Input
                id="sell-shares"
                type="number"
                placeholder="0.00"
                value={sellShares}
                onChange={(e) => setSellShares(e.target.value)}
                max={availableShares}
              />
            </div>

            {/* Sale Amount Calculation */}
            {sellShares && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">You'll receive:</span>
                  <span className="font-semibold">
                    ~${(parseFloat(sellShares) * currentPrice).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSell}
              variant="outline"
              disabled={
                !sellShares || 
                parseFloat(sellShares) <= 0 || 
                parseFloat(sellShares) > availableShares ||
                availableShares === 0 ||
                isLoading
              }
            >
              {isLoading ? "Processing..." : "Sell Shares"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}