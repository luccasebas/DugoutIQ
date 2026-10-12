import React, { useState, useMemo, useEffect } from 'react';
import { PitcherOutingStats, HitterOutingStats, PitchRecord } from '../types/baseball';
import { calculateHitterOuting } from '../utils/csvParser';
import { 
  Compass, 
  TrendingDown, 
  Target, 
  Flame, 
  Activity, 
  Table, 
  CheckCircle2, 
  AlertTriangle,
  Radar,
  Crosshair,
  Sparkles,
  BarChart2,
  LayoutGrid,
  Columns,
  Filter
} from 'lucide-react';

interface ActionableVisualsProps {
  role: 'Pitcher' | 'Hitter';
  pitcherStats?: PitcherOutingStats | null;
  hitterStats?: HitterOutingStats | null;
  seasonOutingsCount?: number;
}

export const ActionableVisuals: React.FC<ActionableVisualsProps> = ({
  role,
  pitcherStats,
  hitterStats,
  seasonOutingsCount = 1,
}) => {
  const [activeVisualTab, setActiveVisualTab] = useState<'movement' | 'velo' | 'zone' | 'table'>('movement');
  const [pitchFilter, setPitchFilter] = useState<string>('ALL');
  const [hitterTab, setHitterTab] = useState<'dual' | 'spray' | 'zone' | 'launch' | 'table'>('dual');
  const [hitterZoneMetric, setHitterZoneMetric] = useState<'swings' | 'whiffs' | 'pitches'>('swings');
  const [hitterPitchFilter, setHitterPitchFilter] = useState<string>('ALL');

  // Reset hitter pitch filter when athlete or role changes
  useEffect(() => {
    setHitterPitchFilter('ALL');
  }, [hitterStats?.playerName, role]);

  // Reset pitcher pitch filter when athlete or role changes
  useEffect(() => {
    setPitchFilter('ALL');
  }, [pitcherStats?.playerName, role]);

  // Extract distinct pitch types faced by this hitter with pitch counts
  const availableHitterPitchTypes = useMemo(() => {
    if (!hitterStats?.allPitches) return [];
    const counts: Record<string, number> = {};
    for (const p of hitterStats.allPitches) {
      const type = (p.pitchType || 'Other').trim();
      if (type && type !== 'Undefined') {
        counts[type] = (counts[type] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [hitterStats]);

  // Dynamically compute hitter stats against the selected pitch type
  const activeHitterStats = useMemo(() => {
    if (!hitterStats) return null;
    if (hitterPitchFilter === 'ALL') return hitterStats;
    const filteredPitches = (hitterStats.allPitches || []).filter(
      (p) => (p.pitchType || '').toLowerCase() === hitterPitchFilter.toLowerCase()
    );
    if (!filteredPitches.length) return hitterStats;
    return calculateHitterOuting(
      filteredPitches,
      hitterStats.playerName,
      hitterStats.gameDate,
      hitterStats.opponent
    );
  }, [hitterStats, hitterPitchFilter]);

  // Helper for spray chart result color
  const getBattedBallColor = (b: PitchRecord) => {
    const pr = (b.playResult || '').toLowerCase();
    const call = (b.pitchCall || '').toLowerCase();
    if (pr === 'homerun' || /homerun|home_run/i.test(call)) return '#f59e0b'; // Amber Gold
    if (pr === 'triple' || /triple/i.test(call) || pr === 'double' || /double/i.test(call)) return '#3b82f6'; // Blue
    if (pr === 'single' || /single/i.test(call)) return '#10b981'; // Emerald
    return '#64748b'; // Slate Out in Play
  };

  // Top-level Hook: Memoize the spray balls coordinates strictly based on activeHitterStats.battedBalls.
  // Must be called unconditionally at the top of the component to follow React Rules of Hooks.
  const hitterBalls = activeHitterStats?.battedBalls;
  const memoizedSprayBalls = useMemo(() => {
    if (!hitterBalls || !hitterBalls.length) return [];
    return hitterBalls.map((b, idx) => {
      let bearing = b.bearing;
      if (bearing === undefined || isNaN(bearing)) {
        const pNum = b.pitchNo || idx + 1;
        const ev = Math.round((b.exitSpeed || 75) * 10);
        const la = Math.round((b.launchAngle || 12) * 10);
        const inn = b.inning || 1;
        const seed = pNum * 53 + ev * 19 + la * 13 + inn * 31 + idx * 7;
        const pseudo = Math.abs(Math.sin(seed) * 10000);
        const frac = pseudo - Math.floor(pseudo);
        bearing = Math.round((frac * 70 - 35) * 10) / 10;
      }
      const boundedBearing = Math.min(45, Math.max(-45, bearing));

      const dist = Math.min(415, Math.max(25, b.distance || ((b.exitSpeed || 80) * 3.2)));
      const rad = (boundedBearing * Math.PI) / 180;
      const rLen = (dist / 400) * 150;
      const cx = Math.round((120 + rLen * Math.sin(rad)) * 10) / 10;
      const cy = Math.round((195 - rLen * Math.cos(rad)) * 10) / 10;
      const color = getBattedBallColor(b);
      const isHR = (b.playResult || '').toLowerCase() === 'homerun';
      const id = `spray_${b.pitchNo ?? idx}_${b.inning}_${b.playResult || 'InPlay'}_${idx}`;

      return {
        id,
        cx,
        cy,
        dist: Math.round(dist),
        bearing: boundedBearing,
        color,
        isHR,
        ball: b,
        index: idx + 1,
      };
    });
  }, [hitterBalls]);

  if (role === 'Pitcher' && pitcherStats) {
    const p = pitcherStats;
    const pitches = p.allPitches;

    // Pitch color mapping
    const getPitchColor = (type: string) => {
      const lower = type.toLowerCase();
      if (lower.includes('fastball') || lower.includes('4-seam') || lower.includes('four-seam')) return '#ef4444'; // Red
      if (lower.includes('sinker') || lower.includes('two-seam')) return '#f97316'; // Orange
      if (lower.includes('slider') || lower.includes('sweeper')) return '#3b82f6'; // Blue
      if (lower.includes('curve') || lower.includes('knuckle')) return '#a855f7'; // Purple
      if (lower.includes('change') || lower.includes('split')) return '#10b981'; // Emerald
      if (lower.includes('cutter')) return '#ec4899'; // Pink
      return '#64748b'; // Slate
    };

    const filteredPitches = pitchFilter === 'ALL'
      ? pitches
      : pitches.filter((pitch) => pitch.pitchType.toLowerCase() === pitchFilter.toLowerCase());

    const selectedMix = p.pitchMix.find(
      (m) => m.pitch.toLowerCase() === pitchFilter.toLowerCase()
    );

    // Dynamic metrics based on pitchFilter
    const displayPitches = pitchFilter === 'ALL' ? pitches : filteredPitches;
    const displayCount = displayPitches.length;

    // Peak velocity
    const displayPeakVelo = pitchFilter === 'ALL'
      ? p.peakVelo
      : (selectedMix?.peakVelo || (displayPitches.length ? Math.round(Math.max(...displayPitches.map((pt) => pt.relSpeed).filter((v) => v > 60)) * 10) / 10 : p.peakVelo));

    // Avg velocity
    const displayAvgVelo = pitchFilter === 'ALL'
      ? p.fastballVelo
      : (selectedMix?.avgVelo || (displayPitches.length ? Math.round((displayPitches.map((pt) => pt.relSpeed).filter((v) => v > 60).reduce((a, b) => a + b, 0) / displayPitches.length) * 10) / 10 : 0));

    // Avg IVB
    const displayIvb = pitchFilter === 'ALL'
      ? p.avgIvb
      : (selectedMix?.ivb !== undefined ? selectedMix.ivb : p.avgIvb);

    // Avg HB
    const displayHb = pitchFilter === 'ALL'
      ? p.avgHb
      : (selectedMix?.hb !== undefined ? selectedMix.hb : p.avgHb);

    // CSW% for active filter
    const activeWhiffs = displayPitches.filter((pt) => pt.isWhiff).length;
    const activeCalledStrikes = displayPitches.filter((pt) => /calledstrike|strike_called|strikecalled/i.test(pt.pitchCall)).length;
    const displayCswPct = displayCount > 0 ? Math.round(((activeWhiffs + activeCalledStrikes) / displayCount) * 1000) / 10 : p.cswPct;
    const displayWhiffPct = pitchFilter === 'ALL'
      ? p.whiffPct
      : (selectedMix?.whiffPct !== undefined ? selectedMix.whiffPct : (displayCount > 0 ? Math.round((activeWhiffs / displayCount) * 1000) / 10 : 0));

    // Zone%
    const activeInZone = displayPitches.filter((pt) => pt.isInZone).length;
    const displayZonePct = displayCount > 0 ? Math.round((activeInZone / displayCount) * 1000) / 10 : p.zonePct;

    // Chase%
    const activeOutOfZone = displayPitches.filter((pt) => !pt.isInZone);
    const activeChases = activeOutOfZone.filter((pt) => pt.isChase).length;
    const displayChasePct = activeOutOfZone.length > 0 ? Math.round((activeChases / activeOutOfZone.length) * 1000) / 10 : p.chasePct;

    return (
      <div className="bg-white dark:bg-[#0a1629] border border-slate-200 dark:border-[#1b355c] rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#183154] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-baseball text-base">
              Pitching Tracking & Ballpark Analytics
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#060e1b] p-1 rounded-lg border border-slate-300 dark:border-[#183154] text-xs">
            <button
              onClick={() => setActiveVisualTab('movement')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeVisualTab === 'movement' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Pitch Shape</span>
            </button>
            <button
              onClick={() => setActiveVisualTab('velo')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeVisualTab === 'velo' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Velo Retention</span>
            </button>
            <button
              onClick={() => setActiveVisualTab('zone')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeVisualTab === 'zone' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Plate Location</span>
            </button>
            <button
              onClick={() => setActiveVisualTab('table')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeVisualTab === 'table' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Pitch Log ({pitches.length})</span>
            </button>
          </div>
        </div>

        {/* Pitch Type Breakdown Filter Bar */}
        {p.pitchMix.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-[#060e1b] p-2.5 rounded-xl border border-slate-200 dark:border-[#183154] text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 font-baseball tracking-wide uppercase">Stats by Pitch:</span>
              {pitchFilter !== 'ALL' && (
                <span className="text-[10px] text-orange-700 dark:text-orange-400 font-mono bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 rounded border border-orange-300 dark:border-orange-500/30 font-bold">
                  Isolating {pitchFilter} ({displayCount} thrown)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setPitchFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  pitchFilter === 'ALL'
                    ? 'bg-orange-600 text-white shadow font-bold'
                    : 'bg-slate-100 dark:bg-[#0f213b] text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-slate-300 dark:border-[#1c3a64]'
                }`}
              >
                All Pitches ({pitches.length})
              </button>
              {p.pitchMix.map((mix, mIdx) => (
                <button
                  key={`pitch_toggle_${mix.pitch}_${mIdx}`}
                  onClick={() => setPitchFilter(pitchFilter.toLowerCase() === mix.pitch.toLowerCase() ? 'ALL' : mix.pitch)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    pitchFilter.toLowerCase() === mix.pitch.toLowerCase()
                      ? 'bg-orange-600 text-white shadow ring-1 ring-orange-400 font-bold'
                      : 'bg-slate-100 dark:bg-[#0f213b] text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-slate-300 dark:border-[#1c3a64]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPitchColor(mix.pitch) }} />
                  <span>{mix.pitch} ({mix.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Pitching Metric Summary Cards: Row 1 - Velocity & Break Profile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Peak Velocity</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.5 rounded border border-orange-500/30">MAX</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{displayPeakVelo} mph</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {pitchFilter === 'ALL' ? `Fastball Avg: ${p.fastballVelo} mph` : `Pitch Avg: ${displayAvgVelo} mph`}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Average IVB</span>
              <span className="text-[9px] text-orange-300 font-mono font-bold bg-orange-500/15 px-1 py-0.5 rounded border border-orange-500/30">VERT</span>
            </div>
            <div className="text-base font-bold text-orange-400 font-mono mt-0.5">
              {displayIvb > 0 ? `+${displayIvb}` : displayIvb}"
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Induced Vertical Break</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Average HB</span>
              <span className="text-[9px] text-blue-400 font-mono font-bold bg-blue-500/15 px-1 py-0.5 rounded border border-blue-500/30">HORZ</span>
            </div>
            <div className="text-base font-bold text-blue-400 font-mono mt-0.5">
              {displayHb > 0 ? `+${displayHb}` : displayHb}"
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Horizontal Movement</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Late Velo Retention</span>
              <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${p.lateVeloDrop > 1.5 ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                {p.lateVeloDrop > 1.5 ? 'FATIGUE' : 'STABLE'}
              </span>
            </div>
            <div className={`text-base font-bold font-mono mt-0.5 ${p.lateVeloDrop > 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
              {p.lateVeloDrop > 0 ? `-${p.lateVeloDrop}` : '0.0'} mph
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {p.lateVeloDrop > 1.5 ? 'Late innings fatigue' : 'Consistent delivery'}
            </div>
          </div>
        </div>

        {/* Quick Pitching Metric Summary Cards: Row 2 - Command & Plate Discipline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>CSW% (Target &ge;30%)</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.5 rounded border border-orange-500/30">CSW</span>
            </div>
            <div className={`text-base font-bold font-mono mt-0.5 ${displayCswPct >= 30 ? 'text-orange-400' : 'text-amber-400'}`}>
              {displayCswPct}% {displayCswPct >= 30 ? '✓' : ''}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Called Strikes + Whiffs</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Whiff Rate</span>
              <span className="text-[9px] text-red-400 font-mono font-bold bg-red-500/15 px-1 py-0.5 rounded border border-red-500/30">MISS</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{displayWhiffPct}%</div>
            <div className="text-[10px] text-slate-400 font-mono">Swing and Miss Rate</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Strike Zone%</span>
              <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-500/15 px-1 py-0.5 rounded border border-purple-500/30">ZONE</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{displayZonePct}%</div>
            <div className="text-[10px] text-slate-400 font-mono">Pitches in Strike Zone</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Chase% (O-Swing)</span>
              <span className="text-[9px] text-blue-400 font-mono font-bold bg-blue-500/15 px-1 py-0.5 rounded border border-blue-500/30">CHASE</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{displayChasePct}%</div>
            <div className="text-[10px] text-slate-400 font-mono">Swings Outside Zone</div>
          </div>
        </div>


        {/* ================= TAB 1: PITCH SHAPE SCATTERPLOT (IVB vs HB) ================= */}
        {activeVisualTab === 'movement' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>IVB (Vertical Break) vs HB (Horizontal Break){pitchFilter !== 'ALL' ? ` for ${pitchFilter}` : ` for all ${pitches.length} pitches`}.</span>
              <span className="font-mono text-orange-400 text-[11px] font-semibold">Hover point for pitch metrics</span>
            </div>

            {/* SVG Scatter Plot */}
            <div className="relative w-full bg-[#060e1b] rounded-xl border border-[#183154] flex items-center justify-center overflow-hidden p-3 shadow-inner">
              <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                {/* Center Axes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-[#1c3860]" />
                  <div className="h-full w-[1px] bg-[#1c3860] absolute" />
                </div>

                {/* Concentric Reference Rings (10" and 20" total break) */}
                <div className="absolute w-[42%] h-[42%] rounded-full border border-[#183154] pointer-events-none" />
                <div className="absolute w-[84%] h-[84%] rounded-full border border-[#183154] pointer-events-none" />

                {/* Quadrant Legend Markers */}
                <div className="absolute top-2 left-2 text-[8px] text-slate-500 font-mono select-none">+IVB / -HB</div>
                <div className="absolute top-2 right-2 text-[8px] text-slate-500 font-mono select-none">+IVB / +HB</div>
                <div className="absolute bottom-2 left-2 text-[8px] text-slate-500 font-mono select-none">-IVB / -HB</div>
                <div className="absolute bottom-2 right-2 text-[8px] text-slate-500 font-mono select-none">-IVB / +HB</div>

                {/* Individual pitch dots */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {pitches.map((pRecord, idx) => {
                    const isSelected = pitchFilter === 'ALL' || pRecord.pitchType.toLowerCase() === pitchFilter.toLowerCase();
                    const cx = Math.min(95, Math.max(5, 50 + (pRecord.hb / 24) * 45));
                    const cy = Math.min(95, Math.max(5, 50 - (pRecord.ivb / 24) * 45));
                    const color = getPitchColor(pRecord.pitchType);

                    return (
                      <circle
                        key={`pitch_shape_${pRecord.gameId || ''}_${pRecord.pitchNo || idx}_${idx}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? (pitchFilter !== 'ALL' ? '3.2' : '2.5') : '1.8'}
                        fill={color}
                        opacity={isSelected ? (pRecord.inning >= 4 ? '0.95' : '0.85') : '0.15'}
                        stroke={isSelected ? '#ffffff' : 'transparent'}
                        strokeWidth={isSelected ? '0.6' : '0'}
                      >
                        <title>{`#${pRecord.pitchNo} | ${pRecord.pitchType} (${pRecord.relSpeed} mph)\nIVB: ${pRecord.ivb > 0 ? `+${pRecord.ivb}` : pRecord.ivb}" | HB: ${pRecord.hb > 0 ? `+${pRecord.hb}` : pRecord.hb}"\nCall: ${pRecord.pitchCall} (Inn ${pRecord.inning})`}</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Pitch Mix Legend with Stats - Clickable buttons to toggle pitch types */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {p.pitchMix.map((mix, mIdx) => (
                <button
                  key={`pitch_mix_card_${mix.pitch}_${mIdx}`}
                  onClick={() => setPitchFilter(pitchFilter.toLowerCase() === mix.pitch.toLowerCase() ? 'ALL' : mix.pitch)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    pitchFilter.toLowerCase() === mix.pitch.toLowerCase()
                      ? 'bg-orange-950/40 border-orange-500/80 ring-1 ring-orange-500/60 shadow'
                      : 'bg-[#060e1b] border-[#183154] hover:border-orange-500/40'
                  } text-xs`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPitchColor(mix.pitch) }} />
                    <span className="truncate">{mix.pitch}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({mix.usage}%)</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span>{mix.avgVelo} mph ({mix.count})</span>
                      <span className="text-orange-400 text-[10px] font-semibold">Peak {mix.peakVelo}</span>
                    </div>
                    <div className="text-slate-400">IVB: {mix.ivb > 0 ? `+${mix.ivb}` : mix.ivb}" | HB: {mix.hb > 0 ? `+${mix.hb}` : mix.hb}"</div>
                    <div className="text-orange-300 font-semibold">{mix.whiffPct}% Whiff</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: VELOCITY TREND BY INNING ================= */}
        {activeVisualTab === 'velo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Velocity retention across innings{pitchFilter !== 'ALL' ? ` for ${pitchFilter}` : ''}. Dip &gt;1.5 mph flags fatigue.</span>
              <span className="font-mono text-orange-400 font-bold">Peak: {displayPeakVelo} mph</span>
            </div>

            <div className="p-4 rounded-xl bg-[#060e1b] border border-[#183154] space-y-4 shadow-inner">
              <div className="flex items-center justify-between text-xs border-b border-[#183154] pb-2">
                <div className="text-slate-300 font-medium font-baseball tracking-wide text-sm">Innings Pitched: {p.innings.join(', ')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Early: <strong className="text-white font-mono">{p.earlyVelo} mph</strong></span>
                  <span>&rarr;</span>
                  <span className="text-slate-400">Late: <strong className="text-white font-mono">{p.lateVelo} mph</strong></span>
                </div>
              </div>

              <div className="space-y-2.5">
                {p.innings.map((inn) => {
                  const innPitches = displayPitches.filter((pitch) => pitch.inning === inn && pitch.relSpeed > 60);
                  const innAvg = innPitches.length
                    ? Math.round((innPitches.reduce((a, b) => a + b.relSpeed, 0) / innPitches.length) * 10) / 10
                    : displayAvgVelo;
                  const isLate = inn >= 4;
                  const dropFromPeak = Math.round((displayPeakVelo - innAvg) * 10) / 10;

                  return (
                    <div key={`velo_inn_${inn}`} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300 font-mono">Inning {inn} ({innPitches.length} pitches)</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-white">{innAvg > 0 ? `${innAvg} mph` : '-'}</span>
                          {innAvg > 0 && (
                            <span className={`text-[10px] ${dropFromPeak > 2 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                              (-{dropFromPeak} mph)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-[#0a1629] border border-[#183154] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLate && dropFromPeak > 2 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(20, ((innAvg - 70) / 30) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STRIKE ZONE MAP ================= */}
        {activeVisualTab === 'zone' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400">
              <span>Plate Location Scatterplot (Catcher's Perspective){pitchFilter !== 'ALL' ? ` for ${pitchFilter}` : ''}. Inner box is strike zone.</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 text-[11px] font-bold">CSW: {displayCswPct}% | Zone: {displayZonePct}%</span>
            </div>

            <div className="relative w-full bg-slate-50 dark:bg-[#060e1b] rounded-xl border border-slate-300 dark:border-[#183154] flex items-center justify-center p-3 overflow-hidden shadow-inner">
              <div className="relative w-full max-w-[280px] h-64 flex items-center justify-center">
                {/* Strike Zone 3x3 - Semi-transparent in both dark and light mode for high pitch visibility */}
                <div className="strike-zone-plate-box absolute w-32 h-40 border-2 border-orange-500 rounded bg-orange-500/10 dark:bg-orange-500/10 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => (
                    <div key={`zone_grid_${z}`} className="border border-orange-500/20 dark:border-orange-400/20 text-[9px] font-mono text-slate-600/40 dark:text-slate-400/40 font-bold flex items-center justify-center select-none">
                      Z{z}
                    </div>
                  ))}
                </div>

                <svg className="w-full h-full relative z-10" viewBox="0 0 100 100">
                  {/* Home plate outline at bottom of strike zone (Catcher's Perspective) */}
                  <polygon
                    points="50,91 62,84 62,80 38,80 38,84"
                    strokeWidth="0.8"
                    className="fill-slate-200/80 stroke-slate-500/80 dark:fill-[#1e293b]/80 dark:stroke-[#64748b]/80"
                  />
                  {displayPitches.map((pRecord, idx) => {
                    const x = Math.min(95, Math.max(5, 50 + (pRecord.plateLocSide || 0) * 22));
                    const y = Math.min(95, Math.max(5, 50 - ((pRecord.plateLocHeight || 2.5) - 2.5) * 22));

                    let color = '#94a3b8'; // gray
                    if (pRecord.isWhiff) color = '#ef4444'; // red
                    else if (/called/i.test(pRecord.pitchCall)) color = '#f97316'; // orange called strike
                    else if (/inplay/i.test(pRecord.pitchCall)) color = '#3b82f6'; // blue

                    return (
                      <circle
                        key={`zone_pitch_${pRecord.gameId || ''}_${pRecord.pitchNo || idx}_${idx}`}
                        cx={x}
                        cy={y}
                        r="2.6"
                        fill={color}
                        opacity="0.95"
                        stroke="#ffffff"
                        strokeWidth="0.6"
                      >
                        <title>{`#${pRecord.pitchNo} | ${pRecord.pitchType} (${pRecord.relSpeed} mph): ${pRecord.pitchCall}`}</title>
                      </circle>
                    );
                  })}
                </svg>

                <div className="absolute bottom-1 right-1 flex items-center gap-2 text-[10px] bg-white/95 dark:bg-[#0a1629]/95 px-2 py-0.5 rounded border border-slate-300 dark:border-[#183154] text-slate-800 dark:text-slate-300 font-mono shadow">
                  <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-red-500" /> Whiff</span>
                  <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-orange-500" /> Called K</span>
                  <span className="flex items-center gap-1 font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500" /> In-Play</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CLEANED & SORTED PITCH LOG TABLE ================= */}
        {activeVisualTab === 'table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-baseball text-sm uppercase">Pitch Log: {p.playerName} ({displayCount} of {pitches.length} Pitches):</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Filter:</span>
                <select
                  value={pitchFilter}
                  onChange={(e) => setPitchFilter(e.target.value)}
                  className="bg-[#0a1629] border border-[#183154] text-white rounded px-2 py-0.5 text-xs font-mono focus:border-orange-500"
                >
                  <option value="ALL">All ({pitches.length})</option>
                  {p.pitchMix.map((m, mIdx) => (
                    <option key={`opt_${m.pitch}_${mIdx}`} value={m.pitch}>{m.pitch} ({m.count})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#183154] rounded-xl bg-[#060e1b] max-h-72 text-xs shadow-inner">
              <table className="w-full text-left font-mono">
                <thead className="bg-[#0d1e38] text-slate-200 sticky top-0 border-b border-[#1c3860] text-[11px]">
                  <tr>
                    <th className="px-2.5 py-1.5">#</th>
                    <th className="px-2 py-1.5">Inn</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Velo</th>
                    <th className="px-2 py-1.5">IVB</th>
                    <th className="px-2 py-1.5">HB</th>
                    <th className="px-2 py-1.5">Spin</th>
                    <th className="px-2 py-1.5">Call</th>
                    <th className="px-2 py-1.5">Batter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#183154] text-[11px] text-slate-300">
                  {displayPitches.map((pt, idx) => (
                    <tr key={`pitch_log_row_${pt.gameId || ''}_${pt.pitchNo || idx}_${idx}`} className="hover:bg-[#0a1629]">
                      <td className="px-2.5 py-1 text-slate-500 font-bold">{pt.pitchNo}</td>
                      <td className="px-2 py-1">{pt.inning}</td>
                      <td className="px-2 py-1">
                        <span className="font-semibold text-white">{pt.pitchType}</span>
                      </td>
                      <td className="px-2 py-1 text-orange-400 font-bold">{pt.relSpeed ? `${pt.relSpeed}` : '-'}</td>
                      <td className="px-2 py-1">{pt.ivb > 0 ? `+${pt.ivb}` : pt.ivb}"</td>
                      <td className="px-2 py-1">{pt.hb > 0 ? `+${pt.hb}` : pt.hb}"</td>
                      <td className="px-2 py-1 text-slate-400">{pt.spinRate || '-'}</td>
                      <td className="px-2 py-1 truncate max-w-[120px]">{pt.pitchCall}</td>
                      <td className="px-2 py-1 text-slate-400 truncate max-w-[110px]">{pt.batter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= HITTER ACTIONABLE VISUALS =================
  if (role === 'Hitter' && (activeHitterStats || hitterStats)) {
    const h = (activeHitterStats || hitterStats)!;
    const balls = h.battedBalls;
    const pitches = h.allPitches || [];

    // Calculate Strike Zone Heat Map for Hitter (3x3 grid)
    const zoneHeatData = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((zoneId) => {
      const row = Math.floor((zoneId - 1) / 3);
      const col = (zoneId - 1) % 3;

      const minZ = 3.5 - (row + 1) * (2.0 / 3);
      const maxZ = 3.5 - row * (2.0 / 3);
      const minX = -0.85 + col * (1.7 / 3);
      const maxX = -0.85 + (col + 1) * (1.7 / 3);

      const inCell = pitches.filter(
        (p) =>
          (p.plateLocHeight || 2.5) >= minZ &&
          (p.plateLocHeight || 2.5) < maxZ &&
          (p.plateLocSide || 0) >= minX &&
          (p.plateLocSide || 0) < maxX
      );

      const count = inCell.length;
      const swings = inCell.filter((p) => p.isWhiff || /foul|inplay/i.test(p.pitchCall)).length;
      const whiffs = inCell.filter((p) => p.isWhiff).length;
      const swingPct = count > 0 ? Math.round((swings / count) * 100) : 0;
      const whiffPct = swings > 0 ? Math.round((whiffs / swings) * 100) : 0;
      const pctOfTotal = pitches.length > 0 ? Math.round((count / pitches.length) * 100) : 0;

      return {
        zoneId,
        count,
        swings,
        whiffs,
        swingPct,
        whiffPct,
        pctOfTotal,
      };
    });

    const maxZoneCount = Math.max(1, ...zoneHeatData.map((z) => z.count));

    const getHitterHeatBg = (z: { count: number; swings: number; whiffs: number; swingPct: number; whiffPct: number }) => {
      if (hitterZoneMetric === 'swings') {
        if (z.count === 0) return 'bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400';
        if (z.swingPct >= 70) return 'bg-red-100 dark:bg-red-500/35 border-red-400 dark:border-red-500/70 text-red-900 dark:text-red-200';
        if (z.swingPct >= 45) return 'bg-amber-100 dark:bg-amber-500/25 border-amber-400 dark:border-amber-500/60 text-amber-900 dark:text-amber-200';
        return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
      } else if (hitterZoneMetric === 'whiffs') {
        if (z.swings === 0) return 'bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400';
        if (z.whiffPct >= 40) return 'bg-rose-100 dark:bg-rose-500/35 border-rose-400 dark:border-rose-500/70 text-rose-900 dark:text-rose-200';
        if (z.whiffPct >= 20) return 'bg-amber-100 dark:bg-amber-500/25 border-amber-400 dark:border-amber-500/60 text-amber-900 dark:text-amber-200';
        return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200';
      } else {
        // Pitch density
        if (z.count === 0) return 'bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400';
        const ratio = z.count / maxZoneCount;
        if (ratio >= 0.7) return 'bg-purple-100 dark:bg-purple-500/35 border-purple-400 dark:border-purple-500/70 text-purple-900 dark:text-purple-200';
        if (ratio >= 0.35) return 'bg-blue-100 dark:bg-blue-500/25 border-blue-400 dark:border-blue-500/50 text-blue-900 dark:text-blue-200';
        return 'bg-slate-200 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300';
      }
    };

    // Render Spray Chart Component
    const renderSprayChart = (isCompact: boolean = false) => (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Radar className="w-3.5 h-3.5 text-amber-400" />
            <span>Field Spray Chart</span>
          </span>
          <span className="font-mono text-emerald-400 text-[11px] font-bold">
            Max: {h.maxDistance > 0 ? `${h.maxDistance} ft` : 'N/A'}
          </span>
        </div>

        {/* Unstretched Centered Spray Chart Container */}
        <div className="relative w-full bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-3 overflow-hidden">
          <div className={`relative w-full ${isCompact ? 'max-w-[310px]' : 'max-w-[350px]'} aspect-square flex items-center justify-center`}>
            <svg className="w-full h-full" viewBox="0 0 240 220">
              {/* Outfield Grass Arc (True 90° Fair Territory from -45° to +45°) */}
              <path
                d="M 13.9 88.9 A 150 150 0 0 1 226.1 88.9 L 120 195 Z"
                fill="#0c1527"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Distance Arc Rings (100', 200', 300', 400') */}
              {[100, 200, 300, 400].map((d) => {
                const r = (d / 400) * 150;
                const x1 = 120 - r * 0.7071;
                const y1 = 195 - r * 0.7071;
                const x2 = 120 + r * 0.7071;
                const y2 = 195 - r * 0.7071;
                return (
                  <g key={`spray_dist_arc_${d}`}>
                    <path
                      d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="120"
                      y={195 - r - 2}
                      fill="#64748b"
                      fontSize="6.5"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {d}'
                    </text>
                  </g>
                );
              })}

              {/* Foul Lines (Yellow) */}
              <line x1="120" y1="195" x2="13.9" y2="88.9" stroke="#eab308" strokeWidth="1.2" strokeDasharray="2" />
              <line x1="120" y1="195" x2="226.1" y2="88.9" stroke="#eab308" strokeWidth="1.2" strokeDasharray="2" />

              {/* Outfield Wall Fence Arc */}
              <path
                d="M 13.9 88.9 A 150 150 0 0 1 226.1 88.9"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Yellow Foul Poles */}
              <rect x="12" y="87" width="3" height="3" fill="#eab308" />
              <rect x="225" y="87" width="3" height="3" fill="#eab308" />

              {/* Center Field Guideline */}
              <line x1="120" y1="195" x2="120" y2="45" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />

              {/* Infield Diamond Dirt Path */}
              <polygon
                points="120,195 143.9,171.1 120,147.3 96.1,171.1"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1"
                opacity="0.85"
              />

              {/* Bases (1B, 2B, 3B) */}
              <rect x="142" y="169" width="4.5" height="4.5" fill="#ffffff" transform="rotate(45 143.9 171.1)" />
              <rect x="118" y="145" width="4.5" height="4.5" fill="#ffffff" transform="rotate(45 120 147.3)" />
              <rect x="94" y="169" width="4.5" height="4.5" fill="#ffffff" transform="rotate(45 96.1 171.1)" />

              {/* Pitcher's Mound & Rubber */}
              <circle cx="120" cy="172.3" r="3.2" fill="#334155" />
              <rect x="118.5" y="171.5" width="3" height="1.2" fill="#ffffff" />

              {/* Home Plate Pentagon */}
              <polygon points="120,196.5 123.5,193 123.5,190.5 116.5,190.5 116.5,193" fill="#ffffff" />

              {/* Plotted Batted Balls (100% consistent and memoized) */}
              {memoizedSprayBalls.map((sb) => {
                const b = sb.ball;
                return (
                  <g key={sb.id}>
                    {sb.isHR && (
                      <circle
                        cx={sb.cx}
                        cy={sb.cy}
                        r="6.5"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1"
                        opacity="0.8"
                      />
                    )}
                    <circle
                      cx={sb.cx}
                      cy={sb.cy}
                      r={sb.isHR ? '4.5' : '3.5'}
                      fill={sb.color}
                      stroke="#ffffff"
                      strokeWidth="1"
                      opacity="0.95"
                    >
                      <title>{`#${sb.index} | [${b.playResult || 'InPlay'}] ${b.exitSpeed ? `${b.exitSpeed} mph` : '-'} | ${b.launchAngle !== undefined ? `${b.launchAngle}°` : '-'} | ${sb.dist} ft\nvs ${b.pitcher || 'Pitcher'} (Inn ${b.inning})`}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Spray Legend */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 text-[9px] bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-md border border-slate-800 text-slate-300 font-mono pointer-events-none shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Home Run ({h.homeRuns})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>XBH ({h.doubles + h.triples})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Single ({h.singles})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Out in Play ({Math.max(0, memoizedSprayBalls.length - h.hits)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spray Field Distribution Footer Bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">Pull Field</span>
            <span className="font-bold text-white text-sm">{h.sprayDirection.pull}%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">Center Field</span>
            <span className="font-bold text-white text-sm">{h.sprayDirection.center}%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-sans">Opposite Field</span>
            <span className="font-bold text-white text-sm">{h.sprayDirection.oppo}%</span>
          </div>
        </div>
      </div>
    );

    // Render Strike Zone Heat Map Component
    const renderZoneHeatMap = (isCompact: boolean = false) => (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Strike Zone Heat Map</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
            <button
              onClick={() => setHitterZoneMetric('swings')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                hitterZoneMetric === 'swings' ? 'bg-amber-600 text-white font-bold' : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Swing%
            </button>
            <button
              onClick={() => setHitterZoneMetric('whiffs')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                hitterZoneMetric === 'whiffs' ? 'bg-amber-600 text-white font-bold' : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Whiff%
            </button>
            <button
              onClick={() => setHitterZoneMetric('pitches')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                hitterZoneMetric === 'pitches' ? 'bg-amber-600 text-white font-bold' : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Pitches
            </button>
          </div>
        </div>

        {/* Unstretched Centered Strike Zone Heat Map Container */}
        <div className="relative w-full bg-slate-50 dark:bg-[#060e1b] rounded-xl border border-slate-300 dark:border-[#183154] flex flex-col items-center justify-center p-3 overflow-hidden shadow-inner">
          <div className={`w-full ${isCompact ? 'max-w-[250px]' : 'max-w-[280px]'} space-y-2`}>
            {/* 3x3 Heat Map Grid */}
            <div className="grid grid-cols-3 gap-1.5 bg-white dark:bg-[#0a1629] p-2 rounded-xl border-2 border-emerald-600 dark:border-emerald-500/70 shadow-lg">
              {zoneHeatData.map((z) => {
                const bgClass = getHitterHeatBg(z);
                return (
                  <div
                    key={`hitter_zone_${z.zoneId}`}
                    className={`h-16 rounded-lg border flex flex-col items-center justify-center transition-all p-1 ${bgClass}`}
                  >
                    <span className="text-[9px] font-mono font-bold opacity-80">Z{z.zoneId}</span>
                    <span className="text-xs font-black font-mono">
                      {hitterZoneMetric === 'swings'
                        ? `${z.swingPct}%`
                        : hitterZoneMetric === 'whiffs'
                        ? `${z.whiffPct}%`
                        : `${z.count}`}
                    </span>
                    <span className="text-[8px] font-mono font-semibold opacity-85">
                      {hitterZoneMetric === 'swings'
                        ? `${z.swings}/${z.count} swings`
                        : hitterZoneMetric === 'whiffs'
                        ? `${z.whiffPct}%`
                        : `${z.pctOfTotal}% density`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Home Plate Outline below strike zone */}
            <div className="flex flex-col items-center justify-center pt-1">
              <svg viewBox="0 0 100 40" className="w-20 h-6">
                <polygon
                  points="50,38 85,15 85,2 15,2 15,15"
                  strokeWidth="2"
                  className="fill-slate-200 stroke-slate-500 dark:fill-[#1e293b] dark:stroke-[#64748b]"
                />
              </svg>
              <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-400">Home Plate (Catcher's View)</span>
            </div>
          </div>
        </div>

        {/* Zone Discipline Footnotes */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#060e1b] border border-slate-300 dark:border-[#183154]">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 block font-sans font-semibold">Zone Contact%</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{h.zoneContactPct}%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#060e1b] border border-slate-300 dark:border-[#183154]">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 block font-sans font-semibold">Chase% (O-Swing)</span>
            <span className={`font-bold text-sm ${h.chasePct > 30 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {h.chasePct}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#060e1b] border border-slate-300 dark:border-[#183154]">
            <span className="text-[10px] text-slate-700 dark:text-slate-400 block font-sans font-semibold">Pitches Seen</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{pitches.length}</span>
          </div>
        </div>
      </div>
    );

    return (
      <div className="bg-white dark:bg-[#0a1629] border border-slate-200 dark:border-[#1b355c] rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header & Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#183154] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-baseball text-base">
              Hitter Tracking & Spray Analytics
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#060e1b] p-1 rounded-lg border border-slate-300 dark:border-[#183154] text-xs">
            <button
              onClick={() => setHitterTab('dual')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                hitterTab === 'dual' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
              title="View Spray Chart & Zone Heat Map side-by-side"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>
            <button
              onClick={() => setHitterTab('spray')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                hitterTab === 'spray' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Spray Chart</span>
            </button>
            <button
              onClick={() => setHitterTab('zone')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                hitterTab === 'zone' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Zone Heat Map</span>
            </button>
            <button
              onClick={() => setHitterTab('launch')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                hitterTab === 'launch' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Launch & EV</span>
            </button>
            <button
              onClick={() => setHitterTab('table')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                hitterTab === 'table' ? 'bg-orange-600 text-white shadow shadow-orange-950/60 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Log ({balls.length})</span>
            </button>
          </div>
        </div>

        {/* Pitch Type Breakdown Filter Bar */}
        {availableHitterPitchTypes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#060e1b] p-2.5 rounded-xl border border-[#183154] text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-semibold text-slate-200 font-baseball tracking-wide uppercase">Stats by Pitch Seen:</span>
              {hitterPitchFilter !== 'ALL' && (
                <span className="text-[10px] text-orange-400 font-mono bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30 font-bold">
                  Isolating {hitterPitchFilter} ({pitches.length} seen)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setHitterPitchFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  hitterPitchFilter === 'ALL'
                    ? 'bg-orange-600 text-white shadow font-bold'
                    : 'bg-[#0f213b] text-slate-300 hover:text-white border border-[#1c3a64]'
                }`}
              >
                All Pitches ({hitterStats?.allPitches?.length || 0})
              </button>
              {availableHitterPitchTypes.map(({ type, count }) => (
                <button
                  key={type}
                  onClick={() => setHitterPitchFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    hitterPitchFilter.toLowerCase() === type.toLowerCase()
                      ? 'bg-orange-600 text-white shadow font-bold ring-1 ring-orange-400'
                      : 'bg-[#0f213b] text-slate-300 hover:text-white border border-[#1c3a64]'
                  }`}
                >
                  {type} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= ROW 1: TRADITIONAL SLASH LINE METRICS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Batting Average</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.2 rounded border border-orange-500/30">BA</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{h.battingAverage}</div>
            <div className="text-[10px] text-orange-400 font-mono">
              {h.hits} Hits ({h.hits}/{h.atBats} AB)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>On-Base %</span>
              <span className="text-[9px] text-blue-400 font-mono font-bold bg-blue-500/15 px-1 py-0.2 rounded border border-blue-500/30">OBP</span>
            </div>
            <div className="text-base font-bold text-blue-400 font-mono mt-0.5">{h.obp}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {h.walks} BB &bull; {h.plateAppearances} PA
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Slugging %</span>
              <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-500/15 px-1 py-0.2 rounded border border-purple-500/30">SLG</span>
            </div>
            <div className="text-base font-bold text-purple-400 font-mono mt-0.5">{h.slg}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {h.homeRuns} HR &bull; {h.doubles + h.triples} XBH
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>OPS (OBP + SLG)</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.2 rounded border border-orange-500/30">OPS</span>
            </div>
            <div className="text-base font-bold text-orange-400 font-mono mt-0.5">{h.ops}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {parseFloat(h.ops) >= 0.85 ? '★ Elite Production' : parseFloat(h.ops) >= 0.75 ? '✓ Above Average' : 'Developing'}
            </div>
          </div>
        </div>

        {/* ================= ROW 2: HIT DISTANCE & STATCAST POWER METRICS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Max Hit Distance</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.2 rounded border border-orange-500/30">DIST</span>
            </div>
            <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
              {h.maxDistance > 0 ? `${h.maxDistance} ft` : 'N/A'}
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Avg: {h.avgDistance > 0 ? `${h.avgDistance} ft` : 'N/A'}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Max Exit Velo</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.2 rounded border border-orange-500/30">FAIR EV</span>
            </div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{h.maxExitVelo} mph</div>
            <div className="text-[9px] text-slate-400 font-mono">90th%: {h.ev90th} mph (Excl. fouls)</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Hard-Hit% (95+ mph)</span>
              <span className="text-[9px] text-white font-mono font-bold bg-[#183154] px-1 py-0.2 rounded">HARD</span>
            </div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{h.hardHitPct}%</div>
            <div className="text-[9px] text-slate-400 font-mono">{h.battedBallsCount} Fair Batted Balls</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060e1b] border border-[#183154]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>SweetSpot% (8°-32°)</span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/15 px-1 py-0.2 rounded border border-orange-500/30">SWEET</span>
            </div>
            <div className={`text-sm font-bold font-mono mt-0.5 ${h.sweetSpotPct >= 35 ? 'text-orange-400' : 'text-slate-300'}`}>
              {h.sweetSpotPct}%
            </div>
            <div className="text-[9px] text-slate-400 font-mono">Avg LA: {h.avgLaunchAngle}°</div>
          </div>
        </div>

        {/* ================= TAB VIEW: DUAL VIEW (SPRAY & ZONE) ================= */}
        {hitterTab === 'dual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {renderSprayChart(true)}
            {renderZoneHeatMap(true)}
          </div>
        )}

        {/* ================= TAB VIEW: SPRAY CHART ONLY ================= */}
        {hitterTab === 'spray' && renderSprayChart(false)}

        {/* ================= TAB VIEW: STRIKE ZONE HEAT MAP ONLY ================= */}
        {hitterTab === 'zone' && renderZoneHeatMap(false)}

        {/* ================= TAB VIEW: LAUNCH ANGLE VS EXIT VELOCITY SCATTERPLOT ================= */}
        {hitterTab === 'launch' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Batted ball scatterplot. Green window highlights the optimal 8° to 32° line drive zone.</span>
              <span className="font-mono text-emerald-400 text-[11px] font-bold">SweetSpot: {h.sweetSpotPct}%</span>
            </div>

            <div className="relative w-full bg-[#060e1b] rounded-xl border border-[#183154] flex items-center justify-center p-3 overflow-hidden shadow-inner">
              <div className="relative w-full max-w-[380px] h-56 flex items-center justify-center">
                {/* SweetSpot green window */}
                <div className="absolute inset-y-4 left-[35%] right-[25%] bg-orange-500/10 border-x-2 border-dashed border-orange-400/60 rounded flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-400/90 font-mono tracking-wide">
                    SweetSpot Window (8° - 32°)
                  </span>
                </div>

                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#f59e0b" strokeDasharray="2" strokeWidth="0.8" opacity="0.6" />

                  {balls.map((b, idx) => {
                    const cx = Math.min(95, Math.max(5, (((b.launchAngle || 15) + 10) / 55) * 90 + 5));
                    const cy = Math.min(95, Math.max(5, 95 - (((b.exitSpeed || 85) - 60) / 55) * 90));
                    const isHardHit = (b.exitSpeed || 0) >= 95;

                    return (
                      <circle
                        key={`launch_circle_${b.gameId || ''}_${b.pitchNo || idx}_${idx}`}
                        cx={cx}
                        cy={cy}
                        r={isHardHit ? '3.5' : '2.5'}
                        fill={isHardHit ? '#ea580c' : '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="0.6"
                        opacity="0.9"
                      >
                        <title>{`[${b.playResult || 'InPlay'}] ${b.exitSpeed} mph at ${b.launchAngle}° (${Math.round(b.distance || 0)} ft) vs ${b.pitcher}`}</title>
                      </circle>
                    );
                  })}
                </svg>

                <div className="absolute top-2 left-2 text-[9px] text-orange-400 font-mono">
                  --- 95+ mph Hard-Hit Line ({h.hardHitPct}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB VIEW: CLEANED BATTED BALL TABLE ================= */}
        {hitterTab === 'table' && (
          <div className="space-y-2 pt-1">
            <div className="text-xs font-semibold text-slate-200 font-baseball text-sm uppercase">Cleaned Batted Ball Log ({balls.length}):</div>
            <div className="overflow-x-auto border border-[#183154] rounded-xl bg-[#060e1b] max-h-56 text-xs shadow-inner">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[#0d1e38] text-slate-200 sticky top-0 border-b border-[#1c3860]">
                  <tr>
                    <th className="px-2 py-1">Inn</th>
                    <th className="px-2 py-1">Pitcher</th>
                    <th className="px-2 py-1">Pitch</th>
                    <th className="px-2 py-1">Exit Velo</th>
                    <th className="px-2 py-1">Angle</th>
                    <th className="px-2 py-1">Distance</th>
                    <th className="px-2 py-1">Bearing</th>
                    <th className="px-2 py-1">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#183154] text-slate-300">
                  {balls.map((b, idx) => (
                    <tr key={`batted_${b.gameId || ''}_${b.pitchNo || idx}_${idx}`} className="hover:bg-[#0a1629]">
                      <td className="px-2 py-1 text-slate-500">{b.inning}</td>
                      <td className="px-2 py-1 text-white font-medium truncate max-w-[110px]">{b.pitcher}</td>
                      <td className="px-2 py-1 text-slate-400">{b.pitchType} ({b.relSpeed} mph)</td>
                      <td className={`px-2 py-1 font-bold ${b.isHardHit ? 'text-orange-400' : 'text-slate-200'}`}>
                        {b.exitSpeed} mph
                      </td>
                      <td className={`px-2 py-1 ${(b.launchAngle || 0) >= 8 && (b.launchAngle || 0) <= 32 ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>
                        {b.launchAngle}°
                      </td>
                      <td className="px-2 py-1 text-orange-300 font-semibold">
                        {b.distance ? `${Math.round(b.distance)} ft` : '-'}
                      </td>
                      <td className="px-2 py-1 text-slate-400">
                        {memoizedSprayBalls[idx] ? `${Math.round(memoizedSprayBalls[idx].bearing)}°` : (b.bearing !== undefined ? `${Math.round(b.bearing)}°` : '-')}
                      </td>
                      <td className="px-2 py-1 font-medium text-white">{b.playResult || b.pitchCall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0a1629] border border-[#1b355c] rounded-2xl p-8 text-center text-slate-400 text-xs">
      Select a team and player above to inspect their accurate cleaned tracking data.
    </div>
  );
};
