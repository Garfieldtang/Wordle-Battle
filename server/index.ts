import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { loadDictionary, isValidWord, getWordInfo, getRandomWord, LEVEL_NAMES } from './wordDictionary.js';
import {
  handleMatchRequest,
  handleMatchCancel,
  handleRoomJoin,
  handleBattleGuess,
  handleBattleWordComplete,
  handleDisconnect,
  getRoomCount,
  getMatchingQueueCount
} from './matchmaking.js';

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/word/check', (req, res) => {
  const word = typeof req.query.word === 'string' ? req.query.word : '';
  const valid = isValidWord(word);
  res.json({ valid, word: word.toLowerCase() });
});

app.get('/api/word/info', (req, res) => {
  const word = typeof req.query.word === 'string' ? req.query.word : '';
  const info = getWordInfo(word);
  if (info) {
    res.json({ found: true, ...info });
  } else {
    res.json({ found: false });
  }
});

app.get('/api/word/random', (req, res) => {
  const level = parseInt(typeof req.query.level === 'string' ? req.query.level : '1', 10) || 1;
  const minLength = parseInt(typeof req.query.minLength === 'string' ? req.query.minLength : '4', 10) || 4;
  const maxLength = parseInt(typeof req.query.maxLength === 'string' ? req.query.maxLength : '8', 10) || 8;
  
  try {
    const word = getRandomWord(level, minLength, maxLength);
    res.json({ word, level, levelName: LEVEL_NAMES[level - 1] || '未知' });
  } catch (err) {
    res.status(503).json({ error: '词典尚未加载完成，请稍后重试' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    rooms: getRoomCount(),
    matchingQueue: getMatchingQueueCount()
  });
});

io.on('connection', (socket) => {
  console.log(`[连接] 新客户端连接: ${socket.id}`);

  socket.on('match:request', (data) => {
    handleMatchRequest(io, socket, data);
  });

  socket.on('match:cancel', () => {
    handleMatchCancel(socket);
  });

  socket.on('room:join', (data) => {
    handleRoomJoin(io, socket, data);
  });

  socket.on('battle:guess', (data) => {
    handleBattleGuess(io, socket, data);
  });

  socket.on('battle:wordComplete', (data) => {
    handleBattleWordComplete(io, socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`[连接] 客户端断开: ${socket.id}`);
    handleDisconnect(socket);
  });
});

const startServer = async () => {
  console.log('正在加载词典...');
  try {
    await loadDictionary();
  } catch (err) {
    console.error('词典加载失败，但服务器仍将启动:', err);
  }

  server.listen(PORT, () => {
    console.log(`\n🚀 服务器已启动`);
    console.log(`   HTTP API:  http://localhost:${PORT}`);
    console.log(`   Socket.io: http://localhost:${PORT}`);
    console.log(`\n📚 接口列表:`);
    console.log(`   GET /api/word/check?word=xxx     检查单词是否有效`);
    console.log(`   GET /api/word/info?word=xxx      获取单词详细信息`);
    console.log(`   GET /api/word/random?level=1     获取随机单词`);
    console.log(`   GET /api/status                  服务器状态`);
    console.log(`\n🎮 对战系统:`);
    console.log(`   Socket.io 事件:`);
    console.log(`     match:request    - 请求随机匹配`);
    console.log(`     match:cancel     - 取消匹配`);
    console.log(`     room:join        - 加入房间`);
    console.log(`     battle:guess     - 提交猜测`);
    console.log(`     battle:wordComplete - 完成单词`);
  });
};

startServer();
