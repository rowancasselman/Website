import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

type Plot = {
  x: number;
  y: number;
  color: string;
};

const allowedColors = [
  "red", "blue", "green", "yellow", "orange", "purple", "pink",
  "saddlebrown", "black", "white", "gray", "cyan", "magenta", "lime", "navy"
];

const gridSize = { cols: 8, rows: 8 };
const plotSizePx = 60;

export default function PlotGrid() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedColor, setSelectedColor] = useState("red");
  const [localVotes, setLocalVotes] = useState<Map<string, string>>(new Map());
  const isPaintingRef = useRef(false);

  useEffect(() => {
    const newPlots: Plot[] = [];
    for (let y = 0; y < gridSize.rows; y++) {
      for (let x = 0; x < gridSize.cols; x++) {
        newPlots.push({ x, y, color: "#ffffff" });
      }
    }
    setPlots(newPlots);
  }, []);

  const paintPlot = (plot: Plot) => {
    const key = `${plot.x}-${plot.y}`;
    const newPlots = plots.map(p =>
      p.x === plot.x && p.y === plot.y ? { ...p, color: selectedColor } : p
    );
    setPlots(newPlots);

    // Track local vote
    setLocalVotes(prev => {
      const updated = new Map(prev);
      updated.set(key, selectedColor);
      return updated;
    });
  };

  const submitVotes = async () => {
    if (localVotes.size === 0) {
      toast("You haven't painted anything!");
      return;
    }

    const ip = await getClientIP();

    // Check if IP already voted
    const { data: existingVotes, error: fetchError } = await supabase
      .from('plot_claims')
      .select('id')
      .eq('voter_ip', ip)
      .limit(1);

    if (fetchError) {
      console.error("Error checking votes by IP:", fetchError);
      toast.error("Could not verify vote status.");
      return;
    }

    if (existingVotes && existingVotes.length > 0) {
      toast.error("You have already voted!");
      return;
    }

    // Prepare votes for submission
    const votes = Array.from(localVotes.entries()).map(([key, color]) => {
      const [x, y] = key.split('-').map(Number);
      return {
        x,
        y,
        color,
        voter_ip: ip,
      };
    });

    const { error } = await supabase.from('plot_claims').insert(votes);

    if (error) {
      console.error("Failed to submit votes:", error);
      toast.error("Error submitting your vote.");
    } else {
      toast.success("Votes submitted!");
      setLocalVotes(new Map());
    }
  };
  async function getClientIP() {
  try {
    const res = await fetch('https://api64.ipify.org?format=json'); // or https://api.ipify.org?format=json
    const data = await res.json();
    return data.ip as string;
  } catch {
    return "unknown";
  }
}
  return (
    <div className="flex items-center justify-center min-h-screen bg-white flex-col space-y-6">
      {/* Top: Paintbrush */}
      <div className="flex flex-wrap justify-center gap-2">
        {allowedColors.map(color => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid border border-gray-300"
        style={{
          gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
          gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`
        }}
        onMouseDown={() => (isPaintingRef.current = true)}
        onMouseUp={() => (isPaintingRef.current = false)}
        onMouseLeave={() => (isPaintingRef.current = false)}
      >
        {plots.map((plot) => {
          const key = `${plot.x}-${plot.y}`;
          const overrideColor = localVotes.get(key);
          return (
            <div
              key={key}
              className="border border-gray-300"
              style={{
                backgroundColor: overrideColor ?? plot.color,
                width: plotSizePx,
                height: plotSizePx,
                cursor: "crosshair"
              }}
              onMouseDown={() => paintPlot(plot)}
              onMouseEnter={() => {
                if (isPaintingRef.current) paintPlot(plot);
              }}
              title={`(${plot.x}, ${plot.y})`}
            />
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        onClick={submitVotes}
      >
        Submit Votes
      </button>
    </div>
  );
}
