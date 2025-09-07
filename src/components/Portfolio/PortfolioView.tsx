import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PortfolioView() {
  const { positions, markets, usdcBalance, setCurrentView, setCurrentMarket } = useAppStore();

  // Add null check for positions to prevent crashes
  const safePositions = positions || [];

  const totalPortfolioValue = safePositions.reduce((total, position) => {
    const market = markets.find(m => m.id === position.marketId);
    if (!market) return total;
    
    // Calculate value for both YES and NO shares
    const yesValue = position.yesShares * market.yesPrice;
    const noValue = position.noShares * market.noPrice;
    return total + yesValue + noValue;
  }, 0);

  const totalInvested = safePositions.reduce((total, position) => {
    // For now, we'll use the current market prices as a proxy for average price
    // In a real implementation, you'd want to track the actual purchase prices
    const market = markets.find(m => m.id === position.marketId);
    if (!market) return total;
    
    const yesValue = position.yesShares * market.yesPrice;
    const noValue = position.noShares * market.noPrice;
    return total + yesValue + noValue;
  }, 0);

  const unrealizedPnL = totalPortfolioValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground">
          Track your prediction market positions and performance
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPortfolioValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              USDC Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${usdcBalance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unrealized P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              unrealizedPnL >= 0 ? 'text-yes' : 'text-no'
            }`}>
              {unrealizedPnL >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              ${Math.abs(unrealizedPnL).toFixed(2)}
              <span className="text-sm">
                ({unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {!safePositions || safePositions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {safePositions ? 'No open positions' : 'Loading positions...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {safePositions 
                  ? 'Start trading in the markets to see your positions here'
                  : 'Please wait while we load your portfolio data'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Market</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">YES Shares</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">NO Shares</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">YES Price</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">NO Price</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {safePositions.map((position, index) => {
                    const market = markets.find(m => m.id === position.marketId);
                    if (!market) return null;

                    const yesValue = position.yesShares * market.yesPrice;
                    const noValue = position.noShares * market.noPrice;
                    const totalValue = yesValue + noValue;

                    return (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setCurrentMarket(market);
                        setCurrentView('trading');
                      }}>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{market.title}</p>
                            <p className="text-sm text-muted-foreground">Resolves: {market.resolutionDate.toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {position.yesShares.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {position.noShares.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-yes">${market.yesPrice.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-no">${market.noPrice.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${totalValue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}