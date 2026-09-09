import React, { useState, useEffect, useRef } from 'react';
import { getGeminiApiKey, setGeminiApiKey } from '../../services/aiAnalyst';
import { db } from '../../db/cricflexDb';
import { seedInitialDataIfEmpty } from '../../db/initialSeed';
import type { MatchRecord } from '../../types/cricket';
import {
  Settings,
  Key,
  Database,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Check,
  AlertCircle,
  Play,
} from 'lucide-react';

interface SettingsModalProps {
  onLoadDemoMatch: (demoMatch: MatchRecord) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onLoadDemoMatch }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(getGeminiApiKey());
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportFullBackup = async () => {
    try {
      const allMatches = await db.matches.toArray();
      const allTournaments = await db.tournaments.toArray();

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        appName: 'CricFlex Zero-DB',
        matches: allMatches,
        tournaments: allTournaments,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cricflex_full_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export backup: ' + err);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.matches && Array.isArray(data.matches)) {
        await db.matches.bulkPut(data.matches);
      } else if (data.id && data.rules && data.innings1) {
        // Single match file
        await db.matches.put(data);
      }

      if (data.tournaments && Array.isArray(data.tournaments)) {
        await db.tournaments.bulkPut(data.tournaments);
      }

      alert('Backup data successfully imported into browser IndexedDB!');
      window.location.reload();
    } catch (err) {
      alert('Error parsing JSON backup file: ' + err);
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to clear all stored matches and tournaments from browser IndexedDB? This cannot be undone.')) {
      await db.matches.clear();
      await db.tournaments.clear();
      alert('Local database cleared.');
      window.location.reload();
    }
  };

  const handleCreateDemoMatch = () => {
    const demoMatch: MatchRecord = {
      id: `demo_${Date.now()}`,
      matchType: 'BOX_GULLY',
      rules: {
        totalOvers: 4,
        ballsPerOver: 4,
        playersPerTeam: 6,
        maxOversPerBowler: 2,
        lastManStanding: true,
        wideRuns: 1,
        noBallRuns: 1,
        reBallWide: true,
        reBallNoBall: true,
      },
      teamA: {
        name: 'Gully Kings',
        players: ['Sameer K.', 'Rahul V.', 'Amit S.', 'Vikram P.', 'Rohit M.', 'Deepak T.'],
      },
      teamB: {
        name: 'Turf Blasters',
        players: ['Kunal D.', 'Sunny G.', 'Fahad B.', 'Zayd R.', 'Tanmay N.', 'Arjun B.'],
      },
      tossWinner: 'Gully Kings',
      tossDecision: 'BAT',
      currentInningsIndex: 2,
      innings1: {
        teamName: 'Gully Kings',
        battingTeam: 'Gully Kings',
        bowlingTeam: 'Turf Blasters',
        totalRuns: 38,
        wicketsLost: 3,
        legalBallsBowled: 16,
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Sameer K.': { name: 'Sameer K.', runs: 22, balls: 8, fours: 3, sixes: 1, isOut: true, dismissalInfo: 'c Fahad B. b Kunal D.', strikeRate: 275 },
          'Rahul V.': { name: 'Rahul V.', runs: 11, balls: 6, fours: 1, sixes: 1, isOut: true, dismissalInfo: 'b Sunny G.', strikeRate: 183.3 },
          'Amit S.': { name: 'Amit S.', runs: 4, balls: 2, fours: 1, sixes: 0, isOut: false, strikeRate: 200 },
        },
        bowlers: {
          'Kunal D.': { name: 'Kunal D.', overs: 2, balls: 0, maidens: 0, runs: 16, wickets: 2, economy: 8.0, wides: 1, noBalls: 0 },
          'Sunny G.': { name: 'Sunny G.', overs: 2, balls: 0, maidens: 0, runs: 22, wickets: 1, economy: 11.0, wides: 0, noBalls: 0 },
        },
        strikerName: 'Amit S.',
        nonStrikerName: 'Vikram P.',
        currentBowlerName: 'Sunny G.',
        extras: { wides: 1, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 1 },
        fallOfWickets: [
          { wicketNumber: 1, score: 18, over: '2.0', playerOut: 'Rahul V.' },
          { wicketNumber: 2, score: 32, over: '3.2', playerOut: 'Sameer K.' },
        ],
        isCompleted: true,
      },
      innings2: {
        teamName: 'Turf Blasters',
        battingTeam: 'Turf Blasters',
        bowlingTeam: 'Gully Kings',
        totalRuns: 39,
        wicketsLost: 2,
        legalBallsBowled: 14,
        currentOverBalls: [],
        allBalls: [],
        batters: {
          'Kunal D.': { name: 'Kunal D.', runs: 26, balls: 9, fours: 2, sixes: 2, isOut: false, strikeRate: 288.9 },
          'Sunny G.': { name: 'Sunny G.', runs: 8, balls: 4, fours: 1, sixes: 0, isOut: true, dismissalInfo: 'c Rohit M. b Sameer K.', strikeRate: 200 },
          'Fahad B.': { name: 'Fahad B.', runs: 3, balls: 2, fours: 0, sixes: 0, isOut: true, dismissalInfo: 'run out (Amit S.)', strikeRate: 150 },
        },
        bowlers: {
          'Sameer K.': { name: 'Sameer K.', overs: 2, balls: 0, maidens: 0, runs: 18, wickets: 1, economy: 9.0, wides: 1, noBalls: 0 },
          'Amit S.': { name: 'Amit S.', overs: 1, balls: 2, maidens: 0, runs: 20, wickets: 0, economy: 13.3, wides: 1, noBalls: 0 },
        },
        strikerName: 'Kunal D.',
        nonStrikerName: 'Zayd R.',
        currentBowlerName: 'Amit S.',
        extras: { wides: 2, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 2 },
        fallOfWickets: [
          { wicketNumber: 1, score: 14, over: '1.2', playerOut: 'Sunny G.' },
          { wicketNumber: 2, score: 28, over: '2.4', playerOut: 'Fahad B.' },
        ],
        isCompleted: true,
      },
      targetRuns: 39,
      status: 'COMPLETED',
      winner: 'Turf Blasters',
      resultText: 'Turf Blasters won by 4 wickets (with 2 balls remaining)',
      aiSummary: {
        potm: 'Kunal D.',
        potmReason: 'All-round masterclass: Smashed 26* off 9 balls and took 2 wickets with the ball',
        bestBatter: 'Kunal D.',
        bestBatterReason: 'Clutch 26* off 9 balls with 2 fours and 2 sixes under chase pressure',
        bestBowler: 'Kunal D.',
        bestBowlerReason: '2 wickets for 16 runs in 2 tight overs',
        bestFielder: 'Amit S.',
        bestFielderReason: 'Sensational direct-hit run out from deep midwicket',
        narrative: 'In a breathless gully showdown, Turf Blasters chased down 39 in the final over led by Kunal D.\'s ice-cold 26*, sealing a 4-wicket triumph against the resilient Gully Kings.',
        generatedAt: Date.now(),
      },
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    };

    onLoadDemoMatch(demoMatch);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-white">
            App Settings & Zero-DB Management
          </h2>
          <p className="text-xs text-slate-400">
            Configure Google Gemini AI API keys, JSON data backup, and offline storage
          </p>
        </div>
      </div>

      {/* Google Gemini AI Configuration */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Google Gemini AI Match Intelligence
            </h3>
            <p className="text-xs text-slate-400">
              Powers automated Player of the Match awards and newspaper match recaps
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline text-[11px]"
              >
                Get a free API key from Google AI Studio →
              </a>
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <Key className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              {apiKey ? (
                <span className="text-emerald-400 flex items-center font-medium">
                  <Check className="w-3.5 h-3.5 mr-1" /> Gemini API configured
                </span>
              ) : (
                <span className="text-amber-400/90 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Offline heuristic engine active
                </span>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Match Quick Experience */}
      <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/20 rounded-3xl border border-emerald-500/30 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Instant Demonstrations</span>
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-1">
            Sample Matches & Tournament Leagues
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            Load sample matches: including a classic <strong>5-Day Test Match (India vs Australia)</strong>, a Box Cricket 4-ball thriller, and an active <strong>Tournament League with Points Table & NRR</strong>!
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              // Clear current and seed showcase
              await db.matches.clear();
              await db.tournaments.clear();
              await seedInitialDataIfEmpty();
              alert('Sample 2-Innings Test Match and Tournament League loaded successfully!');
              window.location.reload();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/50 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load 2-Innings Test Match & League</span>
          </button>

          <button
            type="button"
            onClick={handleCreateDemoMatch}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/50 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Load Box Match</span>
          </button>
        </div>
      </div>

      {/* Zero-DB Data Backup & Restore */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Data Storage & Device Portability
            </h3>
            <p className="text-xs text-slate-400">
              All CricFlex data lives inside your browser's IndexedDB. Export to transfer between devices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleExportFullBackup}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export All Matches & Leagues (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Import JSON Backup File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-400 block">Reset Local Database</span>
            <span className="text-[11px] text-slate-500">Erase all matches, stats, and tournament records</span>
          </div>

          <button
            type="button"
            onClick={handleClearAllData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/40 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Storage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
