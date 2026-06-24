/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GameState, DifficultyLevel, SnakeSkin, GameStats, Achievement } from './types';
import { DIFFICULTY_LEVELS, INITIAL_ACHIEVEMENTS, INITIAL_STATS } from './configs';
import { snakeAudio } from './audio';

// Dynamic Subpanels
import MainMenu from './components/MainMenu';
import SettingsPanel from './components/SettingsPanel';
import AchievementsPanel from './components/AchievementsPanel';
import GameStatsPanel from './components/GameStats';
import GameCanvas from './components/GameCanvas';
import ControlsOverlay from './components/ControlsOverlay';

import { Heart, Pause, Play, Trophy, Activity, Award, Sparkles, AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Game Setup Configurations
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(3); // Default Medium
  const [skin, setSkin] = useState<SnakeSkin>('classic');
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(false);

  // Active play session metrics
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [remainingLives, setRemainingLives] = useState<number>(3);
  const [sessionLevel, setSessionLevel] = useState<number>(1);
  const [crystalClock, setCrystalClock] = useState<number>(0); // visual timing representation

  // Persistent States
  const [highestScore, setHighestScore] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Cross-ref hooks to call child canvas actions
  const triggerResetRef = useRef<(() => void) | null>(null);
  const directionOverrideRef = useRef<((dir: any) => void) | null>(null);

  // Playtime background tracking
  const playTimerRef = useRef<any>(null);

  // 1. INITIALIZE PERSISTENT STORAGE ARCHIVES
  useEffect(() => {
    try {
      // 1. Load sound flags
      const storedSound = localStorage.getItem('pro_snake_sound');
      if (storedSound !== null) {
        const soundVal = storedSound === 'true';
        setIsSoundOn(soundVal);
        snakeAudio.setSoundEnabled(soundVal);
      } else {
        snakeAudio.setSoundEnabled(true);
      }

      const storedMusic = localStorage.getItem('pro_snake_music');
      if (storedMusic !== null) {
        const musicVal = storedMusic === 'true';
        setIsMusicOn(musicVal);
        // Do not auto-play music instantly due to browser user-gesture block policies,
        // it will resume when they click Play or start interacting
      }

      // 2. Load custom skin preference
      const storedSkin = localStorage.getItem('pro_snake_skin');
      if (storedSkin) {
        setSkin(storedSkin as SnakeSkin);
      }

      // 3. Load high score
      const storedHighScore = localStorage.getItem('pro_snake_highest');
      if (storedHighScore) {
        setHighestScore(parseInt(storedHighScore, 10));
      }

      // 4. Load stats
      const storedStats = localStorage.getItem('pro_snake_stats_json');
      if (storedStats) {
        setGameStats(JSON.parse(storedStats));
      }

      // 5. Load achievements
      const storedAchievements = localStorage.getItem('pro_snake_achievements_json');
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }
    } catch (e) {
      console.warn("Could not read local storage archives.", e);
    }
  }, []);

  // 2. TIMER SYSTEM FOR IN-GAME TIME TRACKING (Non-blocking Statistics tracking)
  useEffect(() => {
    if (gameState === 'PLAYING') {
      playTimerRef.current = setInterval(() => {
        setGameStats((prev) => {
          const next = { ...prev, timePlayedSec: prev.timePlayedSec + 1 };
          localStorage.setItem('pro_snake_stats_json', JSON.stringify(next));
          return next;
        });
      }, 1000);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [gameState]);

  // Sync Audio Eng state inside state hooks
  function handleToggleSound() {
    const nextVal = !isSoundOn;
    setIsSoundOn(nextVal);
    snakeAudio.setSoundEnabled(nextVal);
    localStorage.setItem('pro_snake_sound', String(nextVal));
  }

  function handleToggleMusic() {
    const nextVal = !isMusicOn;
    setIsMusicOn(nextVal);
    snakeAudio.setMusicEnabled(nextVal);
    localStorage.setItem('pro_snake_music', String(nextVal));
  }

  function handleSkinChange(newSkin: SnakeSkin) {
    setSkin(newSkin);
    localStorage.setItem('pro_snake_skin', String(newSkin));
  }

  // 3. DYNAMIC STATS RECORD UPDATES AND FILE STORAGE PACKS
  function handleStatsUpdate(statsPiece: Partial<GameStats>) {
    setGameStats((prev) => {
      const next = { ...prev, ...statsPiece };
      
      // Keep individual aggregates incremented
      if (statsPiece.totalFoodEaten) next.totalFoodEaten = prev.totalFoodEaten + statsPiece.totalFoodEaten;
      if (statsPiece.totalGoldenEaten) next.totalGoldenEaten = prev.totalGoldenEaten + statsPiece.totalGoldenEaten;
      if (statsPiece.totalCrystalsEaten) next.totalCrystalsEaten = prev.totalCrystalsEaten + statsPiece.totalCrystalsEaten;
      if (statsPiece.totalBonusEaten) next.totalBonusEaten = prev.totalBonusEaten + statsPiece.totalBonusEaten;

      localStorage.setItem('pro_snake_stats_json', JSON.stringify(next));
      return next;
    });
  }

  function handleResetAllStats() {
    setGameStats(INITIAL_STATS);
    setAchievements(INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })));
    setHighestScore(0);
    localStorage.removeItem('pro_snake_stats_json');
    localStorage.removeItem('pro_snake_achievements_json');
    localStorage.removeItem('pro_snake_highest');
  }

  // 4. ACHIEVEMENT MEDAL TRIGGER CHECKS
  function checkAchievements(sessionMetrics: { score: number; length: number; level: number; crystalsInGame: number }) {
    let changed = false;
    const nowStr = new Date().toISOString();

    const updatedAchievements = achievements.map((ach) => {
      if (ach.unlocked) return ach;

      let meetsRequirement = false;

      if (ach.targetType === 'score') {
        if (ach.id === 'extreme-survival') {
          meetsRequirement = sessionMetrics.score >= ach.targetValue && difficulty === 5;
        } else {
          meetsRequirement = sessionMetrics.score >= ach.targetValue;
        }
      } else if (ach.targetType === 'length') {
        meetsRequirement = sessionMetrics.length >= ach.targetValue;
      } else if (ach.targetType === 'level') {
        meetsRequirement = sessionMetrics.level >= ach.targetValue;
      } else if (ach.targetType === 'crystals') {
        meetsRequirement = sessionMetrics.crystalsInGame >= ach.targetValue;
      } else if (ach.targetType === 'games') {
        meetsRequirement = gameStats.gamesPlayed >= ach.targetValue;
      }

      if (meetsRequirement) {
        changed = true;
        return {
          ...ach,
          unlocked: true,
          unlockedAt: nowStr
        };
      }
      return ach;
    });

    if (changed) {
      setAchievements(updatedAchievements);
      localStorage.setItem('pro_snake_achievements_json', JSON.stringify(updatedAchievements));
      
      // High pitched celebratory chime
      setTimeout(() => {
        snakeAudio.playLevelUp();
      }, 200);
    }
  }

  // 5. GAME TRANSITION TRIGGERS
  function handleStartSession() {
    // Resume context representing user gesture consent
    snakeAudio.resumeContext();
    
    // Play sequence depending on user setting preference
    if (isMusicOn) {
      snakeAudio.setMusicEnabled(true);
    }

    setCurrentScore(0);
    setRemainingLives(3);
    setSessionLevel(1);
    setGameState('PLAYING');
  }

  function handleContinueFromScreen() {
    snakeAudio.playClick();
    setGameState('PLAYING');
    // Call the reset function on the child canvas grid (keeping obstacles and scores!)
    if (triggerResetRef.current) {
      triggerResetRef.current();
    }
  }

  function handleQuitToMenu() {
    snakeAudio.playClick();
    snakeAudio.setMusicEnabled(false);
    setGameState('MENU');
  }

  function handleLivesChange(newLives: number) {
    setRemainingLives(newLives);
  }

  function handleScoreChange(newScore: number) {
    setCurrentScore(newScore);
  }

  function handleLevelReached(newLevel: number) {
    setSessionLevel(newLevel);
  }

  function handleContinueOverlayTrigger() {
    setGameState('CONTINUE_SCREEN');
  }

  function handleCompletedGameOver(finalScore: number) {
    // 1. Tally session games played count
    const nextGamesCount = gameStats.gamesPlayed + 1;
    
    // 2. Validate high record peaks
    let isNewHigh = false;
    let nextHighScore = highestScore;
    if (finalScore > highestScore) {
      nextHighScore = finalScore;
      setHighestScore(finalScore);
      localStorage.setItem('pro_snake_highest', String(finalScore));
      isNewHigh = true;
    }

    const peakLvl = Math.max(gameStats.highestLevelReached, sessionLevel);

    handleStatsUpdate({
      gamesPlayed: 1, // trigger incrementing
      totalScore: finalScore,
      highestScore: nextHighScore,
      highestLevelReached: peakLvl
    });

    // Disable synthesizer music during end game menus
    snakeAudio.setMusicEnabled(false);
    setGameState('GAMEOVER');
  }

  return (
    <div 
      className="w-full min-h-screen bg-[#0a0a0c] text-slate-100 font-sans flex flex-col items-center justify-center p-2 md:p-6 relative overflow-hidden"
      id="app-main-view"
    >
      {/* BACKGROUND DECORATIVE RADIAL GRADIENT FROM THE SOPHISTICATED DARK DESIGN GUIDE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#0a0a0c_70%)] opacity-40 pointer-events-none z-0" />

      {/* SOLID RESPONSIVE WRAPPER GLASS-PANEL ARCADE FRAME */}
      <div 
        className="w-full max-w-xl h-[88vh] md:h-[660px] relative overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between z-10 animate-fade-in"
        id="arcade-bezel-frame"
      >
        {/* UPPER AMBIENT DECORATIVE HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-black/40 text-[10px] font-mono tracking-wider text-slate-400 shrink-0 select-none z-10" id="bezel-info-row">
          <div className="flex items-center gap-2.5" id="header-status-indicator">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.4)] shrink-0">
              <div className="w-4 h-1 bg-slate-900 rounded-full rotate-45"></div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase leading-none italic text-slate-100">Snake Pro</h1>
              <span className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase block mt-0.5 leading-none">v2.0 High-Res Edition</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4" id="header-sys-stats">
            <span className="text-slate-400 font-bold hover:text-white transition-colors" id="creator-tag">
              COIL ENGINE
            </span>
          </div>
        </div>

        {/* --- STATE CARD VIEWS DISPATCHER --- */}
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col justify-between" id="state-renderer-viewport">
          
          {/* A. MENU SCREEN */}
          {gameState === 'MENU' && (
            <MainMenu
              difficulty={difficulty}
              onSelectDifficulty={(lvl) => setDifficulty(lvl)}
              onStartGame={handleStartSession}
              onNavigate={(s) => setGameState(s)}
              highestScore={highestScore}
            />
          )}

          {/* B. SETTINGS & SKINS PANEL */}
          {gameState === 'SETTINGS' && (
            <SettingsPanel
              currentSkin={skin}
              onSkinChange={handleSkinChange}
              onNavigate={(s) => setGameState(s)}
              isSoundOn={isSoundOn}
              onToggleSound={handleToggleSound}
              isMusicOn={isMusicOn}
              onToggleMusic={handleToggleMusic}
            />
          )}

          {/* C. TROPHY HALL ACHIEVEMENTS PANEL */}
          {gameState === 'ACHIEVEMENTS' && (
            <AchievementsPanel
              achievements={achievements}
              onNavigate={(s) => setGameState(s)}
            />
          )}

          {/* D. GAME HISTORIC STATS PANEL */}
          {gameState === 'STATS' && (
            <GameStatsPanel
              stats={gameStats}
              onResetStats={handleResetAllStats}
              onNavigate={(s) => setGameState(s)}
            />
          )}

          {/* E. CORE ACTIVE ARCADE RENDERING ENGINE AND CONTROLS */}
          {gameState === 'PLAYING' && (
            <div className="h-full flex flex-col justify-between" id="active-play-section">
              
              {/* HEAD COUNTER HUD (Heads-Up Display) */}
              <div 
                className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/5 text-white select-none shrink-0"
                id="play-hud"
              >
                {/* Score Module */}
                <div className="text-left" id="hud-score-widget">
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-0.5">SCORE</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 leading-none">
                    {String(currentScore).padStart(6, '0')}
                  </p>
                </div>

                {/* Level Tag HUD */}
                <div className="flex flex-col items-center" id="hud-level-widget">
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-0.5">SPEED MULTIPLIER</p>
                  <p className="text-md font-mono font-extrabold px-3 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-indigo-300 leading-none">
                    STAGE {sessionLevel} (x{DIFFICULTY_LEVELS[difficulty].multiplier.toFixed(1)})
                  </p>
                </div>

                {/* Retro Hearts Health Points System */}
                <div className="text-right" id="hud-lives-widget">
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1.5 font-sans">LIVES LEFT</p>
                  <div className="flex items-center justify-end gap-2" id="hud-hearts">
                    {([1, 2, 3] as const).map((heartIdx) => {
                      const isActive = heartIdx <= remainingLives;
                      return (
                        <div
                          key={heartIdx}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            isActive
                              ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                              : 'bg-white/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTIVE CANVAS WRAPPER CONTAINER */}
              <div className="flex-1 overflow-hidden flex items-center justify-center p-4 relative group" id="active-canvas-viewport">
                
                {/* Glow ring backing effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition pointer-events-none" />

                <div className="relative h-full w-full max-h-[440px] max-w-[440px] bg-[#050507] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                  <GameCanvas
                    isPaused={false}
                    isPlaying={true}
                    difficulty={difficulty}
                    skin={skin}
                    lives={remainingLives}
                    score={currentScore}
                    onScoreChange={handleScoreChange}
                    onLivesChange={handleLivesChange}
                    onLevelReached={handleLevelReached}
                    onContinueScreen={handleContinueOverlayTrigger}
                    onGameOver={handleCompletedGameOver}
                    onStatsUpdate={handleStatsUpdate}
                    onAchievementCheck={checkAchievements}
                    triggerResetRef={triggerResetRef}
                    directionOverrideRef={directionOverrideRef}
                  />
                </div>

                {/* Right Floating Overlay Pause trigger button */}
                <button
                  onClick={() => {
                    snakeAudio.playClick();
                    setGameState('PAUSED');
                  }}
                  className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-[#0a0a0c] border border-white/10 text-slate-400 hover:text-cyan-400 shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 z-20"
                  id="float-pause-button"
                  title="Pause Session"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>

              {/* INTEGRATED PHYSICAL SWIPE CONTROLS (Rendered in HUD for user assistance) */}
              <div className="md:hidden py-1 border-t border-white/5 bg-black/30" id="mobile-keypad-panel">
                <ControlsOverlay
                  onDirectionChange={(dir) => {
                    if (directionOverrideRef.current) {
                      directionOverrideRef.current(dir);
                    }
                  }}
                  currentDirection="RIGHT"
                />
              </div>
            </div>
          )}

          {/* F. GENERAL PAUSED OVERLAY */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm text-white animate-fade-in z-20" id="paused-viewport">
              <div className="w-80 sm:w-96 p-8 bg-slate-950/95 border border-white/10 rounded-3xl text-center shadow-2xl" id="paused-card">
                <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase leading-none italic text-slate-100">PAUSED</h2>
                <p className="text-slate-400 text-xs mb-8">Speed level {sessionLevel}: Keep going for the High Score record!</p>
                <div className="space-y-3" id="paused-options">
                  <button
                    onClick={() => {
                      snakeAudio.playClick();
                      setGameState('PLAYING');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-black uppercase tracking-widest text-xs hover:scale-[1.02] cursor-pointer transition-transform shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                    id="paused-btn-resume"
                  >
                    Resume Session
                  </button>
                  
                  <button
                    onClick={handleQuitToMenu}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-xs cursor-pointer transition-colors text-slate-200"
                    id="paused-btn-quit"
                  >
                    Exit to Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* G. CONTINUE RESPAWN OVERLAY SCREEN */}
          {gameState === 'CONTINUE_SCREEN' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm text-white animate-fade-in z-20" id="continue-screen-viewport">
              <div className="w-80 sm:w-96 p-8 bg-slate-950/95 border border-white/10 rounded-3xl text-center shadow-2xl" id="continue-card">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black mb-1 tracking-tighter uppercase italic text-slate-100">COIL COLLISION</h2>
                <p className="text-slate-400 text-xs mb-6">
                  Your snake collided with barriers! Respawn with continuous shield invulnerability.
                </p>

                {/* Displaying remaining lives explicitly */}
                <div className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 inline-flex items-center gap-2 mb-6" id="continue-heart-summary">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-300">
                    {remainingLives} Health Cores Left
                  </span>
                </div>

                <div className="space-y-3" id="continue-actions">
                  <button
                    onClick={handleContinueFromScreen}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-slate-950 font-black text-xs hover:scale-[1.02] active:scale-95 cursor-pointer transition-all text-center rounded-xl shadow-lg uppercase tracking-widest"
                    id="btn-continue-respawn"
                  >
                    Activate Respawn Shield
                  </button>

                  <button
                    onClick={handleQuitToMenu}
                    className="w-full py-2 bg-transparent text-slate-500 hover:text-white transition-colors cursor-pointer text-center font-bold text-[10px] uppercase tracking-wider"
                    id="btn-quit-from-continue"
                  >
                    Forfeit score & quit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* H. ARCADE GAME OVER TOTAL SCORECARD SUMMARY */}
          {gameState === 'GAMEOVER' && (
            <div className="h-full flex flex-col justify-between py-6 px-6 text-white animate-fade-in relative z-10" id="gameover-viewport">
              {/* Scorecard Header */}
              <div className="text-center mt-2" id="gameover-header">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 animate-bounce" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                  GAME OVER
                </h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">
                  SYS_CORES_CRITICAL_FAILURE
                </p>
              </div>

              {/* Central Stat breakdown Scorecard sheet */}
              <div className="max-w-sm w-full mx-auto" id="gameover-body">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm" id="scorecard-sheet">
                  <div className="mb-5" id="scorecard-metric-primary">
                    <span className="text-[9px] font-semibold tracking-widest text-[#10b981] uppercase font-mono">FINAL SCORE RECORD</span>
                    <div className="text-5xl font-mono font-black text-slate-100 glow-text mt-1.5">
                      {String(currentScore).padStart(6, '0')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10" id="scorecard-metadata-grid">
                    {/* Multiplier Used */}
                    <div className="p-2.5 border border-white/5 bg-black/40 rounded-xl text-left" id="summary-meta-diff">
                      <span className="text-[8px] font-mono text-slate-550 block uppercase">DIFFICULTY PRESET</span>
                      <span className="text-xs font-semibold text-slate-300 block truncate mt-0.5">
                        {DIFFICULTY_LEVELS[difficulty].name}
                      </span>
                    </div>

                    {/* Peak Speed reach */}
                    <div className="p-2.5 border border-white/5 bg-black/40 rounded-xl text-left" id="summary-meta-level">
                      <span className="text-[8px] font-mono text-slate-550 block uppercase">MAX SPEED LEVEL</span>
                      <span className="text-xs font-semibold text-slate-300 block mt-0.5">
                        Stage {sessionLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Record High Indicator alerts */}
                {currentScore >= highestScore && currentScore > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-300 font-bold tracking-wide flex items-center justify-center gap-1.5 animate-pulse" id="record-broken-banner">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> NEW HISTORIC PEAK ACHIEVED!
                  </div>
                )}
              </div>

              {/* Play again triggers */}
              <div className="space-y-2 max-w-sm w-full mx-auto shrink-0 mb-2" id="gameover-actions">
                <button
                  onClick={handleStartSession}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 font-bold text-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-95 cursor-pointer transition-transform shadow-[0_0_25px_rgba(52,211,153,0.3)]"
                  id="gameover-btn-restart"
                >
                  Restart Battle
                </button>

                <button
                  onClick={handleQuitToMenu}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold uppercase tracking-widest text-[10px] rounded-xl cursor-pointer transition-colors"
                  id="gameover-btn-quit"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}

        </div>

        {/* --- DYNAMIC SYNCED STATUS FOOTER (MATCHING SOPHISTICATED DARK SPEC) --- */}
        <footer className="h-10 border-t border-white/5 px-4 flex items-center justify-between bg-black/40 text-[9px] text-slate-500 font-mono tracking-widest shrink-0 z-10" id="arcade-system-footer">
          <div className="flex gap-4 uppercase">
            <span>SESSION: SYNCED</span>
            <span className="hidden sm:inline">ID: SPRO-944</span>
          </div>
          <div className="flex gap-4 uppercase font-bold text-emerald-500/90 items-center">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>60 FPS STABLE</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
