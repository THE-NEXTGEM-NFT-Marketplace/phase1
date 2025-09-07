import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { DepositWithdrawModal } from './DepositWithdrawModal';
import { SidebarProvider, SidebarInset } from './ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [depositWithdrawOpen, setDepositWithdrawOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'deposit' | 'withdraw'>('deposit');

  const openDepositModal = () => {
    setInitialTab('deposit');
    setDepositWithdrawOpen(true);
  };

  const openWithdrawModal = () => {
    setInitialTab('withdraw');
    setDepositWithdrawOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        <AppSidebar onOpenDeposit={openDepositModal} onOpenWithdraw={openWithdrawModal} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
        <DepositWithdrawModal 
          open={depositWithdrawOpen} 
          onOpenChange={setDepositWithdrawOpen}
          initialTab={initialTab}
        />
      </div>
    </SidebarProvider>
  );
}