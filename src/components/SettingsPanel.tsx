/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SnakeSkin, GameState } from '../types';
import { SKINS_CONFIG } from '../configs';
import { snakeAudio } from '../audio';
import { ArrowLeft, Volume2, VolumeX, Music, Settings, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  currentSkin: SnakeSkin;
  onSkinChange: (skin: SnakeSkin) => void;
  onNavigate: (state: GameState) => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
}

export default function SettingsPanel({
  currentSkin,
  onSkinChange,
  onNavigate,
  isSoundOn,
  onToggleSound,
  isMusicOn,
  onToggleMusic,
}: SettingsPanelProps) {

  const handleBack = () => {
    snakeAudio.playClick();
    onNavigate('MENU');
  };

  const selectSkin = (id: SnakeSkin) => {
    snakeAudio.playClick();
    onSkinChange(id);
  };

  const handleToggleSoundClick = () => {
    onToggleSound();
    // Play quick feedback CLICK if just turned on
    setTimeout(() => {
      snakeAudio.playClick();
    }, 50);
  };

  const handleToggleMusicClick = () => {
    onToggleMusic();
    snakeAudio.playClick();
  };

  return (
    <div className="flex flex-col h-full text-white font-sans animate-fade-in py-2" id="settings-panel-container">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 p-4 shrink-0" id="settings-header">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 px-3 rounded-lg border border-slate-800 transition-all cursor-pointer"
          id="btn-settings-to-menu"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <span className="text-sm font-mono tracking-widest text-indigo-400 font-bold uppercase flex items-center gap-1.5">
          <Settings className="w-4 h-4" /> CONFIGURATION
        </span>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* BODY CONFIGURATOR WITH INDEPENDENT SECTIONS */}
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6" id="settings-body">
        
        {/* AUDIO CONSOLE */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 glass-panel" id="settings-audio-deck">
          <h3 className="text-xs font-mono tracking-widest text-indigo-400 mb-3.5 uppercase">SYSTEM AUDIO</h3>
          
          <div className="grid grid-cols-2 gap-3" id="audio-toggle-grid">
            {/* Sound FX Button */}
            <button
              onClick={handleToggleSoundClick}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSoundOn
                  ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-950/55 border-slate-800/80 text-slate-400 hover:text-slate-300'
              }`}
              id="sound-fx-toggle"
            >
              <div className="flex items-center gap-2.5">
                {isSoundOn ? <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight uppercase font-sans">SOUND EFFECTS</div>
                  <div className="text-[10px] text-slate-500">{isSoundOn ? 'ACTIVE' : 'DEACTIVATED'}</div>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${isSoundOn ? 'bg-emerald-400 shadow-md shadow-emerald-400' : 'bg-slate-600'}`} />
            </button>

            {/* Synthesized Music Button */}
            <button
              onClick={handleToggleMusicClick}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isMusicOn
                  ? 'bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-950/55 border-slate-800/80 text-slate-400 hover:text-slate-300'
              }`}
              id="music-synth-toggle"
            >
              <div className="flex items-center gap-2.5">
                <Music className={`w-5 h-5 ${isMusicOn ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '6s' }} />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight uppercase font-sans">SYNTH MUSIC</div>
                  <div className="text-[10px] text-slate-500">{isMusicOn ? 'ACTIVE' : 'DEACTIVATED'}</div>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${isMusicOn ? 'bg-cyan-400 shadow-md shadow-cyan-400' : 'bg-slate-600'}`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-2.5 text-center leading-normal">
            Music utilizes internal Web Audio synthesis. Toggle background loop freely.
          </p>
        </div>

        {/* CUSTOM COILS AND SKIN SHOP */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 glass-panel" id="settings-skin-deck">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono tracking-widest text-indigo-400 uppercase">SNAKE COSMETIC COILS</h3>
            <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-bounce" /> {Object.keys(SKINS_CONFIG).length} STYLES
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5" id="skins-grid">
            {Object.values(SKINS_CONFIG).map((skin) => {
              const isSelected = skin.id === currentSkin;
              
              return (
                <button
                  key={skin.id}
                  onClick={() => selectSkin(skin.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950/60 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 hover:bg-slate-950/50'
                  }`}
                  id={`skin-selector-${skin.id}`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-bold text-slate-200 uppercase font-sans tracking-tight">
                      {skin.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        EQUIPPED
                      </span>
                    )}
                  </div>

                  {/* HIGH RESOLUTION MINI PREVIEW MODULE */}
                  <div className="w-full h-8 rounded-lg bg-slate-950 flex items-center justify-center gap-1 border border-slate-900/90 mb-2 relative overflow-hidden" id={`skin-preview-${skin.id}`}>
                    {/* Shadow overlay glow */}
                    <div 
                      className="absolute inset-0 filter blur-md opacity-35"
                      style={{ backgroundColor: skin.glowColor }}
                    />
                    
                    {/* Render 3 interpolated snake segments */}
                    <div 
                      className="w-4 h-4 rounded-full relative z-10 flex items-center justify-center border"
                      style={{ 
                        backgroundColor: skin.headColor,
                        borderColor: skin.borderColor,
                      }}
                    >
                      {/* Pupils preview */}
                      <div className="w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-black rounded-full" />
                      </div>
                    </div>
                    {[1, 2].map((idx) => (
                      <div 
                        key={idx}
                        className="w-3.5 h-3.5 rounded-full z-10 border"
                        style={{ 
                          backgroundColor: skin.pattern === 'rainbow' 
                            ? `hsl(${(180 + idx * 30) % 360}, 90%, 55%)` 
                            : skin.bodyColor,
                          borderColor: skin.borderColor,
                          opacity: 1 - idx * 0.2
                        }}
                      />
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans leading-normal line-clamp-2">
                    {skin.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
