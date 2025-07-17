import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Wish = {
    id: number;
    wallet: string;
    wish: string;
    timestamp: string;
    tokens_burned: number;
};

export default function WishList() {
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    const fetchWishes = async () => {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
    
    console.log('DATA:', data);

      if (error) {
        console.error('Error fetching wishes:', error);
      } else {
        setWishes(data || []);
      }
    };

    fetchWishes();
  }, []);

  return (
    <div className="mt-8 w-full max-w-3xl mx-auto mb-24">
      <h2 className="text-2xl font-bold mb-4 text-center">Recent Wishes</h2>
      <div className="flex justify-center w-full">
        <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
            <tr className="bg-gray-200">
                <th className="p-2 border text-black border-gray-300">Wallet</th>
                <th className="p-2 border text-black border-gray-300">Wish</th>
                <th className="p-2 border text-black border-gray-300">Tokens Burned</th>
                <th className="p-2 border text-black border-gray-300">Timestamp</th>
            </tr>
            </thead>
            <tbody>
            {wishes.map((wish) => (
                <tr key={wish.id} className="bg-white hover:bg-gray-50">
                <td className="p-2 border text-black border-gray-300">{wish.wallet}</td>
                <td className="p-2 border text-black border-gray-300">{wish.wish}</td>
                <td className="p-2 border text-black border-gray-300">{wish.tokens_burned.toLocaleString()}</td>
                <td className="p-2 border text-black border-gray-300">
                    {new Date(wish.timestamp).toLocaleString()}
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}