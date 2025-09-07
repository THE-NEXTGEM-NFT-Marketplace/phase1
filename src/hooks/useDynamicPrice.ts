import { useEffect, useState } from 'react';

// This hook takes the initial price of a YES share as an argument
export function useDynamicPrice(initialYesPrice: number) {
  const [yesPrice, setYesPrice] = useState<number>(initialYesPrice);

  useEffect(() => {
    // Start the interval when the component mounts
    const interval = setInterval(() => {
      // Update the price based on its current value to make it more "realistic"
      setYesPrice((prevYesPrice) => {
        const volatility = 0.005; // Base volatility
        const randomChange = (Math.random() - 0.5) * volatility;

        // Calculate and clamp the new price (0.01 to 0.99)
        let newPrice = prevYesPrice + randomChange;
        newPrice = Math.max(0.01, Math.min(0.99, newPrice));

        return newPrice;
      });
    }, 2500); // Update the price every 2.5 seconds

    // Cleanup function: stop the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return {
    yesPrice,
    noPrice: 1 - yesPrice,
  };
}








