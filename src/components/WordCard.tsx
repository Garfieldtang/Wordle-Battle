import React from 'react';
import { Word } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BookOpen, Plus } from 'lucide-react';

interface WordCardProps {
  word: Word;
  onAddToBook?: () => void;
  isInBook?: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ word, onAddToBook, isInBook }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-white">{word.word}</div>
          <div className="text-lg text-gray-400">({word.chinese_meaning})</div>
        </div>
        {onAddToBook && (
          <button
            onClick={onAddToBook}
            disabled={isInBook}
            className={twMerge(
              clsx(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                isInBook
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
              )
            )}
          >
            {isInBook ? <BookOpen className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="text-sm">{isInBook ? '已收藏' : '加入生词本'}</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <span className="text-gray-400 font-medium">释义:</span>
          <span className="text-gray-200">{word.definition}</span>
        </div>

        <div className="flex gap-2">
          <span className="text-gray-400 font-medium">例句:</span>
          <span className="text-gray-200 italic">{word.example_sentence}</span>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-gray-400 font-medium">难度:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={twMerge(
                  clsx(
                    'w-3 h-3 rounded-full',
                    i < word.difficulty_level ? 'bg-yellow-500' : 'bg-gray-600'
                  )
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};