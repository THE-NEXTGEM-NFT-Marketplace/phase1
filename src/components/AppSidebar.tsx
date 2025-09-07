import React from 'react';
import { TrendingUp, PieChart, Vote, Wallet, Plus, Minus, Calendar, Coins, Users } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { ConnectButton, useWallet } from "@suiet/wallet-kit";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';

interface AppSidebarProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export function AppSidebar({ onOpenDeposit, onOpenWithdraw }: AppSidebarProps) {
  const { 
    currentView, 
    setCurrentView
  } = useAppStore();
  const { connected } = useWallet();
  
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const navigationItems = [
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'propose-market', label: 'Propose Market', icon: Calendar },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'governance', label: 'Governance', icon: Vote },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'faucet', label: 'Faucet', icon: Coins },
  ] as const;

  const isActive = (id: string) => currentView === id;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        {!collapsed && (
          <div className="px-2">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SuiLFG
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Prediction Markets</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentView(item.id as any)}
                      className={cn(
                        "w-full justify-start",
                        active && "bg-primary/10 text-primary border border-primary/20"
                      )}
                      tooltip={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarGroup>
          <SidebarGroupLabel>Wallet</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <ConnectButton>Connect Wallet</ConnectButton>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && connected && (
          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex gap-2 px-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={onOpenDeposit}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Deposit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onOpenWithdraw}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Withdraw
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}