import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '..', 'ECDICT-master', 'ecdict.csv');

interface WordEntry {
  word: string;
  phonetic: string;
  definition: string;
  translation: string;
  pos: string;
  collins: number;
  oxford: number;
  tag: string;
  bnc: number;
  frq: number;
  exchange: string;
  detail: string;
  audio: string;
}

let allWords: WordEntry[] = [];
let wordsByLevel: Map<number, WordEntry[]> = new Map();
let isLoaded = false;

const LEVEL_NAMES = ['青铜', '白银', '黄金', '钻石', '王者'];

const isAlphabetic = (word: string): boolean => {
  return /^[a-zA-Z]+$/.test(word);
};

const classifyWord = (entry: WordEntry): number[] => {
  const { word, collins, oxford, tag, bnc, frq } = entry;
  
  if (!isAlphabetic(word)) {
    return [];
  }

  const len = word.length;
  const levels: number[] = [];
  const tagLower = (tag || '').toLowerCase();

  if (len < 2 || len > 15) {
    return [];
  }

  if (collins >= 5 || oxford >= 3 || bnc > 0 && bnc < 3000) {
    levels.push(1);
  }

  if (collins >= 3 || (bnc > 0 && bnc < 10000) || tagLower.includes('cet4')) {
    levels.push(2);
  }

  if (collins >= 2 || tagLower.includes('cet6') || tagLower.includes('cet4') || (bnc > 0 && bnc < 30000)) {
    levels.push(3);
  }

  if (collins >= 1 || tagLower.includes('gre') || tagLower.includes('ielts') || tagLower.includes('toefl') || (bnc > 0 && bnc < 60000)) {
    levels.push(4);
  }

  levels.push(5);

  return levels;
};

export const loadDictionary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isLoaded) {
      resolve();
      return;
    }

    allWords = [];
    wordsByLevel = new Map();
    for (let i = 1; i <= 5; i++) {
      wordsByLevel.set(i, []);
    }

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        const entry: WordEntry = {
          word: (record.word || '').trim().toLowerCase(),
          phonetic: record.phonetic || '',
          definition: record.definition || '',
          translation: record.translation || '',
          pos: record.pos || '',
          collins: parseInt(record.collins || '0', 10) || 0,
          oxford: parseInt(record.oxford || '0', 10) || 0,
          tag: record.tag || '',
          bnc: parseInt(record.bnc || '0', 10) || 0,
          frq: parseInt(record.frq || '0', 10) || 0,
          exchange: record.exchange || '',
          detail: record.detail || '',
          audio: record.audio || ''
        };

        if (!entry.word || !isAlphabetic(entry.word)) {
          continue;
        }

        allWords.push(entry);

        const levels = classifyWord(entry);
        levels.forEach(level => {
          const levelWords = wordsByLevel.get(level) || [];
          levelWords.push(entry);
          wordsByLevel.set(level, levelWords);
        });
      }
    });

    parser.on('end', () => {
      isLoaded = true;
      console.log(`词典加载完成：共 ${allWords.length} 个单词`);
      for (let i = 1; i <= 5; i++) {
        const count = wordsByLevel.get(i)?.length || 0;
        console.log(`  ${LEVEL_NAMES[i - 1]}级 (${i}): ${count} 个单词`);
      }
      resolve();
    });

    parser.on('error', (err) => {
      console.error('加载词典失败:', err);
      reject(err);
    });

    createReadStream(CSV_PATH, { encoding: 'utf-8' }).pipe(parser);
  });
};

export const isValidWord = (word: string): boolean => {
  if (!isLoaded) return false;
  const lowerWord = word.toLowerCase().trim();
  return allWords.some(entry => entry.word === lowerWord);
};

export const getWordInfo = (word: string): WordEntry | undefined => {
  if (!isLoaded) return undefined;
  const lowerWord = word.toLowerCase().trim();
  return allWords.find(entry => entry.word === lowerWord);
};

export const getRandomWord = (level: number, minLength = 4, maxLength = 8): string => {
  if (!isLoaded) {
    throw new Error('词典尚未加载');
  }

  const levelWords = wordsByLevel.get(level) || allWords;
  const filtered = levelWords.filter(
    entry => entry.word.length >= minLength && entry.word.length <= maxLength
  );

  if (filtered.length === 0) {
    const fallback = allWords.filter(
      entry => entry.word.length >= minLength && entry.word.length <= maxLength
    );
    if (fallback.length === 0) return 'apple';
    return fallback[Math.floor(Math.random() * fallback.length)].word;
  }

  return filtered[Math.floor(Math.random() * filtered.length)].word;
};

export const getRandomWords = (
  level: number,
  count: number,
  minLength = 4,
  maxLength = 8
): string[] => {
  if (!isLoaded) {
    throw new Error('词典尚未加载');
  }

  const levelWords = wordsByLevel.get(level) || allWords;
  const filtered = levelWords.filter(
    entry => entry.word.length >= minLength && entry.word.length <= maxLength
  );

  const result: string[] = [];
  const used = new Set<string>();

  const pool = filtered.length > 0 ? filtered : allWords.filter(
    entry => entry.word.length >= minLength && entry.word.length <= maxLength
  );

  while (result.length < count && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const word = pool[idx].word;
    if (!used.has(word)) {
      used.add(word);
      result.push(word);
    }
  }

  while (result.length < count) {
    result.push('apple');
  }

  return result;
};

export const getRandomFirstGuess = (level: number, wordLength: number): string => {
  if (!isLoaded) {
    throw new Error('词典尚未加载');
  }

  // 优先从常见起始猜测中挑选（这些单词字母分布好，适合作为首猜）
  const commonStarters = [
    'crane', 'slate', 'crate', 'salet', 'trace',
    'adieu', 'audio', 'raise', 'arise', 'irate',
    'stare', 'snare', 'arose', 'saner', 'later',
    'stern', 'spend', 'clasp', 'route', 'least'
  ];

  // 先尝试从常见起始词中找匹配长度且在该等级词库中有效的单词
  const levelWords = wordsByLevel.get(level) || allWords;
  const levelWordSet = new Set(levelWords.map(e => e.word));

  const matched = commonStarters.filter(w => w.length === wordLength && levelWordSet.has(w));
  if (matched.length > 0) {
    return matched[Math.floor(Math.random() * matched.length)];
  }

  // 从该等级词库中随机挑选一个相同长度的单词
  const pool = levelWords.filter(e => e.word.length === wordLength);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)].word;
  }

  // 兜底：从全词库中找
  const fallback = allWords.filter(e => e.word.length === wordLength);
  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)].word;
  }

  return 'crane';
};

export { isLoaded, LEVEL_NAMES };
