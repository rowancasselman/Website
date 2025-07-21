
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
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import { Toaster } from 'react-hot-toast';
import './index.css';

const endpoint = 'https://api.mainnet-beta.solana.com';
import PlotGrid  from "./components/PlotGrid";

export default function App() {
  const wallets = [new PhantomWalletAdapter()];
  
    return (
  <div className="min-h-screen bg-black text-white flex flex-col">
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Grid fills all remaining vertical space */}
          <div className="flex-1 overflow-auto flex items-center justify-center">
            <PlotGrid />
          </div>

          {/* Wallet button stays at bottom */}
          <div className=" w-full max-w-md mx-auto py-4 text-center">
            <WalletButton />
          </div>

          <Toaster position="bottom-center" />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </div>
);
}
