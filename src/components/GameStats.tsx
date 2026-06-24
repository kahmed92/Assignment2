/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats as StatsType, GameState } from '../types';
import { ArrowLeft, BarChart3, RotateCcw, Swords, Flame, Sparkles, Award, PlayCircle } from 'lucide-react';
import { snakeAudio } from '../audio';

interface GameStatsProps {
  stats: StatsType;
  onResetStats: () => void;
  onNavigate: (state: GameState) => void;
}

export default function GameStats({ stats, onResetStats, onNavigate }: GameStatsProps) {

  const handleBack = () => {
    snakeAudio.playClick();
    onNavigate('MENU');
  };

  const handleReset = () => {
    snakeAudio.playClick();
    if (window.confirm("ARE YOU SURE YOU WANT TO FORMAT THE ARCADE STATISTICS HISTORY? (This cannot be undone)")) {
      onResetStats();
    }
  };

  // Convert seconds to readable minutes/hours
  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}m ${s}s`;
  };

  return (
    <div className="flex flex-col h-full text-white font-sans animate-fade-in py-2" id="stats-panel-container">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 p-4 shrink-0" id="stats-header">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 px-3 rounded-lg border border-slate-800 transition-all cursor-pointer"
          id="btn-stats-to-menu"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <span className="text-sm font-mono tracking-widest text-fuchsia-400 font-bold uppercase flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-fuchsia-400" /> ARCADE RECORDS
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/50 p-1.5 px-2.5 rounded border border-red-500/25 transition-all cursor-pointer shrink-0"
          id="btn-wipe-statistics"
        >
          <RotateCcw className="w-3.5 h-3.5" /> WIPE
        </button>
      </div>

      {/* HISTORICAL STATS BENTO GRID LAYOUT */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-6 animate-fade-in" id="stats-grid-wrapper">
        
        {/* Main highlight score cards in grid */}
        <div className="grid grid-cols-2 gap-3" id="stats-top-bento">
          
          {/* Highest Score Card */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-left relative overflow-hidden flex flex-col justify-between min-h-24 shadow-md pr-1" id="stat-card-high">
            <div className="text-[9px] font-mono tracking-wider text-indigo-400 uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> HIGHEST BAR
            </div>
            <div className="text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mt-2 truncate">
              {stats.highestScore.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-1">Single run maximum score.</div>
          </div>

          {/* Daily / Session Played Games Card */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-left relative overflow-hidden flex flex-col justify-between min-h-24 shadow-md pr-1" id="stat-card-games">
            <div className="text-[9px] font-mono tracking-wider text-emerald-400 uppercase flex items-center gap-1">
              <PlayCircle className="w-3.5 h-3.5" /> ARCADE SESSIONS
            </div>
            <div className="text-2xl font-mono font-black text-white mt-2">
              {stats.gamesPlayed} <span className="text-xs text-slate-500 font-medium">runs</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-1">Total games completed.</div>
          </div>
        </div>

        {/* Extended summary list grid */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 font-sans glass-panel" id="stats-summary-card">
          <h3 className="text-xs font-mono tracking-widest text-indigo-400 mb-3 uppercase">GENERAL METRICS</h3>

          <div className="space-y-2.5" id="stats-summary-rows">
            {/* Play time */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-900" id="row-stats-time">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" /> Time Spent Playing
              </span>
              <span className="text-sm font-mono font-bold text-slate-100">{formatTime(stats.timePlayedSec)}</span>
            </div>

            {/* Total score across sessions */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-900" id="row-stats-accumulated">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Swords className="w-4 h-4 text-indigo-400" /> Cumulative Points
              </span>
              <span className="text-sm font-mono font-bold text-slate-100">{stats.totalScore.toLocaleString()}</span>
            </div>

            {/* Peak Dynamic Level */}
            <div className="flex items-center justify-between py-1.5" id="row-stats-peaklevel">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" /> Max Speed Level Cleared
              </span>
              <span className="text-sm font-mono font-bold text-slate-100">Lvl {stats.highestLevelReached}</span>
            </div>
          </div>
        </div>

        {/* DIETARY DETAIL SHEET */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 font-sans glass-panel" id="stats-dietary">
          <h3 className="text-xs font-mono tracking-widest text-indigo-400 mb-3 uppercase">FOOD DIGEST STATS</h3>

          <div className="grid grid-cols-2 gap-4 text-left" id="stats-dietary-grid">
            {/* Standard Apple */}
            <div className="border border-slate-800/40 rounded-lg p-2.5 bg-slate-950/30" id="sub-diet-regular">
              <div className="text-[10px] font-mono text-rose-400 mb-0.5 uppercase flex items-center gap-1">
                🍎 Red Apples
              </div>
              <div className="text-xl font-mono font-bold text-slate-200">
                {stats.totalFoodEaten} <span className="text-[10px] text-slate-400 font-normal">eaten</span>
              </div>
            </div>

            {/* Golden Apple */}
            <div className="border border-slate-800/40 rounded-lg p-2.5 bg-slate-950/30" id="sub-diet-golden">
              <div className="text-[10px] font-mono text-amber-400 mb-0.5 uppercase flex items-center gap-1">
                ⭐ Golden Star
              </div>
              <div className="text-xl font-mono font-bold text-slate-200">
                {stats.totalGoldenEaten} <span className="text-[10px] text-slate-400 font-normal">eaten</span>
              </div>
            </div>

            {/* Crystals */}
            <div className="border border-slate-800/40 rounded-lg p-2.5 bg-slate-950/30" id="sub-diet-crystals">
              <div className="text-[10px] font-mono text-cyan-400 mb-0.5 uppercase flex items-center gap-1">
                💎 Crystals
              </div>
              <div className="text-xl font-mono font-bold text-slate-200">
                {stats.totalCrystalsEaten} <span className="text-[10px] text-slate-400 font-normal">charged</span>
              </div>
            </div>

            {/* Bonus Orbs */}
            <div className="border border-slate-800/40 rounded-lg p-2.5 bg-slate-950/30" id="sub-diet-bonus">
              <div className="text-[10px] font-mono text-fuchsia-400 mb-0.5 uppercase flex items-center gap-1">
                🔮 Special Orbs
              </div>
              <div className="text-xl font-mono font-bold text-slate-200">
                {stats.totalBonusEaten} <span className="text-[10px] text-slate-400 font-normal">activated</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
