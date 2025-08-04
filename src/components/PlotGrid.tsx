import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import ResultsGrid from './ResultsGrid'; // the new results grid component


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
  const [hoverVotes, setHoverVotes] = useState<{ x: number, y: number, votes: Record<string, number> } | null>(null);
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);
  const isPaintingRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentHoverRef = useRef<{ x: number, y: number } | null>(null);

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
    // Fix #1: Guard against empty plots array
    if (plots.length === 0) return;
    
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

  async function getVotesForTile(x: number, y: number): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('plot_claims')
      .select('color')
      .eq('x', x)
      .eq('y', y);

    if (error) {
      console.error(`Failed to fetch votes for tile (${x}, ${y}):`, error);
      return {};
    }

    const colorCounts: Record<string, number> = {};
    for (const vote of data) {
      const color = vote.color;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }

    return colorCounts;
  }

  const submitVotes = async () => {
    if (localVotes.size === 0) {
      toast("You haven't painted anything!");
      return;
    }

    // Fix #5: Check session-based voting instead of permanent IP ban
    if (hasSubmittedThisSession) {
      toast.error("You have already submitted votes in this session!");
      return;
    }

    const ip = await getClientIP();

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
      setHasSubmittedThisSession(true); // Mark as submitted for this session
    }
  };

  async function getClientIP() {
    try {
      const res = await fetch('https://api64.ipify.org?format=json');
      const data = await res.json();
      return data.ip as string;
    } catch {
      return "unknown";
    }
  }

  // Fix #3: Debounced hover handler to prevent race conditions
  const handleMouseEnter = async (plot: Plot) => {
    if (isPaintingRef.current) paintPlot(plot);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set current hover position
    currentHoverRef.current = { x: plot.x, y: plot.y };
    
    // Debounce the API call
    hoverTimeoutRef.current = setTimeout(async () => {
      // Check if we're still hovering over the same tile
      if (currentHoverRef.current?.x === plot.x && currentHoverRef.current?.y === plot.y) {
        const voteCounts = await getVotesForTile(plot.x, plot.y);
        // Double-check we're still hovering over the same tile after async operation
        if (currentHoverRef.current?.x === plot.x && currentHoverRef.current?.y === plot.y) {
          setHoverVotes({ x: plot.x, y: plot.y, votes: voteCounts });
        }
      }
    }, 150); // 150ms debounce
  };

  const handleMouseLeave = () => {
    // Clear timeout and current hover reference
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    currentHoverRef.current = null;
    setHoverVotes(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white flex-col space-y-6 relative">
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

      {/* Grid container wrapper for relative positioning */}
      <div className="relative">
        {/* Grid */}
        <div
          className="grid border border-gray-300"
          style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
            gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`
          }}
          onMouseDown={() => (isPaintingRef.current = true)}
          onMouseUp={() => (isPaintingRef.current = false)}
          onMouseLeave={() => {
            isPaintingRef.current = false;
            handleMouseLeave();
          }}
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
                  cursor: "crosshair",
                  position: "relative"
                }}
                onMouseDown={() => paintPlot(plot)}
                onMouseEnter={() => handleMouseEnter(plot)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </div>

        {/* Hover votes UI */}
        {hoverVotes && (
          <div
            className="absolute bg-white border shadow p-2 rounded text-sm space-y-1"
            style={{
              top: hoverVotes.y * plotSizePx + 75,
              left: hoverVotes.x * plotSizePx - 0,
              zIndex: 50,
              pointerEvents: 'none',
              minWidth: 80,
            }}
          >
            {Object.entries(hoverVotes.votes).map(([color, count]) =>
              count > 0 ? (
                <div key={color} className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color, border: '1px solid #000' }} />
                  <span>{count}</span>
                </div>
              ) : null
            )}
            {Object.keys(hoverVotes.votes).length === 0 && <div>No votes</div>}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        className={`mt-4 px-6 py-2 rounded ${
          hasSubmittedThisSession 
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
            : 'bg-black text-white hover:bg-gray-800'
        }`}
        onClick={submitVotes}
        disabled={hasSubmittedThisSession}
      >
        {hasSubmittedThisSession ? 'Already Submitted' : 'Submit Votes'}
      </button>
    </div>
  );
}