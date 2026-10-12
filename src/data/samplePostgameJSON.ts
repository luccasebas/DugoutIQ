export const SAMPLE_POSTGAME_JSON = `{
  "gameDate": "2026-07-28",
  "opponent": "Chatham Anglers vs Harwich Mariners",
  "homeTeam": "Chatham Anglers",
  "awayTeam": "Harwich Mariners",
  "pitchers": [
    {
      "playerName": "Tyler Brooks",
      "team": "Chatham Anglers",
      "fastballVelo": 94.4,
      "peakVelo": 96.8,
      "lateVeloDrop": 2.2,
      "whiffPct": 34.2,
      "cswPct": 32.5,
      "zonePct": 63.8,
      "chasePct": 31.4,
      "pitchMix": [
        { "pitch": "Four-Seam Fastball", "count": 46, "avgVelo": 94.4, "ivb": 18.2, "hb": 9.4, "whiffPct": 26 },
        { "pitch": "Slider", "count": 25, "avgVelo": 84.8, "ivb": 2.1, "hb": -7.8, "whiffPct": 44 },
        { "pitch": "Changeup", "count": 14, "avgVelo": 86.2, "ivb": 8.0, "hb": 14.6, "whiffPct": 36 }
      ]
    },
    {
      "playerName": "Mason Albright",
      "team": "Harwich Mariners",
      "fastballVelo": 91.8,
      "peakVelo": 93.5,
      "lateVeloDrop": 0.8,
      "whiffPct": 28.5,
      "cswPct": 29.4,
      "zonePct": 65.0,
      "chasePct": 26.2,
      "pitchMix": [
        { "pitch": "Four-Seam Fastball", "count": 42, "avgVelo": 91.8, "ivb": 16.0, "hb": 8.1, "whiffPct": 22 },
        { "pitch": "Curveball", "count": 28, "avgVelo": 78.4, "ivb": -8.5, "hb": -5.2, "whiffPct": 38 }
      ]
    }
  ],
  "hitters": [
    {
      "playerName": "Camden Cole",
      "team": "Harwich Mariners",
      "plateAppearances": 4,
      "maxExitVelo": 107.4,
      "ev90th": 104.1,
      "avgExitVelo": 95.8,
      "hardHitPct": 75.0,
      "sweetSpotPct": 50.0,
      "avgLaunchAngle": 15.2,
      "chasePct": 16.7,
      "zoneContactPct": 91.2,
      "sprayDirection": { "pull": 50, "center": 25, "oppo": 25 }
    },
    {
      "playerName": "Jack Walsh",
      "team": "Chatham Anglers",
      "plateAppearances": 4,
      "maxExitVelo": 102.5,
      "ev90th": 99.0,
      "avgExitVelo": 91.4,
      "hardHitPct": 50.0,
      "sweetSpotPct": 75.0,
      "avgLaunchAngle": 19.5,
      "chasePct": 20.0,
      "zoneContactPct": 85.5,
      "sprayDirection": { "pull": 25, "center": 50, "oppo": 25 }
    }
  ]
}`;
