// 异步调用后端API验证单词是否为有效英语单词
// 开发环境用 localhost:3001，生产环境用相对路径（由 nginx 反代）
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

export const isValidWord = async (word: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/word/check?word=${encodeURIComponent(word)}`);
    const data = await response.json();
    return data.valid;
  } catch {
    return false;
  }
};
