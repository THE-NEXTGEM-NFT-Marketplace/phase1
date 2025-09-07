import React from 'react';
import { Search, DollarSign } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Input } from './ui/input';
import { SidebarTrigger } from './ui/sidebar';
import { useWallet } from "@suiet/wallet-kit";
const logoImage = '/lovable-uploads/6a5d0c5d-d795-4ad9-897d-574fe8f43a42.png';

export function Header() {
  const { 
    usdcBalance, 
    positions, 
    markets 
  } = useAppStore();
  const { connected } = useWallet();

  // Calculate portfolio value
  const portfolioValue = positions.reduce((total, position) => {
    const market = markets.find(m => m.id === position.marketId);
    if (!market) return total;
    
    const currentPrice = position.outcome === 'YES' ? market.yesPrice : market.noPrice;
    return total + (position.shares * currentPrice);
  }, 0);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Trigger and Search */}
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger />
          <img src={logoImage} alt="SuiLFG" className="h-8 w-8" />
          <div className="max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search markets..."
              className="pl-10 bg-background/50 border-border"
            />
          </div>
        </div>

        {/* Right side - Balance Display */}
        <div className="flex items-center gap-3">
          {connected ? (
            <>
              <div className="flex items-center gap-2 bg-background/80 border border-border rounded-lg px-3 py-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Portfolio:</span>
                <span className="font-semibold text-success">
                  ${portfolioValue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 border border-border rounded-lg px-3 py-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">USDC:</span>
                <span className="font-semibold text-primary">
                  ${usdcBalance.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-background/80 border border-border rounded-lg px-3 py-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Connect a wallet to view balances
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}