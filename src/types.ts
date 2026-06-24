/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'CONTINUE_SCREEN'
  | 'GAMEOVER'
  | 'SETTINGS'
  | 'ACHIEVEMENTS'
  | 'STATS';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  speed: number; // Base speed MS (lower is faster)
  multiplier: number;
  obstacleCount: number;
  description: string;
  glowEffect: boolean;
}

export type FoodType = 'apple' | 'golden' | 'crystal' | 'bonus';

export interface FoodItem {
  x: number;
  y: number;
  type: FoodType;
  color: string;
  glowColor: string;
  points: number;
  sizeMultiplier: number; // For drawing smaller/bigger foods
  duration?: number; // Visual timer for bonus/crystals
  maxDuration?: number;
  id: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
  xRange?: [number, number]; // For moving obstacles at higher difficulties!
  direction?: 1 | -1;
  isMoving?: boolean;
}

export type SnakeSkin = 'classic' | 'neon' | 'cyberpunk' | 'lava' | 'ice' | 'rainbow';

export interface SkinConfig {
  id: SnakeSkin;
  name: string;
  headColor: string;
  bodyColor: string;
  glowColor: string;
  borderColor: string;
  pattern: 'solid' | 'gradient' | 'striped' | 'crystals' | 'rainbow';
  description: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  targetType: 'score' | 'length' | 'level' | 'games' | 'crystals' | 'lives';
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'gameplay' | 'milestone' | 'veteran';
}

export interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  highestScore: number;
  totalFoodEaten: number;
  totalGoldenEaten: number;
  totalCrystalsEaten: number;
  totalBonusEaten: number;
  timePlayedSec: number;
  highestLevelReached: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
