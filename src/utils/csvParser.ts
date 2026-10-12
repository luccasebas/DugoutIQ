import { PitchRecord, GameOuting, PitcherOutingStats, HitterOutingStats } from '../types/baseball';
import { formatRealTeamName } from './teamNames';

// Robust CSV Line Parser that handles quoted commas (e.g. "Ausbun, Keller")
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Convert "Ausbun, Keller" to "Keller Ausbun" for clean display, or keep trimmed
export function formatPlayerName(rawName: string): string {
  const clean = rawName.replace(/^["']|["']$/g, '').trim();
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim());
    if (parts.length === 2 && parts[1]) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return clean;
}

function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === c.toLowerCase().trim());
    if (idx !== -1) return idx;
  }
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === c.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseTrackmanCSV(csvContent: string, fileName?: string): GameOuting {
  const lines = csvContent.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file contains no data rows.');
  }

  const headerRow = parseCSVLine(lines[0]);

  // Exact TrackMan column matches
  const pitcherIdx = findCol(headerRow, ['pitcher', 'pitchername', 'pitcher_name']);
  const pitcherTeamIdx = findCol(headerRow, ['pitcherteam', 'pitcher_team', 'pitcherclub']);
  const batterIdx = findCol(headerRow, ['batter', 'battername', 'batter_name', 'hitter']);
  const batterTeamIdx = findCol(headerRow, ['batterteam', 'batter_team', 'batterclub']);
  const dateIdx = findCol(headerRow, ['date', 'gamedate', 'game_date']);
  const inningIdx = findCol(headerRow, ['inning', 'inn']);
  const topBottomIdx = findCol(headerRow, ['top/bottom', 'topbottom', 'half']);
  const taggedPitchIdx = findCol(headerRow, ['taggedpitchtype', 'autopitchtype', 'pitchtype']);
  const autoPitchIdx = findCol(headerRow, ['autopitchtype', 'taggedpitchtype', 'pitchtype']);
  const pitchCallIdx = findCol(headerRow, ['pitchcall', 'result', 'call', 'description']);
  const playResultIdx = findCol(headerRow, ['playresult', 'play_result']);
  const korbbIdx = findCol(headerRow, ['korbb', 'k_or_bb', 'strikeoutorwalk']);
  const taggedHitIdx = findCol(headerRow, ['taggedhittype', 'autohittype', 'hittype']);
  const distanceIdx = findCol(headerRow, ['distance', 'lasttrackeddistance', 'hitdistance', 'dist']);
  const relSpeedIdx = findCol(headerRow, ['relspeed', 'pitchspeed', 'velocity', 'velo']);
  const ivbIdx = findCol(headerRow, ['inducedvertbreak', 'ivb']);
  const hbIdx = findCol(headerRow, ['horzbreak', 'hb']);
  const spinIdx = findCol(headerRow, ['spinrate', 'spin_rate', 'spin']);
  const locHIdx = findCol(headerRow, ['platelocheight', 'loc_z', 'pz', 'plate_z']);
  const locSIdx = findCol(headerRow, ['platelocside', 'loc_x', 'px', 'plate_x']);
  const exitSpeedIdx = findCol(headerRow, ['exitspeed', 'exitvelocity', 'ev', 'hitspeed']);
  const angleIdx = findCol(headerRow, ['angle', 'launchangle', 'la']);
  const bearingIdx = findCol(headerRow, ['bearing']);
  const directionIdx = findCol(headerRow, ['direction']);
  const homeTeamIdx = findCol(headerRow, ['hometeam', 'home_team']);
  const awayTeamIdx = findCol(headerRow, ['awayteam', 'away_team']);
  const opponentIdx = findCol(headerRow, ['opponent', 'opp']);
  const pitchNoIdx = findCol(headerRow, ['pitchno', 'pitch_no', 'pitch#']);

  let defaultDate = fileName?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '2026-07-26';
  let homeTeamName = 'Home Team';
  let awayTeamName = 'Away Team';

  const pitches: PitchRecord[] = [];
  const teamRosters: Record<string, { pitchers: Set<string>; hitters: Set<string> }> = {};
  const allTeams = new Set<string>();
  const allPitchers = new Set<string>();
  const allHitters = new Set<string>();

  const registerTeamMember = (teamName: string, playerName: string, role: 'Pitcher' | 'Hitter') => {
    const cleanTeam = formatRealTeamName(teamName);
    allTeams.add(cleanTeam);
    if (!teamRosters[cleanTeam]) {
      teamRosters[cleanTeam] = { pitchers: new Set(), hitters: new Set() };
    }
    if (role === 'Pitcher') {
      teamRosters[cleanTeam].pitchers.add(playerName);
      allPitchers.add(playerName);
    } else {
      teamRosters[cleanTeam].hitters.add(playerName);
      allHitters.add(playerName);
    }
    return cleanTeam;
  };

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCSVLine(lines[i]);
    if (rawCols.length < 5) continue;

    const rawPitcher = pitcherIdx !== -1 && rawCols[pitcherIdx] ? rawCols[pitcherIdx] : '';
    const rawBatter = batterIdx !== -1 && rawCols[batterIdx] ? rawCols[batterIdx] : '';

    if (!rawPitcher && !rawBatter) continue;

    const pitcherName = formatPlayerName(rawPitcher);
    const batterName = formatPlayerName(rawBatter);

    const pitchNo = pitchNoIdx !== -1 && !isNaN(parseInt(rawCols[pitchNoIdx])) ? parseInt(rawCols[pitchNoIdx]) : i;
    const inning = inningIdx !== -1 && !isNaN(parseInt(rawCols[inningIdx])) ? parseInt(rawCols[inningIdx]) : 1;

    // Pitch Type Priority: TaggedPitchType, then AutoPitchType
    let pitchType = 'Fastball';
    if (taggedPitchIdx !== -1 && rawCols[taggedPitchIdx] && rawCols[taggedPitchIdx] !== 'Undefined') {
      pitchType = rawCols[taggedPitchIdx];
    } else if (autoPitchIdx !== -1 && rawCols[autoPitchIdx] && rawCols[autoPitchIdx] !== 'Undefined') {
      pitchType = rawCols[autoPitchIdx];
    }

    const relSpeed = relSpeedIdx !== -1 && !isNaN(parseFloat(rawCols[relSpeedIdx])) ? parseFloat(rawCols[relSpeedIdx]) : 0;
    const ivb = ivbIdx !== -1 && !isNaN(parseFloat(rawCols[ivbIdx])) ? parseFloat(rawCols[ivbIdx]) : 0;
    const hb = hbIdx !== -1 && !isNaN(parseFloat(rawCols[hbIdx])) ? parseFloat(rawCols[hbIdx]) : 0;
    const spinRate = spinIdx !== -1 && !isNaN(parseFloat(rawCols[spinIdx])) ? parseFloat(rawCols[spinIdx]) : 0;
    const pitchCall = pitchCallIdx !== -1 && rawCols[pitchCallIdx] ? rawCols[pitchCallIdx] : 'BallCalled';
    const plateLocHeight = locHIdx !== -1 && !isNaN(parseFloat(rawCols[locHIdx])) ? parseFloat(rawCols[locHIdx]) : 2.5;
    const plateLocSide = locSIdx !== -1 && !isNaN(parseFloat(rawCols[locSIdx])) ? parseFloat(rawCols[locSIdx]) : 0.0;
    const exitSpeed = exitSpeedIdx !== -1 && !isNaN(parseFloat(rawCols[exitSpeedIdx])) ? parseFloat(rawCols[exitSpeedIdx]) : undefined;
    const launchAngle = angleIdx !== -1 && !isNaN(parseFloat(rawCols[angleIdx])) ? parseFloat(rawCols[angleIdx]) : undefined;

    let bearing: number | undefined = undefined;
    if (bearingIdx !== -1 && !isNaN(parseFloat(rawCols[bearingIdx]))) {
      bearing = parseFloat(rawCols[bearingIdx]);
    } else if (directionIdx !== -1 && !isNaN(parseFloat(rawCols[directionIdx]))) {
      bearing = parseFloat(rawCols[directionIdx]);
    }

    // TrackMan distance or projectile carry calculation if exit velocity and launch angle exist
    let distance: number | undefined = undefined;
    if (distanceIdx !== -1 && !isNaN(parseFloat(rawCols[distanceIdx]))) {
      const parsedDist = parseFloat(rawCols[distanceIdx]);
      if (parsedDist > 0) distance = Math.round(parsedDist * 10) / 10;
    }
    if (distance === undefined && exitSpeed !== undefined && exitSpeed > 0 && launchAngle !== undefined) {
      if (launchAngle > 0 && launchAngle < 55) {
        const angleFactor = Math.sin((launchAngle * Math.PI) / 60);
        distance = Math.round(exitSpeed * 3.85 * Math.max(0.2, angleFactor) * 10) / 10;
      } else if (launchAngle <= 0) {
        distance = Math.round(exitSpeed * 0.9 * 10) / 10;
      }
    }

    const playResult = playResultIdx !== -1 && rawCols[playResultIdx] && rawCols[playResultIdx] !== 'Undefined'
      ? rawCols[playResultIdx].trim()
      : undefined;
    const korbb = korbbIdx !== -1 && rawCols[korbbIdx] && rawCols[korbbIdx] !== 'Undefined'
      ? rawCols[korbbIdx].trim()
      : undefined;
    const taggedHitType = taggedHitIdx !== -1 && rawCols[taggedHitIdx] && rawCols[taggedHitIdx] !== 'Undefined'
      ? rawCols[taggedHitIdx].trim()
      : undefined;

    const gameDate = dateIdx !== -1 && rawCols[dateIdx] ? rawCols[dateIdx] : defaultDate;
    if (dateIdx !== -1 && rawCols[dateIdx]) defaultDate = rawCols[dateIdx];

    if (homeTeamIdx !== -1 && rawCols[homeTeamIdx]) homeTeamName = formatRealTeamName(rawCols[homeTeamIdx]);
    if (awayTeamIdx !== -1 && rawCols[awayTeamIdx]) awayTeamName = formatRealTeamName(rawCols[awayTeamIdx]);

    // Determine Pitcher & Batter Teams
    let pTeam = pitcherTeamIdx !== -1 && rawCols[pitcherTeamIdx] ? rawCols[pitcherTeamIdx] : '';
    let bTeam = batterTeamIdx !== -1 && rawCols[batterTeamIdx] ? rawCols[batterTeamIdx] : '';

    if (!pTeam) {
      const topBottom = topBottomIdx !== -1 && rawCols[topBottomIdx] ? rawCols[topBottomIdx].toLowerCase() : '';
      pTeam = topBottom === 'bottom' ? awayTeamName : homeTeamName;
    }
    if (!bTeam) {
      const topBottom = topBottomIdx !== -1 && rawCols[topBottomIdx] ? rawCols[topBottomIdx].toLowerCase() : '';
      bTeam = topBottom === 'bottom' ? homeTeamName : awayTeamName;
    }

    const finalPTeam = registerTeamMember(pTeam, pitcherName, 'Pitcher');
    const finalBTeam = registerTeamMember(bTeam, batterName, 'Hitter');

    // Strike / Whiff / Zone / Chase evaluations
    const isWhiff = /swinging|whiff/i.test(pitchCall);
    const isCalledStrike = /calledstrike|strike_called|strikecalled/i.test(pitchCall);
    const isFoul = /foul/i.test(pitchCall) ||
      (playResult !== undefined && /foul/i.test(playResult)) ||
      (taggedHitType !== undefined && /foul/i.test(taggedHitType)) ||
      (bearing !== undefined && (bearing < -45 || bearing > 45));

    const isInPlay = /inplay|single|double|triple|homerun|out|groundball|flyball|linedrive|popup|fielderschoice|error/i.test(pitchCall) ||
      (playResult !== undefined && /single|double|triple|homerun|out|fielderschoice|error|sac/i.test(playResult));

    const isStrike = isWhiff || isCalledStrike || isFoul || isInPlay;

    // Standard Strike Zone in feet (X: [-0.85, 0.85], Z: [1.5, 3.5])
    const isInZone = Math.abs(plateLocSide) <= 0.85 && plateLocHeight >= 1.5 && plateLocHeight <= 3.5;
    const isSwing = isWhiff || isFoul || isInPlay;
    const isChase = !isInZone && isSwing;
    const isHardHit = exitSpeed ? exitSpeed >= 95 : false;

    // If bearing is undefined for fair in-play contact, assign a deterministic fair bearing (-35° to +35°)
    // so spray chart and pull/center/oppo rates are 100% stable across re-renders
    let finalBearing = bearing;
    if (finalBearing === undefined && isInPlay && !isFoul) {
      const pNum = pitchNo || i;
      const evVal = exitSpeed ? Math.round(exitSpeed * 10) : 780;
      const laVal = launchAngle ? Math.round(launchAngle * 10) : 140;
      const seed = pNum * 47 + inning * 23 + evVal * 7 + laVal * 11;
      const pseudo = Math.abs(Math.sin(seed) * 10000);
      const frac = pseudo - Math.floor(pseudo);
      finalBearing = Math.round((frac * 70 - 35) * 10) / 10;
    }

    // Ensure fair in-play contact always has a stable distance
    let finalDistance = distance;
    if ((finalDistance === undefined || finalDistance <= 0) && isInPlay && !isFoul) {
      if (exitSpeed !== undefined && exitSpeed > 0) {
        finalDistance = Math.round(exitSpeed * 3.1 * 10) / 10;
      } else {
        const hitType = (taggedHitType || playResult || '').toLowerCase();
        if (hitType.includes('fly')) finalDistance = 280;
        else if (hitType.includes('line')) finalDistance = 240;
        else if (hitType.includes('pop')) finalDistance = 160;
        else if (hitType.includes('ground')) finalDistance = 110;
        else finalDistance = 180;
      }
    }

    pitches.push({
      pitchNo,
      gameId: `${gameDate}_${homeTeamName}_vs_${awayTeamName}`.replace(/\s+/g, '_'),
      gameDate,
      opponent: `${homeTeamName} vs ${awayTeamName}`,
      inning,
      pitcher: pitcherName,
      pitcherTeam: finalPTeam,
      batter: batterName,
      batterTeam: finalBTeam,
      pitchType,
      relSpeed,
      ivb,
      hb,
      spinRate,
      pitchCall,
      plateLocHeight,
      plateLocSide,
      exitSpeed,
      launchAngle,
      bearing: finalBearing,
      distance: finalDistance,
      playResult,
      korbb,
      taggedHitType,
      isStrike,
      isWhiff,
      isInZone,
      isChase,
      isHardHit,
    });
  }

  const finalRosters: Record<string, { pitchers: string[]; hitters: string[] }> = {};
  for (const [tName, r] of Object.entries(teamRosters)) {
    finalRosters[tName] = {
      pitchers: Array.from(r.pitchers).sort(),
      hitters: Array.from(r.hitters).sort(),
    };
  }

  const opponentSummary = `${homeTeamName} vs ${awayTeamName}`;
  const gameId = `${defaultDate}_${homeTeamName}_${awayTeamName}`.replace(/\s+/g, '_');

  return {
    gameId,
    gameDate: defaultDate,
    opponent: opponentSummary,
    fileName: fileName || `${defaultDate}.csv`,
    totalPitches: pitches.length,
    teams: Array.from(allTeams).sort(),
    teamRosters: finalRosters,
    pitchers: Array.from(allPitchers).sort(),
    hitters: Array.from(allHitters).sort(),
    pitches,
  };
}

// Compute Outing Stats for a Pitcher
export function calculatePitcherOuting(pitches: PitchRecord[], playerName: string, gameDate: string, opponent: string): PitcherOutingStats {
  const pPitches = pitches.filter((p) => p.pitcher.toLowerCase() === playerName.toLowerCase());
  const total = pPitches.length || 1;
  const team = pPitches[0]?.pitcherTeam || 'Team';

  const validVelos = pPitches.map((p) => p.relSpeed).filter((v) => v > 60);
  const avgVelo = validVelos.length ? Math.round((validVelos.reduce((a, b) => a + b, 0) / validVelos.length) * 10) / 10 : 0;
  const peakVelo = validVelos.length ? Math.round(Math.max(...validVelos) * 10) / 10 : 0;

  const validIvbs = pPitches.map((p) => p.ivb).filter((v) => v !== undefined && !isNaN(v));
  const avgIvb = validIvbs.length ? Math.round((validIvbs.reduce((a, b) => a + b, 0) / validIvbs.length) * 10) / 10 : 0;
  const validHbs = pPitches.map((p) => p.hb).filter((v) => v !== undefined && !isNaN(v));
  const avgHb = validHbs.length ? Math.round((validHbs.reduce((a, b) => a + b, 0) / validHbs.length) * 10) / 10 : 0;

  const earlyPitches = pPitches.filter((p) => p.inning <= 3 && p.relSpeed > 60);
  const latePitches = pPitches.filter((p) => p.inning >= 4 && p.relSpeed > 60);

  const earlyVelos = earlyPitches.map((p) => p.relSpeed);
  const lateVelos = latePitches.map((p) => p.relSpeed);

  const earlyAvg = earlyVelos.length ? earlyVelos.reduce((a, b) => a + b, 0) / earlyVelos.length : avgVelo;
  const lateAvg = lateVelos.length ? lateVelos.reduce((a, b) => a + b, 0) / lateVelos.length : avgVelo;
  const lateVeloDrop = Math.max(0, Math.round((earlyAvg - lateAvg) * 10) / 10);

  const whiffs = pPitches.filter((p) => p.isWhiff).length;
  const calledStrikes = pPitches.filter((p) => /calledstrike|strike_called|strikecalled/i.test(p.pitchCall)).length;
  const cswCount = whiffs + calledStrikes;
  const inZone = pPitches.filter((p) => p.isInZone).length;
  const outOfZone = pPitches.filter((p) => !p.isInZone);
  const chases = outOfZone.filter((p) => p.isChase).length;

  const whiffPct = Math.round((whiffs / total) * 1000) / 10;
  const cswPct = Math.round((cswCount / total) * 1000) / 10;
  const zonePct = Math.round((inZone / total) * 1000) / 10;
  const chasePct = outOfZone.length ? Math.round((chases / outOfZone.length) * 1000) / 10 : 0;

  const typeMap = new Map<string, PitchRecord[]>();
  for (const p of pPitches) {
    if (!typeMap.has(p.pitchType)) typeMap.set(p.pitchType, []);
    typeMap.get(p.pitchType)!.push(p);
  }

  const pitchMix = Array.from(typeMap.entries()).map(([pitch, typePitches]) => {
    const pVelos = typePitches.map((p) => p.relSpeed).filter((v) => v > 60);
    const pIvbs = typePitches.map((p) => p.ivb).filter((v) => v !== undefined && !isNaN(v));
    const pHbs = typePitches.map((p) => p.hb).filter((v) => v !== undefined && !isNaN(v));
    const pWhiffs = typePitches.filter((p) => p.isWhiff).length;

    return {
      pitch,
      count: typePitches.length,
      usage: Math.round((typePitches.length / total) * 100),
      avgVelo: pVelos.length ? Math.round((pVelos.reduce((a, b) => a + b, 0) / pVelos.length) * 10) / 10 : 0,
      peakVelo: pVelos.length ? Math.round(Math.max(...pVelos) * 10) / 10 : 0,
      ivb: pIvbs.length ? Math.round((pIvbs.reduce((a, b) => a + b, 0) / pIvbs.length) * 10) / 10 : 0,
      hb: pHbs.length ? Math.round((pHbs.reduce((a, b) => a + b, 0) / pHbs.length) * 10) / 10 : 0,
      whiffPct: Math.round((pWhiffs / typePitches.length) * 1000) / 10,
      pitches: typePitches,
    };
  }).sort((a, b) => b.count - a.count);

  const innings = Array.from(new Set(pPitches.map((p) => p.inning))).sort((a, b) => a - b);

  return {
    playerName,
    team,
    role: 'Pitcher',
    gameId: `${gameDate}_${opponent}`.replace(/\s+/g, '_'),
    gameDate,
    opponent,
    totalPitches: total,
    innings,
    fastballVelo: pitchMix[0]?.avgVelo || avgVelo,
    peakVelo,
    earlyVelo: Math.round(earlyAvg * 10) / 10,
    lateVelo: Math.round(lateAvg * 10) / 10,
    lateVeloDrop,
    avgIvb,
    avgHb,
    whiffPct,
    cswPct,
    zonePct,
    chasePct,
    pitchMix,
    allPitches: pPitches,
  };
}

// Helper to identify foul balls (which must be excluded from fair in-play max EV and spray metrics)
export function isFoulBall(p: PitchRecord): boolean {
  const call = (p.pitchCall || '').toLowerCase();
  const res = (p.playResult || '').toLowerCase();
  const hitType = (p.taggedHitType || '').toLowerCase();
  const korbb = (p.korbb || '').toLowerCase();

  // Explicit foul indicators in text columns
  if (
    call.includes('foul') ||
    res.includes('foul') ||
    hitType.includes('foul') ||
    korbb.includes('foul')
  ) {
    return true;
  }

  // Bearing or Direction outside standard 90° fair territory (< -45° or > 45°)
  if (p.bearing !== undefined && !isNaN(p.bearing)) {
    if (p.bearing < -45 || p.bearing > 45) {
      return true;
    }
  }

  return false;
}

// Helper to determine if a pitch was a fair ball put into play
export function isFairBattedBall(p: PitchRecord): boolean {
  if (isFoulBall(p)) return false;

  const call = (p.pitchCall || '').toLowerCase();
  const res = (p.playResult || '').toLowerCase();
  const hitType = (p.taggedHitType || '').toLowerCase();

  // If call is explicitly a non-contact event
  if (/called|swinging|whiff|ballin|ballcalled|strikeout|walk|hitbypitch/i.test(call) && !call.includes('inplay')) {
    return false;
  }

  return (
    call.includes('inplay') ||
    /single|double|triple|homerun|home_run|out|groundball|flyball|linedrive|popup|fielderschoice|error|sac/i.test(call) ||
    /single|double|triple|homerun|home_run|out|fielderschoice|error|sac/i.test(res) ||
    /groundball|flyball|linedrive|popup|bunt/i.test(hitType)
  );
}

// Compute Outing Stats for a Hitter
export function calculateHitterOuting(pitches: PitchRecord[], playerName: string, gameDate: string, opponent: string): HitterOutingStats {
  const hPitches = pitches.filter((p) => p.batter.toLowerCase() === playerName.toLowerCase());
  const team = hPitches[0]?.batterTeam || 'Team';

  // Strict Rule: Foul balls must NOT be included in max EV calculations!
  // Only fair in-play batted balls with measured exit velocity are used for max/avg/90th EV:
  const fairBattedBallsWithEV = hPitches.filter(
    (p) => p.exitSpeed !== undefined && p.exitSpeed > 0 && isFairBattedBall(p) && !isFoulBall(p)
  );

  const exitVelos = fairBattedBallsWithEV.map((p) => p.exitSpeed!).sort((a, b) => a - b);
  const maxExitVelo = exitVelos.length ? Math.round(Math.max(...exitVelos) * 10) / 10 : 0;
  const avgExitVelo = exitVelos.length ? Math.round((exitVelos.reduce((a, b) => a + b, 0) / exitVelos.length) * 10) / 10 : 0;

  let ev90th = maxExitVelo;
  if (exitVelos.length >= 3) {
    const idx90 = Math.floor(exitVelos.length * 0.9);
    ev90th = Math.round(exitVelos[idx90] * 10) / 10;
  }

  const launchAngles = fairBattedBallsWithEV.map((p) => p.launchAngle || 0);
  const sweetSpotCount = launchAngles.filter((la) => la >= 8 && la <= 32).length;
  const sweetSpotPct = fairBattedBallsWithEV.length ? Math.round((sweetSpotCount / fairBattedBallsWithEV.length) * 1000) / 10 : 0;
  const avgLaunchAngle = launchAngles.length ? Math.round((launchAngles.reduce((a, b) => a + b, 0) / launchAngles.length) * 10) / 10 : 0;

  const hardHitCount = fairBattedBallsWithEV.filter((p) => p.isHardHit || (p.exitSpeed && p.exitSpeed >= 95)).length;
  const hardHitPct = fairBattedBallsWithEV.length ? Math.round((hardHitCount / fairBattedBallsWithEV.length) * 1000) / 10 : 0;

  // ALL fair batted balls (including outs in play that may not have exit velo recorded)
  // Ensure every ball has an immutable stable bearing and distance
  const allFairBattedBalls = hPitches.filter((p) => isFairBattedBall(p) && !isFoulBall(p));
  const fairBattedBalls = allFairBattedBalls.map((b, idx) => {
    let bearing = b.bearing;
    if (bearing === undefined || isNaN(bearing) || bearing < -45 || bearing > 45) {
      const pNum = b.pitchNo || idx + 1;
      const ev = Math.round((b.exitSpeed || 75) * 10);
      const la = Math.round((b.launchAngle || 12) * 10);
      const inn = b.inning || 1;
      const seed = pNum * 53 + ev * 19 + la * 13 + inn * 31 + idx * 7;
      const pseudo = Math.abs(Math.sin(seed) * 10000);
      const frac = pseudo - Math.floor(pseudo);
      bearing = Math.round((frac * 70 - 35) * 10) / 10; // -35° to +35° (fair territory)
    }

    let distance = b.distance;
    if (!distance || distance <= 0) {
      if (b.exitSpeed && b.exitSpeed > 0) {
        const la = b.launchAngle || 14;
        const angleFactor = la > 0 && la < 55 ? Math.sin((la * Math.PI) / 60) : 0.4;
        distance = Math.round(b.exitSpeed * 3.85 * Math.max(0.2, angleFactor) * 10) / 10;
      } else {
        const hitType = (b.taggedHitType || b.playResult || '').toLowerCase();
        if (hitType.includes('fly')) distance = 280;
        else if (hitType.includes('line')) distance = 240;
        else if (hitType.includes('pop')) distance = 160;
        else if (hitType.includes('ground')) distance = 110;
        else distance = 180;
      }
    }

    return {
      ...b,
      bearing,
      distance,
    };
  });

  const outOfZone = hPitches.filter((p) => !p.isInZone);
  const chases = outOfZone.filter((p) => p.isChase).length;
  const chasePct = outOfZone.length ? Math.round((chases / outOfZone.length) * 1000) / 10 : 0;

  const inZonePitches = hPitches.filter((p) => p.isInZone);
  const inZoneSwings = inZonePitches.filter((p) => p.isWhiff || /foul|inplay/i.test(p.pitchCall));
  const inZoneContacts = inZonePitches.filter((p) => /foul|inplay/i.test(p.pitchCall));
  const zoneContactPct = inZoneSwings.length ? Math.round((inZoneContacts.length / inZoneSwings.length) * 1000) / 10 : 0;

  let pull = 0;
  let center = 0;
  let oppo = 0;
  for (const b of fairBattedBalls) {
    const dir = b.bearing || 0;
    if (dir < -12) pull++;
    else if (dir > 12) oppo++;
    else center++;
  }
  const bCount = fairBattedBalls.length || 1;

  // Track hit distances (strictly fair balls)
  const distances = fairBattedBalls
    .map((b) => b.distance)
    .filter((d): d is number => d !== undefined && d > 0);
  const maxDistance = distances.length ? Math.round(Math.max(...distances)) : 0;
  const avgDistance = distances.length ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length) : 0;

  // Track standard outcome box stats (Hits, Walks, Strikeouts, Slash Line)
  let singles = 0;
  let doubles = 0;
  let triples = 0;
  let homeRuns = 0;
  let walks = 0;
  let strikeouts = 0;
  let hitByPitches = 0;
  let sacrifices = 0;
  let outsOnPlay = 0;

  for (const p of hPitches) {
    const pr = (p.playResult || '').toLowerCase();
    const call = (p.pitchCall || '').toLowerCase();
    const korbb = (p.korbb || '').toLowerCase();

    if (pr === 'single' || /single/i.test(call)) {
      singles++;
    } else if (pr === 'double' || /double/i.test(call)) {
      doubles++;
    } else if (pr === 'triple' || /triple/i.test(call)) {
      triples++;
    } else if (pr === 'homerun' || /homerun|home_run/i.test(call)) {
      homeRuns++;
    } else if (korbb === 'walk' || call === 'walk') {
      walks++;
    } else if (korbb === 'strikeout' || call === 'strikeout') {
      strikeouts++;
    } else if (call === 'hitbypitch' || pr === 'hitbypitch') {
      hitByPitches++;
    } else if (/sac/i.test(pr)) {
      sacrifices++;
    } else if (pr === 'out' || pr === 'fielderschoice' || pr === 'error' || /out|groundball|flyball|popup/i.test(call)) {
      outsOnPlay++;
    }
  }

  const hits = singles + doubles + triples + homeRuns;
  const totalBases = (singles * 1) + (doubles * 2) + (triples * 3) + (homeRuns * 4);

  // At-Bats calculation (AB) = Hits + Outs on Play + Strikeouts
  const inferredOuts = outsOnPlay > 0 ? outsOnPlay : Math.max(0, fairBattedBalls.length - hits);
  const atBats = Math.max(hits + inferredOuts + strikeouts, 1);

  // Batting Average (BA)
  const baNum = hits / atBats;
  const battingAverage = atBats > 0
    ? (baNum >= 1 ? '1.000' : (baNum === 0 ? '.000' : baNum.toFixed(3).replace(/^0/, '')))
    : '.000';

  // On-Base Percentage (OBP)
  const obpDenom = atBats + walks + hitByPitches + sacrifices;
  const obpNum = (hits + walks + hitByPitches) / (obpDenom || 1);
  const obp = obpDenom > 0
    ? (obpNum >= 1 ? '1.000' : (obpNum === 0 ? '.000' : obpNum.toFixed(3).replace(/^0/, '')))
    : battingAverage;

  // Slugging Percentage (SLG)
  const slgNum = totalBases / atBats;
  const slg = atBats > 0
    ? (slgNum >= 1 ? slgNum.toFixed(3) : (slgNum === 0 ? '.000' : slgNum.toFixed(3).replace(/^0/, '')))
    : '.000';

  // OPS (OBP + SLG)
  const opsVal = parseFloat(obp) + parseFloat(slg);
  const ops = isNaN(opsVal) ? '.000' : opsVal.toFixed(3);

  const terminalPitches = hPitches.filter((p) => /inplay|single|double|triple|homerun|out|strikeout|walk|hitbypitch/i.test(p.pitchCall));
  const paCount = Math.max(atBats + walks + hitByPitches + sacrifices, terminalPitches.length, 1);

  return {
    playerName,
    team,
    role: 'Hitter',
    gameId: `${gameDate}_${opponent}`.replace(/\s+/g, '_'),
    gameDate,
    opponent,
    plateAppearances: paCount,
    atBats,
    hits,
    singles,
    doubles,
    triples,
    homeRuns,
    walks,
    strikeouts,
    battingAverage,
    obp,
    slg,
    ops,
    maxDistance,
    avgDistance,
    pitchesSeen: hPitches.length,
    battedBallsCount: fairBattedBalls.length,
    maxExitVelo,
    ev90th,
    avgExitVelo,
    hardHitPct,
    sweetSpotPct,
    avgLaunchAngle,
    chasePct,
    zoneContactPct,
    sprayDirection: {
      pull: Math.round((pull / bCount) * 100),
      center: Math.round((center / bCount) * 100),
      oppo: Math.round((oppo / bCount) * 100),
    },
    battedBalls: fairBattedBalls,
    allPitches: hPitches,
  };
}
