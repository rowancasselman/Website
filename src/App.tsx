
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
import wishcoinIcon from './assets/Wish.png';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
const endpoint = 'https://api.mainnet-beta.solana.com';
import { Buffer } from 'buffer'
window.Buffer = Buffer

export default function App() {
  const wallets = [new PhantomWalletAdapter()];
  const [totalBurned, setTotalBurned] = useState<number | null>(null);
  
    useEffect(() => {
      const fetchTotalBurned = async () => {
        const { data, error } = await supabase.rpc("get_total_burned");
  
        if (error) {
          console.error("Error fetching total burned amount:", error.message);
          setTotalBurned(null);
        } else {
          setTotalBurned(data);
        }
      };
  
      fetchTotalBurned();
    }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex items-center justify-center p-4">
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="w-full max-w-md space-y-6 text-center">
            <h1 className="text-7xl font-bold text-white">Wish Coin</h1>
            <div className="text-white text-2xl mb-16">
      🔥 Total WISH burned:{" "}
      {totalBurned !== null ? totalBurned.toLocaleString() : "Loading..."}
    </div>
            
            <img src={wishcoinIcon} alt="WishCoin Icon" className="w-100 h-100" />
              <p className="text-xs text-gray-300 pb-12 ">Token: 3VqXFcymG2UkbnZ9Q9n2UTLU752eX7MSYrTNjDocpump</p>
              <WalletButton />
              <div className="flex flex-col items-center space-y-24">
                <WishButton />
                <WishStats />
              </div>
              <Toaster position="bottom-center" />
              
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}
