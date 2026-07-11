import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { WordCard } from '../components/WordCard';
import { ArrowLeft, BookOpen, Trophy, BarChart } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { userData, removeWordFromBook, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState<'wordbook' | 'stats'>('wordbook');

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!userData) {
    return null;
  }

  const stats = userData.statistics;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 顶部导航栏 */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold text-white">{userData.nickname}的个人中心</h1>
          <div></div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        {/* 标签切换 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('wordbook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'wordbook'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>生词本 ({userData.wordBook.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart className="w-5 h-5" />
            <span>统计数据</span>
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'wordbook' && (
          <div>
            {userData.wordBook.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>生词本是空的</p>
                <p className="text-sm mt-2">在游戏中收藏单词后会显示在这里</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {userData.wordBook.map((entry) => (
                  <div key={entry.wordId} className="relative">
                    <WordCard word={entry.word} isInBook />
                    <button
                      onClick={() => removeWordFromBook(entry.wordId)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              战绩统计
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.totalBattles}</div>
                <div className="text-gray-400 mt-1">总场次</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.winCount}</div>
                <div className="text-gray-400 mt-1">胜利次数</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.winRate.toFixed(1)}%</div>
                <div className="text-gray-400 mt-1">胜率</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{stats.averageGuesses.toFixed(1)}</div>
                <div className="text-gray-400 mt-1">平均猜测次数</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-pink-400">{stats.wordsLearnedCount}</div>
                <div className="text-gray-400 mt-1">已学单词</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};