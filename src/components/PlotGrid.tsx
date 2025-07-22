import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path

const WISH_MINT = new PublicKey("J758VJFLDn28S9L71WuXn9AbJ7yQcUoYFbnMeAG982oY");
const WISH_DECIMALS = 6;

type Plot = {
  x: number;
  y: number;
  color: string;
  owner?: string | null;
  message?: string;
};
const allowedColors = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "brown",
  "black",
  "white",
  "gray",
  "cyan",
  "magenta",
  "lime",
  "navy"
];

export default function PlotGrid() {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection("https://cosmological-fragrant-replica.solana-mainnet.quiknode.pro/d10eb00a7ed1b6cfd7da30e15b72e052bcc1e362/");

  const plotSizePx = 12;
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });
  const [plots, setPlots] = useState<Plot[]>([]);

  // Calculate grid size on mount and resize
  useEffect(() => {
    function updateGridSize() {
      const cols = Math.floor(window.innerWidth / plotSizePx);
      const rows = Math.floor(window.innerHeight / plotSizePx);
      setGridSize({ cols, rows });
    }
    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  // Generate grid plots
  useEffect(() => {
  if (gridSize.cols === 0 || gridSize.rows === 0) return;

  const totalPlots = gridSize.cols * gridSize.rows;
  const newPlots: Plot[] = [];

  for (let i = 0; i < totalPlots; i++) {
    const x = i % gridSize.cols;
    const y = Math.floor(i / gridSize.cols);

    // Try to find old plot data for this coordinate
    const oldPlot = plots.find((p) => p.x === x && p.y === y);

    if (oldPlot) {
      newPlots.push(oldPlot);  // keep previous color/owner/message
    } else {
      newPlots.push({
        x,
        y,
        color: "#ffffff",
        owner: null,
        message: "",
      });
    }
  }

  setPlots(newPlots);
}, [gridSize]);
  useEffect(() => {
  async function loadClaims() {
    try {
      // Fetch all plot claims
      const { data: claims, error } = await supabase
        .from('plot_claims')
        .select('x, y, color, owner:wallet, message')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Failed to load claims:", error);
        return;
      }

      if (!claims) return;

      // Update plots with claims data
      setPlots((oldPlots) =>
        oldPlots.map((plot) => {
          const claim = claims.find(
            (c) => c.x === plot.x && c.y === plot.y
          );
          if (claim) {
            return {
              ...plot,
              color: claim.color,
              owner: claim.owner,
              message: claim.message,
            };
          }
          return plot;
        })
      );
    } catch (e) {
      console.error("Error loading claims:", e);
    }
  }

  loadClaims();
}, []);
  // Burn WISH tokens function
  async function burnTokens(amountToBurn: number) {
  if (!publicKey || !sendTransaction) {
    toast.error("Connect your wallet first!");
    return false;
  }

  try {
    const userATA = await getAssociatedTokenAddress(WISH_MINT, publicKey);

    const tokenAccountInfo = await connection.getParsedAccountInfo(userATA);
    let tokenAmount = 0;

    if (
      tokenAccountInfo.value &&
      'parsed' in tokenAccountInfo.value.data &&
      tokenAccountInfo.value.data.program === 'spl-token'
    ) {
      tokenAmount = tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
    }

    if (!tokenAccountInfo.value) {
      toast.error("You don't have a PLOT token account.");
      return false;
    }

    if (tokenAmount < amountToBurn) {
      toast.error(`Insufficient Wish token balance. Need ${amountToBurn} PLOT.`);
      return false;
    }

    const amountToBurnRaw = amountToBurn * 10 ** WISH_DECIMALS;

    const burnIx = createBurnInstruction(
      userATA,
      WISH_MINT,
      publicKey,
      amountToBurnRaw
    );

    const tx = new Transaction().add(burnIx);
    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, 'confirmed');
    toast.success(`Burned ${amountToBurn.toLocaleString()} PLOT tokens!`);
    return true;

  } catch (error) {
    console.error("Burn failed:", error);
    toast.error("Burn transaction failed.");
    return false;
  }
}


  // On plot click, burn then claim
  const handlePlotClick = async (plot: Plot) => {
  if (!publicKey) {
    toast.error("Please connect your wallet first!");
    return;
  }

  try {
    // Fetch latest burn amount for the plot
    const { data: latestClaims, error: fetchError } = await supabase
      .from('plot_claims')
      .select('tokens_burned')
      .eq('x', plot.x)
      .eq('y', plot.y)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      toast.error("Failed to fetch plot data.");
      return;
    }

    const latestBurn = latestClaims?.[0]?.tokens_burned ?? 0;
    const burnAmount = latestBurn > 0 ? latestBurn + 10_000 : 10_000;

    // Burn tokens
    const burnSuccess = await burnTokens(burnAmount);
    if (!burnSuccess) return;

    // Delete all previous claims for this plot
    const { error: deleteError } = await supabase
      .from('plot_claims')
      .delete()
      .eq('x', plot.x)
      .eq('y', plot.y);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      toast.error("Failed to delete old plot claims.");
      return;
    }

    // Prompt for color and message
    let color = "";
    while (true) {
    const input = prompt(`Pick a color from the list: ${allowedColors.join(", ")}`, "red");
    if (input === null) {
        // User cancelled prompt, exit or assign a fallback color if you want
        alert("Color selection cancelled. Plot claiming aborted.");
        return; // exit the function so no claim happens
    }

    const inputLower = input.toLowerCase();
    if (allowedColors.includes(inputLower)) {
        color = inputLower;
        break; // valid color, exit loop
    } else {
        alert("Invalid color selected! Please try again.");
    }
    }
    const message = prompt("Enter a message (max 20 chars):", "") || "";

    // Update local plots state
    setPlots((oldPlots) =>
      oldPlots.map((p) =>
        p.x === plot.x && p.y === plot.y
          ? { ...p, color, owner: publicKey.toBase58(), message: message.slice(0, 20) }
          : p
      )
    );

    // Insert new claim
    const { error: insertError } = await supabase.from('plot_claims').insert([
      {
        wallet: publicKey.toBase58(),
        x: plot.x,
        y: plot.y,
        color,
        message,
        tokens_burned: burnAmount,
        timestamp: new Date().toISOString(),
      }
    ]);

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      toast.error("Failed to save new claim.");
      return;
    }

    toast.success("Plot reclaimed successfully!");

  } catch (e) {
    console.error("Claim failed:", e);
    toast.error("Something went wrong during plot claiming.");
  }
};


  return (
    <div
      className="grid bg-gray-900"
      style={{
        gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`,
        width: gridSize.cols * plotSizePx,
        height: gridSize.rows * plotSizePx,
      }}
    >
      {plots.map((plot) => (
  <div
    key={`${plot.x}-${plot.y}`}
    className="border border-gray-700 cursor-pointer"
    style={{ 
      backgroundColor: plot.color, 
      width: plotSizePx, 
      height: plotSizePx,
      borderWidth: '0.5px',
    }}
    onClick={() => handlePlotClick(plot)}
    title={plot.owner ? `Owner: ${plot.owner}\n${plot.message}` : "Unclaimed"}
  />
))}
    </div>
  );
}