import React, { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Layout } from '@/components/Layout';
import { MarketsView } from '@/components/Markets/MarketsView';
import { ProposeMarketView } from '@/components/Markets/ProposeMarketView';
import { TradingView } from '@/components/Trading/TradingView';
import { PortfolioView } from '@/components/Portfolio/PortfolioView';
import { GovernanceView } from '@/components/Governance/GovernanceView';
import { FaucetView } from '@/components/Faucet/FaucetView';
import { ReferralsView } from '@/components/Referrals/ReferralsView';
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { getReferralCodeFromUrl } from '@/lib/supabaseClient';

const Index = () => {
  const { 
    currentView, 
    isLoading, 
    loadUserData, 
    loadMarkets, 
    loadUserPositions,
    setWalletAddress 
  } = useAppStore();
  const { account } = useWallet();
  const walletAddress = account?.address;

  // Load user data and markets when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setWalletAddress(null);
      return;
    }

    const initializeApp = async () => {
      try {
        // Get referral code from URL
        const referrerCode = getReferralCodeFromUrl();
        
        // Load user data (creates user if doesn't exist)
        await loadUserData(walletAddress, referrerCode || undefined);
        
        // Load markets
        await loadMarkets();
        
        // Load user positions
        await loadUserPositions();
        
        setWalletAddress(walletAddress);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [walletAddress, loadUserData, loadMarkets, loadUserPositions, setWalletAddress]);

  console.log('Index rendering, currentView:', currentView);

  const renderView = () => {
    switch (currentView) {
      case 'markets':
        return <MarketsView />;
      case 'propose-market':
        return <ProposeMarketView />;
      case 'trading':
        return <TradingView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'governance':
        return <GovernanceView />;
      case 'referrals':
        return <ReferralsView />;
      case 'faucet':
        return <FaucetView />;
      default:
        return <MarketsView />;
    }
  };

  return (
    <Layout>
      {!walletAddress ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to SuiLFG</h1>
          <p className="text-lg text-muted-foreground mb-8">Connect your wallet to begin.</p>
          <ConnectButton>Connect Wallet</ConnectButton>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Welcome to the SuiLFG Phase 1a Testnet</h1>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      ) : (
        renderView()
      )}
    </Layout>
  );
};

export default Index;
