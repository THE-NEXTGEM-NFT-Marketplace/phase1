import { supabase, User, Market, ProposedMarket, Trade, Position, generateReferralCode } from '@/lib/supabaseClient';

// User Management Services
export class UserService {
  static async getOrCreateUser(walletAddress: string, referrerCode: string | null = null): Promise<User> {
    try {
      // First, check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingUser && !fetchError) {
        return existingUser;
      }

      // If user doesn't exist, create a new one
      let referredBy: string | null = null;
      
      // If referrer code is provided, find the referrer's ID
      if (referrerCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referrerCode)
          .single();
        
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      // Generate unique referral code
      let referralCode = generateReferralCode();
      let isUnique = false;
      
      // Ensure referral code is unique
      while (!isUnique) {
        const { data: existingCode } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        
        if (!existingCode) {
          isUnique = true;
        } else {
          referralCode = generateReferralCode();
        }
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          referral_code: referralCode,
          referred_by: referredBy,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      return newUser;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  static async getReferralStats(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', userId);

    if (error) {
      console.error('Error fetching referral stats:', error);
      return 0;
    }

    return count || 0;
  }

  static async updateUserBalance(userId: string, newBalance: number): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ offchain_usdc_balance: newBalance })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user balance:', (error as any).message);
      return null;
    }
  }
}

// Market Services
export class MarketService {
  static async fetchMarkets(): Promise<Market[]> {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'TRADING')
        .order('resolution_date', { ascending: true }); // Order by resolution date instead

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching markets:', (error as any).message);
      return [];
    }
  }

  static async fetchAllMarkets(): Promise<Market[]> {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('resolution_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all markets:', (error as any).message);
      return [];
    }
  }

  static async proposeMarket(
    title: string,
    description: string,
    proposerId: string
  ): Promise<ProposedMarket | null> {
    try {
      const { data, error } = await supabase
        .from('proposed_markets')
        .insert({
          title,
          description,
          proposer_id: proposerId,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error proposing market:', (error as any).message);
      return null;
    }
  }

  static async getMarketById(marketId: string): Promise<Market | null> {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching market:', (error as any).message);
      return null;
    }
  }

  static async fetchPendingProposals(): Promise<ProposedMarket[]> {
    try {
      const { data, error } = await supabase
        .from('proposed_markets')
        .select(`
          *,
          users (
            wallet_address
          )
        `) // Also fetch the proposer's wallet address!
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pending proposals:', (error as any).message);
      return [];
    }
  }
}

// Trading Services
export class TradingService {
  // Buy shares: updates user balance, positions, and market totals
  static async buy(
    userId: string,
    marketId: string,
    outcome: 'YES' | 'NO',
    amount: number
  ): Promise<{ shares: number; price: number } | null> {
    // Fetch user and market
    const { data: user } = await supabase.from('users').select('offchain_usdc_balance').eq('id', userId).single();
    const { data: market } = await supabase.from('markets').select('*').eq('id', marketId).single();
    if (!user || !market) return null;

    const totalYes = Number(market.total_yes_shares || 0);
    const totalNo = Number(market.total_no_shares || 0);
    const total = totalYes + totalNo;
    const yesPrice = total > 0 ? totalYes / total : 0.5;
    const noPrice = total > 0 ? totalNo / total : 0.5;
    const price = outcome === 'YES' ? yesPrice : noPrice;
    const shares = amount / price;

    // Update user balance
    const newBalance = Number(user.offchain_usdc_balance) - amount;
    await supabase.from('users').update({ offchain_usdc_balance: newBalance }).eq('id', userId);

    // Upsert position
    const { data: existingPosition } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single();

    let nextYes = existingPosition?.yes_shares ? Number(existingPosition.yes_shares) : 0;
    let nextNo = existingPosition?.no_shares ? Number(existingPosition.no_shares) : 0;
    if (outcome === 'YES') nextYes += shares; else nextNo += shares;

    await supabase
      .from('positions')
      .upsert(
        [{ user_id: userId, market_id: marketId, yes_shares: nextYes, no_shares: nextNo }],
        { onConflict: 'user_id,market_id' }
      );

    // Update market totals
    const nextTotalYes = outcome === 'YES' ? totalYes + shares : totalYes;
    const nextTotalNo = outcome === 'NO' ? totalNo + shares : totalNo;
    await supabase
      .from('markets')
      .update({ total_yes_shares: nextTotalYes, total_no_shares: nextTotalNo })
      .eq('id', marketId);

    return { shares, price };
  }

  // Sell shares: updates user balance, positions, and market totals
  static async sell(
    userId: string,
    marketId: string,
    outcome: 'YES' | 'NO',
    sharesToSell: number
  ): Promise<{ proceeds: number; price: number } | null> {
    const { data: user } = await supabase.from('users').select('offchain_usdc_balance').eq('id', userId).single();
    const { data: market } = await supabase.from('markets').select('*').eq('id', marketId).single();
    if (!user || !market) return null;

    const totalYes = Number(market.total_yes_shares || 0);
    const totalNo = Number(market.total_no_shares || 0);
    const total = totalYes + totalNo;
    const yesPrice = total > 0 ? totalYes / total : 0.5;
    const noPrice = total > 0 ? totalNo / total : 0.5;
    const price = outcome === 'YES' ? yesPrice : noPrice;

    // Get current position
    const { data: existingPosition } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single();
    if (!existingPosition) return null;

    const currentYes = Number(existingPosition.yes_shares || 0);
    const currentNo = Number(existingPosition.no_shares || 0);
    const available = outcome === 'YES' ? currentYes : currentNo;
    if (sharesToSell > available) return null;

    // Calculate proceeds and new balance
    const proceeds = sharesToSell * price;
    const newBalance = Number(user.offchain_usdc_balance) + proceeds;
    await supabase.from('users').update({ offchain_usdc_balance: newBalance }).eq('id', userId);

    // Update position
    const nextYes = outcome === 'YES' ? currentYes - sharesToSell : currentYes;
    const nextNo = outcome === 'NO' ? currentNo - sharesToSell : currentNo;
    await supabase
      .from('positions')
      .update({ yes_shares: nextYes, no_shares: nextNo })
      .eq('user_id', userId)
      .eq('market_id', marketId);

    // Update market totals
    const nextTotalYes = outcome === 'YES' ? totalYes - sharesToSell : totalYes;
    const nextTotalNo = outcome === 'NO' ? totalNo - sharesToSell : totalNo;
    await supabase
      .from('markets')
      .update({ total_yes_shares: nextTotalYes, total_no_shares: nextTotalNo })
      .eq('id', marketId);

    return { proceeds, price };
  }

  static async getUserPositions(userId: string): Promise<Position[]> {
    // Add a check to prevent running the query with an invalid ID
    if (!userId) {
      console.warn("getUserPositions called without a userId.");
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          markets (
            title,
            resolution_date
          )
        `) // Join with the markets table to get market titles!
        .eq('user_id', userId);

      if (error) {
        // Throw the error to be caught by the caller
        throw error;
      }

      return data || []; // Return data or an empty array if data is null

    } catch (error) {
      console.error("Error fetching user positions:", (error as any).message);
      return []; // Always return an empty array on failure
    }
  }

  static async getTradeHistory(userId: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }

    return data || [];
  }
}

// Real-time subscription helpers
export class RealtimeService {
  static subscribeToMarketUpdates(callback: (market: Market) => void) {
    return supabase
      .channel('market-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets',
        },
        (payload) => {
          callback(payload.new as Market);
        }
      )
      .subscribe();
  }

  static subscribeToTradeUpdates(callback: (trade: Trade) => void) {
    return supabase
      .channel('trade-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        (payload) => {
          callback(payload.new as Trade);
        }
      )
      .subscribe();
  }
}
