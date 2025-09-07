import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://errwvmiyedsehjrhgsoi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnd2bWl5ZWRzZWhqcmhnc29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjAzMzksImV4cCI6MjA3MjE5NjMzOX0.VOAYawDjt3-RgmEkOFpD8Pk2YxfD5iYdGfgZjchslCg';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll handle auth manually with wallet addresses
  },
});

// Database types (these should match your Supabase schema)
export interface User {
  id: string;
  wallet_address: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PROPOSED' | 'TRADING' | 'RESOLVING' | 'RESOLVED';
  resolution_date: string;
  yes_price: number;
  no_price: number;
  total_volume: number;
  created_at: string;
  updated_at: string;
}

export interface ProposedMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  resolution_date: string;
  proposed_by: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  amount: number;
  shares: number;
  price: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  shares: number;
  avg_price: number;
  created_at: string;
  updated_at: string;
}

// Helper function to generate unique referral codes
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to extract referral code from URL
export function getReferralCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
}
