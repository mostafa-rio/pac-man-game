import { LEVEL_MAP, ENEMY_COUNT } from '../constants/game-config';
import type { IPosition, Direction, IItem, ItemType } from '../types/game';

export const isWall = (x: number, y: number): boolean => {
  const mapY = Math.floor(y);
  const mapX = Math.floor(x);
  
  if (mapY < 0 || mapY >= LEVEL_MAP.length || mapX < 0 || mapX >= LEVEL_MAP[0].length) {
    return true;
  }
  
  return LEVEL_MAP[mapY][mapX] === 1;
};

// Check if a move is valid (simple circle/box collision against grid walls)
// For simplicity, we treat entities as points or small circles at the center of the tile
export const isValidMove = (position: IPosition, direction: Direction, speed: number): boolean => {
  let newX = position.x;
  let newY = position.y;

  if (direction === 'UP') newY -= speed;
  if (direction === 'DOWN') newY += speed;
  if (direction === 'LEFT') newX -= speed;
  if (direction === 'RIGHT') newX += speed;

  // Check collision with walls. 
  // We check the corners of the entity's bounding box.
  // Assuming entity size is slightly smaller than 1.0 (tile size)
  const margin = 0.1; // tolerance
  const size = 0.8; // entity size relative to tile

  // Top-Left
  if (isWall(newX + margin, newY + margin)) return false;
  // Top-Right
  if (isWall(newX + size - margin, newY + margin)) return false;
  // Bottom-Left
  if (isWall(newX + margin, newY + size - margin)) return false;
  // Bottom-Right
  if (isWall(newX + size - margin, newY + size - margin)) return false;

  return true;
};

// More robust collision detection that returns the corrected position or allows sliding
export const getNextPosition = (position: IPosition, direction: Direction, speed: number): IPosition => {
  let newX = position.x;
  let newY = position.y;

  if (direction === 'UP') newY -= speed;
  else if (direction === 'DOWN') newY += speed;
  else if (direction === 'LEFT') newX -= speed;
  else if (direction === 'RIGHT') newX += speed;
  else return position;

  // We use a small epsilon to avoid getting stuck on edges
  const hitboxSize = 0.7;
  const offset = (1 - hitboxSize) / 2;
  
  const minX = newX + offset;
  const maxX = newX + 1 - offset;
  const minY = newY + offset;
  const maxY = newY + 1 - offset;

  const pointsToCheck = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
  ];

  for (const p of pointsToCheck) {
    if (isWall(p.x, p.y)) {
      // Collision detected, return original position (stop)
      return position;
    }
  }

  return { x: newX, y: newY };
};

export const getInitialItems = (): IItem[] => {
  const items: IItem[] = [];
  const itemTypes: ItemType[] = ['PILL', 'BANDAID', 'SYRINGE', 'VACCINE'];
  
  let idCounter = 0;

  LEVEL_MAP.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 0) {
        // Chance to spawn item
        // Ensure not too cluttered.
        // For pacman, usually every dot is an item.
        // Let's put pills everywhere (value 10) and others sparsely.
        
        // Skip spawn points if defined (2 and 3)
        // Actually cell 0 is path.
        
        // Let's verify we are not near spawn? 
        // For now, put items on all 0s.
        
        const isSpecial = Math.random() < 0.1;
        const type = isSpecial ? itemTypes[Math.floor(Math.random() * (itemTypes.length - 1)) + 1] : 'PILL';
        const value = type === 'PILL' ? 10 : (type === 'BANDAID' ? 50 : (type === 'SYRINGE' ? 100 : 200));

        items.push({
          id: `item-${idCounter++}`,
          type,
          position: { x, y },
          value,
          collected: false,
        });
      }
    });
  });

  return items;
};

export const getStartPosition = (): IPosition => {
  for (let y = 0; y < LEVEL_MAP.length; y++) {
    for (let x = 0; x < LEVEL_MAP[y].length; x++) {
      if (LEVEL_MAP[y][x] === 3) {
        return { x, y };
      }
    }
  }
  return { x: 1, y: 1 }; // Fallback
};

export const getEnemyStartPositions = (): IPosition[] => {
  const spawnPoints: IPosition[] = [];
  for (let y = 0; y < LEVEL_MAP.length; y++) {
    for (let x = 0; x < LEVEL_MAP[y].length; x++) {
      if (LEVEL_MAP[y][x] === 2) {
        spawnPoints.push({ x, y });
      }
    }
  }

  if (spawnPoints.length === 0) return [{x: 10, y: 10}]; // Fallback

  const positions: IPosition[] = [];
  for (let i = 0; i < ENEMY_COUNT; i++) {
    // Cycle through spawn points if we need more enemies than points
    positions.push({ ...spawnPoints[i % spawnPoints.length] });
  }
  
  return positions;
};
