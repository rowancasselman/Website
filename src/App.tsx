import { Toaster } from 'react-hot-toast';
import './index.css';
import PlotGrid from './components/PlotGrid';

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Scrollable & centerable wrapper */}
      <div className="w-full overflow-x-auto">
        {/* Center content inside scroll area */}
        <div className="flex justify-center min-w-[512px]">
          <PlotGrid />
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}
