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
}

// Market Services
export class MarketService {
  static async fetchMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'TRADING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching markets:', error);
      return [];
    }

    return data || [];
  }

  static async fetchAllMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all markets:', error);
      return [];
    }

    return data || [];
  }

  static async proposeMarket(
    title: string,
    description: string,
    category: string,
    resolutionDate: string,
    proposedBy: string
  ): Promise<ProposedMarket> {
    const { data, error } = await supabase
      .from('proposed_markets')
      .insert({
        title,
        description,
        category,
        resolution_date: resolutionDate,
        proposed_by: proposedBy,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to propose market: ${error.message}`);
    }

    return data;
  }

  static async getMarketById(marketId: string): Promise<Market | null> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (error) {
      console.error('Error fetching market:', error);
      return null;
    }

    return data;
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
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }

    return data || [];
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
