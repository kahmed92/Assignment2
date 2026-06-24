/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyLevel, GameState } from '../types';
import { DIFFICULTY_LEVELS } from '../configs';
import { ChevronRight, Settings, Trophy, BarChart3, Play, Swords } from 'lucide-react';
import { snakeAudio } from '../audio';

interface MainMenuProps {
  difficulty: DifficultyLevel;
  onSelectDifficulty: (lvl: DifficultyLevel) => void;
  onStartGame: () => void;
  onNavigate: (state: GameState) => void;
  highestScore: number;
}

export default function MainMenu({
  difficulty,
  onSelectDifficulty,
  onStartGame,
  onNavigate,
  highestScore,
}: MainMenuProps) {

  const handleSelect = (lvl: DifficultyLevel) => {
    snakeAudio.playClick();
    onSelectDifficulty(lvl);
  };

  const handleButtonClick = (state: GameState) => {
    snakeAudio.playClick();
    onNavigate(state);
  };

  const currentDiffConfig = DIFFICULTY_LEVELS[difficulty];

  return (
    <div className="flex flex-col items-center justify-between min-h-full py-2 animate-fade-in text-slate-100" id="main-menu-container">
      {/* Title Header Branding */}
      <div className="text-center mt-3 mb-1" id="menu-header">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.4)]">
            <div className="w-5 h-1.5 bg-slate-900 rounded-full rotate-45"></div>
          </div>
          <div className="text-left font-sans">
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic text-slate-100">SNAKE PRO</h1>
            <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase block mt-1">v2.0 High-Res Edition</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-sans leading-relaxed">
          Sleek smooth 60 FPS HTML5 canvas engine built for pro players.
        </p>
      </div>

      {/* CORE ACTION SUBPANEL */}
      <div className="w-full max-w-lg px-4 flex-1 flex flex-col justify-center gap-4" id="menu-body">
        
        {/* Play Button Card */}
        <button
          onClick={() => {
            snakeAudio.playClick();
            onStartGame();
          }}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-4 font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] active:scale-95 flex items-center justify-between cursor-pointer border-0"
          id="btn-play-game"
        >
          {/* Pulsing light effect */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/20 p-2.5 rounded-xl">
              <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div className="text-left font-sans">
              <div className="text-base font-black tracking-tight uppercase leading-snug">START ARCADE SESSION</div>
              <div className="text-[10px] font-semibold text-slate-900/80 uppercase tracking-wide">
                Playing on {currentDiffConfig.name} (x{currentDiffConfig.multiplier.toFixed(1)})
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1 text-slate-950" />
        </button>

        {/* Dynamic Interactive Difficulty levels selection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm" id="difficulty-grid-wrapper">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">SELECT DIFFICULTY</h3>
          
          <div className="grid grid-cols-5 gap-1.5" id="difficulty-grid">
            {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => {
              const cfg = DIFFICULTY_LEVELS[level];
              const isSelected = difficulty === level;
              return (
                <button
                  key={level}
                  onClick={() => handleSelect(level)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-100 hover:bg-white/10'
                  }`}
                  id={`diff-level-${level}`}
                >
                  <span className="text-base font-mono font-bold leading-none mb-1">{level}</span>
                  <span className="text-[8px] font-sans font-black tracking-tight uppercase truncate w-full text-center">
                    {cfg.name}
                  </span>
                  {isSelected && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#10b981]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive details display block */}
          <div className="mt-3 p-2.5 rounded-xl bg-black/45 border border-white/5 text-xs font-sans text-slate-300 flex items-center justify-between" id="difficulty-details">
            <div className="flex-1 pr-4 text-left">
              <div className="font-bold text-slate-200 text-[11px] mb-0.5">{currentDiffConfig.name} Mode</div>
              <div className="text-[10px] text-slate-400 leading-snug">{currentDiffConfig.description}</div>
            </div>
            <div className="text-right pl-3 border-l border-white/5 shrink-0">
              <div className="text-[8px] font-mono tracking-wider text-slate-500 font-bold uppercase">MULTIPLIER</div>
              <div className="text-lg font-mono font-black text-cyan-400">x{currentDiffConfig.multiplier.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* SUBMENU NAVIGATION UTILITIES */}
        <div className="grid grid-cols-3 gap-2" id="menu-sub-navigation">
          <button
            onClick={() => handleButtonClick('SETTINGS')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all font-sans cursor-pointer group"
            id="sub-btn-settings"
          >
            <Settings className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:rotate-45 transition-transform" />
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">Skins & SFX</span>
          </button>

          <button
            onClick={() => handleButtonClick('ACHIEVEMENTS')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all font-sans cursor-pointer group"
            id="sub-btn-keychains"
          >
            <Trophy className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">Medals</span>
          </button>

          <button
            onClick={() => handleButtonClick('STATS')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all font-sans cursor-pointer group"
            id="sub-btn-stats"
          >
            <BarChart3 className="w-5 h-5 text-fuchsia-400 mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">Records</span>
          </button>
        </div>
      </div>

      {/* HIGHEST RECORD ACCENT FOOTER */}
      <div className="mt-3 py-2 px-5 rounded-full bg-black/40 border border-white/5 mb-1 shadow-inner text-[10px] font-mono text-cyan-300/90 flex items-center justify-center gap-2" id="menu-highscore-badge">
        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
        <span className="font-semibold text-slate-400">HIGH SCORE ARCHIVE:</span>
        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 glow-text text-sm">
          {highestScore.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
