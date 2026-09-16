import { useState, useEffect } from 'react';
import type {
  MatchRecord,
  MatchRules,
  ExtraType,
  DismissalType,
  InningsState,
  BallEvent,
} from './types/cricket';
import { db } from './db/cricflexDb';
import {
  processBall,
  evaluateMatchResult,
  createInitialInnings,
} from './engine/scoringEngine';
import { updateTournamentOnMatchCompletion } from './engine/tournamentEngine';
import { generateMatchAwards } from './services/aiAnalyst';

// UI Components
import { Navbar } from './components/navbar/Navbar';
import { ScoreBanner } from './components/scorer/ScoreBanner';
import { BatsmenBowlerCard } from './components/scorer/BatsmenBowlerCard';
import { OverTimeline } from './components/scorer/OverTimeline';
import { ScorerPad } from './components/scorer/ScorerPad';
import { ExtrasModal } from './components/scorer/ExtrasModal';
import { WicketModal } from './components/scorer/WicketModal';
import { BowlerSelectModal } from './components/scorer/BowlerSelectModal';
import { BatterSelectModal } from './components/scorer/BatterSelectModal';
import { MatchSetupModal } from './components/scorer/MatchSetupModal';
import { SquadManagementModal } from './components/scorer/SquadManagementModal';
import { FullScorecard } from './components/scorecard/FullScorecard';
import { MatchSummaryCard } from './components/scorecard/MatchSummaryCard';
import { MatchesHistory } from './components/matches/MatchesHistory';
import { TournamentManager } from './components/tournament/TournamentManager';
import { SettingsModal } from './components/settings/SettingsModal';

import { Play, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'scorer' | 'matches' | 'tournaments' | 'settings'>('scorer');
  const [activeMatch, setActiveMatch] = useState<MatchRecord | null>(null);
  const [scorecardViewMatch, setScorecardViewMatch] = useState<MatchRecord | null>(null);

  // Modals state
  const [isMatchSetupOpen, setIsMatchSetupOpen] = useState<boolean>(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState<boolean>(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState<boolean>(false);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState<boolean>(false);
  const [isBatterModalOpen, setIsBatterModalOpen] = useState<boolean>(false);
  const [isSquadModalOpen, setIsSquadModalOpen] = useState<boolean>(false);
  const [targetBatterEnd, setTargetBatterEnd] = useState<'striker' | 'nonStriker'>('striker');

  // For starting tournament matches
  const [tournamentMatchContext, setTournamentMatchContext] = useState<{
    tournamentId?: string;
    teamA?: string;
    teamB?: string;
    rules?: MatchRules;
  }>({});

  // Load the most recent live match on startup if any
  useEffect(() => {
    const loadLatestActiveMatch = async () => {
      try {
        const liveMatches = await db.matches
          .where('status')
          .equals('LIVE')
          .reverse()
          .sortBy('updatedAt');

        if (liveMatches.length > 0) {
          setActiveMatch(liveMatches[0]);
        }
      } catch (err) {
        console.error('Failed to load initial active match:', err);
      }
    };
    loadLatestActiveMatch();
  }, []);

  // Sync active match updates to IndexedDB
  const persistMatch = async (match: MatchRecord) => {
    try {
      setActiveMatch(match);
      await db.matches.put(match);
    } catch (err) {
      console.error('Failed to persist match:', err);
    }
  };

  // Helper to get current active innings (supports 4 innings for Test matches)
  const getCurrentInnings = (match?: MatchRecord | null): InningsState | undefined => {
    if (!match) return undefined;
    if (match.currentInningsIndex === 4 && match.innings4) return match.innings4;
    if (match.currentInningsIndex === 3 && match.innings3) return match.innings3;
    if (match.currentInningsIndex === 2 && match.innings2) return match.innings2;
    return match.innings1;
  };

  const currentInnings: InningsState | undefined = getCurrentInnings(activeMatch);

  // Helper to update match with modified innings
  const updateMatchWithInnings = (
    match: MatchRecord,
    updatedInnings: InningsState,
    extraProps: Partial<MatchRecord> = {}
  ): MatchRecord => {
    const innIndex = match.currentInningsIndex;
    return {
      ...match,
      ...extraProps,
      innings1: innIndex === 1 ? updatedInnings : match.innings1,
      innings2: innIndex === 2 ? updatedInnings : match.innings2,
      innings3: innIndex === 3 ? updatedInnings : match.innings3,
      innings4: innIndex === 4 ? updatedInnings : match.innings4,
    };
  };

  // Active teams rosters
  const battingTeamObj =
    activeMatch && currentInnings
      ? currentInnings.battingTeam === activeMatch.teamA.name
        ? activeMatch.teamA
        : activeMatch.teamB
      : null;

  const bowlingTeamObj =
    activeMatch && currentInnings
      ? currentInnings.bowlingTeam === activeMatch.teamA.name
        ? activeMatch.teamA
        : activeMatch.teamB
      : null;

  // Complete a match, trigger AI analysis and sync tournament
  const finishMatch = async (matchToFinish: MatchRecord, evaluation: { winner: string; resultText: string }) => {
    const completedMatch: MatchRecord = {
      ...matchToFinish,
      status: 'COMPLETED',
      winner: evaluation.winner,
      resultText: evaluation.resultText,
      updatedAt: Date.now(),
    };

    // Trigger AI analysis asynchronously
    generateMatchAwards(completedMatch).then(async (aiSummary) => {
      const withAI = { ...completedMatch, aiSummary };
      await db.matches.put(withAI);
      setActiveMatch(withAI);
    });

    await persistMatch(completedMatch);

    // Synchronize tournament standings, fixtures, NRR, and caps immediately
    if (completedMatch.tournamentId) {
      await updateTournamentOnMatchCompletion(completedMatch, db);
    }
  };

  // Transition between innings in Test Matches (Inn 1 -> 2 -> 3 -> 4)
  const handleTransitionToNextInnings = async (
    matchToUpdate: MatchRecord,
    nextInningsIndex: 2 | 3 | 4
  ) => {
    // In Test match:
    // Innings 1: Team A bats, Team B bowls
    // Innings 2: Team B bats, Team A bowls
    // Innings 3: Team A bats, Team B bowls
    // Innings 4: Team B bats, Team A bowls
    const isTeamABatting = nextInningsIndex === 3;
    const battingTeamName = isTeamABatting
      ? matchToUpdate.innings1.battingTeam
      : matchToUpdate.innings1.bowlingTeam;
    const bowlingTeamName = isTeamABatting
      ? matchToUpdate.innings1.bowlingTeam
      : matchToUpdate.innings1.battingTeam;

    const battingPlayers =
      battingTeamName === matchToUpdate.teamA.name
        ? matchToUpdate.teamA.players
        : matchToUpdate.teamB.players;

    const bowlingPlayers =
      bowlingTeamName === matchToUpdate.teamA.name
        ? matchToUpdate.teamA.players
        : matchToUpdate.teamB.players;

    const newInnings = createInitialInnings(
      battingTeamName,
      bowlingTeamName,
      battingPlayers,
      bowlingPlayers
    );

    let targetRuns: number | undefined = undefined;
    if (nextInningsIndex === 4) {
      const teamATotal = matchToUpdate.innings1.totalRuns + (matchToUpdate.innings3?.totalRuns || 0);
      const teamBInn1 = matchToUpdate.innings2?.totalRuns || 0;
      targetRuns = teamATotal - teamBInn1 + 1;
    }

    const updated: MatchRecord = {
      ...matchToUpdate,
      currentInningsIndex: nextInningsIndex,
      targetRuns,
      ...(nextInningsIndex === 2 ? { innings2: newInnings } : {}),
      ...(nextInningsIndex === 3 ? { innings3: newInnings } : {}),
      ...(nextInningsIndex === 4 ? { innings4: newInnings } : {}),
      undoStack: [],
      updatedAt: Date.now(),
    };

    await persistMatch(updated);
  };

  // Transition from 1st innings to 2nd innings in Limited Overs
  const handleTransitionToSecondInnings = async (matchToUpdate: MatchRecord) => {
    const inn1 = matchToUpdate.innings1;
    const targetRuns = inn1.totalRuns + 1;

    const team2BattingName = inn1.bowlingTeam;
    const team2BowlingName = inn1.battingTeam;

    const team2BattingPlayers =
      team2BattingName === matchToUpdate.teamA.name
        ? matchToUpdate.teamA.players
        : matchToUpdate.teamB.players;

    const team2BowlingPlayers =
      team2BowlingName === matchToUpdate.teamA.name
        ? matchToUpdate.teamA.players
        : matchToUpdate.teamB.players;

    const innings2 = createInitialInnings(
      team2BattingName,
      team2BowlingName,
      team2BattingPlayers,
      team2BowlingPlayers
    );

    const updated: MatchRecord = {
      ...matchToUpdate,
      currentInningsIndex: 2,
      targetRuns,
      innings2,
      undoStack: [], // Reset undo stack for fresh innings
      updatedAt: Date.now(),
    };

    await persistMatch(updated);
  };

  // Check match or innings completion status
  const checkStateTransitions = async (updatedMatch: MatchRecord) => {
    const inn = getCurrentInnings(updatedMatch);
    if (!inn) {
      await persistMatch(updatedMatch);
      return;
    }

    if (updatedMatch.status === 'COMPLETED') {
      await persistMatch(updatedMatch);
      return;
    }

    // TEST MATCH (4 Innings Total: Team A Inn 1, Team B Inn 1, Team A Inn 2, Team B Inn 2)
    if (updatedMatch.matchType === 'TEST') {
      if (updatedMatch.currentInningsIndex === 1 && inn.isCompleted) {
        await handleTransitionToNextInnings(updatedMatch, 2);
        return;
      }
      if (updatedMatch.currentInningsIndex === 2 && inn.isCompleted) {
        await handleTransitionToNextInnings(updatedMatch, 3);
        return;
      }
      if (updatedMatch.currentInningsIndex === 3 && inn.isCompleted) {
        const evaluation = evaluateMatchResult(updatedMatch);
        if (evaluation.isCompleted) {
          // Innings defeat: Team B won by an innings
          await finishMatch(updatedMatch, evaluation);
          return;
        }
        await handleTransitionToNextInnings(updatedMatch, 4);
        return;
      }
      if (updatedMatch.currentInningsIndex === 4) {
        const evaluation = evaluateMatchResult(updatedMatch);
        if (evaluation.isCompleted) {
          await finishMatch(updatedMatch, evaluation);
          return;
        }
      }
      await persistMatch(updatedMatch);
      return;
    }

    // LIMITED OVERS (2 Innings Total)
    if (updatedMatch.currentInningsIndex === 2 && updatedMatch.innings2) {
      const evaluation = evaluateMatchResult(updatedMatch);
      if (evaluation.isCompleted) {
        await finishMatch(updatedMatch, evaluation);
        return;
      }
    }

    if (updatedMatch.currentInningsIndex === 1 && inn.isCompleted) {
      await handleTransitionToSecondInnings(updatedMatch);
      return;
    }

    await persistMatch(updatedMatch);
  };

  // Record a standard run outcome (0, 1, 2, 3, 4, 6)
  const handleScoreRuns = async (runs: number) => {
    if (!activeMatch || !currentInnings || activeMatch.status === 'COMPLETED') return;

    // Snapshot current innings for Undo
    const undoSnapshot = structuredClone(currentInnings);
    const undoStack = [...(activeMatch.undoStack || []), undoSnapshot];

    const { updatedInnings, overFinished } = processBall(currentInnings, activeMatch.rules, {
      runsOffBat: runs,
    });

    const updatedMatch = updateMatchWithInnings(activeMatch, updatedInnings, {
      undoStack,
      updatedAt: Date.now(),
    });

    if (overFinished && !updatedInnings.isCompleted) {
      setIsBowlerModalOpen(true);
    }

    await checkStateTransitions(updatedMatch);
  };

  // Record extras (Wide, No Ball, Bye, Leg Bye, Penalty)
  const handleScoreExtras = async (extraType: ExtraType, extraRuns: number, runsOffBat: number) => {
    if (!activeMatch || !currentInnings || activeMatch.status === 'COMPLETED') return;

    const undoSnapshot = structuredClone(currentInnings);
    const undoStack = [...(activeMatch.undoStack || []), undoSnapshot];

    const { updatedInnings, overFinished } = processBall(currentInnings, activeMatch.rules, {
      runsOffBat,
      extraType,
      extraRuns,
    });

    const updatedMatch = updateMatchWithInnings(activeMatch, updatedInnings, {
      undoStack,
      updatedAt: Date.now(),
    });

    if (overFinished && !updatedInnings.isCompleted) {
      setIsBowlerModalOpen(true);
    }

    await checkStateTransitions(updatedMatch);
  };

  // Record wicket fall
  const handleScoreWicket = async (params: {
    type: DismissalType;
    playerOut: string;
    fielderName?: string;
    runsCompleted?: number;
    newBatterName?: string;
  }) => {
    if (!activeMatch || !currentInnings || activeMatch.status === 'COMPLETED') return;

    let baseMatch = activeMatch;
    // If an incoming batter was newly created on the fly
    if (params.newBatterName && battingTeamObj && !battingTeamObj.players.includes(params.newBatterName)) {
      const isTeamA = battingTeamObj.name === activeMatch.teamA.name;
      const updatedPlayers = [...battingTeamObj.players, params.newBatterName];
      baseMatch = {
        ...activeMatch,
        teamA: isTeamA ? { ...activeMatch.teamA, players: updatedPlayers } : activeMatch.teamA,
        teamB: !isTeamA ? { ...activeMatch.teamB, players: updatedPlayers } : activeMatch.teamB,
      };
    }

    const undoSnapshot = structuredClone(currentInnings);
    const undoStack = [...(baseMatch.undoStack || []), undoSnapshot];

    const { updatedInnings, overFinished } = processBall(currentInnings, baseMatch.rules, {
      runsOffBat: params.runsCompleted || 0,
      wicket: {
        type: params.type,
        playerOut: params.playerOut,
        fielderName: params.fielderName,
        runsCompleted: params.runsCompleted,
      },
      newBatterName: params.newBatterName,
    });

    const updatedMatch = updateMatchWithInnings(baseMatch, updatedInnings, {
      undoStack,
      updatedAt: Date.now(),
    });

    if (overFinished && !updatedInnings.isCompleted) {
      setIsBowlerModalOpen(true);
    }

    await checkStateTransitions(updatedMatch);
  };

  // Multi-level Undo operation
  const handleUndo = async () => {
    if (!activeMatch || !activeMatch.undoStack || activeMatch.undoStack.length === 0) return;

    const undoStack = [...activeMatch.undoStack];
    const previousInningsState = undoStack.pop()!;

    const updatedMatch = updateMatchWithInnings(activeMatch, previousInningsState, {
      undoStack,
      status: 'LIVE', // revert completed status if ball undone
      winner: undefined,
      resultText: undefined,
      aiSummary: undefined,
      updatedAt: Date.now(),
    });

    await persistMatch(updatedMatch);
  };

  // Manually swap striker and non-striker
  const handleSwapStrike = async () => {
    if (!activeMatch || !currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      strikerName: currentInnings.nonStrikerName,
      nonStrikerName: currentInnings.strikerName,
    };

    const updatedMatch = updateMatchWithInnings(activeMatch, updatedInnings);
    await persistMatch(updatedMatch);
  };

  // Select next bowler
  const handleSelectBowler = async (newBowlerName: string) => {
    if (!activeMatch || !currentInnings) return;

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentBowlerName: newBowlerName,
    };

    const updatedMatch = updateMatchWithInnings(activeMatch, updatedInnings);
    await persistMatch(updatedMatch);
  };

  // Select batter for an end
  const handleSelectBatter = async (playerName: string) => {
    if (!activeMatch || !currentInnings) return;

    const currentBattingOrder = currentInnings.battingOrder || [];
    const updatedInnings: InningsState = {
      ...currentInnings,
      strikerName: targetBatterEnd === 'striker' ? playerName : currentInnings.strikerName,
      nonStrikerName: targetBatterEnd === 'nonStriker' ? playerName : currentInnings.nonStrikerName,
      battingOrder: currentBattingOrder.includes(playerName)
        ? currentBattingOrder
        : [...currentBattingOrder, playerName],
    };

    const updatedMatch = updateMatchWithInnings(activeMatch, updatedInnings);
    await persistMatch(updatedMatch);
  };

  // Add new batter on the fly and put them on strike
  const handleAddNewBatter = async (newPlayerName: string) => {
    if (!activeMatch || !currentInnings || !newPlayerName.trim()) return;
    const trimmed = newPlayerName.trim();

    const isTeamA = currentInnings.battingTeam === activeMatch.teamA.name;
    const targetTeam = isTeamA ? activeMatch.teamA : activeMatch.teamB;

    const updatedPlayers = targetTeam.players.includes(trimmed)
      ? targetTeam.players
      : [...targetTeam.players, trimmed];

    const currentBattingOrder = currentInnings.battingOrder || [];
    const updatedInnings: InningsState = {
      ...currentInnings,
      strikerName: targetBatterEnd === 'striker' ? trimmed : currentInnings.strikerName,
      nonStrikerName: targetBatterEnd === 'nonStriker' ? trimmed : currentInnings.nonStrikerName,
      battingOrder: currentBattingOrder.includes(trimmed)
        ? currentBattingOrder
        : [...currentBattingOrder, trimmed],
      batters: {
        ...currentInnings.batters,
        ...(currentInnings.batters[trimmed]
          ? {}
          : {
              [trimmed]: {
                name: trimmed,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                strikeRate: 0,
              },
            }),
      },
    };

    const updatedMatch: MatchRecord = updateMatchWithInnings(
      {
        ...activeMatch,
        teamA: isTeamA ? { ...activeMatch.teamA, players: updatedPlayers } : activeMatch.teamA,
        teamB: !isTeamA ? { ...activeMatch.teamB, players: updatedPlayers } : activeMatch.teamB,
      },
      updatedInnings,
      { updatedAt: Date.now() }
    );

    await persistMatch(updatedMatch);
  };

  // Add new bowler on the fly and put them on bowling attack
  const handleAddNewBowler = async (newBowlerName: string) => {
    if (!activeMatch || !currentInnings || !newBowlerName.trim()) return;
    const trimmed = newBowlerName.trim();

    const isTeamA = currentInnings.bowlingTeam === activeMatch.teamA.name;
    const targetTeam = isTeamA ? activeMatch.teamA : activeMatch.teamB;

    const updatedPlayers = targetTeam.players.includes(trimmed)
      ? targetTeam.players
      : [...targetTeam.players, trimmed];

    const updatedInnings: InningsState = {
      ...currentInnings,
      currentBowlerName: trimmed,
      bowlers: {
        ...currentInnings.bowlers,
        ...(currentInnings.bowlers[trimmed]
          ? {}
          : {
              [trimmed]: {
                name: trimmed,
                overs: 0,
                balls: 0,
                maidens: 0,
                runs: 0,
                wickets: 0,
                economy: 0,
                wides: 0,
                noBalls: 0,
              },
            }),
      },
    };

    const updatedMatch: MatchRecord = updateMatchWithInnings(
      {
        ...activeMatch,
        teamA: isTeamA ? { ...activeMatch.teamA, players: updatedPlayers } : activeMatch.teamA,
        teamB: !isTeamA ? { ...activeMatch.teamB, players: updatedPlayers } : activeMatch.teamB,
      },
      updatedInnings,
      { updatedAt: Date.now() }
    );

    await persistMatch(updatedMatch);
  };

  // Add player to a team during live match from Squad Manager
  const handleAddPlayerToSquad = async (teamKey: 'teamA' | 'teamB', playerName: string) => {
    if (!activeMatch || !playerName.trim()) return;
    const trimmed = playerName.trim();
    const targetTeam = teamKey === 'teamA' ? activeMatch.teamA : activeMatch.teamB;
    if (targetTeam.players.includes(trimmed)) return;

    const updatedTeam = {
      ...targetTeam,
      players: [...targetTeam.players, trimmed],
    };

    let updatedMatch: MatchRecord = {
      ...activeMatch,
      teamA: teamKey === 'teamA' ? updatedTeam : activeMatch.teamA,
      teamB: teamKey === 'teamB' ? updatedTeam : activeMatch.teamB,
      rules: {
        ...activeMatch.rules,
        playersPerTeam: Math.max(activeMatch.rules.playersPerTeam, targetTeam.players.length + 1),
      },
      updatedAt: Date.now(),
    };

    if (currentInnings) {
      const inn = { ...currentInnings };
      if (inn.battingTeam === targetTeam.name && !inn.batters[trimmed]) {
        inn.batters = {
          ...inn.batters,
          [trimmed]: {
            name: trimmed,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            strikeRate: 0,
          },
        };
      }
      if (inn.bowlingTeam === targetTeam.name && !inn.bowlers[trimmed]) {
        inn.bowlers = {
          ...inn.bowlers,
          [trimmed]: {
            name: trimmed,
            overs: 0,
            balls: 0,
            maidens: 0,
            runs: 0,
            wickets: 0,
            economy: 0,
            wides: 0,
            noBalls: 0,
          },
        };
      }
      updatedMatch = updateMatchWithInnings(updatedMatch, inn);
    }

    await persistMatch(updatedMatch);
  };

  // Rename player during live match from Squad Manager or quick rename
  const handleRenamePlayerInMatch = async (teamKey: 'teamA' | 'teamB', oldName: string, newName: string) => {
    if (!activeMatch || !newName.trim() || oldName === newName.trim()) return;
    const trimmed = newName.trim();
    const targetTeam = teamKey === 'teamA' ? activeMatch.teamA : activeMatch.teamB;

    const updatedPlayers = targetTeam.players.map((p) => (p === oldName ? trimmed : p));
    const updatedTeam = { ...targetTeam, players: updatedPlayers };

    const renameInInnings = (inn?: InningsState): InningsState | undefined => {
      if (!inn) return undefined;
      const newBatters = { ...inn.batters };
      if (newBatters[oldName]) {
        newBatters[trimmed] = { ...newBatters[oldName], name: trimmed };
        delete newBatters[oldName];
      }
      const newBowlers = { ...inn.bowlers };
      if (newBowlers[oldName]) {
        newBowlers[trimmed] = { ...newBowlers[oldName], name: trimmed };
        delete newBowlers[oldName];
      }

      const newFallOfWickets = (inn.fallOfWickets || []).map((fow) => ({
        ...fow,
        playerOut: fow.playerOut === oldName ? trimmed : fow.playerOut,
      }));

      const renameBall = (b: BallEvent): BallEvent => ({
        ...b,
        striker: b.striker === oldName ? trimmed : b.striker,
        nonStriker: b.nonStriker === oldName ? trimmed : b.nonStriker,
        bowler: b.bowler === oldName ? trimmed : b.bowler,
        wicket: b.wicket
          ? {
              ...b.wicket,
              playerOut: b.wicket.playerOut === oldName ? trimmed : b.wicket.playerOut,
              bowlerName: b.wicket.bowlerName === oldName ? trimmed : b.wicket.bowlerName,
              fielderName: b.wicket.fielderName === oldName ? trimmed : b.wicket.fielderName,
            }
          : undefined,
      });

      return {
        ...inn,
        strikerName: inn.strikerName === oldName ? trimmed : inn.strikerName,
        nonStrikerName: inn.nonStrikerName === oldName ? trimmed : inn.nonStrikerName,
        currentBowlerName: inn.currentBowlerName === oldName ? trimmed : inn.currentBowlerName,
        batters: newBatters,
        bowlers: newBowlers,
        fallOfWickets: newFallOfWickets,
        allBalls: inn.allBalls ? inn.allBalls.map(renameBall) : inn.allBalls,
        currentOverBalls: inn.currentOverBalls ? inn.currentOverBalls.map(renameBall) : inn.currentOverBalls,
        battingOrder: inn.battingOrder ? inn.battingOrder.map((p) => (p === oldName ? trimmed : p)) : undefined,
      };
    };

    const updatedMatch: MatchRecord = {
      ...activeMatch,
      teamA: teamKey === 'teamA' ? updatedTeam : activeMatch.teamA,
      teamB: teamKey === 'teamB' ? updatedTeam : activeMatch.teamB,
      innings1: renameInInnings(activeMatch.innings1)!,
      innings2: renameInInnings(activeMatch.innings2),
      innings3: renameInInnings(activeMatch.innings3),
      innings4: renameInInnings(activeMatch.innings4),
      updatedAt: Date.now(),
    };

    await persistMatch(updatedMatch);
  };

  // Manually end or declare an innings
  const handleEndInningsManual = async () => {
    if (!activeMatch || !currentInnings) return;

    const promptMsg =
      activeMatch.matchType === 'TEST'
        ? `Are you sure you want to declare / conclude this innings (${currentInnings.battingTeam})?`
        : `Are you sure you want to conclude this innings (${currentInnings.battingTeam})?`;

    if (confirm(promptMsg)) {
      const markedInn: InningsState = { ...currentInnings, isCompleted: true };
      const updatedMatch = updateMatchWithInnings(activeMatch, markedInn);
      await checkStateTransitions(updatedMatch);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white pb-20 md:pb-8">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setScorecardViewMatch(null);
        }}
        onNewMatch={() => {
          setTournamentMatchContext({});
          setIsMatchSetupOpen(true);
        }}
        hasActiveMatch={activeMatch?.status === 'LIVE'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* TAB 1: LIVE SCORER */}
        {activeTab === 'scorer' && (
          <>
            {activeMatch ? (
              <div className="space-y-4">
                {/* Scorecard View vs Summary View */}
                {activeMatch.status === 'COMPLETED' ? (
                  <div className="space-y-6">
                    <MatchSummaryCard
                      match={activeMatch}
                      onUpdateMatch={persistMatch}
                    />
                    <FullScorecard match={activeMatch} />
                  </div>
                ) : currentInnings ? (
                  <div className="space-y-3.5">
                    {/* Primary Score Banner */}
                    <ScoreBanner match={activeMatch} innings={currentInnings} />

                    {/* Active Batters & Bowler Card */}
                    <BatsmenBowlerCard
                      innings={currentInnings}
                      rules={activeMatch.rules}
                      onSwapStrike={handleSwapStrike}
                      onChangeBowler={() => setIsBowlerModalOpen(true)}
                      onChangeBatter={(type) => {
                        setTargetBatterEnd(type);
                        setIsBatterModalOpen(true);
                      }}
                      onOpenSquads={() => setIsSquadModalOpen(true)}
                      onRenamePlayer={handleRenamePlayerInMatch}
                      battingTeamKey={currentInnings.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'}
                      bowlingTeamKey={currentInnings.bowlingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'}
                    />

                    {/* Ball-by-ball timeline of current over */}
                    <OverTimeline
                      currentOverBalls={currentInnings.currentOverBalls}
                      rules={activeMatch.rules}
                      legalBallsBowled={currentInnings.legalBallsBowled}
                    />

                    {/* Scorer Keypad */}
                    <ScorerPad
                      onScoreRuns={handleScoreRuns}
                      onOpenExtras={() => setIsExtrasModalOpen(true)}
                      onOpenWicket={() => setIsWicketModalOpen(true)}
                      onUndo={handleUndo}
                      onSwapStrike={handleSwapStrike}
                      onEndInningsManual={handleEndInningsManual}
                      onOpenSquads={() => setIsSquadModalOpen(true)}
                      canUndo={(activeMatch.undoStack?.length || 0) > 0}
                      isCompleted={currentInnings.isCompleted}
                    />

                    {/* Collapsible Full Scorecard below keypad */}
                    <div className="pt-2">
                      <FullScorecard match={activeMatch} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* No Active Match State */
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl shadow-slate-200/50 max-w-2xl mx-auto my-8">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                  🏏
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 mb-2 tracking-tight">
                  Welcome to CricFlex
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                  The zero-database, offline-first cricket scorer built for gully tournaments, box cricket, and official matches.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setTournamentMatchContext({});
                      setIsMatchSetupOpen(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start New Match</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Try Sample Demo Match</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: MATCHES HISTORY */}
        {activeTab === 'matches' && (
          <div>
            {scorecardViewMatch ? (
              <div className="space-y-4">
                <button
                  onClick={() => setScorecardViewMatch(null)}
                  className="flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
                >
                  ← Back to Matches History
                </button>
                <MatchSummaryCard
                  match={scorecardViewMatch}
                  onUpdateMatch={async (updated) => {
                    setScorecardViewMatch(updated);
                    await db.matches.put(updated);
                  }}
                />
                <FullScorecard match={scorecardViewMatch} />
              </div>
            ) : (
              <MatchesHistory
                onResumeMatch={(match) => {
                  setActiveMatch(match);
                  setActiveTab('scorer');
                }}
                onViewScorecard={(match) => {
                  setScorecardViewMatch(match);
                }}
              />
            )}
          </div>
        )}

        {/* TAB 3: TOURNAMENTS */}
        {activeTab === 'tournaments' && (
          <div>
            {scorecardViewMatch ? (
              <div className="space-y-4">
                <button
                  onClick={() => setScorecardViewMatch(null)}
                  className="flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
                >
                  ← Back to Tournament
                </button>
                <MatchSummaryCard
                  match={scorecardViewMatch}
                  onUpdateMatch={async (updated) => {
                    setScorecardViewMatch(updated);
                    await db.matches.put(updated);
                  }}
                />
                <FullScorecard match={scorecardViewMatch} />
              </div>
            ) : (
              <TournamentManager
                onStartTournamentMatch={(tournamentId, teamA, teamB, rules) => {
                  setTournamentMatchContext({ tournamentId, teamA, teamB, rules });
                  setIsMatchSetupOpen(true);
                }}
                onViewMatchScorecard={async (matchId) => {
                  const match = await db.matches.get(matchId);
                  if (match) setScorecardViewMatch(match);
                }}
              />
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS & BACKUP */}
        {activeTab === 'settings' && (
          <SettingsModal
            onLoadDemoMatch={(demoMatch) => {
              persistMatch(demoMatch);
              setActiveMatch(demoMatch);
              setActiveTab('scorer');
            }}
          />
        )}
      </main>

      {/* ALL MODALS */}
      {/* 1. New Match Setup Wizard */}
      <MatchSetupModal
        isOpen={isMatchSetupOpen}
        onClose={() => {
          setTournamentMatchContext({});
          setIsMatchSetupOpen(false);
        }}
        tournamentId={tournamentMatchContext.tournamentId}
        defaultTeamA={tournamentMatchContext.teamA}
        defaultTeamB={tournamentMatchContext.teamB}
        tournamentRules={tournamentMatchContext.rules}
        onStartMatch={(newMatch) => {
          setTournamentMatchContext({});
          persistMatch(newMatch);
          setActiveMatch(newMatch);
          setActiveTab('scorer');
        }}
      />

      {/* 2. Extras Modal */}
      {currentInnings && activeMatch && (
        <ExtrasModal
          isOpen={isExtrasModalOpen}
          onClose={() => setIsExtrasModalOpen(false)}
          rules={activeMatch.rules}
          onSubmit={handleScoreExtras}
        />
      )}

      {/* 3. Wicket Fall Modal */}
      {currentInnings && activeMatch && battingTeamObj && bowlingTeamObj && (
        <WicketModal
          isOpen={isWicketModalOpen}
          onClose={() => setIsWicketModalOpen(false)}
          innings={currentInnings}
          rules={activeMatch.rules}
          allBattingPlayers={battingTeamObj.players}
          allBowlingPlayers={bowlingTeamObj.players}
          onSubmit={handleScoreWicket}
        />
      )}

      {/* 4. Bowler Select Modal */}
      {currentInnings && activeMatch && bowlingTeamObj && (
        <BowlerSelectModal
          isOpen={isBowlerModalOpen}
          onClose={() => setIsBowlerModalOpen(false)}
          innings={currentInnings}
          rules={activeMatch.rules}
          allBowlingPlayers={bowlingTeamObj.players}
          previousBowlerName={currentInnings.currentBowlerName}
          onSelectBowler={handleSelectBowler}
          onAddNewBowler={handleAddNewBowler}
        />
      )}

      {/* 5. Batter Select Modal */}
      {currentInnings && battingTeamObj && (
        <BatterSelectModal
          isOpen={isBatterModalOpen}
          onClose={() => setIsBatterModalOpen(false)}
          innings={currentInnings}
          allBattingPlayers={battingTeamObj.players}
          targetEnd={targetBatterEnd}
          onSelectBatter={handleSelectBatter}
          onAddNewBatter={handleAddNewBatter}
        />
      )}

      {/* 6. Squad & Player Management Modal */}
      {currentInnings && activeMatch && (
        <SquadManagementModal
          isOpen={isSquadModalOpen}
          onClose={() => setIsSquadModalOpen(false)}
          match={activeMatch}
          currentInnings={currentInnings}
          onAddPlayerToTeam={handleAddPlayerToSquad}
          onRenamePlayer={handleRenamePlayerInMatch}
        />
      )}
    </div>
  );
}

export default App;
