/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Achievement, GameState } from '../types';
import { ArrowLeft, Trophy, Medal, Star, ShieldCheck, Milestone } from 'lucide-react';
import { snakeAudio } from '../audio';

interface AchievementsPanelProps {
  achievements: Achievement[];
  onNavigate: (state: GameState) => void;
}

export default function AchievementsPanel({ achievements, onNavigate }: AchievementsPanelProps) {
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  const handleBack = () => {
    snakeAudio.playClick();
    onNavigate('MENU');
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const pctUnlocked = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'UNLOCKED') return a.unlocked;
    if (filter === 'LOCKED') return !a.unlocked;
    return true;
  });

  return (
    <div className="flex flex-col h-full text-white font-sans animate-fade-in py-2" id="achievements-panel-container">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 p-4 shrink-0" id="achievements-header">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 px-3 rounded-lg border border-slate-800 transition-all cursor-pointer"
          id="btn-achievements-to-menu"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <span className="text-sm font-mono tracking-widest text-amber-400 font-bold uppercase flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> MEDICAL BADGES
        </span>
        <div className="w-16" /> {/* Balance spacer */}
      </div>

      {/* CORE STATS OVERVIEW CARD */}
      <div className="mx-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 mb-4 flex items-center justify-between glass-panel shrink-0" id="achievements-dashboard-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl shadow-lg shadow-amber-500/5">
            🏆
          </div>
          <div className="text-left">
            <div className="text-xs font-mono text-slate-400 tracking-wider">HALL OF MEALS</div>
            <div className="text-lg font-bold font-sans tracking-tight text-white mb-0.5">
              {unlockedCount} of {achievements.length} UNLOCKED
            </div>
            {/* Visual progress loader */}
            <div className="w-44 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-750" 
                style={{ width: `${pctUnlocked}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-mono font-black text-amber-400">{pctUnlocked}%</span>
        </div>
      </div>

      {/* SUB-FILTER NAVIGATION TABS */}
      <div className="grid grid-cols-3 gap-1 mx-4 p-1 rounded-lg bg-slate-950/80 border border-slate-800 shrink-0 mb-4" id="achievements-segment-tabs">
        {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              snakeAudio.playClick();
              setFilter(tab);
            }}
            className={`py-1.5 rounded text-[10px] font-mono font-bold tracking-wider cursor-pointer transition-all ${
              filter === tab
                ? 'bg-slate-800 text-white shadow shadow-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id={`achievements-tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* BADGES SCROLLING GRID */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-6" id="achievements-list">
        {filteredAchievements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center" id="empty-achievements-message">
            <Medal className="w-8 h-8 text-slate-600 mb-2 " />
            <span>NO MEDALS FOUND IN FILTER</span>
          </div>
        ) : (
          filteredAchievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/55 shadow-md shadow-amber-500/1'
                    : 'bg-slate-950/20 border-slate-900 opacity-60'
                }`}
                id={`achievement-card-${ach.id}`}
              >
                {/* Visual Category Icon representation */}
                <div className={`p-2.5 rounded-lg shrink-0 border ${
                  isUnlocked
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800/80 text-slate-500'
                }`} id={`achievement-badge-${ach.id}`}>
                  {ach.category === 'gameplay' && <Star className="w-5 h-5" />}
                  {ach.category === 'milestone' && <Milestone className="w-5 h-5" />}
                  {ach.category === 'veteran' && <ShieldCheck className="w-5 h-5" />}
                </div>

                {/* Details layout */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-xs font-bold font-sans tracking-tight truncate ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                      {ach.title}
                    </h4>
                    {isUnlocked && ach.unlockedAt && (
                      <span className="text-[8px] font-mono text-slate-500">
                        {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
