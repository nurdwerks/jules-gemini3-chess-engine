#!/bin/bash
set -e

# Verify version
VERSION=$(node -p "require('./package.json').version")
if [ -z "$VERSION" ]; then
  echo "Error: Could not determine version from package.json"
  exit 1
fi

echo "Releasing version $VERSION..."

# Run tests
echo "Running tests..."
npm test

# Create release branch
BRANCH_NAME="release/v$VERSION"
echo "Creating release branch $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME"

echo "Release branch $BRANCH_NAME created."
echo "You can now push this branch to the remote repository."
