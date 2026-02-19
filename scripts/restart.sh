#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "正在重启 HomeNote 项目..."
docker-compose restart

if [ $? -eq 0 ]; then
    echo "✅ HomeNote 项目重启成功！"
    echo "📊 项目状态："
    docker-compose ps
else
    echo "❌ HomeNote 项目重启失败！"
    echo "📝 查看日志："
    docker-compose logs
fi
