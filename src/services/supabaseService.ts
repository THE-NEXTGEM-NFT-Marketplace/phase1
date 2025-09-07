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
      console.error('Error updating user balance:', error.message);
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
      console.error('Error fetching markets:', error.message);
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
      console.error('Error fetching all markets:', error.message);
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
      console.error('Error proposing market:', error.message);
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
      console.error('Error fetching market:', error.message);
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
      console.error('Error fetching pending proposals:', error.message);
      return [];
    }
  }
}

// Trading Services
export class TradingService {
  static async initiateTrade(
    userId: string,
    marketId: string,
    outcome: 'YES' | 'NO',
    amount: number,
    shares: number,
    price: number
  ): Promise<Trade> {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        market_id: marketId,
        outcome,
        amount,
        shares,
        price,
        status: 'PENDING',
        signature: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to initiate trade: ${error.message}`);
    }

    return data;
  }

  static async updateTradeStatus(tradeId: string, status: 'COMPLETED' | 'FAILED', signature?: string): Promise<void> {
    const updateData: any = { status };
    if (signature) {
      updateData.signature = signature;
    }

    const { error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId);

    if (error) {
      throw new Error(`Failed to update trade status: ${error.message}`);
    }
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
      console.error("Error fetching user positions:", error.message);
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

  static async subscribeToTradeUpdates(tradeId: string, callback: (trade: Trade) => void): Promise<void> {
    const subscription = supabase
      .channel(`trade-${tradeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `id=eq.${tradeId}`,
        },
        (payload) => {
          callback(payload.new as Trade);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
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
