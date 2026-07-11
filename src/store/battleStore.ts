import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GridCell, LetterStatus } from '../types';
import { isValidWord } from '../utils/wordValidator';

// 开发环境用 localhost:3001，生产环境用同源（由 nginx 反代）
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';
const MAX_GUESSES = 6;

// 计分规则：1次猜对=10分，2次=8分，3次=6分，4次=4分，5次=2分，6次=1分，未猜对=0分
const SCORE_MAP = [10, 8, 6, 4, 2, 1];

const getScoreForGuesses = (guessCount: number): number => {
  if (guessCount >= 1 && guessCount <= 6) return SCORE_MAP[guessCount - 1];
  return 0;
};

// 检查猜测并返回字母状态
const checkGuess = (guess: string, targetWord: string): LetterStatus[] => {
  const result: LetterStatus[] = [];
  const targetLetters = targetWord.toLowerCase().split('');
  const guessLetters = guess.toLowerCase().split('');
  const targetLetterCount: Record<string, number> = {};

  targetLetters.forEach(letter => {
    targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
  });

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetterCount[guessLetters[i]]--;
    } else {
      result[i] = 'absent';
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i] === 'absent' && targetLetterCount[guessLetters[i]] > 0) {
      result[i] = 'present';
      targetLetterCount[guessLetters[i]]--;
    }
  }

  return result;
};

// 创建空格子网格
const createEmptyGrid = (wordLength: number): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    const row: GridCell[] = [];
    for (let j = 0; j < wordLength; j++) {
      row.push({ letter: '', status: 'empty' });
    }
    grid.push(row);
  }
  return grid;
};

// 预填共享首猜到网格第一行
const prefilledGridWithFirstGuess = (
  wordLength: number,
  firstGuess: string,
  targetWord: string
): { grid: GridCell[][]; statuses: LetterStatus[] } => {
  const grid = createEmptyGrid(wordLength);
  const statuses = checkGuess(firstGuess, targetWord);
  grid[0] = firstGuess.split('').map((letter) => ({
    letter: letter.toUpperCase(),
    status: statuses[letter ? 0 : 0] || 'absent'
  }));
  // 正确设置每个字母的状态
  grid[0] = firstGuess.split('').map((letter, j) => ({
    letter: letter.toUpperCase(),
    status: statuses[j]
  }));
  return { grid, statuses };
};

type BattleStateStatus = 'idle' | 'matching' | 'playing' | 'finished';

interface FinalResult {
  myScore: number;
  opponentScore: number;
  won: boolean;
}

interface OpponentInfo {
  nickname: string;
}

interface BattleStore {
  // 对战状态
  battleState: BattleStateStatus;
  roomCode: string | null;
  opponent: OpponentInfo | null;
  difficultyLevel: number;
  words: Array<{ length: number }>;
  sharedFirstGuesses: string[];
  currentWordIndex: number;
  myScore: number;
  opponentScore: number;
  myGuesses: string[];
  opponentGuessCount: number;
  myGrid: GridCell[][];
  opponentFinished: boolean;
  opponentWon: boolean;
  opponentAllDone: boolean;
  isGameOver: boolean;
  finalResult: FinalResult | null;

  // 内部状态
  currentGuess: string;
  isShaking: boolean;
  invalidMessage: string;
  isWordWon: boolean;
  socket: Socket | null;
  targetWords: string[];
  myFinished: boolean;
  opponentWordIndex: number;
  errorMessage: string;

  // Actions
  startMatching: (difficultyLevel: number, nickname: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  cancelMatching: () => void;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => Promise<void>;
  resetBattle: () => void;
  clearShake: () => void;
  clearWordWon: () => void;
  disconnectSocket: () => void;
}

// 提取公共的 Socket 事件监听设置
const setupSocketListeners = (socket: Socket, set: any, get: any) => {
  socket.on('match:waiting', (data: { roomCode: string }) => {
    set({ roomCode: data.roomCode });
  });

  socket.on('match:success', (data: {
    roomCode: string;
    opponent: OpponentInfo;
    words: Array<{ length: number }>;
    targetWords: string[];
    sharedFirstGuesses: string[];
  }) => {
    const { roomCode, opponent, words, targetWords, sharedFirstGuesses } = data;
    const firstWordLength = words[0]?.length || 5;
    const firstGuess = sharedFirstGuesses[0] || '';
    const { grid } = prefilledGridWithFirstGuess(
      firstWordLength,
      firstGuess,
      targetWords[0]
    );

    set({
      battleState: 'playing',
      roomCode,
      opponent,
      words,
      targetWords,
      sharedFirstGuesses,
      currentWordIndex: 0,
      myScore: 0,
      opponentScore: 0,
      myGrid: grid,
      myGuesses: [firstGuess.toLowerCase()],
      currentGuess: '',
      opponentGuessCount: 0,
      opponentFinished: false,
      opponentWon: false,
      opponentAllDone: false,
      opponentWordIndex: 0,
      isGameOver: false,
      finalResult: null,
      myFinished: false,
      isShaking: false,
      invalidMessage: '',
      isWordWon: false
    });
  });

  socket.on('battle:progress', (data: {
    wordIndex: number;
    guessCount: number;
    finished: boolean;
    won: boolean;
    score?: number;
  }) => {
    const current = get();
    set({
      opponentGuessCount: data.guessCount,
      opponentFinished: data.finished,
      opponentWon: data.won || false,
      opponentWordIndex: data.wordIndex,
      opponentScore: data.score !== undefined ? data.score : current.opponentScore
    });
  });

  socket.on('battle:opponentAllDone', (data: { score: number }) => {
    set({
      opponentAllDone: true,
      opponentScore: data.score
    });
  });

  socket.on('battle:finish', (data: {
    myScore: number;
    opponentScore: number;
    won: boolean;
  }) => {
    set({
      battleState: 'finished',
      isGameOver: true,
      finalResult: {
        myScore: data.myScore,
        opponentScore: data.opponentScore,
        won: data.won
      }
    });
  });

  socket.on('error', (data: { message: string }) => {
    set({ errorMessage: data.message || '发生错误' });
  });

  socket.on('connect_error', () => {
    set({ errorMessage: '无法连接到服务器，请稍后重试' });
  });

  socket.on('disconnect', () => {
    const current = get();
    if (current.battleState === 'matching') {
      set({ errorMessage: '连接已断开' });
    }
  });
};

export const useBattleStore = create<BattleStore>((set, get) => ({
  battleState: 'idle',
  roomCode: null,
  opponent: null,
  difficultyLevel: 1,
  words: [],
  sharedFirstGuesses: [],
  currentWordIndex: 0,
  myScore: 0,
  opponentScore: 0,
  myGuesses: [],
  opponentGuessCount: 0,
  myGrid: [],
  opponentFinished: false,
  opponentWon: false,
  opponentAllDone: false,
  isGameOver: false,
  finalResult: null,

  currentGuess: '',
  isShaking: false,
  invalidMessage: '',
  isWordWon: false,
  socket: null,
  targetWords: [],
  myFinished: false,
  opponentWordIndex: 0,
  errorMessage: '',

  startMatching: (difficultyLevel, nickname) => {
    const oldSocket = get().socket;
    if (oldSocket) {
      oldSocket.disconnect();
    }

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000
    });

    set({
      socket,
      battleState: 'matching',
      difficultyLevel,
      roomCode: null,
      opponent: null,
      errorMessage: '',
      isGameOver: false,
      finalResult: null
    });

    socket.on('connect', () => {
      socket.emit('match:request', { difficultyLevel, nickname });
    });

    setupSocketListeners(socket, set, get);
  },

  joinRoom: (roomCode, nickname) => {
    const oldSocket = get().socket;
    if (oldSocket) {
      oldSocket.disconnect();
    }

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000
    });

    set({
      socket,
      battleState: 'matching',
      roomCode,
      opponent: null,
      errorMessage: '',
      isGameOver: false,
      finalResult: null
    });

    socket.on('connect', () => {
      socket.emit('room:join', { roomCode, nickname });
    });

    setupSocketListeners(socket, set, get);
  },

  cancelMatching: () => {
    const socket = get().socket;
    if (socket) {
      socket.emit('match:cancel');
      socket.disconnect();
    }
    set({
      battleState: 'idle',
      socket: null,
      roomCode: null,
      opponent: null,
      errorMessage: ''
    });
  },

  addLetter: (letter: string) => {
    const state = get();
    if (state.battleState !== 'playing' || state.isGameOver || state.myFinished || state.isWordWon) return;
    const currentWordLength = state.words[state.currentWordIndex]?.length || 5;
    if (state.currentGuess.length >= currentWordLength) return;
    set({
      currentGuess: state.currentGuess + letter,
      isShaking: false,
      invalidMessage: ''
    });
  },

  removeLetter: () => {
    const state = get();
    if (state.battleState !== 'playing' || state.isGameOver || state.myFinished || state.isWordWon) return;
    if (state.currentGuess.length === 0) return;
    set({
      currentGuess: state.currentGuess.slice(0, -1),
      isShaking: false,
      invalidMessage: ''
    });
  },

  submitGuess: async () => {
    const state = get();
    if (state.battleState !== 'playing' || state.isGameOver || state.myFinished || state.isWordWon) return;

    const guess = state.currentGuess;
    const currentWordLength = state.words[state.currentWordIndex]?.length || 5;

    if (guess.length !== currentWordLength) {
      set({ isShaking: true, invalidMessage: '字母数量不足' });
      return;
    }

    // 异步调用后端API验证单词
    const valid = await isValidWord(guess);
    if (!valid) {
      set({ isShaking: true, invalidMessage: '不是有效的英语单词' });
      return;
    }

    // 异步操作后重新获取状态
    const currentState = get();
    if (currentState.battleState !== 'playing' || currentState.isGameOver || currentState.myFinished || currentState.isWordWon) {
      return;
    }

    const targetWord = currentState.targetWords[currentState.currentWordIndex];
    if (!targetWord) return;

    const statuses = checkGuess(guess, targetWord);
    const guessIndex = currentState.myGuesses.length;

    // 更新格子
    const newGrid = currentState.myGrid.map((row, i) => {
      if (i === guessIndex) {
        return guess.split('').map((letter, j) => ({
          letter: letter.toUpperCase(),
          status: statuses[j]
        }));
      }
      return row;
    });

    const isWon = statuses.every(s => s === 'correct');
    const newGuesses = [...currentState.myGuesses, guess.toLowerCase()];
    const isWordDone = isWon || newGuesses.length >= MAX_GUESSES;

    set({
      myGrid: newGrid,
      myGuesses: newGuesses,
      currentGuess: '',
      isShaking: false,
      invalidMessage: '',
      isWordWon: isWon
    });

    // 通过 Socket.io 发送猜测给服务器
    currentState.socket?.emit('battle:guess', {
      wordIndex: currentState.currentWordIndex,
      guess: guess.toLowerCase(),
      guessIndex
    });

    if (isWordDone) {
      // 计算本单词得分
      const guessCount = newGuesses.length;
      let score = isWon ? getScoreForGuesses(guessCount) : 0;
      // 第3个单词（索引2）得分翻倍
      if (currentState.currentWordIndex === 2) {
        score *= 2;
      }

      const newMyScore = currentState.myScore + score;
      set({ myScore: newMyScore });

      const isAllWordsDone = currentState.currentWordIndex >= 2;

      // 通知服务器单词完成
      currentState.socket?.emit('battle:wordComplete', {
        wordIndex: currentState.currentWordIndex,
        score,
        totalScore: newMyScore,
        finished: isAllWordsDone
      });

      if (isAllWordsDone) {
        // 全部单词完成，等待对手
        set({ myFinished: true });
      }
    }
  },

  clearShake: () => {
    set({ isShaking: false, invalidMessage: '' });
  },

  clearWordWon: () => {
    const state = get();
    // 只有当前单词猜对了，才进入下一个单词
    if (!state.isWordWon) return;

    const isAllWordsDone = state.currentWordIndex >= 2;

    if (isAllWordsDone) {
      set({ isWordWon: false });
      return;
    }

    // 进入下一个单词
    const nextIndex = state.currentWordIndex + 1;
    const nextWordLength = state.words[nextIndex]?.length || 5;
    const nextTarget = state.targetWords[nextIndex];
    const nextFirstGuess = state.sharedFirstGuesses[nextIndex] || '';
    const { grid: nextGrid } = prefilledGridWithFirstGuess(
      nextWordLength,
      nextFirstGuess,
      nextTarget
    );

    set({
      currentWordIndex: nextIndex,
      myGrid: nextGrid,
      myGuesses: [nextFirstGuess.toLowerCase()],
      currentGuess: '',
      opponentGuessCount: 0,
      opponentFinished: false,
      opponentWon: false,
      isWordWon: false
    });
  },

  resetBattle: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }
    set({
      battleState: 'idle',
      roomCode: null,
      opponent: null,
      difficultyLevel: 1,
      words: [],
      sharedFirstGuesses: [],
      currentWordIndex: 0,
      myScore: 0,
      opponentScore: 0,
      myGuesses: [],
      opponentGuessCount: 0,
      myGrid: [],
      opponentFinished: false,
      opponentWon: false,
      opponentAllDone: false,
      isGameOver: false,
      finalResult: null,
      currentGuess: '',
      isShaking: false,
      invalidMessage: '',
      isWordWon: false,
      socket: null,
      targetWords: [],
      myFinished: false,
      opponentWordIndex: 0,
      errorMessage: ''
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
