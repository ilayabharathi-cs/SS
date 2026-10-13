import React from 'react';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 max-w-md w-full flex flex-col items-center shadow-2xl">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 mb-4">
          <ServerCrash className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Backend Connection Error</h2>
        
        <p className="text-xs text-rose-300/80 bg-rose-950/40 p-3 rounded-lg border border-rose-900/50 mb-6 font-mono text-left w-full">
          {error}
        </p>

        <p className="text-xs text-slate-400 mb-6">
          Please verify that the SmartShield FastAPI backend server is running on <code className="text-cyan-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{API_BASE_URL}</code>.
        </p>

        <button
          onClick={onRetry}
          className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Reconnect to Backend
        </button>
      </div>
    </div>
  );
};
