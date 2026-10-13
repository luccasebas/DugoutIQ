import React, { useState, useEffect, useMemo } from 'react';
import { GameOuting, PlayerRole, PitcherOutingStats, HitterOutingStats } from '../types/baseball';
import { calculatePitcherOuting, calculateHitterOuting } from '../utils/csvParser';
import { formatRealTeamName } from '../utils/teamNames';
import { ActionableVisuals } from './ActionableVisuals';
import { ReportOutput } from './ReportOutput';
import { 
  Users, 
  Shield, 
  Sparkles, 
  ChevronRight, 
  FileSpreadsheet, 
  Activity, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PlayerAnalysisPageProps {
  games: GameOuting[];
  onGenerateReport: (payload: {
    rawInput: string;
    role: PlayerRole;
    playerName: string;
    outing: string;
    team: string;
    modelPreference: string;
    pitcherStats?: PitcherOutingStats;
    hitterStats?: HitterOutingStats;
  }) => void;
  reportText: string;
  reportSource?: string;
  modelUsed?: string;
  failoverOccurred?: boolean;
  isLoading: boolean;
  onNavigateToUpload: () => void;
}

export const PlayerAnalysisPage: React.FC<PlayerAnalysisPageProps> = ({
  games,
  onGenerateReport,
  reportText,
  reportSource,
  modelUsed,
  failoverOccurred,
  isLoading,
  onNavigateToUpload,
}) => {
  // If no games uploaded, display empty state prompting CSV upload
  if (games.length === 0) {
    return (
      <div className="bg-[#0a1629] border border-[#1b355c] border-t-4 border-t-orange-500 rounded-2xl p-12 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#0d1e38] border border-[#1e3d6b] flex items-center justify-center text-3xl mx-auto text-orange-400 shadow-inner">
          ⚾
        </div>
        <h3 className="text-xl font-bold text-white font-baseball tracking-wider uppercase">No Season Games Uploaded Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload your season TrackMan CSV or summary JSON files to populate your team rosters. DugoutIQ strictly shows only players from your verified game tracking records.
        </p>
        <button
          onClick={onNavigateToUpload}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/60 transition-all inline-flex items-center gap-2 cursor-pointer font-scoreboard tracking-wide"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Go to Ballpark CSV Upload</span>
        </button>
      </div>
    );
  }

  // Derive all unique teams strictly from the uploaded games using real official names
  const teamsMap = useMemo(() => {
    const map = new Map<string, { pitchers: Set<string>; hitters: Set<string> }>();

    for (const g of games) {
      for (const [rawTeamName, roster] of Object.entries(g.teamRosters)) {
        const teamName = formatRealTeamName(rawTeamName);
        if (!map.has(teamName)) {
          map.set(teamName, { pitchers: new Set(), hitters: new Set() });
        }
        roster.pitchers.forEach((p) => map.get(teamName)!.pitchers.add(p));
        roster.hitters.forEach((h) => map.get(teamName)!.hitters.add(h));
      }
    }
    return map;
  }, [games]);

  const teamNames = Array.from(teamsMap.keys()).sort();

  // State: Selected Team
  const [selectedTeam, setSelectedTeam] = useState<string>(teamNames[0] || '');

  // Ensure selected team is valid
  useEffect(() => {
    if (!teamsMap.has(selectedTeam) && teamNames.length > 0) {
      setSelectedTeam(teamNames[0]);
    }
  }, [teamNames, selectedTeam, teamsMap]);

  // Athletes belonging strictly to the selected team
  const currentTeamRoster = useMemo(() => {
    const roster = teamsMap.get(selectedTeam);
    const pitchers = roster ? Array.from(roster.pitchers).sort() : [];
    const hitters = roster ? Array.from(roster.hitters).sort() : [];
    return { pitchers, hitters };
  }, [teamsMap, selectedTeam]);

  // State: Role filter within team
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Pitcher' | 'Hitter'>('ALL');

  // Filtered athlete names for the selected team
  const teamAthletes = useMemo(() => {
    if (roleFilter === 'Pitcher') return currentTeamRoster.pitchers;
    if (roleFilter === 'Hitter') return currentTeamRoster.hitters;
    return Array.from(new Set([...currentTeamRoster.pitchers, ...currentTeamRoster.hitters])).sort();
  }, [currentTeamRoster, roleFilter]);

  // State: Selected Athlete
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');

  // Auto-select first athlete when team or filter changes
  useEffect(() => {
    if (!teamAthletes.includes(selectedAthlete)) {
      setSelectedAthlete(teamAthletes[0] || '');
    }
  }, [teamAthletes, selectedAthlete]);

  // Determine available roles for selected athlete
  const canPitch = currentTeamRoster.pitchers.includes(selectedAthlete);
  const canHit = currentTeamRoster.hitters.includes(selectedAthlete);

  const [activeRole, setActiveRole] = useState<PlayerRole>('Pitcher');

  // Synchronize activeRole with athlete's available roles and roleFilter
  useEffect(() => {
    if (roleFilter === 'Pitcher') {
      setActiveRole('Pitcher');
    } else if (roleFilter === 'Hitter') {
      setActiveRole('Hitter');
    } else if (canPitch && !canHit) {
      setActiveRole('Pitcher');
    } else if (canHit && !canPitch) {
      setActiveRole('Hitter');
    }
  }, [selectedAthlete, roleFilter, canPitch, canHit]);

  const isPitcher = activeRole === 'Pitcher';
  const playerRole: PlayerRole = activeRole;

  // Find games this athlete participated in
  const athleteGames = useMemo(() => {
    if (!selectedAthlete) return [];
    return games.filter((g) => {
      if (isPitcher) return g.pitchers.includes(selectedAthlete);
      return g.hitters.includes(selectedAthlete);
    });
  }, [games, selectedAthlete, isPitcher]);

  // State: Selected Outing
  const [selectedGameId, setSelectedGameId] = useState<string>('ALL');

  // State: AI Model version (Gemini 3.1 Flash Lite offers high traffic resilience)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');

  // Pitches for this athlete's selected outing
  const activePitches = useMemo(() => {
    if (!selectedAthlete) return [];
    if (selectedGameId === 'ALL') {
      return athleteGames.flatMap((g) => g.pitches);
    }
    const match = athleteGames.find((g) => g.gameId === selectedGameId);
    return match ? match.pitches : [];
  }, [athleteGames, selectedGameId, selectedAthlete]);

  const formatOutingDisplay = (gameDate: string, opponent: string): string => {
    if (!opponent) return gameDate || 'Outing';
    // Remove any redundant leading "vs" so date is not shown as "date vs team"
    const cleanOpponent = opponent.replace(/^vs\.?\s+/i, '').trim();
    return `${gameDate} - ${cleanOpponent}`;
  };

  const activeGame = athleteGames.find((g) => g.gameId === selectedGameId);
  const outingLabel = activeGame
    ? formatOutingDisplay(activeGame.gameDate, activeGame.opponent)
    : `Season Aggregate (${athleteGames.length} ${athleteGames.length === 1 ? 'Outing' : 'Outings'})`;

  // Calculate stats strictly for this athlete and outing
  const pitcherStats = useMemo(() => {
    if (!isPitcher || !activePitches.length || !selectedAthlete) return null;
    return calculatePitcherOuting(
      activePitches,
      selectedAthlete,
      activeGame?.gameDate || 'Season',
      activeGame?.opponent || 'Opponents'
    );
  }, [isPitcher, activePitches, selectedAthlete, activeGame]);

  const hitterStats = useMemo(() => {
    if (isPitcher || !activePitches.length || !selectedAthlete) return null;
    return calculateHitterOuting(
      activePitches,
      selectedAthlete,
      activeGame?.gameDate || 'Season',
      activeGame?.opponent || 'Opponents'
    );
  }, [isPitcher, activePitches, selectedAthlete, activeGame]);

  const handleGenerateClick = () => {
    if (!selectedAthlete) return;

    let trackingSummaryText = '';

    if (isPitcher && pitcherStats) {
      const p = pitcherStats;
      trackingSummaryText = `Player: ${p.playerName} (Pitcher, ${selectedTeam}) | Outing: ${outingLabel} (Total Pitches: ${p.totalPitches}, Innings: ${p.innings.join(', ')})
TrackMan Pitch Tracking & Velo Metrics:
- Peak Velocity: ${p.peakVelo} mph, Fastball Velocity: ${p.fastballVelo} mph avg
- Overall Pitch Movement: Average IVB (Vert Break): ${p.avgIvb > 0 ? `+${p.avgIvb}` : p.avgIvb}", Average HB (Horz Break): ${p.avgHb > 0 ? `+${p.avgHb}` : p.avgHb}"
- Inning Endurance / Fatigue: Innings 1-3 Avg: ${p.earlyVelo} mph, Innings 4+ Avg: ${p.lateVelo} mph, Late Velocity Drop: ${p.lateVeloDrop} mph
- Pitch Repertoire & Shape:
${p.pitchMix.map((m) => `  * ${m.pitch}: ${m.avgVelo} mph avg (Peak: ${m.peakVelo || m.avgVelo} mph), IVB (Vert Break): ${m.ivb > 0 ? `+${m.ivb}` : m.ivb}", HB (Horz Break): ${m.hb > 0 ? `+${m.hb}` : m.hb}", Whiff%: ${m.whiffPct}%, Usage: ${m.usage}% (${m.count} pitches thrown)`).join('\n')}
- Command & Plate Discipline:
  * Whiff%: ${p.whiffPct}%
  * CSW% (Called Strikes + Whiffs): ${p.cswPct}% (${p.cswPct >= 30 ? 'Elite benchmark >=30%' : 'Below 30% collegiate benchmark'})
  * Zone%: ${p.zonePct}% (Pitches in Strike Zone)
  * Chase% (O-Swing): ${p.chasePct}% (Swings at pitches out of zone)
- Notes: Evaluated across ${p.innings.length} innings from CSV tracking records.`;
    } else if (!isPitcher && hitterStats) {
      const h = hitterStats;
      trackingSummaryText = `Player: ${h.playerName} (Hitter, ${selectedTeam}) | Outing: ${outingLabel} (Plate Appearances: ${h.plateAppearances}, At-Bats: ${h.atBats})
Traditional Box Score & Slash Metrics:
- Batting Average: ${h.battingAverage} (${h.hits} hits in ${h.atBats} AB)
- On-Base Percentage (OBP): ${h.obp} (${h.walks} BB, ${h.plateAppearances} PA)
- Slugging Percentage (SLG): ${h.slg} (${h.homeRuns} HR, ${h.doubles} 2B, ${h.triples} 3B, ${h.singles} 1B)
- OPS: ${h.ops} (OBP + SLG)
- Strikeouts: ${h.strikeouts}, Walks: ${h.walks}
TrackMan / Statcast Batted Ball & Distance Metrics:
- Hit Distance: Max ${h.maxDistance} ft, Avg ${h.avgDistance} ft
- Exit Velocity (Fair Balls Only, Excludes Foul Balls): Max ${h.maxExitVelo} mph, 90th Percentile ${h.ev90th} mph, Avg ${h.avgExitVelo} mph
- Hard-Hit Rate (95+ mph): ${h.hardHitPct}% (${h.battedBallsCount} fair batted balls tracked)
- Launch Angle Profile: Avg ${h.avgLaunchAngle}°, SweetSpot% (8°-32° Line Drive Window): ${h.sweetSpotPct}%
- Plate Discipline & Zone: Zone Contact%: ${h.zoneContactPct}%, Chase% (O-Swing): ${h.chasePct}%, Pitches Seen: ${h.pitchesSeen}
- Spray Direction: Pull ${h.sprayDirection.pull}%, Center ${h.sprayDirection.center}%, Oppo ${h.sprayDirection.oppo}%`;
    } else {
      trackingSummaryText = `Player: ${selectedAthlete} (${playerRole}, ${selectedTeam}) | Outing: ${outingLabel}\nPitches tracked: ${activePitches.length}`;
    }

    onGenerateReport({
      rawInput: trackingSummaryText,
      role: playerRole,
      playerName: selectedAthlete,
      outing: outingLabel,
      team: selectedTeam,
      modelPreference: selectedModel,
      pitcherStats: pitcherStats || undefined,
      hitterStats: hitterStats || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* ================= TEAM & ATHLETE SELECTION AREA ================= */}
      <div className="bg-white dark:bg-[#0a1629] border border-slate-200 dark:border-[#1b355c] border-l-4 border-l-orange-500 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#183154] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white font-baseball text-lg">
              Team & Athlete Roster Selection
            </h2>
          </div>

          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {teamNames.length} {teamNames.length === 1 ? 'Team' : 'Teams'} &bull; <span className="text-orange-600 dark:text-orange-400 font-bold">{teamAthletes.length}</span> Athletes Found
          </span>
        </div>

        {/* 3 Step Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* STEP 1: Select Team */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 font-baseball text-xs">
                <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold border border-orange-500/30">1</span>
                <span>Select Team</span>
              </label>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">From CSVs</span>
            </div>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0a1629] border border-slate-300 dark:border-[#1c3860] text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {teamNames.map((tName) => {
                const roster = teamsMap.get(tName);
                const count = (roster?.pitchers.size || 0) + (roster?.hitters.size || 0);
                return (
                  <option key={tName} value={tName}>
                    ⚾ {tName} ({count} {count === 1 ? 'Player' : 'Players'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* STEP 2: Select Athlete from Selected Team */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 font-baseball text-xs">
                <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold border border-orange-500/30">2</span>
                <span>Select Athlete</span>
              </label>
              
              {/* Role filter pills */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${roleFilter === 'ALL' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-[#0a1629] border border-slate-200 dark:border-transparent'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('Pitcher')}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${roleFilter === 'Pitcher' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-[#0a1629] border border-slate-200 dark:border-transparent'}`}
                >
                  Pitchers
                </button>
                <button
                  onClick={() => setRoleFilter('Hitter')}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${roleFilter === 'Hitter' ? 'bg-orange-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white bg-slate-100 dark:bg-[#0a1629] border border-slate-200 dark:border-transparent'}`}
                >
                  Hitters
                </button>
              </div>
            </div>

            {teamAthletes.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-1">No athletes found for this team</div>
            ) : (
              <select
                value={selectedAthlete}
                onChange={(e) => setSelectedAthlete(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0a1629] border border-slate-300 dark:border-[#1c3860] text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {teamAthletes.map((name) => {
                  const athleteIsPitcher = currentTeamRoster.pitchers.includes(name);
                  return (
                    <option key={name} value={name}>
                      {athleteIsPitcher ? '⚾' : '🎯'} {name} ({athleteIsPitcher ? 'Pitcher' : 'Hitter'})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* STEP 3: Select Outing & Generate */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060e1b] border border-slate-200 dark:border-[#183154] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 font-baseball text-xs">
                <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold border border-orange-500/30">3</span>
                <span>Select Outing & Generate</span>
              </label>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                {athleteGames.length} {athleteGames.length === 1 ? 'Outing' : 'Outings'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0a1629] border border-slate-300 dark:border-[#1c3860] text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer truncate"
              >
                <option value="ALL">Season Total ({athleteGames.length} Outings)</option>
                {athleteGames.map((g, gIdx) => (
                  <option key={`${g.gameId}_${gIdx}`} value={g.gameId}>
                    {formatOutingDisplay(g.gameDate, g.opponent)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !selectedAthlete}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-[#0f213b] disabled:text-slate-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-orange-950/60 shrink-0 cursor-pointer flex items-center gap-1.5 font-baseball tracking-wide"
                title="Generate Coach Dugout Report"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-orange-200" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Engine Version Swapper */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#183154] flex items-center justify-between gap-1.5">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span>AI Version:</span>
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-[10px] px-2 py-1 rounded-md bg-white dark:bg-[#0a1629] border border-slate-300 dark:border-[#1c3860] text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer truncate"
                title="Select Gemini version to handle high-traffic spikes"
              >
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Traffic & Fast)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest (Balanced Speed)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Standard)</option>
                <option value="auto">Auto (Smart Failover)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Athlete Active Badge */}
        {selectedAthlete && (
          <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-[#183154]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base font-baseball tracking-wide">{selectedAthlete}</span>
              <span className="text-orange-600 dark:text-orange-500 font-black">&bull;</span>
              <span className="text-orange-700 dark:text-orange-400 font-bold">{selectedTeam}</span>
              {canPitch && canHit ? (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#060e1b] border border-slate-300 dark:border-[#1c3860] p-0.5 rounded-md text-[10px]">
                  <button
                    onClick={() => setActiveRole('Pitcher')}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      activeRole === 'Pitcher' ? 'bg-orange-600 text-white font-bold' : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    ⚾ Pitcher
                  </button>
                  <button
                    onClick={() => setActiveRole('Hitter')}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      activeRole === 'Hitter' ? 'bg-orange-600 text-white font-bold' : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    🎯 Hitter
                  </button>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 font-mono">
                  {playerRole}
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500">&bull;</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{outingLabel}</span>
            </div>

            <div className="font-mono text-[11px] text-orange-800 dark:text-orange-300/80 bg-orange-50 dark:bg-[#060e1b] px-2.5 py-0.5 rounded border border-orange-200 dark:border-[#183154] font-medium">
              {activePitches.length} Pitches Evaluated Strictly From Uploaded CSVs
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Split: Actionable Visuals & Jargon-Free Coach Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Actionable Visuals (Scatterplots, Inning Fatigue, Strike Zone) */}
        <div className="lg:col-span-6 space-y-4">
          <ActionableVisuals
            role={playerRole}
            pitcherStats={pitcherStats}
            hitterStats={hitterStats}
            seasonOutingsCount={athleteGames.length}
          />
        </div>

        {/* Right: Jargon-Free Dugout Report Card */}
        <div className="lg:col-span-6 space-y-4">
          <ReportOutput
            reportText={reportText}
            role={playerRole}
            playerName={selectedAthlete}
            outing={outingLabel}
            reportSource={modelUsed || reportSource}
            failoverOccurred={failoverOccurred}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
