#!/usr/bin/env bash
set -euo pipefail
TRAINING_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRAINING_PORT="${1:-8765}"
echo "退出服务：Ctrl+C；仅提供公开学员目录，不含导师私有材料。"
exec python3 "$TRAINING_ROOT/tools/serve_training.py" "$TRAINING_PORT"
