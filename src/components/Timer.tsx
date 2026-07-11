import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TimerProps {
  elapsedTime: number;
  timeLimit: number;
  isRunning: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const Timer: React.FC<TimerProps> = ({ elapsedTime, timeLimit, isRunning }) => {
  const remainingTime = timeLimit - elapsedTime;
  const isWarning = remainingTime <= 30;
  const isCritical = remainingTime <= 10;

  return (
    <div className="flex items-center gap-2">
      <div
        className={twMerge(
          clsx(
            'text-3xl font-bold font-mono',
            isCritical ? 'text-red-500 animate-pulse' : isWarning ? 'text-yellow-500' : 'text-white'
          )
        )}
      >
        {formatTime(remainingTime)}
      </div>
      {isRunning && (
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </div>
  );
};