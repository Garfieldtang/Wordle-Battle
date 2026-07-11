import React from 'react';
import { GridCell } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface WordGridProps {
  grid: GridCell[][];
  currentGuess: string;
  currentRow: number;
  isShaking: boolean;
  wordLength: number;
  firstLetterHint?: string; // 7+字母单词的首字母提示
}

const getCellColor = (status: string): string => {
  switch (status) {
    case 'correct':
      return 'bg-[#6aaa64] text-white border-[#6aaa64]';
    case 'present':
      return 'bg-[#c9b458] text-white border-[#c9b458]';
    case 'absent':
      return 'bg-[#787c7e] text-white border-[#787c7e]';
    default:
      return 'bg-transparent text-gray-200 border-gray-600';
  }
};

export const WordGrid: React.FC<WordGridProps> = ({
  grid,
  currentGuess,
  currentRow,
  isShaking,
  wordLength,
  firstLetterHint
}) => {
  const showFirstLetterHint = wordLength >= 7 && firstLetterHint;

  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      {grid.map((row, rowIndex) => {
        const isCurrentRow = rowIndex === currentRow;
        const isShakingRow = isCurrentRow && isShaking;

        return (
          <div
            key={rowIndex}
            className={twMerge(
              clsx(
                'flex gap-2 transition-transform',
                isShakingRow && 'animate-shake'
              )
            )}
          >
            {row.map((cell, cellIndex) => {
              let displayLetter = cell.letter;
              let cellStatus = cell.letter ? cell.status : 'empty';

              // 当前行未填入的字母
              if (isCurrentRow && !cell.letter) {
                const currentLetter = currentGuess[cellIndex]?.toUpperCase() || '';
                if (currentLetter) {
                  displayLetter = currentLetter;
                } else if (showFirstLetterHint && cellIndex === 0) {
                  // 7+字母单词首字母提示
                  displayLetter = firstLetterHint!.toUpperCase();
                  cellStatus = 'pending';
                }
              }

              return (
                <div
                  key={cellIndex}
                  className={twMerge(
                    clsx(
                      'w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold transition-all duration-300',
                      getCellColor(cellStatus),
                      cell.letter && 'animate-flip'
                    )
                  )}
                >
                  {displayLetter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
