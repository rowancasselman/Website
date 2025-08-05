import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";

type Plot = {
  x: number;
  y: number;
  color: string;
};

type Artwork = {
  id: number;
  pixels: Plot[];
  created_at: string;
};

const gridSize = { cols: 8, rows: 8 };
const plotSizePx = 30; // smaller preview size

// Helper: Get current vote day string in Eastern Time with 5pm reset
function getEasternVoteDate(): string {
    
  const now = new Date();
  const easternTime = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const easternDate = new Date(easternTime);

  if (easternDate.getHours() < 17) {
    easternDate.setDate(easternDate.getDate() - 1);
  }
  return easternDate.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function ResultsGrid() {
    const [sortMode, setSortMode] = useState<'votes' | 'date'>('votes');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [votesCount, setVotesCount] = useState<Record<number, number>>({});
  const [userVotes, setUserVotes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch artworks and votes when mounted
  useEffect(() => {
    fetchArtworksAndVotes();
  }, []);

  async function fetchArtworksAndVotes() {
    setLoading(true);

    try {
      // Fetch artworks
      let { data: artworksData, error: artworksError } = await supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false });

      if (artworksError) throw artworksError;
      if (!artworksData) artworksData = [];

      setArtworks(artworksData);

      // Get current vote date string
      const voteDate = getEasternVoteDate();

      // Get client IP to track user's votes
      const ip = await getClientIP();

      // Fetch today's votes count grouped by artwork_id
      const { data: votesData, error: votesError } = await supabase
        .from("artwork_votes")
        .select("artwork_id, voter_ip")
        .eq("vote_date", voteDate);

      if (votesError) throw votesError;

      // Count votes per artwork
      const countMap: Record<number, number> = {};
      const votedSet = new Set<number>();

      votesData?.forEach((vote) => {
        const aid = vote.artwork_id;
        countMap[aid] = (countMap[aid] || 0) + 1;

        if (vote.voter_ip === ip) {
          votedSet.add(aid);
        }
      });

      setVotesCount(countMap);
      setUserVotes(votedSet);
    } catch (error) {
      console.error("Error loading artworks or votes:", error);
      toast.error("Failed to load artworks or votes.");
    } finally {
      setLoading(false);
    }
  }

  async function voteForArtwork(artworkId: number) {
    if (userVotes.has(artworkId)) {
      toast.error("You have already voted for this artwork today.");
      return;
    }

    const voteDate = getEasternVoteDate();
    const ip = await getClientIP();

    const { error } = await supabase.from("artwork_votes").insert([
      {
        artwork_id: artworkId,
        voter_ip: ip,
        vote_date: voteDate,
      },
    ]);

    if (error) {
      toast.error("Error submitting your vote.");
      console.error(error);
    } else {
      toast.success("Vote submitted!");
      // Refresh votes count and user votes
      fetchArtworksAndVotes();
    }
  }

  async function getClientIP(): Promise<string> {
    try {
      const res = await fetch("https://api64.ipify.org?format=json");
      const data = await res.json();
      return data.ip as string;
    } catch {
      return "unknown";
    }
  }

  // Render one artwork grid preview, read-only
  function renderArtworkGrid(pixels: Plot[]) {
    // Create a map for quick lookup: key = "x-y"
    const pixelMap = new Map(pixels.map(p => [`${p.x}-${p.y}`, p.color]));

    const cells = [];
    for (let y = 0; y < gridSize.rows; y++) {
      for (let x = 0; x < gridSize.cols; x++) {
        const color = pixelMap.get(`${x}-${y}`) ?? "#ffffff";
        cells.push(
          <div
            key={`${x}-${y}`}
            style={{
              width: plotSizePx,
              height: plotSizePx,
              backgroundColor: color,
        
            }}
          />
        );
      }
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize.cols}, ${plotSizePx}px)`,
          gridTemplateRows: `repeat(${gridSize.rows}, ${plotSizePx}px)`,
          userSelect: "none",
        }}
      >
        {cells}
      </div>
    );
  }

  if (loading) return <div>Loading artworks...</div>;
  if (artworks.length === 0) return <div>No artworks submitted yet.</div>;

  return (
    <div className="space-y-6 max-w-screen-lg w-full">
        <div className="flex justify-end items-center mb-4">
  <label htmlFor="sortMode" className="mr-2 text-sm font-medium">Sort by:</label>
  <select
    id="sortMode"
    value={sortMode}
    onChange={(e) => setSortMode(e.target.value as 'votes' | 'date')}
    className="border border-gray-300 rounded px-2 py-1 text-sm"
  >
    <option value="votes">Most Votes</option>
    <option value="date">Newest</option>
  </select>
</div>
      {[...artworks]
  .sort((a, b) => {
    if (sortMode === 'votes') {
      const votesA = votesCount[a.id] ?? 0;
      const votesB = votesCount[b.id] ?? 0;
      return votesB - votesA; // descending vote count
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest first
    }
  })
  .map((artwork) => (
        <div
          key={artwork.id}
          className="border rounded p-4 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6"
        >
          {/* Artwork Preview */}
          {renderArtworkGrid(artwork.pixels)}

          {/* Info & voting */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="text-sm text-gray-600">
              Submitted: {new Date(artwork.created_at).toLocaleString()}
            </div>
            <div className="font-semibold text-lg">
              Votes: {votesCount[artwork.id] ?? 0}
            </div>
            <button
              className={`mt-2 px-4 py-1 rounded ${
                userVotes.has(artwork.id)
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              disabled={userVotes.has(artwork.id)}
              onClick={() => voteForArtwork(artwork.id)}
              type="button"
            >
              {userVotes.has(artwork.id) ? "Voted" : "Vote"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
