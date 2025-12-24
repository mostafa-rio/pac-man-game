export type GameStatus = 'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface IPosition {
  x: number;
  y: number;
}

export interface IEntity {
  position: IPosition;
  direction: Direction;
  speed: number;
}

export type ItemType = 'PILL' | 'BANDAID' | 'SYRINGE' | 'VACCINE';

export interface IItem {
  id: string;
  type: ItemType;
  position: IPosition;
  value: number;
  collected: boolean;
}

export interface IPlayer extends IEntity {
  name: string;
  score: number;
  lives: number; // Maybe for future use
}

export interface IEnemy extends IEntity {
  id: string;
  color: string;
}

export interface ILevel {
  grid: number[][]; // 0: path, 1: wall
  startPosition: IPosition;
  enemyPositions: IPosition[];
}
