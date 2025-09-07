import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { Market } from '../../stores/useAppStore';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface MarketCardProps {
  market: Market;
  onClick: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const getStatusVariant = (status: Market['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-status-open/10 text-status-open border-status-open/20';
      case 'RESOLVING':
        return 'bg-status-resolving/10 text-status-resolving border-status-resolving/20';
      case 'RESOLVED':
        return 'bg-status-resolved/10 text-status-resolved border-status-resolved/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-elevated hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getStatusVariant(market.status))}
          >
            {market.status}
          </Badge>
          <TrendingUp className="w-4 h-4 text-chart-line group-hover:text-primary transition-colors" />
        </div>
        
        <h3 className="font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
          {market.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {market.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">YES</p>
              <p className="font-bold text-yes">${market.yesPrice.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">NO</p>
              <p className="font-bold text-no">${market.noPrice.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(market.resolutionDate, 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground">
              Vol: ${(market.totalVolume / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}