import { GameOuting, PitchRecord, PlayerRole } from '../types/baseball';
import { formatPlayerName } from './csvParser';
import { formatRealTeamName } from './teamNames';

export function parsePostgameJSON(jsonInput: string, fileName?: string): GameOuting[] {
  let data: any;
  try {
    data = JSON.parse(jsonInput.trim());
  } catch (err: any) {
    throw new Error('Invalid JSON format: ' + err.message);
  }

  // Handle array of GameOutings or single GameOuting
  const items = Array.isArray(data) ? data : [data];

  // Case 1: The JSON is an array of raw pitch objects (e.g., from TrackMan JSON export)
  if (Array.isArray(data) && data.length > 0 && ('Pitcher' in data[0] || 'pitcher' in data[0] || 'RelSpeed' in data[0] || 'relSpeed' in data[0])) {
    return [parseTrackmanJSONPitches(data, fileName || 'Postgame_Pitches.json')];
  }

  const resultGames: GameOuting[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];

    // Case 2: Already a GameOuting structure (has gameId, pitches, teamRosters)
    if (item.gameId && Array.isArray(item.pitches) && item.teamRosters) {
      resultGames.push({
        gameId: item.gameId,
        gameDate: item.gameDate || new Date().toISOString().split('T')[0],
        opponent: item.opponent || 'Game Matchup',
        fileName: item.fileName || fileName || `Game_${idx + 1}.json`,
        totalPitches: item.pitches.length,
        teams: item.teams || Object.keys(item.teamRosters),
        teamRosters: item.teamRosters,
        pitchers: item.pitchers || Array.from(new Set(item.pitches.map((p: PitchRecord) => p.pitcher))),
        hitters: item.hitters || Array.from(new Set(item.pitches.map((p: PitchRecord) => p.batter))),
        pitches: item.pitches,
      });
      continue;
    }

    // Case 3: Structured postgame summary with teams, pitchers, and/or hitters
    const gameDate = item.gameDate || item.date || item.outingDate || '2026-07-26';
    const homeTeam = formatRealTeamName(item.homeTeam || item.home_team || item.team || 'Home Club');
    const awayTeam = formatRealTeamName(item.awayTeam || item.away_team || item.opponentTeam || 'Away Club');
    const opponent = item.opponent || `${homeTeam} vs ${awayTeam}`;
    const gameId = (item.gameId || `${gameDate}_${homeTeam}_vs_${awayTeam}`).replace(/\s+/g, '_');

    const teams = new Set<string>();
    if (homeTeam) teams.add(homeTeam);
    if (awayTeam) teams.add(awayTeam);
    if (Array.isArray(item.teams)) {
      item.teams.forEach((t: string) => teams.add(formatRealTeamName(t)));
    }

    const teamRosters: Record<string, { pitchers: string[]; hitters: string[] }> = {};
    const pitchersList: string[] = [];
    const hittersList: string[] = [];
    const syntheticPitches: PitchRecord[] = [];

    // Process Pitchers in JSON
    const rawPitchers = item.pitchers || item.pitcherSummaries || (item.role === 'Pitcher' || item.pitchMix ? [item] : []);
    for (const p of rawPitchers) {
      const pName = formatPlayerName(p.playerName || p.name || p.pitcher || 'Starting Pitcher');
      const pTeam = formatRealTeamName(p.team || p.pitcherTeam || homeTeam);
      teams.add(pTeam);
      if (!teamRosters[pTeam]) teamRosters[pTeam] = { pitchers: [], hitters: [] };
      if (!teamRosters[pTeam].pitchers.includes(pName)) teamRosters[pTeam].pitchers.push(pName);
      if (!pitchersList.includes(pName)) pitchersList.push(pName);

      // If raw pitches are attached, use them
      if (Array.isArray(p.pitches) && p.pitches.length > 0) {
        syntheticPitches.push(...p.pitches);
      } else {
        // Synthesize realistic pitch records from pitchMix or summary stats so visuals render
        const mix = p.pitchMix || [
          { pitch: 'Fastball', count: 35, avgVelo: p.fastballVelo || 92, ivb: 16.5, hb: 10.2, whiffPct: p.whiffPct || 25 },
          { pitch: 'Slider', count: 20, avgVelo: (p.fastballVelo || 92) - 8, ivb: 3.2, hb: -6.5, whiffPct: (p.whiffPct || 25) + 12 },
        ];

        let pNum = syntheticPitches.length + 1;
        mix.forEach((m: any, mIdx: number) => {
          const count = m.count || Math.round((m.usage ? (m.usage / 100) * 50 : 20));
          const baseVelo = m.avgVelo || p.fastballVelo || 90;
          const baseIvb = m.ivb !== undefined ? m.ivb : 12;
          const baseHb = m.hb !== undefined ? m.hb : 5;

          for (let i = 0; i < count; i++) {
            const inning = Math.min(7, 1 + Math.floor(i / 15));
            const lateFatigue = inning >= 4 ? (p.lateVeloDrop || 1.8) * ((inning - 3) / 3) : 0;
            const velo = Math.round((baseVelo - lateFatigue + (Math.sin(i) * 1.2)) * 10) / 10;
            const ivb = Math.round((baseIvb + (Math.cos(i) * 1.5)) * 10) / 10;
            const hb = Math.round((baseHb + (Math.sin(i * 2) * 1.5)) * 10) / 10;
            const isInZone = Math.random() < ((p.zonePct || 60) / 100);
            const isWhiff = Math.random() < ((m.whiffPct || p.whiffPct || 28) / 100);

            syntheticPitches.push({
              pitchNo: pNum++,
              gameId,
              gameDate,
              opponent,
              inning,
              pitcher: pName,
              pitcherTeam: pTeam,
              batter: `Hitter_${(i % 9) + 1}`,
              batterTeam: awayTeam,
              pitchType: m.pitch || 'Fastball',
              relSpeed: velo,
              ivb,
              hb,
              spinRate: Math.round(2100 + Math.random() * 300),
              pitchCall: isWhiff ? 'StrikeSwinging' : isInZone ? 'CalledStrike' : 'BallCalled',
              plateLocHeight: isInZone ? 2.5 + (Math.sin(i) * 0.7) : 4.0,
              plateLocSide: isInZone ? Math.cos(i) * 0.6 : 1.2,
              isStrike: isWhiff || isInZone,
              isWhiff,
              isInZone,
              isChase: !isInZone && Math.random() < ((p.chasePct || 25) / 100),
            });
          }
        });
      }
    }

    // Process Hitters in JSON
    const rawHitters = item.hitters || item.hitterSummaries || (item.role === 'Hitter' || item.maxExitVelo ? [item] : []);
    for (const h of rawHitters) {
      const hName = formatPlayerName(h.playerName || h.name || h.hitter || 'Lineup Hitter');
      const hTeam = formatRealTeamName(h.team || h.batterTeam || awayTeam);
      teams.add(hTeam);
      if (!teamRosters[hTeam]) teamRosters[hTeam] = { pitchers: [], hitters: [] };
      if (!teamRosters[hTeam].hitters.includes(hName)) teamRosters[hTeam].hitters.push(hName);
      if (!hittersList.includes(hName)) hittersList.push(hName);

      // If raw batted balls/pitches attached
      if (Array.isArray(h.battedBalls) && h.battedBalls.length > 0) {
        syntheticPitches.push(...h.battedBalls);
      } else {
        const bbCount = h.battedBallsCount || (h.plateAppearances ? Math.max(2, h.plateAppearances - 1) : 4);
        const maxEV = h.maxExitVelo || 102;
        const avgEV = h.avgExitVelo || 89;

        for (let b = 0; b < bbCount; b++) {
          const ev = b === 0 ? maxEV : Math.round((avgEV + (Math.sin(b) * 6)) * 10) / 10;
          const la = Math.round((h.avgLaunchAngle || 15) + (Math.cos(b) * 12));
          const bearing = b % 3 === 0 ? -20 : b % 3 === 1 ? 0 : 20;
          const dist = (h.maxDistance && b === 0)
            ? h.maxDistance
            : Math.round(ev * 3.85 * Math.max(0.2, Math.sin((la * Math.PI) / 60)) * 10) / 10;
          const playResult = b === 0
            ? (ev >= 100 && la >= 24 && la <= 34 ? 'HomeRun' : ev >= 95 ? 'Double' : 'Single')
            : (b % 2 === 0 ? 'Single' : 'Out');

          syntheticPitches.push({
            pitchNo: syntheticPitches.length + 1,
            gameId,
            gameDate,
            opponent,
            inning: Math.min(9, b * 2 + 1),
            pitcher: 'Opposing Pitcher',
            pitcherTeam: homeTeam,
            batter: hName,
            batterTeam: hTeam,
            pitchType: 'Fastball',
            relSpeed: 91,
            ivb: 15,
            hb: 8,
            pitchCall: 'InPlay',
            exitSpeed: ev,
            launchAngle: la,
            bearing,
            distance: dist,
            playResult,
            isStrike: true,
            isWhiff: false,
            isInZone: true,
            isChase: false,
            isHardHit: ev >= 95,
          });
        }
      }
    }

    resultGames.push({
      gameId,
      gameDate,
      opponent,
      fileName: fileName || `${gameDate}_Postgame_Summary.json`,
      totalPitches: syntheticPitches.length,
      teams: Array.from(teams),
      teamRosters,
      pitchers: pitchersList,
      hitters: hittersList,
      pitches: syntheticPitches,
    });
  }

  return resultGames;
}

// Helper to parse array of TrackMan raw pitch objects in JSON
function parseTrackmanJSONPitches(rows: any[], fileName: string): GameOuting {
  const teamRosters: Record<string, { pitchers: Set<string>; hitters: Set<string> }> = {};
  const allTeams = new Set<string>();
  const allPitchers = new Set<string>();
  const allHitters = new Set<string>();
  const pitches: PitchRecord[] = [];

  const defaultDate = rows[0]?.Date || rows[0]?.date || '2026-07-26';
  const homeTeam = formatRealTeamName(rows[0]?.HomeTeam || rows[0]?.homeTeam || 'Home Club');
  const awayTeam = formatRealTeamName(rows[0]?.AwayTeam || rows[0]?.awayTeam || 'Away Club');
  const opponent = `${homeTeam} vs ${awayTeam}`;
  const gameId = `${defaultDate}_${homeTeam}_vs_${awayTeam}`.replace(/\s+/g, '_');

  rows.forEach((r, idx) => {
    const rawPitcher = r.Pitcher || r.pitcher || r.pitcher_name || '';
    const rawBatter = r.Batter || r.batter || r.batter_name || '';
    if (!rawPitcher && !rawBatter) return;

    const pitcherName = formatPlayerName(rawPitcher);
    const batterName = formatPlayerName(rawBatter);

    const pTeam = formatRealTeamName((r.PitcherTeam || r.pitcherTeam || homeTeam).trim());
    const bTeam = formatRealTeamName((r.BatterTeam || r.batterTeam || awayTeam).trim());

    allTeams.add(pTeam);
    allTeams.add(bTeam);

    if (!teamRosters[pTeam]) teamRosters[pTeam] = { pitchers: new Set(), hitters: new Set() };
    if (!teamRosters[bTeam]) teamRosters[bTeam] = { pitchers: new Set(), hitters: new Set() };

    teamRosters[pTeam].pitchers.add(pitcherName);
    allPitchers.add(pitcherName);

    teamRosters[bTeam].hitters.add(batterName);
    allHitters.add(batterName);

    const pitchCall = r.PitchCall || r.pitchCall || 'BallCalled';
    const isWhiff = /swinging|whiff/i.test(pitchCall);
    const isCalledStrike = /calledstrike|strike_called/i.test(pitchCall);
    const bearingVal = r.Bearing !== undefined ? parseFloat(r.Bearing) : undefined;
    const isFoul = /foul/i.test(pitchCall) ||
      (r.PlayResult !== undefined && /foul/i.test(r.PlayResult)) ||
      (r.TaggedHitType !== undefined && /foul/i.test(r.TaggedHitType)) ||
      (bearingVal !== undefined && (bearingVal < -45 || bearingVal > 45));
    const isInPlay = /inplay|single|double|triple|homerun|out|groundball|flyball/i.test(pitchCall) ||
      (r.PlayResult !== undefined && /single|double|triple|homerun|out|fielderschoice|error|sac/i.test(r.PlayResult));
    const isStrike = isWhiff || isCalledStrike || isFoul || isInPlay;

    const locZ = parseFloat(r.PlateLocHeight || r.plateLocHeight || 2.5);
    const locX = parseFloat(r.PlateLocSide || r.plateLocSide || 0);
    const isInZone = Math.abs(locX) <= 0.85 && locZ >= 1.5 && locZ <= 3.5;
    const isSwing = isWhiff || isFoul || isInPlay;
    const isChase = !isInZone && isSwing;
    const exitSpeed = r.ExitSpeed !== undefined ? parseFloat(r.ExitSpeed) : undefined;

    let finalBearing = bearingVal;
    if (finalBearing === undefined && isInPlay && !isFoul) {
      const pSeed = (idx + 1) * 47 + (r.Inning ? parseInt(r.Inning) : 1) * 23;
      const pseudo = Math.abs(Math.sin(pSeed) * 10000);
      finalBearing = Math.round(((pseudo - Math.floor(pseudo)) * 70 - 35) * 10) / 10;
    }

    pitches.push({
      pitchNo: r.PitchNo ? parseInt(r.PitchNo) : idx + 1,
      gameId,
      gameDate: defaultDate,
      opponent,
      inning: r.Inning ? parseInt(r.Inning) : 1,
      pitcher: pitcherName,
      pitcherTeam: pTeam,
      batter: batterName,
      batterTeam: bTeam,
      pitchType: r.TaggedPitchType || r.AutoPitchType || 'Fastball',
      relSpeed: parseFloat(r.RelSpeed || r.relSpeed || 90),
      ivb: parseFloat(r.InducedVertBreak || r.ivb || 15),
      hb: parseFloat(r.HorzBreak || r.hb || 5),
      spinRate: parseFloat(r.SpinRate || 2200),
      pitchCall,
      plateLocHeight: locZ,
      plateLocSide: locX,
      exitSpeed,
      launchAngle: r.Angle !== undefined ? parseFloat(r.Angle) : undefined,
      bearing: finalBearing,
      distance: r.Distance !== undefined ? parseFloat(r.Distance) : undefined,
      playResult: r.PlayResult || r.playResult,
      korbb: r.KorBB || r.korbb,
      taggedHitType: r.TaggedHitType || r.taggedHitType,
      isStrike,
      isWhiff,
      isInZone,
      isChase,
      isHardHit: exitSpeed ? exitSpeed >= 95 : false,
    });
  });

  const finalRosters: Record<string, { pitchers: string[]; hitters: string[] }> = {};
  for (const [tName, r] of Object.entries(teamRosters)) {
    finalRosters[tName] = {
      pitchers: Array.from(r.pitchers).sort(),
      hitters: Array.from(r.hitters).sort(),
    };
  }

  return {
    gameId,
    gameDate: defaultDate,
    opponent,
    fileName,
    totalPitches: pitches.length,
    teams: Array.from(allTeams).sort(),
    teamRosters: finalRosters,
    pitchers: Array.from(allPitchers).sort(),
    hitters: Array.from(allHitters).sort(),
    pitches,
  };
}
