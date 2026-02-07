#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <game-id>"
  exit 1
fi

GAME_ID="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_PATH="$ROOT_DIR/platform/templates/game-platform-manifest.json"
GAME_DIR="$ROOT_DIR/projects/$GAME_ID"
TARGET_PATH="$GAME_DIR/platform-manifest.json"

mkdir -p "$GAME_DIR"

if [ -f "$TARGET_PATH" ]; then
  echo "Manifest already exists: $TARGET_PATH"
  exit 1
fi

sed "s/replace-with-game-id/$GAME_ID/g" "$TEMPLATE_PATH" > "$TARGET_PATH"
echo "Created: $TARGET_PATH"
