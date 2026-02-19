#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "📊 HomeNote 项目状态："
echo "=============================="
docker-compose ps
echo ""
echo "📝 最近日志（最后20行）："
echo "=============================="
docker-compose logs --tail=20 homenote
