import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Eye } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { toast } from '../ui/use-toast';

// Type definitions
type SuiLfgNftTier = 'None' | 'Voter' | 'Governor' | 'Council';

interface PartnerNfts {
  claynosaurz: number;
  studioMirai: number;
}

interface DemoWalletAssets {
  suiLfgNftTier: SuiLfgNftTier;
  afSuiBalance: number;
  partnerNfts: PartnerNfts;
}

interface VotingPowerBreakdown {
  baseVotes: number;
  multiplier: number;
  totalVotes: number;
  breakdown: {
    fromNft: number;
    fromAfSui: number;
    fromPartnerNfts: number;
  };
}

interface DisputeInfo {
  id: string;
  marketTitle: string;
  yesVotes: number;
  noVotes: number;
  timeRemaining: string;
  disputed: boolean;
}

export function GovernanceView() {
  const { setCurrentView, markets } = useAppStore();
  
  // Local state for dispute management
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [bondAmount, setBondAmount] = useState('100');
  const [selectedVote, setSelectedVote] = useState<'YES' | 'NO' | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [showDemoControls, setShowDemoControls] = useState(false);

  // Demo wallet assets state
  const [demoWalletAssets, setDemoWalletAssets] = useState<DemoWalletAssets>({
    suiLfgNftTier: 'Governor',
    afSuiBalance: 500,
    partnerNfts: {
      claynosaurz: 2,
      studioMirai: 1
    }
  });

  // Mock dispute data for markets in RESOLVING status
  const [disputes, setDisputes] = useState<DisputeInfo[]>(() => {
    const resolvingMarkets = markets.filter(m => m.status === 'RESOLVING');
    return resolvingMarkets.map((market, index) => ({
      id: market.id,
      marketTitle: market.title,
      yesVotes: 1250 + (index * 300),
      noVotes: 850 + (index * 200), 
      timeRemaining: `${2 + index} days`,
      disputed: false
    }));
  });

  // Update disputes when markets change (to handle status transitions)
  useEffect(() => {
    const resolvingMarkets = markets.filter(m => m.status === 'RESOLVING');
    setDisputes(resolvingMarkets.map((market, index) => ({
      id: market.id,
      marketTitle: market.title,
      yesVotes: 1250 + (index * 300),
      noVotes: 850 + (index * 200), 
      timeRemaining: `${2 + index} days`,
      disputed: false
    })));
  }, [markets]);

  // Proposed markets for demo
  const proposedMarkets = markets.filter(m => m.status === 'PROPOSED');

  // Calculate voting power using corrected formula
  const calculateVotingPower = (assets: DemoWalletAssets): VotingPowerBreakdown => {
    // Base votes from different sources
    const nftBaseVotes = assets.suiLfgNftTier === 'Voter' ? 10 :
                        assets.suiLfgNftTier === 'Governor' ? 100 :
                        assets.suiLfgNftTier === 'Council' ? 1000 : 0;
    
    const afSuiVotes = assets.afSuiBalance;
    const claynosaurzVotes = assets.partnerNfts.claynosaurz * 10;
    const studioMiraiVotes = assets.partnerNfts.studioMirai * 100;
    
    // Total votes from other sources (excluding NFT base votes)
    const otherBaseVotes = afSuiVotes + claynosaurzVotes + studioMiraiVotes;
    
    // Multiplier from highest tier NFT
    const multiplier = assets.suiLfgNftTier === 'Voter' ? 1.5 :
                      assets.suiLfgNftTier === 'Governor' ? 5 :
                      assets.suiLfgNftTier === 'Council' ? 25 : 1;
    
    // Corrected formula: (OtherBaseVotes * NFTMultiplier) + NFTBaseVotes
    const totalVotes = (otherBaseVotes * multiplier) + nftBaseVotes;

    return {
      baseVotes: otherBaseVotes + nftBaseVotes,
      multiplier,
      totalVotes,
      breakdown: {
        fromNft: nftBaseVotes,
        fromAfSui: afSuiVotes,
        fromPartnerNfts: claynosaurzVotes + studioMiraiVotes
      }
    };
  };

  const votingPower = calculateVotingPower(demoWalletAssets);

  // Event handlers
  const handleDispute = () => {
    if (!selectedDispute) {
      toast({
        title: "No Market Selected",
        description: "Please select a market to dispute first.",
        variant: "destructive",
      });
      return;
    }

    if (!disputeEvidence.trim()) {
      toast({
        title: "Evidence Required",
        description: "Please provide evidence for your dispute.",
        variant: "destructive",
      });
      return;
    }

    setDisputes(prev => prev.map(d => 
      d.id === selectedDispute ? { ...d, disputed: true } : d
    ));

    toast({
      title: "Dispute Submitted",
      description: `Your dispute has been submitted with a ${bondAmount} USDC bond.`,
    });

    setDisputeEvidence('');
    setBondAmount('100');
  };

  const handleVote = () => {
    if (!selectedDispute) {
      toast({
        title: "No Market Selected",
        description: "Please select a market to vote on first.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVote) {
      toast({
        title: "No Vote Selected",
        description: "Please select YES or NO to cast your vote.",
        variant: "destructive",
      });
      return;
    }

    setDisputes(prev => prev.map(d => {
      if (d.id === selectedDispute) {
        return {
          ...d,
          yesVotes: selectedVote === 'YES' ? d.yesVotes + votingPower.totalVotes : d.yesVotes,
          noVotes: selectedVote === 'NO' ? d.noVotes + votingPower.totalVotes : d.noVotes
        };
      }
      return d;
    }));

    toast({
      title: "Vote Cast",
      description: `You voted ${selectedVote} with ${votingPower.totalVotes.toLocaleString()} voting power.`,
    });

    setSelectedVote(null);
  };

  const handleBackToTrading = () => {
    setCurrentView('markets');
  };

  // Helper function to update demo wallet assets
  const updateDemoWalletAssets = (updates: Partial<DemoWalletAssets>) => {
    setDemoWalletAssets(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Governance</h1>
          <p className="text-muted-foreground">
            Participate in community governance and dispute resolution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleBackToTrading}
          >
            Back to Trading
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDemoControls(!showDemoControls)}
            className="w-8 h-8"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Demo Controls */}
      {showDemoControls && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-warning">Demo Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>SuiLFG NFT Tier</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                  value={demoWalletAssets.suiLfgNftTier}
                  onChange={(e) => updateDemoWalletAssets({ suiLfgNftTier: e.target.value as SuiLfgNftTier })}
                >
                  <option value="None">None</option>
                  <option value="Voter">Voter (10 base + 1.5x)</option>
                  <option value="Governor">Governor (100 base + 5x)</option>
                  <option value="Council">Council (1000 base + 25x)</option>
                </select>
              </div>
              <div>
                <Label>afSUI Balance</Label>
                <Input
                  type="number"
                  value={demoWalletAssets.afSuiBalance}
                  onChange={(e) => updateDemoWalletAssets({ afSuiBalance: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Claynosaurz NFTs</Label>
                <Input
                  type="number"
                  value={demoWalletAssets.partnerNfts.claynosaurz}
                  onChange={(e) => updateDemoWalletAssets({ 
                    partnerNfts: { ...demoWalletAssets.partnerNfts, claynosaurz: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Power Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Your Voting Power Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-2">Part 1: Calculating Your Base Power</h4>
                <div className="space-y-1 text-sm">
                  {votingPower.breakdown.fromNft > 0 && (
                    <div>From SuiLFG {demoWalletAssets.suiLfgNftTier} NFT: <span className="font-medium">{votingPower.breakdown.fromNft} Votes</span></div>
                  )}
                  <div>From afSUI Balance ({demoWalletAssets.afSuiBalance}): <span className="font-medium">{votingPower.breakdown.fromAfSui} Votes</span></div>
                  {votingPower.breakdown.fromPartnerNfts > 0 && (
                    <div>From Partner NFTs: <span className="font-medium">{votingPower.breakdown.fromPartnerNfts} Votes</span></div>
                  )}
                </div>
                <div className="border-t pt-2 mt-2 font-medium">
                  Other Base Power: {votingPower.breakdown.fromAfSui + votingPower.breakdown.fromPartnerNfts} Votes
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-2">Part 2: Applying Your Multiplier</h4>
                <div className="text-sm">
                  {demoWalletAssets.suiLfgNftTier !== 'None' ? (
                    <div>SuiLFG {demoWalletAssets.suiLfgNftTier} NFT Held: <span className="font-medium text-success">x{votingPower.multiplier} Multiplier ✅</span></div>
                  ) : (
                    <div>No SuiLFG NFT: <span className="font-medium">x1 Multiplier</span></div>
                  )}
                </div>
              </div>

              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="text-lg font-bold text-center">
                  Total Voting Power: {votingPower.totalVotes.toLocaleString()} Final Votes
                </div>
                <div className="text-xs text-center text-muted-foreground mt-1">
                  ({votingPower.breakdown.fromAfSui + votingPower.breakdown.fromPartnerNfts} × {votingPower.multiplier}) + {votingPower.breakdown.fromNft}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Governance Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="disputes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="disputes">Market Disputes</TabsTrigger>
                <TabsTrigger value="proposed">Proposed Markets</TabsTrigger>
              </TabsList>

              <TabsContent value="disputes" className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No markets currently being disputed</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Select Market to Vote/Dispute</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedDispute || ''}
                        onChange={(e) => setSelectedDispute(e.target.value || null)}
                      >
                        <option value="">Select a market...</option>
                        {disputes.map(dispute => (
                          <option key={dispute.id} value={dispute.id}>
                            {dispute.marketTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDispute && (
                      <div className="space-y-4">
                        {disputes.filter(d => d.id === selectedDispute).map(dispute => (
                          <div key={dispute.id} className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">{dispute.marketTitle}</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground">YES Votes</div>
                                <div className="text-lg font-medium text-yes">{dispute.yesVotes.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">NO Votes</div>
                                <div className="text-lg font-medium text-no">{dispute.noVotes.toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                              Time remaining: {dispute.timeRemaining}
                            </div>
                            
                            {/* Voting */}
                            <div className="space-y-2 mb-4">
                              <Label>Cast Your Vote</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant={selectedVote === 'YES' ? 'default' : 'outline'}
                                  onClick={() => setSelectedVote('YES')}
                                  className="flex-1"
                                >
                                  YES ({votingPower.totalVotes.toLocaleString()} Votes)
                                </Button>
                                <Button
                                  variant={selectedVote === 'NO' ? 'default' : 'outline'}
                                  onClick={() => setSelectedVote('NO')}
                                  className="flex-1"
                                >
                                  NO ({votingPower.totalVotes.toLocaleString()} Votes)
                                </Button>
                              </div>
                              <Button onClick={handleVote} className="w-full" disabled={!selectedVote}>
                                Cast Vote
                              </Button>
                            </div>

                            {/* Dispute Form */}
                            <div className="space-y-2 border-t pt-4">
                              <Label>Submit New Dispute</Label>
                              <Textarea
                                placeholder="Provide evidence for your dispute..."
                                value={disputeEvidence}
                                onChange={(e) => setDisputeEvidence(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="Bond amount (USDC)"
                                  value={bondAmount}
                                  onChange={(e) => setBondAmount(e.target.value)}
                                />
                                <Button onClick={handleDispute} disabled={!disputeEvidence.trim()}>
                                  Submit Dispute
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="proposed" className="space-y-4">
                {proposedMarkets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No markets currently pending approval</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Proposed markets will appear here before being approved
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposedMarkets.map(market => (
                      <div key={market.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{market.title}</h4>
                          <Badge variant="outline" className="text-warning border-warning/20">
                            PROPOSED
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{market.description}</p>
                        <div className="text-xs text-muted-foreground">
                          Category: {market.category} | Resolution: {market.resolutionDate.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>How Governance Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Voting Power Calculation</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Your voting power is calculated using a two-step process:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Calculate total base power from all your assets</li>
                <li>Apply multiplier from your highest-tier SuiLFG NFT</li>
                <li>Add base votes from your SuiLFG NFT</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Formula: (Other Base Votes × NFT Multiplier) + NFT Base Votes
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dispute Process</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Community members can dispute market resolutions by:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Posting a bond (minimum 100 USDC)</li>
                <li>Providing evidence for the dispute</li>
                <li>Community votes on the dispute</li>
                <li>Resolution is updated if dispute succeeds</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}