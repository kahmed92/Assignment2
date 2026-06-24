/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyConfig, SkinConfig, Achievement, GameStats } from './types';

export const DIFFICULTY_LEVELS: Record<number, DifficultyConfig> = {
  1: {
    level: 1,
    name: 'Beginner',
    speed: 150, // slow
    multiplier: 1,
    obstacleCount: 0,
    description: 'Slow speed, no obstacles. Perfect for practicing controls.',
    glowEffect: false,
  },
  2: {
    level: 2,
    name: 'Easy',
    speed: 110, // faster
    multiplier: 2,
    obstacleCount: 0,
    description: 'Slightly faster speed. Warm-up arcade tempo.',
    glowEffect: false,
  },
  3: {
    level: 3,
    name: 'Medium',
    speed: 85, // fast, smaller food, some obstacles
    multiplier: 3,
    obstacleCount: 4,
    description: 'Speed picks up! Includes obstacles scattered across the grid.',
    glowEffect: true,
  },
  4: {
    level: 4,
    name: 'Hard',
    speed: 65, // very fast, more obstacles
    multiplier: 5,
    obstacleCount: 8,
    description: 'Very fast reaction times needed, dense obstacle formations.',
    glowEffect: true,
  },
  5: {
    level: 5,
    name: 'Extreme',
    speed: 45, // maximum speed!
    multiplier: 10,
    obstacleCount: 12,
    description: 'Hyper speed! Random moving obstacles and high risk-reward action.',
    glowEffect: true,
  },
};

export const SKINS_CONFIG: Record<string, SkinConfig> = {
  classic: {
    id: 'classic',
    name: 'Emerald Glide',
    headColor: '#22c55e', // Emerald 500
    bodyColor: '#16a34a', // Emerald 600
    borderColor: '#4ade80', // Green 400
    glowColor: 'rgba(34, 197, 94, 0.4)',
    pattern: 'solid',
    description: 'Classic arcade emerald-green skin with lightweight borders.'
  },
  neon: {
    id: 'neon',
    name: 'Plasma Cyber',
    headColor: '#06b6d4', // Cyan 500
    bodyColor: '#3b82f6', // Blue 500
    borderColor: '#a855f7', // Purple 500
    glowColor: 'rgba(6, 182, 212, 0.8)',
    pattern: 'gradient',
    description: 'Electric cyan to deep plasma purple with a radiating energy glow.'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Synth Runner',
    headColor: '#eab308', // Yellow 500
    bodyColor: '#f97316', // Orange 500
    borderColor: '#ec4899', // Pink 500
    glowColor: 'rgba(234, 179, 8, 0.7)',
    pattern: 'striped',
    description: 'Industrial high-contrast warning stripes and cyber tech borders.'
  },
  lava: {
    id: 'lava',
    name: 'Fiery Magma',
    headColor: '#ef4444', // Red 500
    bodyColor: '#b91c1c', // Red 700
    borderColor: '#f97316', // Orange 500
    glowColor: 'rgba(239, 68, 68, 0.8)',
    pattern: 'solid',
    description: 'Molten bedrock with glowing liquid orange warning flares.'
  },
  ice: {
    id: 'ice',
    name: 'Glacial Shard',
    headColor: '#38bdf8', // Sky 400
    bodyColor: '#0284c7', // Sky 600
    borderColor: '#ffffff', // White
    glowColor: 'rgba(56, 189, 248, 0.7)',
    pattern: 'crystals',
    description: 'Beautiful geometric crystalline blue shards with frosted edges.'
  },
  rainbow: {
    id: 'rainbow',
    name: 'Prism Overdrive',
    headColor: '#ec4899', // Pink 500
    bodyColor: '#3b82f6', // Blue 500
    borderColor: '#f43f5e', // Rose 500
    glowColor: 'rgba(236, 72, 153, 0.8)',
    pattern: 'rainbow',
    description: 'A shifting hue-spectrum fluid that cycles across the entire snake.'
  }
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-100',
    title: 'Warm-up Lap',
    description: 'Score 100 points in a single session.',
    targetType: 'score',
    targetValue: 100,
    unlocked: false,
    category: 'gameplay',
  },
  {
    id: 'high-flyer',
    title: 'Apex Predator',
    description: 'Score 500 points in a single session.',
    targetType: 'score',
    targetValue: 500,
    unlocked: false,
    category: 'gameplay',
  },
  {
    id: 'extreme-survival',
    title: 'Extreme Gladiator',
    description: 'Score 1,000 points on Extreme difficulty.',
    targetType: 'score',
    targetValue: 1000,
    unlocked: false,
    category: 'veteran',
  },
  {
    id: 'snake-lord',
    title: 'Leviathan Scale',
    description: 'Grow your snake to a length of 25 blocks.',
    targetType: 'length',
    targetValue: 25,
    unlocked: false,
    category: 'milestone',
  },
  {
    id: 'mighty-behemoth',
    title: 'Colossal Serpent',
    description: 'Grow your snake to a length of 45 blocks.',
    targetType: 'length',
    targetValue: 45,
    unlocked: false,
    category: 'milestone',
  },
  {
    id: 'level-up-master',
    title: 'Extreme Survivor',
    description: 'Reach Level 5 difficulty session.',
    targetType: 'level',
    targetValue: 5,
    unlocked: false,
    category: 'veteran',
  },
  {
    id: 'session-veteran',
    title: 'Dedicated Arcade Cadet',
    description: 'Play 15 games in total.',
    targetType: 'games',
    targetValue: 15,
    unlocked: false,
    category: 'veteran',
  },
  {
    id: 'crystal-energy',
    title: 'Warp Speed Collector',
    description: 'Eat 5 energy crystals in a single run.',
    targetType: 'crystals',
    targetValue: 5,
    unlocked: false,
    category: 'gameplay',
  },
];

export const INITIAL_STATS: GameStats = {
  gamesPlayed: 0,
  totalScore: 0,
  highestScore: 0,
  totalFoodEaten: 0,
  totalGoldenEaten: 0,
  totalCrystalsEaten: 0,
  totalBonusEaten: 0,
  timePlayedSec: 0,
  highestLevelReached: 1,
};
