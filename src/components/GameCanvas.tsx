/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Direction, DifficultyLevel, FoodType, FoodItem, Point, Obstacle, Particle, SnakeSkin, GameStats } from '../types';
import { DIFFICULTY_LEVELS, SKINS_CONFIG } from '../configs';
import { snakeAudio } from '../audio';

interface GameCanvasProps {
  isPaused: boolean;
  isPlaying: boolean;
  difficulty: DifficultyLevel;
  skin: SnakeSkin;
  lives: number;
  score: number;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelReached: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onContinueScreen: () => void;
  onStatsUpdate: (stats: Partial<GameStats>) => void;
  onAchievementCheck: (stats: { score: number; length: number; level: number; crystalsInGame: number }) => void;
  triggerResetRef: React.MutableRefObject<(() => void) | null>;
  directionOverrideRef: React.MutableRefObject<((dir: Direction) => void) | null>;
}

// Grid dimensions
const GRID_SIZE = 30;

export default function GameCanvas({
  isPaused,
  isPlaying,
  difficulty,
  skin,
  lives,
  score,
  onScoreChange,
  onLivesChange,
  onLevelReached,
  onGameOver,
  onContinueScreen,
  onStatsUpdate,
  onAchievementCheck,
  triggerResetRef,
  directionOverrideRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core Game State on Refs (to prevent re-render lags)
  const snakeRef = useRef<Point[]>([
    { x: 15, y: 15 },
    { x: 14, y: 15 },
    { x: 13, y: 15 },
  ]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionsRef = useRef<Direction[]>([]);
  const foodItemsRef = useRef<FoodItem[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  
  // Scoring / Game Stats tracked in run
  const runScoreRef = useRef<number>(0);
  const snakeLevelRef = useRef<number>(1);
  const livesRef = useRef<number>(3);
  const totalCrystalsEatenRef = useRef<number>(0);
  
  // Powerups and Effects
  const crystalBoostTimeRef = useRef<number>(0); // remaining miliseconds
  const bonusSpawnTimerRef = useRef<number>(0); // frames/seconds countdown to bonus spawn
  const screenShakeRef = useRef<number>(0); // magnitude
  const flashAnimRef = useRef<number>(0); // translucent overlay alpha
  const invulnerableFramesRef = useRef<number>(0); // invincible after continue
  const particlesRef = useRef<Particle[]>([]);
  
  // Frame cycles
  const lastTickTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Responsive state
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 500, height: 500 });

  // Update refs when props change
  useEffect(() => {
    runScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // Handle Resize
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height, 550);
      setCanvasDimensions({
        width: minDim,
        height: minDim,
      });
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Setup observer for parent size changes
    const observer = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // Set up public triggers
  useEffect(() => {
    triggerResetRef.current = () => {
      resetGame(true);
    };

    directionOverrideRef.current = (newDir: Direction) => {
      changeDirection(newDir);
    };

    return () => {
      triggerResetRef.current = null;
      directionOverrideRef.current = null;
    };
  }, [difficulty]);

  // Initialize Game Loops
  useEffect(() => {
    resetGame(true);
    
    // Start continuous animation rendering
    lastTickTimeRef.current = performance.now();
    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    // Keyboard handlers
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [difficulty, isPlaying, isPaused]);

  // 1. DIRECTION HANDLING with clean input buffering
  function handleKeyDown(e: KeyboardEvent) {
    if (!isPlaying || isPaused) return;

    let keyDir: Direction | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyDir = 'UP';
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyDir = 'DOWN';
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyDir = 'LEFT';
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyDir = 'RIGHT';
        e.preventDefault();
        break;
      case ' ':
        // Spacebar acts as pause handled in Parent React State
        break;
    }

    if (keyDir) {
      changeDirection(keyDir);
    }
  }

  function changeDirection(newDir: Direction) {
    const queue = nextDirectionsRef.current;
    
    // Buffer at most 2 moves to keep snake controls highly crisp without causing instant collisons
    if (queue.length >= 2) return;

    const baseDir = queue.length > 0 ? queue[queue.length - 1] : directionRef.current;

    // Validate 180-degree turns
    if (newDir === 'UP' && baseDir === 'DOWN') return;
    if (newDir === 'DOWN' && baseDir === 'UP') return;
    if (newDir === 'LEFT' && baseDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && baseDir === 'LEFT') return;

    // Buffer sound & queue
    queue.push(newDir);
  }

  // 2. STAGE BUILDERS & STATE RESETS
  function resetGame(fullReset: boolean) {
    // Generate Snake Setup
    snakeRef.current = [
      { x: 15, y: 15 },
      { x: 14, y: 15 },
      { x: 13, y: 15 },
    ];
    directionRef.current = 'RIGHT';
    nextDirectionsRef.current = [];

    // Reset speeds and boosts
    crystalBoostTimeRef.current = 0;
    invulnerableFramesRef.current = 100; // Invincible brief period after spawn
    
    if (fullReset) {
      foodItemsRef.current = [];
      totalCrystalsEatenRef.current = 0;
      generateStaticObstacles();
      spawnFood('apple');
    }
  }

  function generateStaticObstacles() {
    const config = DIFFICULTY_LEVELS[difficulty];
    const obList: Obstacle[] = [];
    
    // Map obstacle coordinates, keeping center zone clean (within 5 units of start (15,15))
    const isSafeZone = (x: number, y: number) => {
      return Math.abs(x - 15) <= 5 && Math.abs(y - 15) <= 5;
    };

    let count = 0;
    let attempts = 0;
    while (count < config.obstacleCount && attempts < 200) {
      attempts++;
      // Random coordinates between 2 and 27
      const x = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      const y = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;

      if (isSafeZone(x, y)) continue;

      // Check duplicate
      const duplicate = obList.some(o => o.x === x && o.y === y);
      if (duplicate) continue;

      // Dynamic traits for higher difficulty levels
      const obstacle: Obstacle = { x, y };

      if (difficulty === 5) {
        // High action moving obstacles!
        obstacle.isMoving = Math.random() > 0.4;
        obstacle.direction = Math.random() > 0.5 ? 1 : -1;
        // Float boundaries
        const rangeLength = Math.floor(Math.random() * 5) + 3;
        const low = Math.max(2, x - rangeLength);
        const high = Math.min(GRID_SIZE - 3, x + rangeLength);
        obstacle.xRange = [low, high];
      }

      obList.push(obstacle);
      count++;
    }

    obstaclesRef.current = obList;
  }

  function spawnFood(type: FoodType) {
    const config = DIFFICULTY_LEVELS[difficulty];
    let attempts = 0;

    while (attempts < 500) {
      attempts++;
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);

      // Collision checks:
      // Inside snake
      const insideSnake = snakeRef.current.some(s => s.x === x && s.y === y);
      if (insideSnake) continue;

      // Inside obstacles
      const insideObstacles = obstaclesRef.current.some(o => o.x === x && o.y === y);
      if (insideObstacles) continue;

      // Inside existing foods
      const insideExistingFoods = foodItemsRef.current.some(f => f.x === x && f.y === y);
      if (insideExistingFoods) continue;

      let color = '#ef4444'; // Red Apple
      let glowColor = 'rgba(239, 68, 68, 0.5)';
      let points = 10;
      let sizeMultiplier = 1.0;
      let duration: number | undefined;

      if (difficulty === 3) sizeMultiplier = 0.8;
      if (difficulty >= 4) sizeMultiplier = 0.7;

      if (type === 'golden') {
        color = '#f59e0b'; // Amber Golden
        glowColor = 'rgba(245, 158, 11, 0.8)';
        points = 50;
        sizeMultiplier *= 1.1;
        duration = 8000; // Lasts 8 seconds
      } else if (type === 'crystal') {
        color = '#06b6d4'; // Cyan Energy Crystal
        glowColor = 'rgba(6, 182, 212, 0.8)';
        points = 30;
        sizeMultiplier *= 0.9;
        duration = 6000; // Lasts 6 seconds
      } else if (type === 'bonus') {
        color = '#d946ef'; // Fuchsia Special Bonus
        glowColor = 'rgba(217, 70, 239, 0.9)';
        points = 100;
        sizeMultiplier *= 1.25;
        duration = 5000; // Lasts 5 seconds
      }

      const id = `${type}-${Math.random()}`;
      
      const newFood: FoodItem = {
        id,
        x,
        y,
        type,
        color,
        glowColor,
        points: points * config.multiplier,
        sizeMultiplier,
        duration,
        maxDuration: duration
      };

      foodItemsRef.current.push(newFood);
      return;
    }
  }

  // Particle explosion builder
  function spawnExplosion(x: number, y: number, color: string, count: number = 15) {
    const cellSize = canvasDimensions.width / GRID_SIZE;
    const px = x * cellSize + cellSize / 2;
    const py = y * cellSize + cellSize / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  }

  // 3. CORE 60FPS GRAPHICS & DISPATCH LOOP
  function renderLoop(timestamp: number) {
    if (!canvasRef.current || !isPlaying) {
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const elapsed = timestamp - lastTickTimeRef.current;
    
    // Physics pacing calculation
    const baseSpeed = DIFFICULTY_LEVELS[difficulty].speed;
    const isBoosted = crystalBoostTimeRef.current > 0;
    // Boost renders snake moving double speed
    const tickInterval = isBoosted ? baseSpeed * 0.55 : baseSpeed;

    if (!isPaused && elapsed >= tickInterval) {
      updatePhysics();
      lastTickTimeRef.current = timestamp;
    }

    // Always update animation frames for particles, glides, fades, obstacles at 60fps
    updateAnimations(isPaused ? 0 : 16.6);
    drawScene();

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);
  }

  // Dynamic moving obstacles or countdown tick timers
  function updateAnimations(deltaTimeMs: number) {
    if (deltaTimeMs === 0) return;

    // 1. Energy crystal timer tick
    if (crystalBoostTimeRef.current > 0) {
      crystalBoostTimeRef.current = Math.max(0, crystalBoostTimeRef.current - deltaTimeMs);
    }

    // 2. Food timers decay
    foodItemsRef.current = foodItemsRef.current.map(f => {
      if (f.duration !== undefined) {
        return { ...f, duration: Math.max(0, f.duration - deltaTimeMs) };
      }
      return f;
    }).filter(f => f.duration === undefined || f.duration > 0);

    // 3. Random Bonus spawning ticks (approx 0.02% chance per frame)
    if (Math.random() < 0.0006 && !foodItemsRef.current.some(f => f.type === 'bonus')) {
      spawnFood('bonus');
    }

    // 4. Update particles
    particlesRef.current = particlesRef.current.map(p => {
      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        alpha: Math.max(0, p.alpha - p.decay),
        vx: p.vx * 0.96, // physics friction
        vy: p.vy * 0.96,
      };
    }).filter(p => p.alpha > 0);

    // 5. Update extreme floating obstacles
    if (difficulty === 5) {
      obstaclesRef.current = obstaclesRef.current.map(o => {
        if (o.isMoving && o.xRange && o.direction) {
          let nextX = o.x + 0.1 * o.direction;
          let nextDir = o.direction;
          
          if (nextX <= o.xRange[0]) {
            nextX = o.xRange[0];
            nextDir = 1;
          } else if (nextX >= o.xRange[1]) {
            nextX = o.xRange[1];
            nextDir = -1;
          }
          return { ...o, x: nextX, direction: nextDir };
        }
        return o;
      });
    }

    // 6. Camera shake decayed
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.5);
    }

    // 7. Flash overlay decaying
    if (flashAnimRef.current > 0) {
      flashAnimRef.current = Math.max(0, flashAnimRef.current - 0.04);
    }

    // 8. Invulnerability ticks
    if (invulnerableFramesRef.current > 0) {
      invulnerableFramesRef.current = Math.max(0, invulnerableFramesRef.current - 1);
    }
  }

  // 4. CORE ENGINE PHYSICS
  function updatePhysics() {
    if (isPaused) return;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };

    // Apply queued direction buffer
    if (nextDirectionsRef.current.length > 0) {
      directionRef.current = nextDirectionsRef.current.shift()!;
    }

    const currentDir = directionRef.current;

    // Advance head coordinates
    switch (currentDir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // CHECK COLLISION COLLIDERS
    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE;
    
    // Self collision
    const hitSelf = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

    // Obstacle collision
    const hitObstacle = obstaclesRef.current.some(o => {
      // Float rounding for moving obstacles in Extreme lvl
      return Math.round(o.x) === head.x && Math.round(o.y) === head.y;
    });

    const isInvincible = invulnerableFramesRef.current > 0;

    if ((hitWall || hitSelf || hitObstacle) && !isInvincible) {
      handleSnakeDeath();
      return;
    }

    // Prepend new head
    snake.unshift(head);

    // Check food consumption
    let ateSomething = false;
    let hitFoodIndex = -1;

    for (let i = 0; i < foodItemsRef.current.length; i++) {
      const f = foodItemsRef.current[i];
      if (f.x === head.x && f.y === head.y) {
        hitFoodIndex = i;
        break;
      }
    }

    if (hitFoodIndex !== -1) {
      const eatenFood = foodItemsRef.current[hitFoodIndex];
      ateSomething = true;
      foodItemsRef.current.splice(hitFoodIndex, 1);

      // Sound design trigger & particle system values
      let growSize = 1;
      let explodeCount = 15;

      if (eatenFood.type === 'apple') {
        snakeAudio.playEatRegular();
        onStatsUpdate({ totalFoodEaten: 1 });
      } else if (eatenFood.type === 'golden') {
        growSize = 3;
        explodeCount = 30;
        snakeAudio.playEatGolden();
        onStatsUpdate({ totalGoldenEaten: 1 });
      } else if (eatenFood.type === 'crystal') {
        growSize = 1;
        explodeCount = 20;
        snakeAudio.playEatCrystal();
        // Trigger temporary speed crystals boost!
        crystalBoostTimeRef.current = 5000; // 5 seconds
        totalCrystalsEatenRef.current += 1;
        onStatsUpdate({ totalCrystalsEaten: 1 });
      } else if (eatenFood.type === 'bonus') {
        growSize = 0; // bonus score only, no size increment!
        explodeCount = 45;
        snakeAudio.playEatGolden(); // majestic golden chime
        onStatsUpdate({ totalBonusEaten: 1 });
      }

      // Grow segments based on food category
      // Head already prepended, so if size grows by 1 we simply do not pop tail.
      // If growSize > 1, replicate the tail end point
      if (growSize > 1) {
        for (let g = 0; g < growSize - 1; g++) {
          snake.push({ ...snake[snake.length - 1] });
        }
      }

      // Launch screen flash + camera shake + particles
      flashAnimRef.current = eatenFood.type === 'bonus' || eatenFood.type === 'golden' ? 0.3 : 0.1;
      screenShakeRef.current = eatenFood.type === 'bonus' ? 7 : 3;
      spawnExplosion(head.x, head.y, eatenFood.color, explodeCount);

      const pointsScored = eatenFood.points;
      const newScore = runScoreRef.current + pointsScored;
      onScoreChange(newScore);

      // Dynamic difficulty leveling up thresholds in single game (keeps speed increasing!)
      const applesMilestone = Math.floor(newScore / 200) + 1;
      if (applesMilestone > snakeLevelRef.current && snakeLevelRef.current < 5) {
        snakeLevelRef.current = applesMilestone;
        onLevelReached(applesMilestone);
        snakeAudio.playLevelUp();
        flashAnimRef.current = 0.6;
        screenShakeRef.current = 10;
      }

      // Setup replacement food if basic Apple was consumed
      if (eatenFood.type === 'apple') {
        spawnFood('apple');
        
        // Dynamic spawn secondary fruit chances
        const roll = Math.random();
        if (roll < 0.12) {
          spawnFood('golden');
        } else if (roll < 0.22) {
          spawnFood('crystal');
        }
      }

      // Dispatch achievements verification values to React Context
      onAchievementCheck({
        score: newScore,
        length: snake.length,
        level: snakeLevelRef.current,
        crystalsInGame: totalCrystalsEatenRef.current
      });

    } else {
      // Just step forwards, drop the tail
      snake.pop();
    }

    snakeRef.current = snake;
  }

  function handleSnakeDeath() {
    snakeAudio.playGameOver();
    screenShakeRef.current = 14;
    flashAnimRef.current = 0.5;

    // Explode entire snake segments beautifully
    const skinConfig = SKINS_CONFIG[skin];
    snakeRef.current.forEach((seg, idx) => {
      spawnExplosion(seg.x, seg.y, idx === 0 ? skinConfig.headColor : skinConfig.bodyColor, 4);
    });

    // Lower life count
    const nextLives = livesRef.current - 1;
    onLivesChange(nextLives);

    if (nextLives > 0) {
      // Continue overlay trigger
      onContinueScreen();
    } else {
      // Final GAME OVER screen
      onGameOver(runScoreRef.current);
    }
  }

  // 5. HTML5 CANVAS DETAILED RENDER ENGINE
  function drawScene() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const cellSize = width / GRID_SIZE;

    // Clear and translate for screen-shaking arcade impact
    ctx.save();
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      ctx.translate(shakeX, shakeY);
    }

    // DRAW DARK GAMING COMPOSITING CANVAS BACKGROUND
    ctx.fillStyle = '#0f172a'; // Slate 900 slate board
    ctx.fillRect(0, 0, width, height);

    // DRAW SPACE HOLOGRAPHIC GRID LINES
    ctx.strokeStyle = '#1e293b'; // Slate 800 subtle
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw secondary neon aesthetic matrix border
    ctx.lineWidth = 3;
    ctx.strokeStyle = DIFFICULTY_LEVELS[difficulty].glowEffect ? '#a855f7' : '#334155'; // Purple glowing extreme boundary
    ctx.strokeRect(0, 0, width, height);

    // DRAW OBSTACLES (futuristic cyber defense squares)
    obstaclesRef.current.forEach((ob) => {
      const ox = ob.x * cellSize;
      const oy = ob.y * cellSize;

      ctx.save();
      // Drop subtle outer red shadow for obstacles
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';

      // Outer block shape
      ctx.fillStyle = '#334155'; // Slate 700
      ctx.fillRect(ox + 1, oy + 1, cellSize - 2, cellSize - 2);

      // Warning hazard stripes fill inside obstacles
      ctx.strokeStyle = '#f43f5e'; // Rose
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ox + 3, oy + cellSize - 3);
      ctx.lineTo(ox + cellSize - 3, oy + 3);
      ctx.stroke();

      ctx.restore();
    });

    // DRAW MULTIPLE FOOD ITEMS (Dynamic Apples, crystals, bonus)
    foodItemsRef.current.forEach((food) => {
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;
      const radius = (cellSize / 2) * food.sizeMultiplier;

      // Pulse scaling factors using actual frame performance millisecond clocks
      const scale = 1 + Math.sin(performance.now() * 0.008) * 0.12;

      ctx.save();
      ctx.shadowBlur = DIFFICULTY_LEVELS[difficulty].glowEffect ? 14 * scale : 8;
      ctx.shadowColor = food.glowColor;

      // Draw specific food visual assets with Canvas vectors
      if (food.type === 'apple' || food.type === 'golden') {
        // Round juicy apple body
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(fx, fy + 1, radius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Little green/yellow leaf anchor
        ctx.strokeStyle = food.type === 'golden' ? '#eab308' : '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy - radius * scale);
        ctx.quadraticCurveTo(fx + radius / 2, fy - radius * 1.5, fx + radius / 1.5, fy - radius * 1.5);
        ctx.stroke();

      } else if (food.type === 'crystal') {
        // High resolution crystalline energy octahedron
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.moveTo(fx, fy - radius * scale);
        ctx.lineTo(fx + radius * scale * 0.8, fy);
        ctx.lineTo(fx, fy + radius * scale);
        ctx.lineTo(fx - radius * scale * 0.8, fy);
        ctx.closePath();
        ctx.fill();

        // Shimmering core highlight
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(fx, fy - radius * scale * 0.8);
        ctx.lineTo(fx + radius * scale * 0.3, fy);
        ctx.lineTo(fx, fy + radius * scale * 0.8);
        ctx.lineTo(fx - radius * scale * 0.3, fy);
        ctx.closePath();
        ctx.fill();

      } else if (food.type === 'bonus') {
        // Holographic shifting orb with orbit halos
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(fx, fy, radius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer overlay arc
        ctx.strokeStyle = '#fdf2f8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(fx, fy, radius * 1.35 * scale, radius * 0.4 * scale, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw visual decay countdown ring for expiring temporary fruits
      if (food.duration !== undefined && food.maxDuration) {
        const pct = food.duration / food.maxDuration;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx, fy, radius * 1.6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2) * pct);
        ctx.stroke();
      }

      ctx.restore();
    });

    // DRAW THE GLOWING SEGMENTED SNAKE
    const snake = snakeRef.current;
    if (snake.length > 0) {
      const skinConfig = SKINS_CONFIG[skin];
      const isCrystalActive = crystalBoostTimeRef.current > 0;

      // OPTIONAL SPEED TRAILS behind tail segment index
      if (isCrystalActive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        
        // Draw trailing ghost snake segments offset by few frames
        for (let i = 2; i < Math.min(snake.length, 12); i += 2) {
          const ghostPos = snake[i];
          ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.beginPath();
          ctx.arc(
            ghostPos.x * cellSize + cellSize / 2, 
            ghostPos.y * cellSize + cellSize / 2, 
            (cellSize / 2) * 0.85, 
            0, 
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.restore();
      }

      // DRAW SNAKE BODY WITH BEAUTIFUL GRADIENTS AND segment interpolation
      ctx.save();
      
      // Select appropriate glowing factors based on skins or higher extreme levels
      const baseGlowLevel = DIFFICULTY_LEVELS[difficulty].glowEffect ? 15 : 6;
      ctx.shadowBlur = isCrystalActive ? 22 : baseGlowLevel;
      ctx.shadowColor = skinConfig.glowColor;

      // Draw body pieces segments
      for (let i = snake.length - 1; i > 0; i--) {
        const segment = snake[i];
        const segX = segment.x * cellSize + cellSize / 2;
        const segY = segment.y * cellSize + cellSize / 2;

        // Visual width decreases slowly towards tail segments
        const ratio = 1 - (i / snake.length) * 0.35;
        const radius = (cellSize / 2) * 0.85 * ratio;

        // Custom segment skin configuration painting:
        let bodyFill: string | CanvasGradient = skinConfig.bodyColor;
        
        if (skinConfig.pattern === 'gradient') {
          // Dynamic gradient calculation along segments
          const grad = ctx.createRadialGradient(segX, segY, 1, segX, segY, radius);
          grad.addColorStop(0, skinConfig.headColor);
          grad.addColorStop(1, skinConfig.bodyColor);
          bodyFill = grad;
        } else if (skinConfig.pattern === 'rainbow') {
          // Frequency shifts
          const hue = (performance.now() * 0.15 + i * 16) % 360;
          bodyFill = `hsl(${hue}, 90%, 55%)`;
        } else if (skinConfig.pattern === 'striped' && i % 2 === 0) {
          bodyFill = '#1e293b'; // Gunmetal stripe inserts
        } else if (skinConfig.pattern === 'crystals') {
          // Sharp blue geometric cuts
          bodyFill = '#0369a1';
        }

        ctx.fillStyle = bodyFill;
        
        // Block shapes vs rounded capsules depending on theme
        if (skinConfig.pattern === 'crystals') {
          // Gem facet polygon shapes!
          ctx.beginPath();
          ctx.moveTo(segX, segY - radius);
          ctx.lineTo(segX + radius, segY - radius * 0.3);
          ctx.lineTo(segX + radius * 0.4, segY + radius);
          ctx.lineTo(segX - radius * 0.8, segY + radius * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(segX, segY, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Segment subtle border lines for crisp high resolution readability
        ctx.strokeStyle = skinConfig.borderColor;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // DRAW HEAD SEGMENT (with eyes looking in direction of speed!)
      const head = snake[0];
      const hx = head.x * cellSize + cellSize / 2;
      const hy = head.y * cellSize + cellSize / 2;
      const hRadius = (cellSize / 2) * 0.95;

      // Head drawing
      ctx.fillStyle = skinConfig.headColor;
      ctx.beginPath();
      ctx.arc(hx, hy, hRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = skinConfig.borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, hRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Invulnerability glowing shell
      if (invulnerableFramesRef.current > 0 && Math.floor(performance.now() / 100) % 2 === 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hx, hy, hRadius * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ANIMATED VISUAL EYES ON HEAD looking into the direction vector
      let eyeOffsetX1 = 0, eyeOffsetY1 = 0;
      let eyeOffsetX2 = 0, eyeOffsetY2 = 0;
      const eyeSpacing = hRadius * 0.38;
      const eyeCenterOffset = hRadius * 0.32;

      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP':
          eyeOffsetX1 = -eyeSpacing; eyeOffsetY1 = -eyeCenterOffset;
          eyeOffsetX2 = eyeSpacing; eyeOffsetY2 = -eyeCenterOffset;
          break;
        case 'DOWN':
          eyeOffsetX1 = -eyeSpacing; eyeOffsetY1 = eyeCenterOffset;
          eyeOffsetX2 = eyeSpacing; eyeOffsetY2 = eyeCenterOffset;
          break;
        case 'LEFT':
          eyeOffsetX1 = -eyeCenterOffset; eyeOffsetY1 = -eyeSpacing;
          eyeOffsetX2 = -eyeCenterOffset; eyeOffsetY2 = eyeSpacing;
          break;
        case 'RIGHT':
          eyeOffsetX1 = eyeCenterOffset; eyeOffsetY1 = -eyeSpacing;
          eyeOffsetX2 = eyeCenterOffset; eyeOffsetY2 = eyeSpacing;
          break;
      }

      // Outer Whites
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + eyeOffsetX1, hy + eyeOffsetY1, hRadius * 0.22, 0, Math.PI * 2);
      ctx.arc(hx + eyeOffsetX2, hy + eyeOffsetY2, hRadius * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Pupils (shining magenta/cyan vector dots)
      ctx.fillStyle = skin === 'classic' ? '#000000' : '#d946ef';
      ctx.beginPath();
      ctx.arc(hx + eyeOffsetX1 * 1.1, hy + eyeOffsetY1 * 1.1, hRadius * 0.1, 0, Math.PI * 2);
      ctx.arc(hx + eyeOffsetX2 * 1.1, hy + eyeOffsetY2 * 1.1, hRadius * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // DRAW THE ACTIVE PARTICLE PHYSICS EXPLOSION SYSTEMS
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // DRAW EAT REWARD OR LEVEL UP SCREEN FLASH TRANSITIONS
    if (flashAnimRef.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAnimRef.current})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex items-center justify-center p-1 md:p-4 select-none focus:outline-none"
      id="game-canvas-container"
    >
      <div 
        className="relative shadow-2xl overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center"
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
        }}
        id="canvas-scaler-wrapper"
      >
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          className="absolute inset-0 select-none block"
          id="classic-canvas-target"
        />

        {/* Temporary Pause Overlay directly over Canvas inside wrapper */}
        {isPaused && (
          <div 
            className="absolute inset-0 bg-slate-900/82 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in text-white"
            id="pause-screen-canvas-overlay"
          >
            <div className="relative p-6 px-10 rounded-2xl border border-slate-700 bg-slate-950/90 text-center shadow-2xl glass-panel">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-cyan-500/10 rounded-full border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-3xl animate-bounce">
                ⏸
              </div>
              <h2 className="text-3xl font-bold font-sans tracking-tight mb-2 text-cyan-400">GAME PAUSED</h2>
              <p className="text-sm text-slate-400 font-sans mb-4">Press ESC or click RESUME to return</p>
              <div className="text-xs text-indigo-400 font-mono tracking-wide px-3 py-1 bg-indigo-500/10 rounded-full inline-block">
                Level {snakeLevelRef.current} • Score multiplier: x{DIFFICULTY_LEVELS[difficulty].multiplier}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
