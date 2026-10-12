import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Users, 
  AlertCircle, 
  Shield, 
  FileText,
  FileCode,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { GameOuting } from '../types/baseball';
import { parseTrackmanCSV } from '../utils/csvParser';
import { parsePostgameJSON } from '../utils/jsonParser';
import { formatRealTeamName } from '../utils/teamNames';
import { CCL_SAMPLE_CSV } from '../data/sampleCCLGame';
import { SAMPLE_POSTGAME_JSON } from '../data/samplePostgameJSON';

interface SeasonUploadPageProps {
  games: GameOuting[];
  onAddGame: (game: GameOuting) => void;
  onAddMultipleGames: (games: GameOuting[]) => void;
  onDeleteGame: (gameId: string) => void;
  onClearSeason: () => void;
  onNavigateToAnalysis: () => void;
}

export const SeasonUploadPage: React.FC<SeasonUploadPageProps> = ({
  games,
  onAddGame,
  onAddMultipleGames,
  onDeleteGame,
  onClearSeason,
  onNavigateToAnalysis,
}) => {
  // Refs for file pickers
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Drag states
  const [isCsvDragging, setIsCsvDragging] = useState(false);
  const [isJsonDragging, setIsJsonDragging] = useState(false);

  // Paste & Modal states
  const [csvPasteMode, setCsvPasteMode] = useState(false);
  const [jsonPasteMode, setJsonPasteMode] = useState(false);
  const [pastedCsv, setPastedCsv] = useState('');
  const [pastedCsvGameName, setPastedCsvGameName] = useState('');
  const [pastedJson, setPastedJson] = useState('');
  const [pastedJsonGameName, setPastedJsonGameName] = useState('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedJsonSchema, setCopiedJsonSchema] = useState(false);

  // Handle CSV file uploads
  const handleCsvFiles = (fileList: FileList) => {
    setNotification(null);
    const newGames: GameOuting[] = [];
    let errorCount = 0;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parseTrackmanCSV(text, file.name);
          newGames.push(parsed);
          if (newGames.length + errorCount === fileList.length) {
            onAddMultipleGames(newGames);
            setNotification({
              message: `Successfully loaded ${newGames.length} CSV game(s). Cleaned and sorted teams, pitchers, and hitters.`,
              type: 'success',
            });
          }
        } catch (err: any) {
          errorCount++;
          console.error(`Error parsing ${file.name}:`, err);
          setNotification({
            message: `Failed to parse ${file.name}. Ensure it contains valid comma-separated tracking rows.`,
            type: 'error',
          });
        }
      };
      reader.readAsText(file);
    });
  };

  // Handle JSON file uploads
  const handleJsonFiles = (fileList: FileList) => {
    setNotification(null);
    const newGames: GameOuting[] = [];
    let errorCount = 0;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parsePostgameJSON(text, file.name);
          newGames.push(...parsed);
          if (newGames.length + errorCount === fileList.length) {
            onAddMultipleGames(newGames);
            setNotification({
              message: `Successfully loaded ${newGames.length} JSON game(s) into your season database.`,
              type: 'success',
            });
          }
        } catch (err: any) {
          errorCount++;
          console.error(`Error parsing JSON ${file.name}:`, err);
          setNotification({
            message: `Failed to parse ${file.name}: ${err.message}`,
            type: 'error',
          });
        }
      };
      reader.readAsText(file);
    });
  };

  // Submit Pasted CSV
  const handlePastedCsvSubmit = () => {
    if (!pastedCsv.trim()) return;
    try {
      const gameName = pastedCsvGameName.trim() || `Game_${games.length + 1}.csv`;
      const parsed = parseTrackmanCSV(pastedCsv, gameName);
      onAddGame(parsed);
      setPastedCsv('');
      setPastedCsvGameName('');
      setCsvPasteMode(false);
      setNotification({
        message: `Pasted CSV cleaned and sorted successfully (${parsed.teams.join(' vs ')}).`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to parse pasted CSV text.',
        type: 'error',
      });
    }
  };

  // Submit Pasted JSON
  const handlePastedJsonSubmit = () => {
    if (!pastedJson.trim()) return;
    try {
      const gameName = pastedJsonGameName.trim() || `Postgame_${games.length + 1}.json`;
      const parsedGames = parsePostgameJSON(pastedJson, gameName);
      onAddMultipleGames(parsedGames);
      setPastedJson('');
      setPastedJsonGameName('');
      setJsonPasteMode(false);
      setNotification({
        message: `Loaded ${parsedGames.length} postgame summary JSON record(s) successfully.`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to parse pasted JSON data.',
        type: 'error',
      });
    }
  };

  // Quick Action: Load California Collegiate League (CCL) real game CSV
  const handleLoadCCLSample = () => {
    try {
      const parsed = parseTrackmanCSV(CCL_SAMPLE_CSV, '2026-07-26_SON_STO_vs_ALA_MER.csv');
      onAddGame(parsed);
      setNotification({
        message: 'Loaded real California Collegiate League game: Sonoma Stompers (SON_STO) vs Alameda Merchants (ALA_MER)!',
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: 'Failed to parse CCL sample CSV.',
        type: 'error',
      });
    }
  };

  // Quick Action: Load Sample Postgame JSON
  const handleLoadSampleJSON = () => {
    try {
      const parsedGames = parsePostgameJSON(SAMPLE_POSTGAME_JSON, 'Sample_Chatham_vs_Harwich.json');
      onAddMultipleGames(parsedGames);
      setNotification({
        message: 'Loaded Sample Postgame JSON: Chatham Anglers vs Harwich Mariners!',
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: 'Failed to parse sample postgame JSON.',
        type: 'error',
      });
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SAMPLE_POSTGAME_JSON);
    setCopiedJsonSchema(true);
    setTimeout(() => setCopiedJsonSchema(false), 2000);
  };

  const allPitchers = Array.from(new Set(games.flatMap((g) => g.pitchers)));
  const allHitters = Array.from(new Set(games.flatMap((g) => g.hitters)));
  const allTeams = Array.from(new Set(games.flatMap((g) => g.teams.map((t) => formatRealTeamName(t)))));

  return (
    <div className="space-y-6">
      {/* Ballpark Dugout Header Banner */}
      <div className="bg-[#0a1629] border border-[#1b355c] border-l-4 border-l-orange-500 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-baseball text-lg">
              Ballpark Season Games & Postgame Data
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload raw TrackMan/Statcast game CSVs or postgame summary JSONs. DugoutIQ cleans and separates hitting and pitching by team, enabling roster breakdown and feel-based dugout reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {games.length > 0 && (
            <button
              onClick={onNavigateToAnalysis}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-950/60 cursor-pointer"
            >
              <span className="tracking-wide">Select Team & Player ({allPitchers.length + allHitters.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
          notification.type === 'success'
            ? 'bg-[#0a2318]/90 border-emerald-500/40 text-emerald-200'
            : 'bg-red-950/80 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white font-bold ml-2 text-sm leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2 MAIN UPLOAD BOXES: RAW CSV DATA & POSTGAME SUMMARY JSON                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ================= BOX 1: RAW CSV DATA UPLOAD ================= */}
        <div className="bg-[#0a1629] border border-[#1b355c] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#183154] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-baseball text-base">
                    Box 1: Raw TrackMan CSV Upload
                  </h3>
                  <span className="text-[10px] text-slate-400">TrackMan &bull; Statcast &bull; Single or Multiple Games</span>
                </div>
              </div>

              <button
                onClick={() => setCsvPasteMode(!csvPasteMode)}
                className="text-[11px] text-slate-300 hover:text-orange-400 font-semibold px-2 py-1 rounded bg-[#0f213b] border border-[#1e3b68] transition-colors cursor-pointer"
              >
                {csvPasteMode ? 'Upload Mode' : 'Paste CSV'}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Upload raw pitch-by-pitch tracking logs. DugoutIQ automatically cleans player names, separates Home & Away teams, and extracts pitching shapes and batted ball velocities.
            </p>
          </div>

          {!csvPasteMode ? (
            /* CSV Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsCsvDragging(true);
              }}
              onDragLeave={() => setIsCsvDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsCsvDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleCsvFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => csvFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
                isCsvDragging
                  ? 'border-orange-400 bg-orange-950/30 ring-2 ring-orange-500/20'
                  : 'border-[#1b3760] bg-[#060e1b] hover:border-orange-500/50 hover:bg-[#081324]'
              }`}
            >
              <input
                type="file"
                ref={csvFileInputRef}
                multiple
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleCsvFiles(e.target.files);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-[#0d1c33] border border-[#1c3862] flex items-center justify-center text-orange-400 mb-2 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5 tracking-wide">
                Drop CSV Game Files Here
              </h4>
              <p className="text-[11px] text-slate-400 mb-2">
                Click to browse (single or multiple .csv / .txt)
              </p>
              <span className="text-[10px] font-mono text-orange-300 bg-[#0c192d] px-2 py-0.5 rounded border border-[#1b355c]">
                Auto-sorts 2 teams (Pitching & Hitting)
              </span>
            </div>
          ) : (
            /* CSV Paste Area */
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Game Name / Date (e.g. 2026-07-26_SON_STO_vs_ALA_MER.csv)"
                value={pastedCsvGameName}
                onChange={(e) => setPastedCsvGameName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#060e1b] border border-[#1b3760] text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
              <textarea
                rows={6}
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                placeholder="Paste TrackMan CSV rows with header (Pitcher, PitchType, RelSpeed...)"
                className="w-full p-2.5 font-mono text-[11px] rounded-lg bg-[#060e1b] border border-[#1b3760] text-slate-200 focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCsvPasteMode(false)}
                  className="px-3 py-1.5 bg-[#0f213b] hover:bg-[#152e52] text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePastedCsvSubmit}
                  disabled={!pastedCsv.trim()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-[#0f213b] text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  Parse & Add CSV
                </button>
              </div>
            </div>
          )}

          {/* Quick Helper Button */}
          <div className="pt-2 border-t border-[#183154] flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Need sample TrackMan data?</span>
            <button
              onClick={handleLoadCCLSample}
              className="px-2.5 py-1 rounded-lg bg-[#0f213b] hover:bg-[#152e52] text-slate-200 border border-[#1e3d6b] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Load CCL Game (SON_STO vs ALA_MER)</span>
            </button>
          </div>
        </div>

        {/* ================= BOX 2: POSTGAME SUMMARY JSON UPLOAD ================= */}
        <div className="bg-[#0a1629] border border-[#1b355c] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#183154] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-baseball text-base">
                    Box 2: Postgame Summary JSON Upload
                  </h3>
                  <span className="text-[10px] text-slate-400">Structured Summary JSON &bull; Pitcher & Hitter Outings</span>
                </div>
              </div>

              <button
                onClick={() => setJsonPasteMode(!jsonPasteMode)}
                className="text-[11px] text-slate-300 hover:text-blue-400 font-semibold px-2 py-1 rounded bg-[#0f213b] border border-[#1e3b68] transition-colors cursor-pointer"
              >
                {jsonPasteMode ? 'Upload Mode' : 'Paste JSON'}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Upload pre-calculated postgame summaries or exported analytics JSON. Supports team rosters, pitch mix breakdowns, velo drops, and batted ball metrics.
            </p>
          </div>

          {!jsonPasteMode ? (
            /* JSON Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsJsonDragging(true);
              }}
              onDragLeave={() => setIsJsonDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsJsonDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleJsonFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => jsonFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
                isJsonDragging
                  ? 'border-blue-400 bg-blue-950/30 ring-2 ring-blue-500/20'
                  : 'border-[#1b3760] bg-[#060e1b] hover:border-blue-400/50 hover:bg-[#081324]'
              }`}
            >
              <input
                type="file"
                ref={jsonFileInputRef}
                multiple
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleJsonFiles(e.target.files);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-[#0d1c33] border border-[#1c3862] flex items-center justify-center text-blue-400 mb-2 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5 tracking-wide">
                Drop Postgame JSON Files Here
              </h4>
              <p className="text-[11px] text-slate-400 mb-2">
                Click to browse (.json files)
              </p>
              <span className="text-[10px] font-mono text-blue-300 bg-[#0c192d] px-2 py-0.5 rounded border border-[#1b355c]">
                Supports GameOuting &bull; Summary Objects &bull; TrackMan JSON
              </span>
            </div>
          ) : (
            /* JSON Paste Area */
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Game Label (e.g. 2026-07-28_Chatham_vs_Harwich.json)"
                value={pastedJsonGameName}
                onChange={(e) => setPastedJsonGameName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#060e1b] border border-[#1b3760] text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <textarea
                rows={6}
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder='Paste postgame JSON here (e.g. { "gameDate": "2026-07-28", "pitchers": [...] })'
                className="w-full p-2.5 font-mono text-[11px] rounded-lg bg-[#060e1b] border border-[#1b3760] text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setJsonPasteMode(false)}
                  className="px-3 py-1.5 bg-[#0f213b] hover:bg-[#152e52] text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePastedJsonSubmit}
                  disabled={!pastedJson.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#0f213b] text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  Parse & Add JSON
                </button>
              </div>
            </div>
          )}

          {/* Quick Helper Buttons for JSON */}
          <div className="pt-2 border-t border-[#183154] flex flex-wrap items-center justify-between text-xs gap-2">
            <button
              onClick={handleCopySchema}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              title="Copy sample JSON structure to clipboard"
            >
              {copiedJsonSchema ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJsonSchema ? 'Schema Copied!' : 'Copy JSON Format'}</span>
            </button>

            <button
              onClick={handleLoadSampleJSON}
              className="px-2.5 py-1 rounded-lg bg-[#0f213b] hover:bg-[#152e52] text-slate-200 border border-[#1e3d6b] text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Sample Postgame JSON</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= SUMMARY METRICS BAR ================= */}
      {games.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0a1629] border border-[#1b355c] rounded-xl p-3.5 flex items-center gap-3 shadow-md">
            <div className="p-2.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Games Uploaded</div>
              <div className="text-lg font-bold text-white font-baseball tracking-wide text-xl">{games.length} Outings</div>
            </div>
          </div>

          <div className="bg-[#0a1629] border border-[#1b355c] rounded-xl p-3.5 flex items-center gap-3 shadow-md">
            <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Teams Detected</div>
              <div className="text-lg font-bold text-white font-baseball tracking-wide text-xl">{allTeams.length} Teams</div>
            </div>
          </div>

          <div className="bg-[#0a1629] border border-[#1b355c] rounded-xl p-3.5 flex items-center gap-3 shadow-md">
            <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Pitchers in Data</div>
              <div className="text-lg font-bold text-white font-baseball tracking-wide text-xl">{allPitchers.length} Arms</div>
            </div>
          </div>

          <div className="bg-[#0a1629] border border-[#1b355c] rounded-xl p-3.5 flex items-center gap-3 shadow-md">
            <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Hitters in Data</div>
              <div className="text-lg font-bold text-white font-baseball tracking-wide text-xl">{allHitters.length} Bats</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLEANED SEASON GAMES LIST ================= */}
      <div className="bg-[#0a1629] border border-[#1b355c] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#183154] pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-baseball text-sm">
              Cleaned Season Games ({games.length})
            </h3>
          </div>

          {games.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={onClearSeason}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Games</span>
              </button>
            </div>
          )}
        </div>

        {games.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs space-y-2">
            <p>No season games uploaded yet.</p>
            <p className="text-slate-500">
              Upload files into Box 1 (CSV) or Box 2 (JSON) above, or click the sample buttons to explore collegiate TrackMan data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {games.map((g, gIdx) => (
              <div
                key={`${g.gameId}_${g.fileName || ''}_${gIdx}`}
                className="p-4 rounded-xl bg-[#060e1b] border border-[#183154] hover:border-orange-500/50 hover:bg-[#081324] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 font-semibold">{g.gameDate}</span>
                      <h4 className="text-base font-bold text-white truncate mt-0.5 font-baseball tracking-wide">{g.opponent}</h4>
                    </div>
                    <button
                      onClick={() => onDeleteGame(g.gameId)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Total Pitches / Events:</span>
                      <span className="font-mono font-bold text-white">{g.totalPitches}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Teams:</span>
                      <span className="truncate max-w-[170px] font-semibold text-orange-300">
                        {g.teams.map((t) => formatRealTeamName(t)).join(' vs ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Pitchers:</span>
                      <span className="truncate max-w-[170px] font-medium text-slate-300">{g.pitchers.join(', ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Hitters:</span>
                      <span className="truncate max-w-[170px] font-medium text-slate-300">{g.hitters.join(', ') || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#183154] flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[150px] font-mono">{g.fileName}</span>
                  <span className="text-orange-400 flex items-center gap-1 font-semibold text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" /> Cleaned & Sorted
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
