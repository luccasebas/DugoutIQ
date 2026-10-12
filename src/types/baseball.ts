export type PlayerRole = 'Pitcher' | 'Hitter';

export interface PitchRecord {
  pitchNo: number;
  gameId: string;
  gameDate: string;
  opponent: string;
  inning: number;
  pitcher: string;
  pitcherTeam: string;
  pitcherThrows?: 'R' | 'L';
  batter: string;
  batterTeam: string;
  batterSide?: 'R' | 'L';
  pitchType: string;
  relSpeed: number; // Velocity in mph
  ivb: number; // Induced Vertical Break in inches
  hb: number; // Horizontal Break in inches
  spinRate?: number;
  pitchCall: string; // CalledStrike, StrikeSwinging, FoulBall, InPlay, BallCalled, etc.
  plateLocHeight?: number; // In feet
  plateLocSide?: number; // In feet
  exitSpeed?: number; // Exit velo in mph if batted ball
  launchAngle?: number; // Launch angle in degrees if batted ball
  bearing?: number; // Direction in degrees
  distance?: number; // Distance in feet
  playResult?: string; // Single, Double, Triple, HomeRun, Out, Error, etc.
  korbb?: string; // Strikeout, Walk
  taggedHitType?: string; // FlyBall, GroundBall, LineDrive, Popup
  isStrike: boolean;
  isWhiff: boolean;
  isInZone: boolean;
  isChase: boolean;
  isHardHit?: boolean;
}

export interface GameOuting {
  gameId: string;
  gameDate: string;
  opponent: string;
  fileName?: string;
  totalPitches: number;
  teams: string[];
  teamRosters: Record<string, { pitchers: string[]; hitters: string[] }>;
  pitchers: string[];
  hitters: string[];
  pitches: PitchRecord[];
}

export interface PitcherOutingStats {
  playerName: string;
  team: string;
  role: 'Pitcher';
  gameId: string;
  gameDate: string;
  opponent: string;
  totalPitches: number;
  innings: number[];
  fastballVelo: number;
  peakVelo: number;
  earlyVelo: number; // Innings 1-3
  lateVelo: number; // Innings 4+
  lateVeloDrop: number;
  avgIvb: number; // Average Induced Vertical Break in inches
  avgHb: number; // Average Horizontal Break in inches
  whiffPct: number;
  cswPct: number;
  zonePct: number;
  chasePct: number;
  pitchMix: {
    pitch: string;
    count: number;
    usage: number; // %
    avgVelo: number;
    peakVelo: number; // Peak velo for this pitch type
    ivb: number;
    hb: number;
    whiffPct: number;
    pitches: PitchRecord[];
  }[];
  allPitches: PitchRecord[];
}

export interface HitterOutingStats {
  playerName: string;
  team: string;
  role: 'Hitter';
  gameId: string;
  gameDate: string;
  opponent: string;
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  battingAverage: string; // e.g. ".333"
  obp: string; // On-Base Percentage, e.g. ".429"
  slg: string; // Slugging Percentage, e.g. ".667"
  ops: string; // On-Base Plus Slugging, e.g. "1.096"
  maxDistance: number; // in feet, e.g. 385
  avgDistance: number; // in feet, e.g. 260
  pitchesSeen: number;
  battedBallsCount: number;
  maxExitVelo: number;
  ev90th: number;
  avgExitVelo: number;
  hardHitPct: number; // 95+ mph
  sweetSpotPct: number; // 8° to 32°
  avgLaunchAngle: number;
  chasePct: number;
  zoneContactPct: number;
  sprayDirection: {
    pull: number;
    center: number;
    oppo: number;
  };
  battedBalls: PitchRecord[];
  allPitches: PitchRecord[];
}

export interface PlayerReportData {
  id: string;
  playerName: string;
  team: string;
  role: PlayerRole;
  dateOrOuting: string;
  opponent: string;
  rawInput: string;
  generatedReport: string;
  wordCount: number;
  hasJargonFlag: boolean;
  jargonTermsFound: string[];
  createdAt: string;
}
