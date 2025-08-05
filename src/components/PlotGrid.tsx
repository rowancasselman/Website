import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
//yup
type Plot = {
  x: number;
  y: number;
  color: string;
};

const allowedColors = [
  // Grayscale
  "black",

  "gray",
  "silver",
  "lightgray",
  "white",

  // Red shades
  "maroon",
  "red",
  "tomato",

  // Orange shades
  "peachpuff",
  "orange",
  "darkorange",

  // Yellow shades
  "gold",
  "yellow",
  "lightyellow",

  // Green shades
  "darkgreen",
  "green",
  "mediumseagreen",

  // Blue shades
  "navy",
  "blue",
  "deepskyblue",

  // Indigo shades

  "mediumorchid",

  // Violet / Purple shades
  "darkviolet",
  "violet"
];

const gridSize = { cols: 8, rows: 8 };
const plotSizePx = 60;

export default function PlotGrid() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedColor, setSelectedColor] = useState("red");
  const isPaintingRef = useRef(false);

  // Initialize blank grid on mount
  useEffect(() => {
    const newPlots: Plot[] = [];
    for (let y = 0; y < gridSize.rows; y++) {
      for (let x = 0; x < gridSize.cols; x++) {
        newPlots.push({ x, y, color: "#ffffff" }); // white background
      }
    }
    setPlots(newPlots);
  }, []);

  // Paint a single plot
  const paintPlot = (plot: Plot) => {
    setPlots(prevPlots =>
      prevPlots.map(p =>
        p.x === plot.x && p.y === plot.y ? { ...p, color: selectedColor } : p
      )
    );
  };

  // Clear entire grid
  const clearGrid = () => {
    setPlots(prev => prev.map(p => ({ ...p, color: "#ffffff" })));
  };

  // Submit entire artwork
  const submitArtwork = async () => {
  // Check if any pixel is colored (not white)
  if (plots.every(p => p.color.toLowerCase() === "#ffffff" || p.color.toLowerCase() === "white")) {
    toast("You haven't drawn anything!");
    return;
  }

  // Get user's IP address (client-side, using external service)
  const userIP = await fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip)
    .catch(() => null);

  if (!userIP) {
    toast.error("Unable to get your IP address.");
    return;
  }

  // Check if this IP has already submitted artwork
  const { data: existingArtworks, error: checkError } = await supabase
    .from('artworks')
    .select('id')
    .eq('user_ip', userIP);

  if (checkError) {
    toast.error("Error checking previous submissions.");
    console.error(checkError);
    return;
  }

  if (existingArtworks.length >= 10) {
    toast.error("You have submitted too much artwork.");
    return;
  }

  // Prepare and submit artwork
  const artworkData = {
    pixels: plots.map(({ x, y, color }) => ({ x, y, color })),
    created_at: new Date().toISOString(),
    user_ip: userIP,
  };

  const { error } = await supabase.from('artworks').insert([artworkData]);

  if (error) {
    toast.error("Error submitting your artwork.");
    console.error(error);
  } else {
    toast.success("Artwork submitted!");
    clearGrid();
  }
};


  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Color palette */}
      <div className="flex flex-wrap justify-center gap-2">
        {allowedColors.map(color => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
        <button
          className="ml-4 px-4 py-1 rounded border border-red-500 text-red-500 hover:bg-red-100"
          onClick={clearGrid}
          type="button"
        >
          Clear
        </button>
      </div>

      {/* Grid */}
      <div
        className="grid border border-gray-300"
        style={{
          gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
          gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`,
          userSelect: "none",
        }}
        onMouseDown={() => (isPaintingRef.current = true)}
        onMouseUp={() => (isPaintingRef.current = false)}
        onMouseLeave={() => (isPaintingRef.current = false)}
      >
        {plots.map((plot) => (
          <div
            key={`${plot.x}-${plot.y}`}
            className="border border-gray-300"
            style={{
              backgroundColor: plot.color,
              width: plotSizePx,
              height: plotSizePx,
              cursor: "crosshair",
            }}
            onMouseDown={() => paintPlot(plot)}
            onMouseEnter={() => {
              if (isPaintingRef.current) paintPlot(plot);
            }}
          />
        ))}
      </div>

      {/* Submit Button */}
      <button
        className="mt-4 px-6 py-2 rounded bg-black text-white hover:bg-gray-800"
        onClick={submitArtwork}
        type="button"
      >
        Submit Artwork
      </button>
    </div>
  );
}
