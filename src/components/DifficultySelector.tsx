import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Crown } from 'lucide-react';

interface DifficultySelectorProps {
  selectedLevel: number;
  onSelect: (level: number) => void;
}

const DIFFICULTY_LEVELS = [
  { level: 1, name: '青铜', color: 'from-amber-600 to-amber-800', desc: '初学者' },
  { level: 2, name: '白银', color: 'from-gray-400 to-gray-600', desc: '初高中' },
  { level: 3, name: '黄金', color: 'from-yellow-500 to-yellow-700', desc: '四六级' },
  { level: 4, name: '钛金', color: 'from-purple-600 to-purple-800', desc: '专八/GRE' },
  { level: 5, name: '王者', color: 'from-blue-500 to-blue-700', desc: '无限制', icon: Crown }
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedLevel,
  onSelect
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center text-white">选择难度等级</h2>
      <div className="grid grid-cols-5 gap-3">
        {DIFFICULTY_LEVELS.map((item) => (
          <button
            key={item.level}
            onClick={() => onSelect(item.level)}
            className={twMerge(
              clsx(
                'relative p-4 rounded-lg bg-gradient-to-b transition-all duration-200',
                item.color,
                selectedLevel === item.level
                  ? 'ring-4 ring-white ring-opacity-50 scale-105 shadow-lg'
                  : 'opacity-70 hover:opacity-100 hover:scale-102',
                'flex flex-col items-center justify-center gap-1 min-h-[80px]'
              )
            )}
          >
            {item.icon && <item.icon className="w-5 h-5 text-yellow-400" />}
            <div className="text-lg font-bold text-white">{item.name}</div>
            <div className="text-xs text-white opacity-80">{item.desc}</div>
            <div className="absolute top-2 right-2 text-lg font-bold text-white opacity-60">
              {item.level}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};