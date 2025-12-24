import  { forwardRef } from 'react';

interface IPropsForGameEntity {
  emoji: string;
  cellSize: number;
  className?: string;
}

const GameEntity = forwardRef<HTMLDivElement, IPropsForGameEntity>(
  ({ emoji, cellSize, className }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute flex items-center justify-center transition-transform duration-75 ease-linear ${className}`}
        style={{
          width: cellSize,
          height: cellSize,
          fontSize: cellSize * 0.8,
          zIndex: 10,
          top: 0,
          left: 0,
        }}
      >
        {emoji}
      </div>
    );
  }
);

GameEntity.displayName = 'GameEntity';

export default GameEntity;
