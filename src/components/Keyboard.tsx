import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  usedLetters: Record<string, 'correct' | 'present' | 'absent'>;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const getKeyColor = (key: string, usedLetters: Record<string, 'correct' | 'present' | 'absent'>): string => {
  const status = usedLetters[key.toLowerCase()];
  switch (status) {
    case 'correct':
      return 'bg-[#6aaa64] text-white hover:bg-[#5a9a54]';
    case 'present':
      return 'bg-[#c9b458] text-white hover:bg-[#b9a448]';
    case 'absent':
      return 'bg-[#787c7e] text-white hover:bg-[#686c6e]';
    default:
      return 'bg-gray-600 text-white hover:bg-gray-500';
  }
};

export const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  onEnter,
  onBackspace,
  usedLetters
}) => {
  const handleKeyClick = (key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === '⌫') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center justify-center w-full max-w-lg">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center w-full">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              className={twMerge(
                clsx(
                  'h-12 rounded-md font-bold transition-all duration-150 active:scale-95',
                  key === 'ENTER' || key === '⌫' ? 'px-3 text-sm' : 'w-8 text-base',
                  getKeyColor(key, usedLetters)
                )
              )}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};