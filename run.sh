#!/bin/bash

COMPOSE="docker compose -f ./database/docker-compose.yml --env-file ./.env"

setup_env() {
  if [ ! -f .env ]; then
    echo ".env 不存在，自動從 .env.example 複製..."
    cp .env.example .env
    echo ".env 建立完成"
  fi
}

case "$1" in
  up)
    setup_env
    echo "啟動後端 + 資料庫..."
    $COMPOSE up -d --build
    ;;
  down)
    echo "停止後端 + 資料庫..."
    $COMPOSE down
    ;;
  restart)
    echo "重啟後端 + 資料庫..."
    $COMPOSE restart
    ;;
  frontend)
    echo "啟動前端 dev server..."
    cd frontend && npm install && npm run dev
    ;;
  logs)
    $COMPOSE logs -f
    ;;
  *)
    echo "用法："
    echo "  ./run.sh up        - 啟動後端 + 資料庫"
    echo "  ./run.sh down      - 停止後端 + 資料庫"
    echo "  ./run.sh restart   - 重啟後端 + 資料庫"
    echo "  ./run.sh frontend  - 啟動前端 dev server"
    echo "  ./run.sh logs      - 查看 logs"
    ;;
esac
