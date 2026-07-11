import { create } from 'zustand';
import { UserData, WordBookEntry, BattleRecord, UserStatistics, Word } from '../types';

interface UserStore {
  userData: UserData | null;
  isAuthenticated: boolean;
  addWordToBook: (word: Word) => void;
  removeWordFromBook: (wordId: string) => void;
  addBattleRecord: (record: BattleRecord) => void;
  updateStatistics: () => void;
  login: (nickname: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getInitialStatistics = (): UserStatistics => ({
  totalBattles: 0,
  winCount: 0,
  winRate: 0,
  averageTime: 0,
  averageGuesses: 0,
  wordsLearnedCount: 0
});

export const useUserStore = create<UserStore>((set, get) => ({
  userData: null,
  isAuthenticated: false,

  login: (nickname: string) => {
    const userId = generateUserId();
    const userData: UserData = {
      userId,
      nickname,
      difficultyPreference: 1,
      wordBook: [],
      battleHistory: [],
      statistics: getInitialStatistics()
    };
    localStorage.setItem('wordle_user_data', JSON.stringify(userData));
    set({ userData, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('wordle_user_data');
    set({ userData: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const stored = localStorage.getItem('wordle_user_data');
    if (stored) {
      try {
        const userData = JSON.parse(stored) as UserData;
        set({ userData, isAuthenticated: true });
      } catch {
        localStorage.removeItem('wordle_user_data');
      }
    }
  },

  addWordToBook: (word: Word) => {
    const state = get();
    if (!state.userData) return;

    const existingEntry = state.userData.wordBook.find(entry => entry.wordId === word.id);
    if (existingEntry) return;

    const newEntry: WordBookEntry = {
      wordId: word.id,
      word,
      addedAt: new Date(),
      reviewedCount: 0
    };

    const updatedData = {
      ...state.userData,
      wordBook: [...state.userData.wordBook, newEntry],
      statistics: {
        ...state.userData.statistics,
        wordsLearnedCount: state.userData.statistics.wordsLearnedCount + 1
      }
    };

    localStorage.setItem('wordle_user_data', JSON.stringify(updatedData));
    set({ userData: updatedData });
  },

  removeWordFromBook: (wordId: string) => {
    const state = get();
    if (!state.userData) return;

    const updatedData = {
      ...state.userData,
      wordBook: state.userData.wordBook.filter(entry => entry.wordId !== wordId),
      statistics: {
        ...state.userData.statistics,
        wordsLearnedCount: Math.max(0, state.userData.statistics.wordsLearnedCount - 1)
      }
    };

    localStorage.setItem('wordle_user_data', JSON.stringify(updatedData));
    set({ userData: updatedData });
  },

  addBattleRecord: (record: BattleRecord) => {
    const state = get();
    if (!state.userData) return;

    const updatedData = {
      ...state.userData,
      battleHistory: [...state.userData.battleHistory, record]
    };

    localStorage.setItem('wordle_user_data', JSON.stringify(updatedData));
    set({ userData: updatedData });
    get().updateStatistics();
  },

  updateStatistics: () => {
    const state = get();
    if (!state.userData) return;

    const history = state.userData.battleHistory;
    if (history.length === 0) return;

    const totalBattles = history.length;
    const winCount = history.filter(r => r.result === 'win').length;
    const winRate = (winCount / totalBattles) * 100;
    const averageTime = history.reduce((sum, r) => sum + r.timeUsed, 0) / totalBattles;
    const averageGuesses = history.reduce((sum, r) => sum + r.guessesCount, 0) / totalBattles;

    const updatedData = {
      ...state.userData,
      statistics: {
        ...state.userData.statistics,
        totalBattles,
        winCount,
        winRate,
        averageTime,
        averageGuesses
      }
    };

    localStorage.setItem('wordle_user_data', JSON.stringify(updatedData));
    set({ userData: updatedData });
  }
}));