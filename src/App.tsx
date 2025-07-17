import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets';

import WalletButton from './components/WalletButton';
import WishButton from './components/WishButton';

import { Toaster } from 'react-hot-toast';
import './index.css';

import WishStats from './components/WishStats';

const network = WalletAdapterNetwork.Mainnet;
const endpoint = 'https://api.mainnet-beta.solana.com';

export default function App() {
  const wallets = [new PhantomWalletAdapter()];

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex items-center justify-center p-4">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="w-full max-w-md space-y-6 text-center">
            <h1 className="text-6xl font-bold text-white">Wish Coin</h1>
            <p className="text-gray-300 text-lg">✨ Burn tokens. Make a wish. ✨</p>
              <p className="text-xs text-gray-300 pb-24 ">Token: [placeholder address]</p>
              <WalletButton />
              <WishButton />
              <Toaster position="bottom-center" />
              <WishStats />
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}
