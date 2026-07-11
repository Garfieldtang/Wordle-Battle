# ====== 阶段1: 构建前端 ======
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ====== 阶段2: 构建后端 + 运行 ======
FROM node:20-alpine

WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制后端依赖
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 复制后端源码
COPY server/ ./server/
COPY tsconfig.json ./

# 复制词典
COPY ECDICT-master/ecdict.csv ./ECDICT-master/ecdict.csv

# 复制前端构建产物
COPY --from=frontend-build /app/dist ./dist

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/http.d/default.conf

# 复制启动脚本
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 80

CMD ["./start.sh"]
