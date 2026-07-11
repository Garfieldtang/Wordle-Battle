import { Server, Socket } from 'socket.io';
import { getRandomWords, getRandomFirstGuess } from './wordDictionary.js';

const MAX_GUESSES = 6;
const WORDS_PER_BATTLE = 3;
const SCORE_MAP = [10, 8, 6, 4, 2, 1];

interface Player {
  id: string;
  socket: Socket;
  nickname: string;
  difficultyLevel: number;
}

interface BattleRoom {
  roomCode: string;
  players: Player[];
  targetWords: string[];
  sharedFirstGuesses: string[];
  scores: { [playerId: string]: number };
  guessCounts: { [playerId: string]: number };
  playerWordIndex: { [playerId: string]: number };
  battleFinished: { [playerId: string]: boolean };
  difficultyLevel: number;
}

const matchingQueue: Map<number, Player[]> = new Map();
const rooms: Map<string, BattleRoom> = new Map();

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const getScoreForGuesses = (guessCount: number, isWon: boolean): number => {
  if (!isWon) return 0;
  if (guessCount >= 1 && guessCount <= 6) return SCORE_MAP[guessCount - 1];
  return 0;
};

const generateSharedFirstGuesses = (difficultyLevel: number, targetWords: string[]): string[] => {
  return targetWords.map(word => getRandomFirstGuess(difficultyLevel, word.length));
};

const createBattleRoom = (
  player1: Player,
  player2: Player,
  difficultyLevel: number,
  roomCode?: string
): BattleRoom => {
  const code = roomCode || generateRoomCode();

  const minLen = difficultyLevel <= 2 ? 4 : difficultyLevel <= 4 ? 5 : 4;
  const maxLen = difficultyLevel <= 2 ? 6 : difficultyLevel <= 4 ? 8 : 10;

  const targetWords = getRandomWords(difficultyLevel, WORDS_PER_BATTLE, minLen, maxLen);
  const sharedFirstGuesses = generateSharedFirstGuesses(difficultyLevel, targetWords);

  const room: BattleRoom = {
    roomCode: code,
    players: [player1, player2],
    targetWords,
    sharedFirstGuesses,
    scores: { [player1.id]: 0, [player2.id]: 0 },
    guessCounts: { [player1.id]: 1, [player2.id]: 1 },
    playerWordIndex: { [player1.id]: 0, [player2.id]: 0 },
    battleFinished: { [player1.id]: false, [player2.id]: false },
    difficultyLevel
  };

  rooms.set(code, room);
  return room;
};

const notifyMatchSuccess = (room: BattleRoom) => {
  const [p1, p2] = room.players;

  const wordsInfo = room.targetWords.map(word => ({
    length: word.length
  }));

  const baseData = {
    roomCode: room.roomCode,
    words: wordsInfo,
    targetWords: room.targetWords,
    sharedFirstGuesses: room.sharedFirstGuesses
  };

  p1.socket.join(room.roomCode);
  p2.socket.join(room.roomCode);

  p1.socket.emit('match:success', { ...baseData, opponent: { nickname: p2.nickname } });
  p2.socket.emit('match:success', { ...baseData, opponent: { nickname: p1.nickname } });
};

const tryMatchRandom = (io: Server, difficultyLevel: number) => {
  const queue = matchingQueue.get(difficultyLevel) || [];

  while (queue.length >= 2) {
    const player1 = queue.shift()!;
    const player2 = queue.shift()!;

    const room = createBattleRoom(player1, player2, difficultyLevel);
    notifyMatchSuccess(room);
  }

  matchingQueue.set(difficultyLevel, queue);
};

export const handleMatchRequest = (
  io: Server,
  socket: Socket,
  data: { difficultyLevel: number; nickname: string }
) => {
  const { difficultyLevel, nickname } = data;

  const player: Player = {
    id: socket.id,
    socket,
    nickname: nickname || '匿名玩家',
    difficultyLevel
  };

  const roomCode = generateRoomCode();
  socket.emit('match:waiting', { roomCode });

  const queue = matchingQueue.get(difficultyLevel) || [];
  queue.push(player);
  matchingQueue.set(difficultyLevel, queue);

  console.log(`[匹配] ${nickname} 加入难度 ${difficultyLevel} 匹配队列，当前队列长度: ${queue.length}`);

  setTimeout(() => tryMatchRandom(io, difficultyLevel), 100);
};

export const handleMatchCancel = (socket: Socket) => {
  for (const [level, queue] of matchingQueue.entries()) {
    const idx = queue.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const player = queue[idx];
      queue.splice(idx, 1);
      matchingQueue.set(level, queue);
      console.log(`[匹配] ${player.nickname} 取消匹配`);
      break;
    }
  }
};

export const handleRoomJoin = (
  io: Server,
  socket: Socket,
  data: { roomCode: string; nickname: string; difficultyLevel?: number }
) => {
  const { roomCode, nickname } = data;
  const code = roomCode.toUpperCase();

  const room = rooms.get(code);

  const player: Player = {
    id: socket.id,
    socket,
    nickname: nickname || '匿名玩家',
    difficultyLevel: data.difficultyLevel || 1
  };

  if (!room) {
    socket.emit('match:waiting', { roomCode: code });
    console.log(`[房间] ${nickname} 创建房间 ${code}`);

    const newRoom: BattleRoom = {
      roomCode: code,
      players: [player],
      targetWords: [],
      sharedFirstGuesses: [],
      scores: { [player.id]: 0 },
      guessCounts: { [player.id]: 1 },
      playerWordIndex: { [player.id]: 0 },
      battleFinished: { [player.id]: false },
      difficultyLevel: player.difficultyLevel
    };
    rooms.set(code, newRoom);
    return;
  }

  if (room.players.length >= 2) {
    socket.emit('error', { message: '房间已满' });
    return;
  }

  room.players.push(player);
  room.scores[player.id] = 0;
  room.guessCounts[player.id] = 1;
  room.playerWordIndex[player.id] = 0;
  room.battleFinished[player.id] = false;

  const difficultyLevel = room.difficultyLevel;
  const minLen = difficultyLevel <= 2 ? 4 : difficultyLevel <= 4 ? 5 : 4;
  const maxLen = difficultyLevel <= 2 ? 6 : difficultyLevel <= 4 ? 8 : 10;

  room.targetWords = getRandomWords(difficultyLevel, WORDS_PER_BATTLE, minLen, maxLen);
  room.sharedFirstGuesses = generateSharedFirstGuesses(difficultyLevel, room.targetWords);

  console.log(`[房间] ${nickname} 加入房间 ${code}，开始对战`);
  notifyMatchSuccess(room);
};

export const handleBattleGuess = (
  io: Server,
  socket: Socket,
  data: { wordIndex: number; guess: string; guessIndex: number }
) => {
  const room = Array.from(rooms.values()).find(r =>
    r.players.some(p => p.id === socket.id)
  );

  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (!player) return;

  const opponent = room.players.find(p => p.id !== socket.id);
  if (!opponent) return;

  // 检测单词切换，重置猜测计数
  const lastWordIndex = room.playerWordIndex[socket.id] ?? 0;
  if (data.wordIndex !== lastWordIndex) {
    room.guessCounts[socket.id] = 1; // 重置为1（共享首猜算1次）
    room.playerWordIndex[socket.id] = data.wordIndex;
  }

  const currentGuessCount = room.guessCounts[socket.id] || 1;
  const newGuessCount = currentGuessCount + 1;
  room.guessCounts[socket.id] = newGuessCount;

  const targetWord = room.targetWords[data.wordIndex];
  const isWon = data.guess.toLowerCase() === targetWord?.toLowerCase();
  const isWordDone = isWon || newGuessCount >= MAX_GUESSES;

  if (isWordDone) {
    let score = getScoreForGuesses(newGuessCount, isWon);
    if (data.wordIndex === 2) {
      score *= 2;
    }
    room.scores[socket.id] = (room.scores[socket.id] || 0) + score;
  }

  // 发送进度给对手
  opponent.socket.emit('battle:progress', {
    wordIndex: data.wordIndex,
    guessCount: newGuessCount,
    finished: isWordDone,
    won: isWon,
    score: room.scores[socket.id]
  });
};

export const handleBattleWordComplete = (
  io: Server,
  socket: Socket,
  data: { wordIndex: number; score: number; totalScore: number; finished: boolean }
) => {
  const room = Array.from(rooms.values()).find(r =>
    r.players.some(p => p.id === socket.id)
  );

  if (!room) return;

  const opponent = room.players.find(p => p.id !== socket.id);
  if (!opponent) return;

  // 更新服务器端的分数（以客户端为准，更准确）
  room.scores[socket.id] = data.totalScore;

  if (data.finished) {
    room.battleFinished[socket.id] = true;

    // 通知对手：你已完成所有单词
    opponent.socket.emit('battle:opponentAllDone', {
      score: data.totalScore
    });

    const allFinished = room.players.every(p => room.battleFinished[p.id]);

    if (allFinished) {
      const [p1, p2] = room.players;
      const score1 = room.scores[p1.id] || 0;
      const score2 = room.scores[p2.id] || 0;

      p1.socket.emit('battle:finish', {
        myScore: score1,
        opponentScore: score2,
        won: score1 > score2
      });

      p2.socket.emit('battle:finish', {
        myScore: score2,
        opponentScore: score1,
        won: score2 > score1
      });

      setTimeout(() => {
        rooms.delete(room.roomCode);
        console.log(`[对战] 房间 ${room.roomCode} 对战结束，已清理`);
      }, 5000);
    }
  }
};

export const handleDisconnect = (socket: Socket) => {
  handleMatchCancel(socket);

  const room = Array.from(rooms.values()).find(r =>
    r.players.some(p => p.id === socket.id)
  );

  if (room) {
    const remainingPlayer = room.players.find(p => p.id !== socket.id);
    if (remainingPlayer) {
      remainingPlayer.socket.emit('error', { message: '对手已断开连接' });
    }
    rooms.delete(room.roomCode);
    console.log(`[对战] 玩家断开，房间 ${room.roomCode} 已解散`);
  }
};

export const getRoomCount = () => rooms.size;
export const getMatchingQueueCount = () => {
  let total = 0;
  for (const queue of matchingQueue.values()) {
    total += queue.length;
  }
  return total;
};
