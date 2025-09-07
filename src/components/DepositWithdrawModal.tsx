import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAppStore } from '../stores/useAppStore';

import { useToast } from '../hooks/use-toast';

interface DepositWithdrawModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialTab?: 'deposit' | 'withdraw';
}

export function DepositWithdrawModal({ open, onOpenChange, initialTab = 'deposit' }: DepositWithdrawModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { deposit, withdraw, usdcBalance, isAnyWalletConnected } = useAppStore();
  const { toast } = useToast();

  const handleDeposit = () => {
    if (!isAnyWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to deposit funds",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      deposit(amount);
      setDepositAmount('');
      toast({
        title: "Deposit Successful",
        description: `Deposited $${amount.toFixed(2)} USDC to your account`,
      });
      onOpenChange?.(false);
    }
  };

  const handleWithdraw = () => {
    if (!isAnyWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to withdraw funds",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= usdcBalance) {
      withdraw(amount);
      setWithdrawAmount('');
      toast({
        title: "Withdrawal Successful",
        description: `Withdrew $${amount.toFixed(2)} USDC from your account`,
      });
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Funds</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={initialTab} key={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USDC)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleDeposit}
              variant="success"
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || !isAnyWalletConnected}
            >
              {isAnyWalletConnected ? 'Deposit USDC' : 'Connect Wallet First'}
            </Button>
          </TabsContent>
          
          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={usdcBalance}
              />
              <p className="text-sm text-muted-foreground">
                Available: ${usdcBalance.toFixed(2)} USDC
              </p>
            </div>
            <Button
              onClick={handleWithdraw}
              variant="outline"
              disabled={
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                parseFloat(withdrawAmount) > usdcBalance ||
                !isAnyWalletConnected
              }
            >
              {isAnyWalletConnected ? 'Withdraw USDC' : 'Connect Wallet First'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}