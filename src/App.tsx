import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import './index.css';
import PlotGrid from './components/PlotGrid';
import ResultsGrid from './components/ResultsGrid';

export default function App() {
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Toggle Button */}
      <button
        className="mb-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowResults(!showResults)}
      >
        {showResults ? 'Switch to Drawing Canvas' : 'Switch to Gallery'}
      </button>

      {/* Scrollable & centerable wrapper */}
      <div className="w-full overflow-x-auto">
        {/* Center content inside scroll area */}
        <div className="flex justify-center min-w-[512px]">
          {showResults ? <ResultsGrid /> : <PlotGrid />}
        </div>
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
}
