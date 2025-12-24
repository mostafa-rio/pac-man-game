import React from 'react';
import type { IItem } from '../types/game';

interface IPropsForItemRenderer {
  items: IItem[];
  cellSize: number;
}

const ItemRenderer: React.FC<IPropsForItemRenderer> = ({ items, cellSize }) => {
  const getItemEmoji = (type: string) => {
    switch (type) {
      case 'PILL': return '💊';
      case 'BANDAID': return '🩹';
      case 'SYRINGE': return '💉';
      case 'VACCINE': return '🩸';
      default: return '•';
    }
  };

  return (
    <>
      {items.map((item) => {
        if (item.collected) return null;
        return (
          <div
            key={item.id}
            className="absolute flex items-center justify-center animate-pulse"
            style={{
              left: item.position.x * cellSize,
              top: item.position.y * cellSize,
              width: cellSize,
              height: cellSize,
              fontSize: cellSize * 0.6,
              zIndex: 5,
            }}
          >
            {getItemEmoji(item.type)}
          </div>
        );
      })}
    </>
  );
};

export default ItemRenderer;
