import React, { useState } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId && import.meta.env.DEV) {
  console.warn(
    '[Web3Provider] VITE_WALLETCONNECT_PROJECT_ID is not set. ' +
    'WalletConnect will not work. Add your Project ID from https://cloud.walletconnect.com to .env'
  );
}

const metadata = {
  name: 'Akhuwat Finance',
  description: 'Akhuwat DeFi Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
  icons: [],
};

const chains = [bsc] as const;

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createWeb3Modal({ wagmiConfig, projectId, chains });

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
