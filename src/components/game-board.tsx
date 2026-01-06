import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LEVEL_MAP, CELL_SIZE, MOVEMENT_SPEED, ENEMY_SPEED } from '../constants/game-config';
import type { GameStatus, IPlayer, IEnemy, IItem, Direction, IPosition } from '../types/game';
import MazeGrid from './maze-grid';
import GameEntity from './game-entity';
import ItemRenderer from './item-renderer';
import { useGameLoop } from '../hooks/use-game-loop';
import { getInitialItems, getStartPosition, getEnemyStartPositions, getNextPosition, isValidMove, isWall, getBestDirection } from '../utils/game-logic';

interface IPropsForGameBoard {
  playerName: string;
  onGameOver: (score: number) => void;
  onVictory: (score: number) => void;
}

const GameBoard: React.FC<IPropsForGameBoard> = ({ playerName, onGameOver, onVictory }) => {
  // Game State
  const [items, setItems] = useState<IItem[]>(() => getInitialItems());
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [enemyMode, setEnemyMode] = useState<'CHASE' | 'SCATTER'>('CHASE');
  
  // Refs for performance (movement loop)
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const playerState = useRef<IPlayer>({
    position: getStartPosition(),
    direction: 'NONE',
    speed: MOVEMENT_SPEED,
    name: playerName,
    score: 0,
    lives: 3
  });
  
  const nextDirection = useRef<Direction>('NONE');
  
  const getInitialEnemies = useCallback((): IEnemy[] => {
    const enemyPositions = getEnemyStartPositions();
    const colors = ['text-red-500', 'text-pink-500', 'text-cyan-500', 'text-orange-500'];
    return enemyPositions.map((pos, index) => ({
      id: `enemy-${index}`,
      position: { ...pos },
      direction: ['UP', 'DOWN', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 4)] as Direction,
      speed: ENEMY_SPEED,
      color: colors[index % colors.length]
    }));
  }, []);

  const [enemiesList] = useState<IEnemy[]>(getInitialEnemies);
  
  const enemiesState = useRef<IEnemy[]>(getInitialEnemies());

  const updateEntityPosition = (element: HTMLDivElement, position: IPosition) => {
    element.style.transform = `translate(${position.x * CELL_SIZE}px, ${position.y * CELL_SIZE}px)`;
  };

  // Initialize Game Status
  useEffect(() => {
    // Initial render position
    if (playerRef.current) {
      updateEntityPosition(playerRef.current, playerState.current.position);
    }
    enemiesState.current.forEach((enemy, index) => {
      if (enemyRefs.current[index]) {
        updateEntityPosition(enemyRefs.current[index]!, enemy.position);
      }
    });

  }, []);

  // Enemy Mode Timer (Chase / Scatter)
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const switchMode = () => {
      setEnemyMode(prev => prev === 'CHASE' ? 'SCATTER' : 'CHASE');
    };

    // Toggle mode every 20 seconds (Chase) and 7 seconds (Scatter)
    // Simplified: Toggle every 15 seconds for now to ensure they don't get stuck long
    const interval = setInterval(switchMode, 15000);

    return () => clearInterval(interval);
  }, [status]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'PLAYING') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          nextDirection.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          nextDirection.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          nextDirection.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          nextDirection.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  const enemyModeRef = useRef<'CHASE' | 'SCATTER'>('CHASE');
  
  // Sync state with ref for game loop
  useEffect(() => {
    enemyModeRef.current = enemyMode;
  }, [enemyMode]);

  // Game Loop
  const gameLoop = useCallback(() => {
    if (status !== 'PLAYING') return;

    // 1. Update Player
    const player = playerState.current;
    
    // Try to switch to next direction
    if (nextDirection.current !== 'NONE') {
      const p = player.position;
      const tileX = Math.round(p.x);
      const tileY = Math.round(p.y);

      // Determine target tile for the new direction
      let targetX = tileX;
      let targetY = tileY;
      if (nextDirection.current === 'UP') targetY -= 1;
      else if (nextDirection.current === 'DOWN') targetY += 1;
      else if (nextDirection.current === 'LEFT') targetX -= 1;
      else if (nextDirection.current === 'RIGHT') targetX += 1;

      // Check if target is walkable (not a wall)
      // We use isWall from utils which expects float, but integers work too (Math.floor(int) == int)
      // Note: We are checking the specific target tile.
      if (!isWall(targetX, targetY)) {
        // Check alignment
        // If turning VERTICALLY, we must be aligned horizontally (close to tileX)
        // If turning HORIZONTALLY, we must be aligned vertically (close to tileY)
        const isVerticalTurn = nextDirection.current === 'UP' || nextDirection.current === 'DOWN';
        const distFromAxis = isVerticalTurn ? Math.abs(p.x - tileX) : Math.abs(p.y - tileY);
        
        // Allow snap if within tolerance (e.g., 0.4 cells)
        if (distFromAxis < 0.4) {
          // SNAP to axis
          if (isVerticalTurn) player.position.x = tileX;
          else player.position.y = tileY;
          
          player.direction = nextDirection.current;
          nextDirection.current = 'NONE';
        }
      }
    }

    // Move in current direction
    if (player.direction !== 'NONE') {
      // Calculate next position based on speed
      const newPos = getNextPosition(player.position, player.direction, player.speed);
      
      // Additional safety: Wall Slide / Correction
      // If we are moving and hit a wall, we stop.
      // But getNextPosition already handles "stop if hit wall".
      // It returns original position if blocked.
      
      // Let's ensure we are perfectly aligned on the non-moving axis to avoid "drifting" into walls due to float errors?
      // Actually, if we snapped on turn, and only move along one axis, we should stay aligned.
      // But let's force alignment occasionally?
      // No, simple addition is fine.
      
      player.position = newPos;
      if (playerRef.current) {
        updateEntityPosition(playerRef.current, player.position);
      }
    }

    // 2. Update Enemies
    enemiesState.current.forEach((enemy, index) => {
      // Random movement logic (simplified)
      // If hit wall or random chance, change direction
      
      let nextPos = getNextPosition(enemy.position, enemy.direction, enemy.speed);
      
      // If position didn't change (hit wall) or random turn
      const hitWall = nextPos.x === enemy.position.x && nextPos.y === enemy.position.y;
      
      // At intersections, enemies should choose a new valid direction
      // We can check if we are at the center of a tile to make decisions
      const isCentered = Math.abs(enemy.position.x - Math.round(enemy.position.x)) < 0.1 && 
                         Math.abs(enemy.position.y - Math.round(enemy.position.y)) < 0.1;

      // Determine valid directions first to see if we are at an intersection
      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const validDirections = directions.filter(d => isValidMove(enemy.position, d, enemy.speed));

      // Intersection detection:
      // 1. More than 2 paths (T-junction or Cross)
      // 2. OR 2 paths that are NOT straight line (Corner)
      const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      const isIntersection = validDirections.length > 2 || (validDirections.length === 2 && validDirections[0] !== opposite[validDirections[1] as keyof typeof opposite]);

      // Decision time if:
      // 1. Hit a wall
      // 2. Centered AND at an intersection (don't just plow through)
      // 3. Centered AND random chance (spontaneous turn)
      const shouldDecide = hitWall || (isCentered && (isIntersection || Math.random() < 0.05));

      if (shouldDecide) {
        if (validDirections.length > 0) {
          // Prefer not to reverse if possible (unless dead end)
          const forwardDirs = validDirections.filter(d => d !== opposite[enemy.direction as keyof typeof opposite]);
          
          const candidates = forwardDirs.length > 0 ? forwardDirs : validDirections;
          
          const mode = enemyModeRef.current;

          // Target Selection
          let targetX = player.position.x;
          let targetY = player.position.y;

          if (mode === 'SCATTER') {
             // Target corners based on enemy index
             // 4 enemies -> 4 corners
             const corners = [
                 { x: 1, y: 1 }, // Top-Left
                 { x: LEVEL_MAP[0].length - 2, y: 1 }, // Top-Right
                 { x: 1, y: LEVEL_MAP.length - 2 }, // Bottom-Left
                 { x: LEVEL_MAP[0].length - 2, y: LEVEL_MAP.length - 2 } // Bottom-Right
             ];
             const corner = corners[index % 4];
             targetX = corner.x;
             targetY = corner.y;
          }

          // Move Logic: Use BFS for smart pathfinding
          // 95% chance to be smart, 5% random error to feel organic
          if (Math.random() > 0.05) {
             enemy.direction = getBestDirection(
                 enemy.position, 
                 { x: targetX, y: targetY }, 
                 enemy.direction, 
                 candidates
             );
          } else {
             // Random choice
             enemy.direction = candidates[Math.floor(Math.random() * candidates.length)];
          }
        } else {
            // Stuck?
             enemy.direction = 'NONE'; 
        }
      }
      
      // Apply move
      nextPos = getNextPosition(enemy.position, enemy.direction, enemy.speed);
      enemy.position = nextPos;
      
      if (enemyRefs.current[index]) {
        updateEntityPosition(enemyRefs.current[index]!, enemy.position);
      }

      // Check Collision with Player
      // Simple distance check
      const dist = Math.sqrt(
        Math.pow(player.position.x - enemy.position.x, 2) + 
        Math.pow(player.position.y - enemy.position.y, 2)
      );
      
      if (dist < 0.5) {
        // Game Over
        setStatus('GAME_OVER');
        onGameOver(score);
      }
    });

    // 3. Check Item Collection
    // We check against the items state.
    // Optimization: Only check items near player? 
    // Since item count is low (<100), iterating is fine.
    
    let itemsChanged = false;
    const newItems = [...items];
    let scoreToAdd = 0;

    newItems.forEach(item => {
      if (!item.collected) {
        const dist = Math.sqrt(
            Math.pow(player.position.x - item.position.x, 2) + 
            Math.pow(player.position.y - item.position.y, 2)
        );
        if (dist < 0.5) {
          item.collected = true;
          scoreToAdd += item.value;
          itemsChanged = true;
        }
      }
    });

    if (itemsChanged) {
      setItems(newItems);
      setScore(s => s + scoreToAdd);
      
      // Check Victory
      if (newItems.every(i => i.collected)) {
        setStatus('VICTORY');
        onVictory(score + scoreToAdd);
      }
    }

  }, [status, items, score, onGameOver, onVictory]);

  useGameLoop(gameLoop, status === 'PLAYING');

  // Mobile Controls
  const handleMobileControl = (dir: Direction) => {
    nextDirection.current = dir;
  };

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;
      
      const mapWidth = LEVEL_MAP[0].length * CELL_SIZE;
      const mapHeight = LEVEL_MAP.length * CELL_SIZE;
      
      // Reserve space for header (approx 60px) and controls (approx 150px)
      // We always show controls now, so reserve space
      const verticalPadding = 220;
      
      const scaleX = (maxWidth - 40) / mapWidth; // 20px padding each side
      const scaleY = (maxHeight - verticalPadding) / mapHeight;
      
      const newScale = Math.min(scaleX, scaleY, 2.0); // Cap at 2x zoom
      setScale(Math.max(newScale, 0.5)); // Min 0.5x zoom
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900 overflow-hidden">
        {/* HUD */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-8 z-20 text-xl font-bold font-mono">
            <div className="text-hospital-blue">{playerName}</div>
            <div className="text-white">SCORE: {score}</div>
        </div>

        {/* Game Area */}
        <div 
             className="relative bg-slate-800 rounded-lg shadow-2xl border-4 border-slate-700 transition-transform duration-300" 
             style={{ 
               width: LEVEL_MAP[0].length * CELL_SIZE, 
               height: LEVEL_MAP.length * CELL_SIZE,
               transform: `scale(${scale})`
             }}>
            
            <MazeGrid cellSize={CELL_SIZE} />
            
            <ItemRenderer items={items} cellSize={CELL_SIZE} />
            
            <GameEntity 
                ref={playerRef}
                emoji="👩‍⚕️"
                cellSize={CELL_SIZE}
                className="z-20"
            />
            
            {enemiesList.map((enemy, idx) => (
                <GameEntity
                    key={enemy.id}
                    ref={(el) => { enemyRefs.current[idx] = el; }}
                    emoji="🤰🏻"
                    cellSize={CELL_SIZE}
                    className="z-20"
                />
            ))}
        </div>

        {/* Mobile Controls - Always visible now */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-30 pointer-events-none">
             <div className="grid grid-cols-3 gap-2 pointer-events-auto">
                <div></div>
                <button 
                    className="w-16 h-16 bg-blue-600/80 rounded-full text-3xl flex items-center justify-center active:bg-blue-500 shadow-lg border-2 border-blue-400"
                    onTouchStart={(e) => { e.preventDefault(); handleMobileControl('UP'); }}
                    onMouseDown={(e) => { e.preventDefault(); handleMobileControl('UP'); }}
                >⬆️</button>
                <div></div>
                <button 
                    className="w-16 h-16 bg-blue-600/80 rounded-full text-3xl flex items-center justify-center active:bg-blue-500 shadow-lg border-2 border-blue-400"
                    onTouchStart={(e) => { e.preventDefault(); handleMobileControl('LEFT'); }}
                    onMouseDown={(e) => { e.preventDefault(); handleMobileControl('LEFT'); }}
                >⬅️</button>
                <button 
                    className="w-16 h-16 bg-blue-600/80 rounded-full text-3xl flex items-center justify-center active:bg-blue-500 shadow-lg border-2 border-blue-400"
                    onTouchStart={(e) => { e.preventDefault(); handleMobileControl('DOWN'); }}
                    onMouseDown={(e) => { e.preventDefault(); handleMobileControl('DOWN'); }}
                >⬇️</button>
                <button 
                    className="w-16 h-16 bg-blue-600/80 rounded-full text-3xl flex items-center justify-center active:bg-blue-500 shadow-lg border-2 border-blue-400"
                    onTouchStart={(e) => { e.preventDefault(); handleMobileControl('RIGHT'); }}
                    onMouseDown={(e) => { e.preventDefault(); handleMobileControl('RIGHT'); }}
                >➡️</button>
             </div>
        </div>
    </div>
  );
};

export default GameBoard;
