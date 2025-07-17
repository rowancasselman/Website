import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path as needed

// Define your Wish type here:
interface Wish {
  id: number;
  wallet: string;
  wish: string;
  timestamp: string;
  tokens_burned: number;
}

export default function WishArchive() {
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    async function fetchWishes() {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error(error);
      } else if (data) {
        setWishes(data as Wish[]);
      }
    }
    fetchWishes();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-8 text-white">
      <h2 className="text-xl font-bold mb-4">Wish Archive</h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {wishes.map(({ id, wish, wallet, tokens_burned, timestamp }) => (
          <li key={id} className="border-b border-gray-600 pb-2">
            <p>"{wish}"</p>
            <p className="text-xs text-gray-400">
              {wallet} — {tokens_burned.toLocaleString()} tokens — {new Date(timestamp).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}