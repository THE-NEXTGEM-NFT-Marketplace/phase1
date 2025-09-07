import { TransactionBlock } from '@mysten/sui.js/transactions';
import { PACKAGE_ID, FAUCET_POOL_ID, TREASURY_CAP_ID, CLOCK_ID, USDC_COIN_TYPE } from '../constants';
import { suiClient } from './suiClient';

// --- FAUCET ---
/**
 * Creates the transaction block for claiming from the faucet.
 * @returns {TransactionBlock} - The constructed transaction block.
 */
export const createFaucetTx = () => {
  const txb = new TransactionBlock();

  // Define the target for our smart contract call
  const target = `${PACKAGE_ID}::suilfg_testnet_v1::faucet`;

  // The new `faucet` function signature is:
  // faucet(pool: &mut FaucetPool, _clock: &Clock, ctx: &mut TxContext)
  txb.moveCall({
    target: target,
    arguments: [
      // Arg 1: The FaucetPool object.
      txb.object(FAUCET_POOL_ID),
      // Arg 2: The special Clock object (0x6).
      txb.object("0x6"),
    ],
  });

  return txb;
};

// --- "PAYMENT" ACTION ---
export function createPaymentTx(signAndExecuteTransactionBlock: any, userUsdcCoin: any) {
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${PACKAGE_ID}::suilfg_testnet_v1::do_action_with_payment`,
    arguments: [txb.object(TREASURY_CAP_ID), txb.object(userUsdcCoin.coinObjectId)],
  });
  return signAndExecuteTransactionBlock({ transactionBlock: txb });
}

// --- "FREE" ACTION ---
export function createFreeTx(signAndExecuteTransactionBlock: any) {
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${PACKAGE_ID}::suilfg_testnet_v1::do_action_free`,
    arguments: [],
  });
  return signAndExecuteTransactionBlock({ transactionBlock: txb });
}

// Renamed for clarity: gas-only, no real payment
export function createGasOnlyTx(signAndExecuteTransactionBlock: any) {
  return createFreeTx(signAndExecuteTransactionBlock);
}

// --- GET USER USDC COINS ---
export async function getUserUsdcCoins(walletAddress: string) {
  try {
    const coins = await suiClient.getCoins({
      owner: walletAddress,
      coinType: USDC_COIN_TYPE,
    });
    return coins.data;
  } catch (error) {
    console.error('Error fetching USDC coins:', error);
    return [];
  }
}