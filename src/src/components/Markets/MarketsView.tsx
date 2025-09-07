import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore, MarketCategory } from '@/stores/useAppStore';
import { MarketCard } from './MarketCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categories: MarketCategory[] = ['All', 'Crypto', 'Politics', 'Sports', 'Community'];

export function MarketsView() {
  const { markets, selectedCategory, setSelectedCategory, setCurrentMarket, setCurrentView, isLoading } = useAppStore();
  
  console.log('MarketsView rendering, markets:', markets.length, 'selectedCategory:', selectedCategory);

  const filteredMarkets = selectedCategory === 'All' 
    ? markets.filter(market => market.status !== 'PROPOSED')
    : markets.filter(market => market.category === selectedCategory && market.status !== 'PROPOSED');

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

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as MarketCategory)}>
        <TabsList className="bg-secondary/50">
          {categories.map((category) => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
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
                <p className="text-muted-foreground">No markets found in this category.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}