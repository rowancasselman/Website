import { Toaster } from 'react-hot-toast';
import './index.css';
import PlotGrid from './components/PlotGrid';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-wrap items-start justify-center w-full h-full">
          <PlotGrid />
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}