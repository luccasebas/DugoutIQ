import React, { useState, useEffect } from 'react';
import { Header, NavigationPage } from './components/Header';
import { SeasonUploadPage } from './components/SeasonUploadPage';
import { PlayerAnalysisPage } from './components/PlayerAnalysisPage';
import { CoachCheatSheet } from './components/CoachCheatSheet';
import { GameOuting, PlayerRole, PitcherOutingStats, HitterOutingStats } from './types/baseball';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeLeague, setActiveLeague] = useState('Summer Collegiate');
  const [currentPage, setCurrentPage] = useState<NavigationPage>('upload');
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Theme state: default to 'dark', sync with documentElement class and localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('dugoutiq_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('dugoutiq_theme', theme);
    } catch {
      // ignore
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize strictly EMPTY - do not include any players the user has not entered
  const [games, setGames] = useState<GameOuting[]>([]);
  const [reportText, setReportText] = useState<string>('');
  const [reportSource, setReportSource] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');
  const [failoverOccurred, setFailoverOccurred] = useState<boolean>(false);

  const handleAddGame = (newGame: GameOuting) => {
    setGames((prev) => [newGame, ...prev.filter((g) => g.gameId !== newGame.gameId)]);
  };

  const handleAddMultipleGames = (newGames: GameOuting[]) => {
    setGames((prev) => {
      const existingIds = new Set(newGames.map((g) => g.gameId));
      return [...newGames, ...prev.filter((g) => !existingIds.has(g.gameId))];
    });
  };

  const handleDeleteGame = (gameId: string) => {
    setGames((prev) => prev.filter((g) => g.gameId !== gameId));
  };

  const handleClearSeason = () => {
    setGames([]);
    setReportText('');
    setReportSource('');
    setModelUsed('');
    setFailoverOccurred(false);
  };

  const handleGenerateReport = async (payload: {
    rawInput: string;
    role: PlayerRole;
    playerName: string;
    outing: string;
    team: string;
    modelPreference?: string;
    pitcherStats?: PitcherOutingStats;
    hitterStats?: HitterOutingStats;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerInput: payload.rawInput,
          playerType: payload.role,
          playerName: payload.playerName,
          modelPreference: payload.modelPreference || 'gemini-3.1-flash-lite',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const generated = data.report || '';
      setReportText(generated);
      setReportSource(data.source || '');
      setModelUsed(data.modelUsed || '');
      setFailoverOccurred(Boolean(data.failoverOccurred));
    } catch (err: any) {
      console.error('Error generating report:', err);
      setErrorMessage('Failed to connect to analytics engine. Using collegiate rule fallback.');
    } finally {
      setIsLoading(false);
    }
  };

  const allPlayersCount = Array.from(new Set(games.flatMap((g) => [...g.pitchers, ...g.hitters]))).length;

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f4f6fa] text-slate-900' : 'bg-[#08101e] text-slate-100'} flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-150`}>
      {/* Header with Page Swapper */}
      <Header
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        gamesCount={games.length}
        playersCount={allPlayersCount}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        activeLeague={activeLeague}
        onChangeLeague={setActiveLeague}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* PAGE 1: CSV Upload Page */}
        {currentPage === 'upload' && (
          <SeasonUploadPage
            games={games}
            onAddGame={handleAddGame}
            onAddMultipleGames={handleAddMultipleGames}
            onDeleteGame={handleDeleteGame}
            onClearSeason={handleClearSeason}
            onNavigateToAnalysis={() => setCurrentPage('analysis')}
          />
        )}

        {/* PAGE 2: Select Player / Outing and Generate Report Page */}
        {currentPage === 'analysis' && (
          <PlayerAnalysisPage
            games={games}
            onGenerateReport={handleGenerateReport}
            reportText={reportText}
            reportSource={reportSource}
            modelUsed={modelUsed}
            failoverOccurred={failoverOccurred}
            isLoading={isLoading}
            onNavigateToUpload={() => setCurrentPage('upload')}
          />
        )}
      </main>

      {/* Ballpark Dugout Footer */}
      <footer className="bg-[#0a1526] border-t border-[#183154] py-4 px-6 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="font-semibold text-slate-300">⚾ DugoutIQ Player Development</span>
          <span className="text-orange-500">&bull;</span>
          <span className="text-orange-400 font-semibold tracking-wide uppercase font-baseball text-sm">Sonoma Stompers Edition</span>
          <span className="text-orange-500">&bull;</span>
          <span>Zero Jargon &bull; Feel Cues Policy</span>
        </div>
      </footer>

      {/* Coach Cheat Sheet Modal */}
      <CoachCheatSheet
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />
    </div>
  );
}
