# 🏏 CricFlex (Zero-DB Edition)

> **Lightweight, Offline-First Cricket Scoring & Tournament Management Web App**  
> Designed for grassroots box cricket, gully tournaments, and official matches with zero database setup. Scores offline in your browser and uses Google Gemini AI for post-match analysis.

---

## 📌 Table of Contents
1. [Why Zero-DB?](#-why-zero-db)
2. [Key Features](#-key-features)
3. [Architecture Overview](#-architecture-overview)
4. [Tech Stack](#-tech-stack)
5. [Local Data Storage Model](#-local-data-storage-model)
6. [Match Rule Engine](#-match-rule-engine)
7. [AI Awards & Match Intelligence](#-ai-awards--match-intelligence)
8. [Quick Start & Local Setup](#-quick-start--local-setup)
9. [Environment Variables](#-environment-variables)
10. [Export & Backup Features](#-export--backup-features)
11. [License](#-license)

---

## ⚡ Why Zero-DB?

Most cricket scoring applications require dedicated databases, authentication servers, and stable internet connections. On actual cricket grounds—turf pitches, parks, or street corners—cellular signals are often weak or nonexistent.

**CricFlex Zero-DB Edition** is built as a **Progressive Web App (PWA)**:
* **Zero Configuration:** No PostgreSQL, MySQL, Redis, or Docker needed.
* **100% Offline-Ready:** Score matches without internet connectivity; all state lives in browser storage (`IndexedDB` & `localStorage`).
* **Zero Hosting Overhead:** Host it for free on Vercel, Netlify, or GitHub Pages as a static front-end.
* **On-Demand AI Insights:** Connect to the Gemini API only when match results are finalized and internet connectivity is available.

---

## 🚀 Key Features

### 1. Fully Customizable Match Rules
- **Non-Standard Cricket Formats:**
  - Configurable balls per over (e.g., 4 balls/over for box/gully cricket, standard 6).
  - Configurable team sizes (e.g., 6-a-side, 8-a-side, or full 11-a-side).
  - Custom overs per innings (5, 8, 10, 15, 20, 50).
  - Max overs per bowler limits.
  - Toggles for *Last-Man Standing*, wide/no-ball re-ball rules, and bonus runs.
- **Official Formats:** Presets for T20, One Day (ODI), and Multi-Innings Test matches.

### 2. High-Performance Scorer Pad
- One-tap buttons designed for quick handheld scoring: `0, 1, 2, 3, 4, 6`.
- Extras management: Wide, No-Ball, Bye, Leg Bye, Penalty runs.
- Wicket modal with dismissal classification (Bowled, Caught, LBW, Run Out, Stumped) and fielder attribution.
- Intelligent strike rotation on odd runs and over completions.
- Instant **Undo** support via an internal state action history stack.

### 3. Local Tournament Manager
- Create knockout or round-robin tournament schedules directly on your device.
- Automated points table with dynamic Net Run Rate (NRR) calculation:
  $$\text{NRR} = \left(\frac{\text{Total Runs Scored}}{\text{Total Overs Faced}}\right) - \left(\frac{\text{Total Runs Conceded}}{\text{Total Overs Bowled}}\right)$$
- Tracks tournament leaders (Orange Cap for runs, Purple Cap for wickets).

### 4. Gemini AI Match Analyst
- Generates post-match honors:
  - **Player of the Match (POTM)**
  - **Best Batter**
  - **Best Bowler**
  - **Best Fielder** (tallies catches, run-outs, stumping assists)
- Context-aware reasoning (e.g., weights wickets and tight overs higher in low-scoring games).
- Automated newspaper-style match recap.

---

## 🏗 Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Client Browser                         │
 │                                                             │
 │  ┌───────────────────────────┐  ┌────────────────────────┐  │
 │  │      React / Next.js      │  │    Scoring State       │  │
 │  │    User Interface (UI)    │  │       Machine          │  │
 │  └─────────────┬─────────────┘  └───────────┬────────────┘  │
 │                │                            │               │
 │                ▼                            ▼               │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │        Client Storage (IndexedDB / LocalStorage)      │  │
 │  │        - Active Matches   - Tournament Standings      │  │
 │  │        - Player Profiles  - Action Undo History       │  │
 │  └──────────────────────────┬────────────────────────────┘  │
 └─────────────────────────────┼───────────────────────────────┘
                               │ (Only on match completion
                               │  when online)
                               ▼
                 ┌───────────────────────────┐
                 │     Google Gemini API     │
                 │   - POTM Evaluation       │
                 │   - Match Commentary      │
                 └───────────────────────────┘
```

---

## 💻 Tech Stack

- **Framework:** Next.js (App Router) or React (Vite)
- **Styling:** Tailwind CSS (mobile-first touch controls)
- **Local Persistence:** [Dexie.js](https://dexie.org/) (clean wrapper over browser `IndexedDB`) + `localStorage`
- **State Management:** Zustand or React Context + `useReducer`
- **AI Integration:** Google Gen AI SDK (`@google/genai`)
- **Exporting:** `canvas-confetti` (celebrations), `html2canvas` / `jspdf` (scorecard PDF & image exports)

---

## 🗃 Local Data Storage Model

Because there is no external database, all tables live inside browser `IndexedDB` using Dexie:

```typescript
// db/cricflexDb.ts
import Dexie, { Table } from 'dexie';

export interface MatchRecord {
  id: string;
  tournamentId?: string;
  matchType: 'CUSTOM' | 'T20' | 'ODI' | 'TEST';
  rules: {
    totalOvers: number;
    ballsPerOver: number;
    playersPerTeam: number;
    maxOversPerBowler: number;
    lastManStanding: boolean;
  };
  teamA: { name: string; players: string[] };
  teamB: { name: string; players: string[] };
  scorecard: any;
  status: 'LIVE' | 'COMPLETED';
  aiSummary?: {
    potm: string;
    bestBatter: string;
    bestBowler: string;
    bestFielder: string;
    narrative: string;
  };
  createdAt: number;
}

export class CricFlexDB extends Dexie {
  matches!: Table<MatchRecord, string>;
  tournaments!: Table<any, string>;

  constructor() {
    super('CricFlexDB');
    this.version(1).stores({
      matches: 'id, tournamentId, status, createdAt',
      tournaments: 'id, status, createdAt'
    });
  }
}

export const db = new CricFlexDB();
```

---

## ⚙️ Match Rule Engine

When computing over and match completions, the engine uses the match configuration dynamically:

```typescript
// Example state check
const isOverComplete = (currentLegalBalls: number, rules: MatchRules): boolean => {
  return currentLegalBalls >= rules.ballsPerOver; // Dynamic (e.g. 4 balls or 6 balls)
};

const isAllOut = (wicketsLost: number, rules: MatchRules): boolean => {
  const maxWickets = rules.lastManStanding 
    ? rules.playersPerTeam 
    : rules.playersPerTeam - 1;
  return wicketsLost >= maxWickets;
};
```

---

## 🧠 AI Awards & Match Intelligence

When a match completes, CricFlex compiles the scorecard into a compact JSON payload and sends it to the Gemini API:

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function generateMatchAwards(matchData: any) {
  const prompt = `
    You are an expert cricket analyst. Review the scorecard below for a match played under:
    - Total Overs: ${matchData.rules.totalOvers}
    - Balls Per Over: ${matchData.rules.ballsPerOver}
    - Players Per Team: ${matchData.rules.playersPerTeam}

    Scorecard:
    ${JSON.stringify(matchData.scorecard)}

    Return a JSON response with:
    1. "potm": Player name and reason
    2. "bestBatter": Player name and reason
    3. "bestBowler": Player name and reason
    4. "bestFielder": Player name and reason
    5. "matchSummary": 2-sentence match recap.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text);
}
```

---

## 🛠 Quick Start & Local Setup

### 1. Clone the Project
```bash
git clone https://github.com/your-username/cricflex.git
cd cricflex
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💾 Export & Backup Features

Because data is stored on the device, CricFlex includes built-in backup tools:
* **JSON Export/Import:** Download any match or complete tournament as a `.json` file to transfer to another phone.
* **Match Report Card (Image/PDF):** Render the final scorecard, team totals, and AI awards into a shareable image for WhatsApp or social media.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
