import { Toaster } from 'react-hot-toast';
import './index.css';
import PlotGrid from './components/PlotGrid';

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Scrollable horizontal wrapper */}
      <div className="w-full max-w-full overflow-x-auto">
        {/* Grid should size itself naturally */}
        <div className="inline-block">
          <PlotGrid />
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}