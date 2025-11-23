#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci

echo "🔍 Running linter..."
npm run lint

echo "📝 Running type check..."
npx tsc --noEmit

echo "🧪 Running tests..."
npm test

echo "📊 Running tests with coverage..."
npm run test:coverage

echo "🏗️ Building project..."
npm run build

echo "🔒 Running security audit..."
npm audit --audit-level=moderate

echo "✅ All CI checks passed!"