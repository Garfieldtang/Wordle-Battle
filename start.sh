#!/bin/sh

# 启动后端（后台）
npx tsx server/index.ts &

# 等待后端启动
sleep 3

# 启动 nginx（前台）
nginx -g 'daemon off;'
