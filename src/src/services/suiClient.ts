import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// Create Sui client for testnet
export const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});