import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Activity,
  History,
  Settings,
  PlusCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'scorer' | 'matches' | 'tournaments' | 'settings';
  setActiveTab: (tab: 'scorer' | 'matches' | 'tournaments' | 'settings') => void;
  onNewMatch: () => void;
  hasActiveMatch: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewMatch,
  hasActiveMatch,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0b101b]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('scorer')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-2xl">
              🏏
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-white">
                  Cric<span className="text-emerald-400">Flex</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Zero-DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Offline Cricket Scoring & AI Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('scorer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scorer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Scorer</span>
              {hasActiveMatch && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'matches'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tournaments'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Tournaments</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Actions: Offline Badge & New Match */}
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
              }`}
              title={isOnline ? 'Online (Gemini AI ready)' : 'Offline mode active (Local IndexedDB)'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* New Match Button */}
            <button
              onClick={onNewMatch}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-900/30 transition-all active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Match</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b101b]/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab('scorer')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'scorer' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span>Scorer</span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'matches' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5 mb-1" />
          <span>Matches</span>
        </button>
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'tournaments' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5 mb-1" />
          <span>Tournaments</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
