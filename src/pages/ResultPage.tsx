import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WordCard } from '../components/WordCard';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { Word } from '../types';
import { ArrowLeft, RotateCcw, Home } from 'lucide-react';

interface ResultState {
  word: Word;
  guesses: string[];
  isWon: boolean;
}

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState;

  const { addWordToBook, userData } = useUserStore();
  const { startGame, difficultyLevel } = useGameStore();

  if (!state) {
    navigate('/');
    return null;
  }

  const { word, guesses, isWon } = state;

  const isInBook = userData?.wordBook.some(entry => entry.wordId === word.id);

  const handlePlayAgain = () => {
    startGame(difficultyLevel);
    navigate('/practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 顶部导航栏 */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">游戏结束</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>主页</span>
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* 结果展示 */}
        <div className="text-center mb-8">
          <div className={`text-6xl mb-4 ${isWon ? 'text-green-500' : 'text-red-500'}`}>
            {isWon ? '🎉' : '😢'}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isWon ? 'text-green-500' : 'text-red-500'}`}>
            {isWon ? '恭喜你猜对了！' : '很遗憾，没有猜对'}
          </h2>
          <p className="text-gray-400">
            猜测次数: {guesses.length}
          </p>
        </div>

        {/* 单词释义卡片 */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">单词释义</h3>
          <WordCard
            word={word}
            onAddToBook={() => addWordToBook(word)}
            isInBook={isInBook}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-500 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>再玩一次</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回主页</span>
          </button>
        </div>
      </main>
    </div>
  );
};