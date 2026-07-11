import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { WordGrid } from '../components/WordGrid';
import { Keyboard } from '../components/Keyboard';
import { ArrowLeft } from 'lucide-react';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    grid,
    currentGuess,
    guesses,
    currentWord,
    isGameOver,
    isWon,
    isPlaying,
    isShaking,
    invalidMessage,
    submitGuess,
    addLetter,
    removeLetter,
    clearShake
  } = useGameStore();

  // 计算已使用的字母状态
  const usedLetters: Record<string, 'correct' | 'present' | 'absent'> = {};
  grid.forEach(row => {
    row.forEach(cell => {
      if (cell.letter) {
        const letter = cell.letter.toLowerCase();
        if (cell.status === 'correct') {
          usedLetters[cell.letter.toLowerCase()] = 'correct';
        } else if (cell.status === 'present' && usedLetters[letter] !== 'correct') {
          usedLetters[cell.letter.toLowerCase()] = 'present';
        } else if (cell.status === 'absent' && !usedLetters[letter]) {
          usedLetters[cell.letter.toLowerCase()] = 'absent';
        }
      }
    });
  });

  // 摇动动画结束后清除状态
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => {
        clearShake();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isShaking, clearShake]);

  // 键盘事件监听
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (isGameOver) return;

    const key = event.key.toUpperCase();

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }, [isGameOver, submitGuess, removeLetter, addLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 游戏结束后跳转
  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => {
        navigate('/result', {
          state: {
            word: currentWord,
            guesses,
            isWon
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, currentWord, guesses, isWon, navigate]);

  // 7+字母单词的首字母提示
  const firstLetterHint = currentWord.word.length >= 7
    ? currentWord.word[0]
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* 顶部栏 */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回主页</span>
          </button>
          <div className="text-gray-400 text-sm">
            第 {guesses.length + 1} / 6 次猜测
          </div>
        </div>
      </nav>

      {/* 游戏区域 */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        {/* 单词长度提示 */}
        <div className="text-gray-400 text-sm">
          猜测一个 {currentWord.word.length} 个字母的单词
          {firstLetterHint && (
            <span className="ml-2 text-yellow-500">
              （首字母提示: {firstLetterHint.toUpperCase()}）
            </span>
          )}
        </div>

        {/* 无效单词提示 */}
        {invalidMessage && (
          <div className="text-red-500 text-sm animate-pulse">
            {invalidMessage}
          </div>
        )}

        {/* 猜词格子 */}
        <WordGrid
          grid={grid}
          currentGuess={currentGuess}
          currentRow={guesses.length}
          isShaking={isShaking}
          wordLength={currentWord.word.length}
          firstLetterHint={firstLetterHint}
        />

        {/* 键盘 */}
        <Keyboard
          onKeyPress={addLetter}
          onEnter={submitGuess}
          onBackspace={removeLetter}
          usedLetters={usedLetters}
        />
      </main>

      {/* 游戏结束提示 */}
      {isGameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className={`text-3xl font-bold mb-4 ${isWon ? 'text-green-500' : 'text-red-500'}`}>
              {isWon ? '恭喜你猜对了！' : '次数用完了'}
            </h2>
            <p className="text-gray-400">正在跳转到结果页面...</p>
          </div>
        </div>
      )}
    </div>
  );
};
