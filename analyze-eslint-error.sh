#!/bin/bash

# Quick ESLint check to identify which files have issues
echo "Running ESLint in the CrashPage frontend..."
cd CrashPage/frontend

# Check if there's a specific ESLint command
if grep -q "lint:" package.json; then
  echo "Found lint script in package.json"
  echo "Running: npm run lint"
  npm run lint
else
  echo "No lint script in package.json"
fi

echo "\nTrying to find ESLint configuration..."
if [ -f ".eslintrc.json" ]; then
  echo "Found .eslintrc.json at project root"
  cat .eslintrc.json
elif [ -f "src/.eslintrc.json" ]; then
  echo "Found .eslintrc.json in src/"
  cat src/.eslintrc.json
else
  echo "No ESLint config found at project root or src/"
fi
