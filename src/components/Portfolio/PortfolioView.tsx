import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PortfolioView() {
  const { positions, markets, usdcBalance, setCurrentView, setCurrentMarket } = useAppStore();

  const totalPortfolioValue = positions.reduce((total, position) => {
    const market = markets.find(m => m.id === position.marketId);
    if (!market) return total;
    
    const currentPrice = position.outcome === 'YES' ? market.yesPrice : market.noPrice;
    return total + (position.shares * currentPrice);
  }, 0);

  const totalInvested = positions.reduce((total, position) => {
    return total + (position.shares * position.avgPrice);
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
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No open positions</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start trading in the markets to see your positions here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Market</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Outcome</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Shares</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Avg Price</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Current Price</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Current Value</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, index) => {
                    const market = markets.find(m => m.id === position.marketId);
                    if (!market) return null;

                    const currentPrice = position.outcome === 'YES' ? market.yesPrice : market.noPrice;
                    const currentValue = position.shares * currentPrice;
                    const invested = position.shares * position.avgPrice;
                    const pnl = currentValue - invested;
                    const pnlPercent = (pnl / invested) * 100;

                    return (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setCurrentMarket(market);
                        setCurrentView('trading');
                      }}>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium hover:text-primary transition-colors">{market.title}</p>
                            <p className="text-sm text-muted-foreground">{market.category}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge 
                            variant="outline"
                            className={position.outcome === 'YES' 
                              ? 'text-yes border-yes/20' 
                              : 'text-no border-no/20'
                            }
                          >
                            {position.outcome}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {position.shares.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          ${position.avgPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          ${currentPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${currentValue.toFixed(2)}
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${
                          pnl >= 0 ? 'text-yes' : 'text-no'
                        }`}>
                          ${Math.abs(pnl).toFixed(2)}
                          <div className="text-xs">
                            ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                          </div>
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