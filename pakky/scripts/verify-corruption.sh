#!/bin/bash

# Configuration paths for Electron apps on macOS
APP_NAME="pakky"
DEV_NAME="Electron"
BASE_DIR="$HOME/Library/Application Support"

# Try to find the active config file
# In dev mode, Electron often uses 'Electron' as the app name
if [ -f "$BASE_DIR/$DEV_NAME/user-config.json" ]; then
    CONFIG_PATH="$BASE_DIR/$DEV_NAME/user-config.json"
elif [ -f "$BASE_DIR/$APP_NAME/user-config.json" ]; then
    CONFIG_PATH="$BASE_DIR/$APP_NAME/user-config.json"
else
    # Default to dev path if neither exists (so next launch sees it)
    mkdir -p "$BASE_DIR/$DEV_NAME"
    CONFIG_PATH="$BASE_DIR/$DEV_NAME/user-config.json"
fi

echo "📍 Target Config: $CONFIG_PATH"

# Backup if exists and valid
if [ -f "$CONFIG_PATH" ]; then
    # Check if it's already corrupted (don't overwrite good backup with bad data)
    if grep -q "CORRUPTED_TEST_DATA" "$CONFIG_PATH"; then
        echo "⚠️  File is already corrupted."
    else
        cp "$CONFIG_PATH" "$CONFIG_PATH.pre-test.bak"
        echo "💾 Backed up existing config to $CONFIG_PATH.pre-test.bak"
    fi
fi

# Corrupt the file
echo "CORRUPTED_TEST_DATA_$(date +%s)" > "$CONFIG_PATH"

echo ""
echo "✅ Config file has been corrupted."
echo "👉 Now run 'npm run dev' to verify the Corruption Alert UI."
