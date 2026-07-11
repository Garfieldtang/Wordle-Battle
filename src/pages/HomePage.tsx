import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DifficultySelector } from '../components/DifficultySelector';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { useBattleStore } from '../store/battleStore';
import { Play, BookOpen, User, X, Swords, DoorOpen, Loader2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const startGame = useGameStore((state) => state.startGame);
  const { isAuthenticated, userData, login, logout, loadFromStorage } = useUserStore();
  const { battleState, roomCode, errorMessage, startMatching, joinRoom, cancelMatching } = useBattleStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 匹配成功后跳转到对战页面
  useEffect(() => {
    if (battleState === 'playing') {
      navigate('/battle');
    }
  }, [battleState, navigate]);

  const handleStartPractice = () => {
    startGame(selectedLevel);
    navigate('/practice');
  };

  const handleLogin = () => {
    if (nickname.trim()) {
      login(nickname.trim());
      setShowLoginModal(false);
      setNickname('');
    }
  };

  const handleRandomMatch = () => {
    const myNickname = userData?.nickname || `玩家${Math.floor(Math.random() * 10000)}`;
    startMatching(selectedLevel, myNickname);
  };

  const handleJoinRoom = () => {
    if (roomCodeInput.trim()) {
      const myNickname = userData?.nickname || `玩家${Math.floor(Math.random() * 10000)}`;
      joinRoom(roomCodeInput.trim().toUpperCase(), myNickname);
      setShowRoomModal(false);
      setRoomCodeInput('');
    }
  };

  const handleCancelMatching = () => {
    cancelMatching();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 顶部导航栏 */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Wordle Battle</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>{userData?.nickname}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">
            挑战你的词汇量
          </h2>
          <p className="text-xl text-gray-400 mb-2">
            边玩边学，提升英语能力
          </p>
          <p className="text-gray-500 text-sm">
            猜测单词 · 学习释义 · 收藏生词
          </p>
        </div>

        {/* 难度选择 */}
        <div className="mb-8">
          <DifficultySelector
            selectedLevel={selectedLevel}
            onSelect={setSelectedLevel}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={handleStartPractice}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 rounded-lg hover:bg-green-500 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Play className="w-6 h-6" />
            <span className="text-xl font-bold">开始练习</span>
          </button>

          {/* 对战入口 */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleRandomMatch}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 rounded-lg hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <Swords className="w-5 h-5" />
              <span className="text-lg font-bold">随机匹配对战</span>
            </button>
            <button
              onClick={() => setShowRoomModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <DoorOpen className="w-5 h-5" />
              <span className="text-lg font-bold">房间号对战</span>
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-lg">查看生词本</span>
            </button>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-16 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-white">游戏规则</h3>
          <div className="space-y-3 text-gray-300">
            <p>• 猜测一个隐藏的英文单词，每个字母输入后会显示颜色提示</p>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-6 h-6 bg-[#6aaa64] rounded flex items-center justify-center text-xs font-bold">A</div>
              <span>绿色：字母正确且位置正确</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-6 h-6 bg-[#c9b458] rounded flex items-center justify-center text-xs font-bold">B</div>
              <span>黄色：字母正确但位置错误</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-6 h-6 bg-[#787c7e] rounded flex items-center justify-center text-xs font-bold">C</div>
              <span>灰色：字母不在单词中</span>
            </div>
            <p>• 每局游戏有6次猜测机会</p>
            <p>• 每次猜测必须是一个有效的英语单词，否则不消耗猜测次数</p>
            <p>• 7字母及以上的单词会提供首字母提示</p>
            <p>• 游戏结束后可查看单词释义并收藏到生词本</p>
          </div>
        </div>
      </main>

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-96 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">登录</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">输入昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                  placeholder="请输入你的昵称"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={!nickname.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认登录
              </button>
              <p className="text-xs text-gray-500 text-center">
                登录后可保存战绩和生词本
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 房间号输入弹窗 */}
      {showRoomModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-96 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">房间号对战</h2>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">输入房间号</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinRoom();
                  }}
                  placeholder="请输入房间号"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!roomCodeInput.trim()}
                className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                加入房间
              </button>
              <p className="text-xs text-gray-500 text-center">
                输入对手分享的房间号进行对战
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 匹配中遮罩层 */}
      {battleState === 'matching' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Swords className="w-10 h-10 text-orange-500" />
              <h2 className="text-3xl font-bold text-white">匹配中...</h2>
            </div>
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-gray-400 text-lg">
              正在为你寻找对手（难度等级 {selectedLevel}）
            </p>
            {roomCode && (
              <div className="bg-gray-800 rounded-lg px-6 py-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">房间号（分享给好友）</p>
                <p className="text-3xl font-bold text-orange-500 tracking-widest text-center">
                  {roomCode}
                </p>
              </div>
            )}
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
            <button
              onClick={handleCancelMatching}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-white"
            >
              <X className="w-4 h-4" />
              <span>取消匹配</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
