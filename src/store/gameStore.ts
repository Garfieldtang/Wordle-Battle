import { create } from 'zustand';
import { Word, GameState, GridCell, LetterStatus } from '../types';
import wordsData from '../data/words.json';
import { isValidWord } from '../utils/wordValidator';

// 根据难度等级获取单词列表
const getWordsByLevel = (level: number): Word[] => {
  const key = `level${level}`;
  return (wordsData as Record<string, Word[]>)[key] || [];
};

// 随机选择一个单词
const selectRandomWord = (level: number): Word => {
  const words = getWordsByLevel(level);
  if (words.length === 0) {
    throw new Error(`No words found for level ${level}`);
  }
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

// 检查猜测并返回字母状态
const checkGuess = (guess: string, targetWord: string): LetterStatus[] => {
  const result: LetterStatus[] = [];
  const targetLetters = targetWord.toLowerCase().split('');
  const guessLetters = guess.toLowerCase().split('');
  const targetLetterCount: Record<string, number> = {};

  // 统计目标单词中每个字母的出现次数
  targetLetters.forEach(letter => {
    targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
  });

  // 第一遍：标记正确位置的字母
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetterCount[guessLetters[i]]--;
    } else {
      result[i] = 'absent';
    }
  }

  // 第二遍：标记存在但位置错误的字母
  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i] === 'absent' && targetLetterCount[guessLetters[i]] > 0) {
      result[i] = 'present';
      targetLetterCount[guessLetters[i]]--;
    }
  }

  return result;
};

// 创建空格子网格
const createEmptyGrid = (wordLength: number, maxGuesses: number): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let i = 0; i < maxGuesses; i++) {
    const row: GridCell[] = [];
    for (let j = 0; j < wordLength; j++) {
      row.push({ letter: '', status: 'empty' });
    }
    grid.push(row);
  }
  return grid;
};

// 更新格子网格
const updateGridWithGuess = (
  grid: GridCell[][],
  rowIndex: number,
  guess: string,
  statuses: LetterStatus[]
): GridCell[][] => {
  const newGrid = grid.map((row, i) => {
    if (i === rowIndex) {
      return guess.split('').map((letter, j) => ({
        letter: letter.toUpperCase(),
        status: statuses[j]
      }));
    }
    return row;
  });
  return newGrid;
};

interface GameStore extends GameState {
  isShaking: boolean;
  invalidMessage: string;
  startGame: (difficultyLevel: number) => void;
  submitGuess: () => Promise<boolean>;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  resetGame: () => void;
  clearShake: () => void;
  isSubmitting: boolean;
}

const initialState: GameState = {
  currentWord: selectRandomWord(1),
  guesses: [],
  grid: createEmptyGrid(5, 6),
  currentGuess: '',
  maxGuesses: 6,
  timeLimit: 0,
  elapsedTime: 0,
  isGameOver: false,
  isWon: false,
  difficultyLevel: 1,
  isPlaying: false
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  isShaking: false,
  invalidMessage: '',
  isSubmitting: false,

  startGame: (difficultyLevel: number) => {
    const word = selectRandomWord(difficultyLevel);
    const grid = createEmptyGrid(word.word.length, 6);
    set({
      currentWord: word,
      difficultyLevel,
      grid,
      guesses: [],
      currentGuess: '',
      isGameOver: false,
      isWon: false,
      isPlaying: true,
      isShaking: false,
      invalidMessage: '',
      isSubmitting: false
    });
  },

  submitGuess: async () => {
    const state = get();
    if (state.isGameOver || state.currentGuess.length !== state.currentWord.word.length || state.isSubmitting) {
      return false;
    }

    set({ isSubmitting: true });

    try {
      const valid = await isValidWord(state.currentGuess);
      
      const currentState = get();
      if (currentState.isGameOver || currentState.currentGuess !== state.currentGuess) {
        set({ isSubmitting: false });
        return false;
      }

      if (!valid) {
        set({ isShaking: true, invalidMessage: '不是有效的英语单词', isSubmitting: false });
        return false;
      }

      const statuses = checkGuess(state.currentGuess, state.currentWord.word);
      const newGrid = updateGridWithGuess(
        currentState.grid,
        currentState.guesses.length,
        state.currentGuess,
        statuses
      );

      const isWon = statuses.every(s => s === 'correct');
      const isGameOver = isWon || currentState.guesses.length >= currentState.maxGuesses - 1;

      set({
        grid: newGrid,
        guesses: [...currentState.guesses, state.currentGuess.toLowerCase()],
        currentGuess: '',
        isWon,
        isGameOver,
        isPlaying: !isGameOver,
        isShaking: false,
        invalidMessage: '',
        isSubmitting: false
      });
      return true;
    } catch {
      set({ isSubmitting: false });
      return false;
    }
  },

  addLetter: (letter: string) => {
    const state = get();
    if (!state.isPlaying || state.currentGuess.length >= state.currentWord.word.length) {
      return;
    }
    set({ currentGuess: state.currentGuess + letter, isShaking: false, invalidMessage: '' });
  },

  removeLetter: () => {
    const state = get();
    if (!state.isPlaying || state.currentGuess.length === 0) {
      return;
    }
    set({ currentGuess: state.currentGuess.slice(0, -1), isShaking: false, invalidMessage: '' });
  },

  clearShake: () => {
    set({ isShaking: false, invalidMessage: '' });
  },

  resetGame: () => {
    const state = get();
    const word = selectRandomWord(state.difficultyLevel);
    const grid = createEmptyGrid(word.word.length, 6);
    set({
      currentWord: word,
      grid,
      guesses: [],
      currentGuess: '',
      isGameOver: false,
      isWon: false,
      isPlaying: false,
      isShaking: false,
      invalidMessage: '',
      isSubmitting: false
    });
  }
}));