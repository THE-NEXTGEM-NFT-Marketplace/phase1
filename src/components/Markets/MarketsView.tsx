import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { MarketCard } from './MarketCard';
import { Button } from '@/components/ui/button';

export function MarketsView() {
  const { markets, setCurrentMarket, setCurrentView, isLoading } = useAppStore();
  
  console.log('MarketsView rendering, markets:', markets.length);

  const filteredMarkets = markets.filter(market => market.status !== 'PROPOSED');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
            <p className="text-muted-foreground">
              Loading markets...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
          <p className="text-muted-foreground">
            Trade on the outcomes of future events with real money
          </p>
        </div>
        <Button 
          onClick={() => setCurrentView('propose-market')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Propose Market
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarkets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            onClick={() => setCurrentMarket(market)}
          />
        ))}
      </div>
      
      {filteredMarkets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No markets found.</p>
        </div>
      )}
    </div>
  );
}