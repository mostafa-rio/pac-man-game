import React from 'react';
import { LEVEL_MAP, COLORS } from '../constants/game-config';

interface IPropsForMazeGrid {
  cellSize: number;
}

const MazeGrid: React.FC<IPropsForMazeGrid> = ({ cellSize }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: LEVEL_MAP[0].length * cellSize,
        height: LEVEL_MAP.length * cellSize,
      }}
    >
      {LEVEL_MAP.map((row, y) =>
        row.map((cell, x) => {
          if (cell === 1) {
            return (
              <div
                key={`${x}-${y}`}
                className={`absolute ${COLORS.WALL} border border-slate-800 rounded-sm`}
                style={{
                  left: x * cellSize,
                  top: y * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              />
            );
          }
          return null;
        })
      )}
    </div>
  );
};

export default MazeGrid;
