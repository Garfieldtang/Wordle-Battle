export interface Word {
  id: string;
  word: string;
  definition: string;
  chinese_meaning: string;
  example_sentence: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
}

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'pending';

export interface GridCell {
  letter: string;
  status: LetterStatus;
}

export interface GameState {
  currentWord: Word;
  guesses: string[];
  grid: GridCell[][];
  currentGuess: string;
  maxGuesses: number;
  timeLimit: number;
  elapsedTime: number;
  isGameOver: boolean;
  isWon: boolean;
  difficultyLevel: number;
  isPlaying: boolean;
}

export interface UserData {
  userId: string;
  nickname: string;
  difficultyPreference: number;
  wordBook: WordBookEntry[];
  battleHistory: BattleRecord[];
  statistics: UserStatistics;
}

export interface WordBookEntry {
  wordId: string;
  word: Word;
  addedAt: Date;
  reviewedCount: number;
  lastReviewedAt?: Date;
}

export interface BattleRecord {
  battleId: string;
  date: Date;
  difficultyLevel: number;
  result: 'win' | 'lose';
  timeUsed: number;
  guessesCount: number;
  wordsInvolved: string[];
}

export interface UserStatistics {
  totalBattles: number;
  winCount: number;
  winRate: number;
  averageTime: number;
  averageGuesses: number;
  wordsLearnedCount: number;
}