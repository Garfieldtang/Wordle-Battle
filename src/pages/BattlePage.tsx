import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../store/battleStore';
import { useUserStore } from '../store/userStore';
import { WordGrid } from '../components/WordGrid';
import { Keyboard } from '../components/Keyboard';
import { ArrowLeft, Swords, Trophy, Loader2, Users, Zap, CheckCircle2 } from 'lucide-react';

export const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUserStore();
  const {
    battleState,
    roomCode,
    opponent,
    difficultyLevel,
    words,
    sharedFirstGuesses,
    currentWordIndex,
    myScore,
    opponentScore,
    myGuesses,
    opponentGuessCount,
    myGrid,
    opponentFinished,
    opponentWon,
    opponentAllDone,
    isGameOver,
    finalResult,
    currentGuess,
    isShaking,
    invalidMessage,
    isWordWon,
    myFinished,
    opponentWordIndex,
    errorMessage,
    addLetter,
    removeLetter,
    submitGuess,
    clearShake,
    clearWordWon,
    resetBattle,
    disconnectSocket
  } = useBattleStore();

  // 不在组件卸载时自动断开 Socket（React StrictMode 会双重挂载导致误断开）
  // Socket 只在用户主动退出（handleBackHome）或浏览器关闭时断开

  // 摇动动画结束后清除状态
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => {
        clearShake();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isShaking, clearShake]);

  // 猜对单词后，2秒后自动进入下一个单词
  useEffect(() => {
    if (isWordWon) {
      const timer = setTimeout(() => {
        clearWordWon();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isWordWon, clearWordWon]);

  // 计算已使用的字母状态
  const usedLetters: Record<string, 'correct' | 'present' | 'absent'> = {};
  myGrid.forEach(row => {
    row.forEach(cell => {
      if (cell.letter) {
        const letter = cell.letter.toLowerCase();
        if (cell.status === 'correct') {
          usedLetters[letter] = 'correct';
        } else if (cell.status === 'present' && usedLetters[letter] !== 'correct') {
          usedLetters[letter] = 'present';
        } else if (cell.status === 'absent' && !usedLetters[letter]) {
          usedLetters[letter] = 'absent';
        }
      }
    });
  });

  // 键盘事件监听
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (battleState !== 'playing' || isGameOver || myFinished || isWordWon) return;

    const key = event.key.toUpperCase();
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }, [battleState, isGameOver, myFinished, isWordWon, submitGuess, removeLetter, addLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 当前单词信息
  const currentWordLength = words[currentWordIndex]?.length || 5;
  const currentFirstGuess = sharedFirstGuesses[currentWordIndex] || '';
  const isFirstLetterHint = currentWordLength >= 7;
  const firstLetterHint = isFirstLetterHint
    ? currentFirstGuess[0]
    : undefined;

  // 对手进度简化格子
  const opponentGridCells = Array.from({ length: 6 }, (_, i) => {
    if (i < opponentGuessCount) {
      return { filled: true };
    }
    return { filled: false };
  });

  const handleBackHome = () => {
    resetBattle();
    navigate('/');
  };

  // 匹配中状态
  if (battleState === 'matching') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Swords className="w-10 h-10 text-orange-500" />
            <h1 className="text-3xl font-bold">匹配中...</h1>
          </div>
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-gray-400 text-lg">
            正在为你寻找对手（难度等级 {difficultyLevel}）
          </p>
          {roomCode && (
            <div className="bg-gray-800 rounded-lg px-6 py-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">房间号</p>
              <p className="text-2xl font-bold text-orange-500 tracking-widest">{roomCode}</p>
            </div>
          )}
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
          <button
            onClick={() => handleBackHome()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>取消匹配</span>
          </button>
        </div>
      </div>
    );
  }

  // 空闲状态
  if (battleState === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Swords className="w-12 h-12 text-gray-500" />
          <p className="text-gray-400 text-lg">尚未开始对战</p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主页</span>
          </button>
        </div>
      </div>
    );
  }

  // 游戏结束状态
  if (battleState === 'finished' && finalResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-6">
            <Trophy className={`w-16 h-16 ${finalResult.won ? 'text-yellow-500' : 'text-gray-500'}`} />
            <h1 className={`text-4xl font-bold ${finalResult.won ? 'text-yellow-500' : 'text-gray-400'}`}>
              {finalResult.won ? '胜利！' : '失败'}
            </h1>
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-400">{userData?.nickname || '我'}</p>
                <p className="text-5xl font-bold text-green-500">{finalResult.myScore}</p>
              </div>
              <span className="text-2xl text-gray-600">VS</span>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-gray-400">{opponent?.nickname || '对手'}</p>
                <p className="text-5xl font-bold text-red-500">{finalResult.opponentScore}</p>
              </div>
            </div>
            <button
              onClick={() => handleBackHome()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-bold"
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 对战进行中
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* 顶部栏 */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 py-3 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={() => handleBackHome()}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">退出对战</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>房间号: {roomCode}</span>
          </div>
        </div>
      </nav>

      {/* 分数面板 */}
      <div className="max-w-5xl mx-auto w-full px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* 我的分数 */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 border border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">玩家</p>
                <p className="text-lg font-bold text-green-500">
                  {userData?.nickname || '我'}
                </p>
              </div>
              <div className="text-3xl font-bold text-green-500">{myScore}</div>
            </div>
          </div>

          {/* 单词进度 */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400">单词进度</p>
            <div className="flex gap-2">
              {words.map((_, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                    index === currentWordIndex
                      ? 'bg-orange-600 text-white'
                      : index < currentWordIndex
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {currentWordIndex + 1} / {words.length}
            </p>
          </div>

          {/* 对手分数 */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 border border-red-700">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-500">{opponentScore}</div>
              <div className="text-right">
                <p className="text-xs text-gray-400">对手</p>
                <p className="text-lg font-bold text-red-500">
                  {opponent?.nickname || '对手'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第3个单词得分翻倍标记 */}
      {currentWordIndex === 2 && (
        <div className="max-w-5xl mx-auto w-full px-6">
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg py-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-bold text-yellow-300">本单词得分翻倍</span>
            <Zap className="w-4 h-4 text-yellow-300" />
          </div>
        </div>
      )}

      {/* 主游戏区域 */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
        {/* 猜对单词庆祝特效 */}
        {isWordWon && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="flex flex-col items-center gap-4 animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-green-500 drop-shadow-lg" />
              <p className="text-3xl font-bold text-green-500 drop-shadow-lg">猜对了！</p>
            </div>
          </div>
        )}

        {/* 无效单词提示 */}
        {invalidMessage && (
          <div className="text-red-500 text-sm animate-pulse">
            {invalidMessage}
          </div>
        )}

        <div className="flex gap-8 items-start max-w-5xl w-full px-6 justify-center">
          {/* 左侧：我的猜词格子 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-400">我的猜测</p>
            <div className="text-gray-400 text-xs mb-1">
              猜测一个 {currentWordLength} 个字母的单词
              {isFirstLetterHint && (
                <span className="ml-2 text-yellow-500">
                  （首字母提示: {firstLetterHint?.toUpperCase()}）
                </span>
              )}
            </div>
            <WordGrid
              grid={myGrid}
              currentGuess={currentGuess}
              currentRow={myGuesses.length}
              isShaking={isShaking}
              wordLength={currentWordLength}
              firstLetterHint={firstLetterHint}
            />
            {myFinished && !isGameOver && (
              <p className="text-yellow-500 text-sm mt-2 animate-pulse">
                已完成所有单词，等待对手...
              </p>
            )}
          </div>

          {/* 右侧：对手进度面板 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-400">对手进度</p>
            <div className={`bg-gray-800 rounded-lg p-4 border w-48 ${
              opponentAllDone ? 'border-yellow-600' : 'border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{opponent?.nickname || '对手'}</span>
                <span className="text-xs text-gray-500">
                  单词 {opponentWordIndex + 1}/{words.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-gray-500 mb-1">猜测次数: {opponentGuessCount}/6</p>
                {opponentGridCells.map((cell, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded flex items-center justify-center text-xs font-bold ${
                      cell.filled
                        ? opponentWon && i === opponentGuessCount - 1
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-600 text-white'
                        : 'bg-gray-700/50 text-gray-600'
                    }`}
                  >
                    {cell.filled ? `第${i + 1}次` : ''}
                  </div>
                ))}
              </div>
              {opponentWon && !opponentAllDone && (
                <p className="text-green-500 text-xs mt-2 text-center font-bold">
                  对手猜对了本单词！
                </p>
              )}
              {opponentFinished && !opponentWon && !opponentAllDone && (
                <p className="text-yellow-500 text-xs mt-2 text-center">
                  对手已完成本单词
                </p>
              )}
              {opponentAllDone && (
                <p className="text-yellow-500 text-xs mt-2 text-center font-bold animate-pulse">
                  对手已完成所有单词！
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 键盘 */}
        <Keyboard
          onKeyPress={addLetter}
          onEnter={submitGuess}
          onBackspace={removeLetter}
          usedLetters={usedLetters}
        />
      </main>
    </div>
  );
};
