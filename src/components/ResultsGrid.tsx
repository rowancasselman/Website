import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Plot = {
  x: number;
  y: number;
  color: string;
};

const gridSize = { cols: 8, rows: 8 };
const plotSizePx = 60;

export default function ResultsGrid() {
  const [plots, setPlots] = useState<Plot[]>([]);

  useEffect(() => {
  async function fetchResults() {
    const { data, error } = await supabase
      .from('plot_claims')
      .select('x, y, color');

    if (error) {
      console.error("Error fetching all votes:", error);
      return;
    }

    // Initialize empty grid with white
    const newPlots: Plot[] = [];
    for (let y = 0; y < gridSize.rows; y++) {
      for (let x = 0; x < gridSize.cols; x++) {
        newPlots.push({ x, y, color: '#ffffff' });
      }
    }

    // Map to count votes per tile per color: { 'x-y': { color: count, ... }, ... }
    const voteMap: Record<string, Record<string, number>> = {};

    for (const vote of data) {
      const key = `${vote.x}-${vote.y}`;
      if (!voteMap[key]) voteMap[key] = {};
      voteMap[key][vote.color] = (voteMap[key][vote.color] || 0) + 1;
    }

    // Determine max color per tile
    for (const plot of newPlots) {
      const key = `${plot.x}-${plot.y}`;
      const counts = voteMap[key];
      if (counts) {
        let maxColor = '#ffffff';
        let maxCount = 0;
        for (const [color, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count;
            maxColor = color;
          }
        }
        plot.color = maxColor;
      }
    }

    setPlots(newPlots);
  }

  fetchResults();
}, []);


  return (
    <div
      className="grid border border-gray-300"
      style={{
        gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`,
        width: plotSizePx * gridSize.cols,
        height: plotSizePx * gridSize.rows,
      }}
    >
      {plots.map((plot) => (
        <div
          key={`${plot.x}-${plot.y}`}
          className="border border-gray-300"
          style={{
            backgroundColor: plot.color,
            width: plotSizePx,
            height: plotSizePx,
          }}
          title={`(${plot.x}, ${plot.y})`}
        />
      ))}
    </div>
  );
}
