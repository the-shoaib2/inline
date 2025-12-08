#!/bin/bash
set -e

echo "🧹 Cleaning up project..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
rm -rf out dist target
rm -rf packages/native-rust/target packages/native-cpp/build

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️  Building project..."
pnpm run build

echo "✅ Setup complete! run 'pnpm run dev' to watch for changes."
