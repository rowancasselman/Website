import { Toaster } from 'react-hot-toast';
import './index.css';
import PlotGrid from './components/PlotGrid';

export default function App() {
  return (
    <div
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="w-full max-w-screen-md overflow-x-auto">
        <PlotGrid />
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}