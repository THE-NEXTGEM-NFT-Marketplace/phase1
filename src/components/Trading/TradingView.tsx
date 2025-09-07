import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleChart } from './SimpleChart';
import { TradingPanel } from './TradingPanel';
import { format } from 'date-fns';
import { RealtimeService } from '@/services/supabaseService';

export function TradingView() {
  const { currentMarket, setCurrentMarket, setCurrentView, markets, setCurrentMarket: updateCurrentMarket } = useAppStore();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Subscribe to real-time market updates
  useEffect(() => {
    if (!currentMarket || isSubscribed) return;

    const subscription = RealtimeService.subscribeToMarketUpdates((updatedMarket) => {
      if (updatedMarket.id === currentMarket.id) {
        // Update the current market with real-time data
        const updatedMarketData = {
          ...currentMarket,
          yesPrice: updatedMarket.yes_price,
          noPrice: updatedMarket.no_price,
          totalVolume: updatedMarket.total_volume,
          status: updatedMarket.status as any,
        };
        updateCurrentMarket(updatedMarketData);
      }
    });

    setIsSubscribed(true);

    return () => {
      subscription.unsubscribe();
      setIsSubscribed(false);
    };
  }, [currentMarket, isSubscribed, updateCurrentMarket]);

  if (!currentMarket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No market selected</p>
      </div>
    );
  }

  const handleBackToMarkets = () => {
    setCurrentMarket(null);
    setCurrentView('markets');
  };

  const handleGovernanceClick = () => {
    setCurrentView('governance');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleBackToMarkets}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Markets
        </Button>
        <span className="text-muted-foreground">{'>'}</span>
        <span className="text-muted-foreground">{currentMarket.category}</span>
        <span className="text-muted-foreground">{'>'}</span>
        <span className="font-medium">{currentMarket.title}</span>
      </div>

      {/* Market Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">{currentMarket.title}</h1>
          <p className="text-muted-foreground mb-4">{currentMarket.description}</p>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {currentMarket.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Resolution: {format(currentMarket.resolutionDate, 'MMM d, yyyy')}
            </span>
            <span className="text-sm text-muted-foreground">
              Volume: ${(currentMarket.totalVolume / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <SimpleChart market={currentMarket} />
        </div>
        <div>
          <TradingPanel market={currentMarket} />
        </div>
      </div>

      {/* Market Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Market Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Volume</p>
            <p className="text-xl font-bold">${currentMarket.totalVolume.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Resolution Date</p>
            <p className="text-xl font-bold">
              {format(currentMarket.resolutionDate, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Market Status</p>
            <p className="text-xl font-bold">{currentMarket.status}</p>
          </div>
        </div>

        {currentMarket.status === 'RESOLVING' && (
          <div className="flex items-center gap-3 p-4 bg-status-resolving/10 border border-status-resolving/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-status-resolving" />
            <div className="flex-1">
              <p className="font-medium text-status-resolving">Market is in dispute resolution</p>
              <p className="text-sm text-muted-foreground">
                This market outcome is being disputed. You can participate in governance.
              </p>
            </div>
            <Button variant="outline" onClick={handleGovernanceClick}>
              View Dispute
            </Button>
          </div>
        )}

        {currentMarket.status === 'OPEN' && (
          <Button variant="outline" onClick={handleGovernanceClick}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Propose/Dispute Outcome
          </Button>
        )}
      </div>
    </div>
  );
}