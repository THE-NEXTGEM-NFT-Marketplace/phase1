import React from 'react';
import { Market } from '../../stores/useAppStore';

interface SimpleChartProps {
  market: Market;
}

export function SimpleChart({ market }: SimpleChartProps) {
  const { priceHistory, yesPrice } = market;
  
  // Calculate SVG path for the line chart
  const points = priceHistory.map((point, index) => {
    const x = (index / (priceHistory.length - 1)) * 300;
    const y = 80 - (point.value * 80); // Invert Y axis and scale to height
    return `${x},${y}`;
  }).join(' ');

  const currentTrend = priceHistory.length > 1 
    ? priceHistory[priceHistory.length - 1].value > priceHistory[priceHistory.length - 2].value
    : true;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">YES Price History</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Current:</span>
          <span className={`font-bold ${currentTrend ? 'text-yes' : 'text-no'}`}>
            ${yesPrice.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="relative bg-chart-grid/20 rounded-lg p-4">
        <svg width="100%" height="200" viewBox="0 0 300 100" className="w-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 20" fill="none" stroke="hsl(var(--chart-grid))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <polyline
            fill="none"
            stroke="hsl(var(--chart-line))"
            strokeWidth="2"
            points={points}
            className="drop-shadow-sm"
          />
          
          {/* Area under the curve */}
          <polygon
            fill="url(#gradient)"
            points={`${points} 300,80 0,80`}
            opacity="0.2"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--chart-line))" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Current price indicator */}
          {priceHistory.length > 0 && (
            <circle
              cx={((priceHistory.length - 1) / (priceHistory.length - 1)) * 300}
              cy={80 - (yesPrice * 80)}
              r="3"
              fill="hsl(var(--chart-line))"
              className="animate-pulse"
            />
          )}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
          <span>$1.00</span>
          <span>$0.50</span>
          <span>$0.00</span>
        </div>
      </div>
    </div>
  );
}