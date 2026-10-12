import React from 'react';
import { BookOpen, FileSpreadsheet, UserCheck, Sparkles, Activity, Sun, Moon } from 'lucide-react';

export type NavigationPage = 'upload' | 'analysis';

interface HeaderProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  gamesCount: number;
  playersCount: number;
  onOpenCheatSheet: () => void;
  activeLeague: string;
  onChangeLeague: (league: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onSelectPage,
  gamesCount,
  playersCount,
  onOpenCheatSheet,
  activeLeague,
  onChangeLeague,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="bg-[#0a1629]/95 border-b border-[#1c3860] border-t-2 border-t-orange-500 backdrop-blur sticky top-0 z-30 px-4 md:px-8 py-3 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-orange-950/70 font-black text-xl ring-2 ring-orange-400/30">
            ⚾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wider font-baseball uppercase">
                DugoutIQ
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-full font-mono">
                Stompers Player Dev Lab
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              TrackMan Ballpark Analytics &bull; Feel-Based Dugout Reports &bull; Zero Jargon
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Swap between CSV Upload & Player Analysis) */}
        <nav className="flex items-center bg-[#060e1b] p-1 rounded-xl border border-[#1a3458] shadow-inner">
          <button
            onClick={() => onSelectPage('upload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentPage === 'upload'
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-950/50'
                : 'text-slate-300 hover:text-white hover:bg-[#0f213b]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="tracking-wide">CSV Ballpark Upload</span>
            {gamesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                currentPage === 'upload' ? 'bg-orange-700 text-orange-100' : 'bg-[#142642] text-slate-300'
              }`}>
                {gamesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectPage('analysis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentPage === 'analysis'
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-950/50'
                : 'text-slate-300 hover:text-white hover:bg-[#0f213b]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="tracking-wide">Player Outing Analysis</span>
            {playersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                currentPage === 'analysis' ? 'bg-orange-700 text-orange-100' : 'bg-[#142642] text-slate-300'
              }`}>
                {playersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 md:px-3 md:py-1.5 rounded-xl bg-[#0f213b] hover:bg-[#162f55] border border-[#203f6d] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-xs font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden md:inline text-xs font-medium">Dark</span>
              </>
            )}
          </button>

          {/* Coach Translation Matrix Button */}
          <button
            onClick={onOpenCheatSheet}
            className="px-3 py-1.5 rounded-xl bg-[#0f213b] hover:bg-[#162f55] border border-[#203f6d] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Metric-to-Feel</span> Matrix
          </button>
        </div>
      </div>
    </header>
  );
};
