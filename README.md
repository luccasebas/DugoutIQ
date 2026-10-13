# ⚾ DugoutIQ

> **Elite Collegiate Baseball Analytics & Player Development Platform**  
> Translating TrackMan, Statcast, and optical tracking data into clear, actionable, feel-based player reports for summer ball and collegiate athletes.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.4.0-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [The Problem DugoutIQ Solves](#-the-problem-dugoutiq-solves)
- [Key Features](#-key-features)
- [Interactive Visualizations](#-interactive-visualizations)
- [Player Report Architecture](#-player-report-architecture)
- [Dual-Engine Generation & Resilience](#-dual-engine-generation--resilience)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Supported Tracking Metrics & Formats](#-supported-tracking-metrics--formats)
- [Scripts](#-scripts)
- [Contributing & License](#-contributing--license)

---

## 🔍 Overview

**DugoutIQ** is designed for collegiate baseball programs, summer ball development leagues (such as the Cape Cod League, Northwoods League, and California Collegiate League), and independent player development coordinators. 

Modern ballparks capture rich pitch-by-pitch ball-flight data through optical and radar systems like **TrackMan**, **Statcast**, and **Hawkeye**. However, raw tracking spreadsheets are dense, confusing, and overwhelming for players. DugoutIQ bridges this gap: it parses season or single-game tracking CSV/JSON files, extracts meaningful performance metrics, audits the data for accuracy, and produces **concise (<250 word) individualized player reports** formatted for mobile phones in the dugout.

---

## 💡 The Problem DugoutIQ Solves

1. **Information Overload**: Players get handed sheets full of metrics—IVB, HB, spin efficiency, CSW%, launch angle standard deviations—and leave with analysis paralysis.
2. **Academic Jargon**: Terms like *"statistically significant delta in vertical break"* don't help a pitcher in the bullpen. DugoutIQ translates statistical variances into **physical feel-based cues** (e.g., *"Stay on top of your fingers through release to keep the sharp downward bite on your slider"*).
3. **Data Integrity Guardrails**: Prevents common analytics errors, such as mistakenly including foul balls in maximum exit velocity calculations, or issuing generic player archetype templates that aren't grounded in actual game stats.
4. **Dugout Accessibility**: Reports are sized and formatted specifically for dugout smartphone screens or coach text message updates before the next outing or cage session.

---

## ✨ Key Features

- **Multi-File CSV & JSON Ingestion**:
  - Drag-and-drop support for TrackMan pitch-by-pitch CSV exports, postgame summary JSONs, and multi-game rosters.
  - Built-in data auditor ensuring fair batted balls only for exit velocity ceilings, valid pitch count tallies, and clean player role separation.
  - Preloaded sample datasets from collegiate summer ball (e.g., Sonoma Stompers CCL games).

- **Role-Aware Player Analysis**:
  - Dedicated analysis flows for **Pitchers** (velocity, break profile, pitch arsenal, CSW%, zone rate, fatigue drop) and **Hitters** (exit velocity, sweet-spot %, launch angles, chase rate, spray profile).

- **Smartphone Dugout View (Modal)**:
  - Interactive smartphone mockup displaying the player report exactly as an athlete sees it on their device.
  - One-click copy formatted cleanly for SMS, iMessage, GroupMe, or Slack team chats.

- **Coach Cheat Sheet**:
  - Slide-out quick-reference card detailing collegiate benchmarks (CSW% ≥ 30%, IVB ride thresholds, sweet-spot launch angle brackets 8°–32°, hard-hit benchmarks 95+ mph).

- **Theme Adaptability (Dark / Light)**:
  - High-contrast stadium dark mode (`dark`) and daylight mode (`light`) with persistent preference storage and transparent overlays for daylight readability.

---

## 📊 Interactive Visualizations

DugoutIQ includes custom, high-performance visualization components built directly into the player report workflow:

| Visualization | Description |
|---|---|
| **Pitcher Plate Location Scatterplot** | Interactive 3×3 strike zone with transparency control, catcher's perspective home plate indicator, and pitch-type color coding. |
| **Pitch Movement Plot (IVB vs. HB)** | Induced Vertical Break vs. Horizontal Break scatterplot with axis crosshairs and quadrant separation (carry vs. sink, cut vs. run). |
| **Fatigue Velocity Trend** | Inning-by-inning velocity curve highlighting early vs. late-outing drops to detect mechanical breakdown. |
| **Hitter Strike Zone Heatmap** | 3×3 zone matrix displaying swing frequency and contact efficiency across pitch locations. |
| **Batted Ball Spray Chart** | Visual spray angle distribution mapping pull-side, center, and opposite-field contact. |

---

## 📑 Player Report Architecture

Every generated report follows a disciplined, 5-point collegiate structure:

```markdown
### ⚾ Player Report: [Player Name] ([Pitcher / Hitter]) | [Outing / Date]

1. The Quick Take (1–2 sentences):
   Data-grounded summary highlighting standout velocity, break, or exit velocity numbers.

2. What Worked (1–2 bullet points):
   Key pitches or contact profiles that generated results, citing exact tracking values.

3. One Specific Thing to Improve (From CSV Data):
   ONE pinpointed area of variance directly from the data (e.g., late-inning velo drop, secondary pitch shape, chase rate), followed by ONE feel-based cue.

4. Actionable Routine Cues (1–2 bullet points):
   Tactical drills and mechanical focus for the next bullpen or cage session.

5. Next Game Focus:
   A single-sentence tactical focus heading into their next outing.
```

---

## 🤖 Dual-Engine Generation & Resilience

DugoutIQ pairs cutting-edge generative AI with an offline-capable collegiate rule engine:

```
                  ┌──────────────────────────────────────────────┐
                  │           Uploaded Tracking Data             │
                  │        (TrackMan CSV / Postgame JSON)        │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Data Audit & Extraction           │
                  │   (baseballAuditor.ts & csvParser.ts)        │
                  └──────────────────────┬───────────────────────┘
                                         │
                        Is GEMINI_API_KEY available?
                                    /         \
                                  Yes          No
                                  /             \
                                 ▼               ▼
        ┌────────────────────────────────┐   ┌───────────────────────────────┐
        │       Google Gemini API        │   │    Collegiate Rule Engine     │
        │   (gemini-3.1-flash-lite /     │   │   (Direct CSV metric-driven   │
        │    gemini-3.8-flash failover)  │   │    insight generation)        │
        └────────────────┬───────────────┘   └───────────────┬───────────────┘
                         │                                   │
              Model 503 / Traffic Spike                      │
                         └─────────────────► Fallback ───────┘
                                                │
                                                ▼
                              ┌───────────────────────────────────┐
                              │     Rendered Player Report Card   │
                              │    + Dugout Smartphone Modal      │
                              └───────────────────────────────────┘
```

1. **Primary AI Engine**: Uses `@google/genai` to generate nuanced, context-aware reports with strict anti-jargon system instructions. Features automatic model failover (`gemini-3.1-flash-lite` ➔ `gemini-3.8-flash`).
2. **Deterministic Fallback Engine**: If the API key is not configured or an AI service experiences a traffic spike, DugoutIQ falls back seamlessly to a high-baseball-IQ collegiate rule engine that extracts exact figures and outputs structured reports without delay.

---

## 🛠 Tech Stack

- **Frontend Framework**: React 19 (SPA)
- **Bundler & Tooling**: Vite 8, TypeScript 5, tsx
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons & Motion**: Lucide React, Motion
- **Backend**: Node.js, Express 4 (integrated Vite middleware in development)
- **AI SDK**: `@google/genai` (Google Gen AI TypeScript SDK)

---

## 📂 Project Structure

```
dugoutiq/
├── .env.example              # Environment variables template
├── index.html                # HTML entry point with metadata
├── metadata.json             # AI Studio applet capabilities
├── package.json              # Dependencies and scripts
├── server.ts                 # Express server with Vite middleware & Gemini API endpoint
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite bundler configuration
└── src/
    ├── App.tsx               # Root application component with state & theme
    ├── index.css             # Tailwind CSS global styles & dark/light theme overrides
    ├── main.tsx              # React DOM render entry point
    ├── components/
    │   ├── ActionableVisuals.tsx    # Strike zone, movement charts & velocity trends
    │   ├── CoachCheatSheet.tsx      # Collegiate metric benchmarks slide-out
    │   ├── Header.tsx               # Top navigation, theme switcher, and league selector
    │   ├── PhoneDugoutModal.tsx     # Smartphone hardware chassis mockup for dugout reading
    │   ├── PlayerAnalysisPage.tsx   # Player selection, metrics preview & report generator
    │   ├── ReportOutput.tsx         # Rendered report card display with copy/export actions
    │   └── SeasonUploadPage.tsx     # CSV/JSON file upload, parsing, and games list
    ├── data/
    │   ├── sampleCCLGame.ts         # Sample California Collegiate League TrackMan game data
    │   └── samplePostgameJSON.ts    # Sample structured postgame summary
    ├── types/
    │   └── baseball.ts              # TypeScript interfaces for TrackMan, pitch, and game data
    └── utils/
        ├── baseballAuditor.ts       # Statistical validation & data integrity checks
        ├── csvParser.ts             # Pitch-by-pitch TrackMan CSV reader & metric aggregator
        ├── jsonParser.ts            # Postgame JSON file reader
        └── teamNames.ts             # Summer league team name and abbreviation helpers
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **npm** or **bun** / **yarn** / **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/dugoutiq.git
   cd dugoutiq
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key to `.env` (optional; the app will use the rule engine fallback if omitted):
   ```env
   GEMINI_API_KEY="your_api_key_here"
   PORT=3000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open your browser at **`http://localhost:3000`**.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key for AI report generation. If omitted, the app uses the built-in collegiate rule engine. |
| `PORT` | Optional | `3000` | Port for the Express server to listen on. |
| `NODE_ENV` | Optional | `development` | Set to `production` when running compiled production builds. |

---

## 📈 Supported Tracking Metrics & Formats

DugoutIQ handles standard TrackMan V3/V4 column schemas as well as custom collegiate CSV exports:

### Pitcher Tracking Columns:
- **Pitch Type**: `TaggedPitchType`, `PitchType`, `AutoPitchType`
- **Velocity**: `RelSpeed`, `PitchVelocity`, `Velocity`
- **Movement**: `InducedVertBreak` (IVB), `HorzBreak` (HB), `SpinRate`
- **Release**: `RelHeight`, `RelSide`, `Extension`
- **Plate Location**: `PlateLocHeight`, `PlateLocSide`
- **Outcome**: `PitchCall`, `PlayResult`, `KorBB`

### Hitter Tracking Columns:
- **Exit Velocity**: `ExitSpeed`, `HitVelo` *(audited to ensure only fair in-play balls are counted towards Max EV)*
- **Launch Angle**: `Angle`, `LaunchAngle` (Sweet-spot range: 8°–32°)
- **Hit Distance**: `Distance`, `HitDistance`
- **Direction**: `Bearing`, `Direction`, `SprayAngle`

---

## 📜 Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the Express server with Vite middleware on port 3000 |
| `npm run build` | Compiles TypeScript and creates optimized production client build in `/dist` |
| `npm run start` | Runs production server serving `/dist` bundle |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Deletes `/dist` and build artifacts |

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports from coaches, players, and developers are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewMetricVisual`)
3. Commit your Changes (`git commit -m 'Add release extension chart'`)
4. Push to the Branch (`git push origin feature/NewMetricVisual`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
