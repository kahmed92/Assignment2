/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Direction } from '../types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Fingerprint } from 'lucide-react';
import { snakeAudio } from '../audio';

interface ControlsOverlayProps {
  onDirectionChange: (dir: Direction) => void;
  currentDirection: Direction;
}

export default function ControlsOverlay({ onDirectionChange, currentDirection }: ControlsOverlayProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Set up full-screen gesture listeners for swipes
  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchMove(e: TouchEvent) {
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      const threshold = 35; // px trigger

      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal Swipe
          if (deltaX > 0) {
            onDirectionChange('RIGHT');
          } else {
            onDirectionChange('LEFT');
          }
        } else {
          // Vertical Swipe
          if (deltaY > 0) {
            onDirectionChange('DOWN');
          } else {
            onDirectionChange('UP');
          }
        }
        // Void start coordinates so we don't trigger rapidly in standard swipes
        touchStartRef.current = null;
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onDirectionChange]);

  const triggerButton = (dir: Direction) => {
    snakeAudio.playClick();
    onDirectionChange(dir);
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 px-4 select-none shrink-0" id="controls-panel">
      
      {/* Dynamic tactile Virtual D-Pad controller */}
      <div className="relative w-40 h-40 flex items-center justify-center border border-slate-800/80 bg-slate-950/40 rounded-full p-2" id="tactile-dpad">
        
        {/* Core center thumb stick cap */}
        <div className="absolute w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 z-10 shadow-md">
          <Fingerprint className="w-5 h-5 text-indigo-400 hover:scale-105 active:scale-90 transition-transform cursor-pointer" />
        </div>

        {/* UP KEY */}
        <button
          onClick={() => triggerButton('UP')}
          className={`absolute top-1.5 w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            currentDirection === 'UP'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-400'
              : 'bg-slate-900/85 border-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
          aria-label="Move Up"
          id="dpad-up"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        {/* LEFT KEY */}
        <button
          onClick={() => triggerButton('LEFT')}
          className={`absolute left-1.5 w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            currentDirection === 'LEFT'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-400'
              : 'bg-slate-900/85 border-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
          aria-label="Move Left"
          id="dpad-left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* RIGHT KEY */}
        <button
          onClick={() => triggerButton('RIGHT')}
          className={`absolute right-1.5 w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            currentDirection === 'RIGHT'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-400'
              : 'bg-slate-900/85 border-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
          aria-label="Move Right"
          id="dpad-right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* DOWN KEY */}
        <button
          onClick={() => triggerButton('DOWN')}
          className={`absolute bottom-1.5 w-11 h-11 rounded-xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            currentDirection === 'DOWN'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-400'
              : 'bg-slate-900/85 border-slate-800/80 hover:bg-slate-800 text-slate-300'
          }`}
          aria-label="Move Down"
          id="dpad-down"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* SWIPE RECOGNITION TIPS */}
      <span className="text-[10px] font-mono tracking-wider text-slate-500 text-center select-none uppercase pointer-events-none mt-1">
        Tap keys or Swipe anywhere to steer
      </span>
    </div>
  );
}
