import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path as needed


const WISH_MINT = new PublicKey("3VqXFcymG2UkbnZ9Q9n2UTLU752eX7MSYrTNjDocpump"); // Replace later
const WISH_DECIMALS = 6;

export default function WishButton() {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection("https://cosmological-fragrant-replica.solana-mainnet.quiknode.pro/d10eb00a7ed1b6cfd7da30e15b72e052bcc1e362/");
  const [wish, setWish] = useState('');
  const [burnAmount, setBurnAmount] = useState(100000);

  
  const handleWish = async () => {
    if (!publicKey) {
      toast.error("Connect wallet first!");
      return;
    }
    if (!wish.trim()) {
      toast.error("Please enter a wish!");
      return;
    }
  
    try {
        console.log("Fetching ATA...");
        const userATA = await getAssociatedTokenAddress(WISH_MINT, publicKey);
        console.log("User ATA:", userATA.toBase58());
    
        const tokenAccountInfo = await connection.getParsedAccountInfo(userATA);
            
        let tokenAmount = 0;

            if (
            tokenAccountInfo.value &&
            'parsed' in tokenAccountInfo.value.data &&
            tokenAccountInfo.value.data.program === 'spl-token'
            ) {
            tokenAmount = tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
            }

            console.log("💸 Wallet token balance:", tokenAmount);
        if (!tokenAccountInfo.value) {
            toast.error("You don't have a Wish token account.");
            console.error("No token account found at ATA.");
            return;
        }
        
        console.log("User token balance:", tokenAmount);
    
        const amountToBurn = burnAmount;
        const amountToBurnRaw = amountToBurn * 10 ** WISH_DECIMALS;
        if (tokenAmount < amountToBurn) {
            toast.error("Insufficient Wish token balance.");
            console.error(`Insufficient balance. Needed: ${amountToBurn}, Available: ${tokenAmount}`);
            return;
        }
        if (tokenAmount < burnAmount) {
            toast.error("Not enough WISH tokens to burn!");
            return;
        }
    
        console.log("Creating burn instruction...");
        const burnIx = createBurnInstruction(
            userATA,
            WISH_MINT,
            publicKey,
            amountToBurnRaw
        );
    
        const tx = new Transaction().add(burnIx);
        console.log("Sending transaction...");
        const sig = await sendTransaction(tx, connection);
        console.log("Transaction sent:", sig);
    
        await connection.confirmTransaction(sig, 'confirmed');
        toast.success("✨ Wish Sent!");
        setWish(''); // Clear input after wish
    
        const { error } = await supabase.from('wishes').insert([
            { wallet: publicKey.toString(), wish, tokens_burned: amountToBurn }
        ]);
        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }
    
        console.log("Wish saved to Supabase");
    } catch (e) {
      console.error("Error in handleWish:", e);
      toast.error("Burn failed. Check token balance or transaction status.");
    }
  };



  return (
    
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
    <p className={`mt-2 italic transition-opacity duration-300 ${wish ? 'text-white' : 'text-gray-400'}`}>
      I wish {wish || '...'}
    </p>
  
    <input
      type="text"
      value={wish}
      onChange={(e) => setWish(e.target.value)}
      maxLength={80}
      placeholder="Type your wish..."
      className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
    />
  
    <label className="text-white mb-2 block text-sm font-medium"></label>
    <input
      type="range"
      min={100000}
      max={100000000}
      step={100000}
      value={burnAmount}
      onChange={(e) => setBurnAmount(Number(e.target.value))}
      className="w-full mb-2"
    />

<p className="text-white mb-4">Burn Amount: {burnAmount.toLocaleString()} WISH</p>
        
      <button
        onClick={handleWish}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg transition  duration-200 shadow"
      >
        Wish
      </button>
    </div>
  );
}
