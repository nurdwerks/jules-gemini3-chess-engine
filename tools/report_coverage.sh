#!/bin/bash
set -e

echo "Cleaning..."
rm -rf .nyc_output coverage
mkdir -p .nyc_output

echo "Running Backend Tests (Jest)..."
npm run coverage || true
if [ -f coverage/coverage-final.json ]; then
    cp coverage/coverage-final.json .nyc_output/jest-coverage.json
fi

echo "Starting backend with coverage..."
./node_modules/.bin/nyc --silent --no-clean node src/app.js > server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

echo "Waiting for server..."
sleep 15

echo "Running E2E Tests..."
npm run test:e2e || true

echo "Processes before kill:"
ps aux | grep node || true

echo "Stopping backend..."
kill -SIGINT $SERVER_PID
sleep 5

echo "Generating Report..."
node tools/generate_unified_coverage.js --skip-tests
