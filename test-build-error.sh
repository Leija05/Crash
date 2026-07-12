#!/bin/bash

echo "Checking for ESLint configuration..."
if [ -f "CrashPage/frontend/.eslintrc.json" ]; then
  echo "Found .eslintrc.json"
  cat CrashPage/frontend/.eslintrc.json
else
  echo ".eslintrc.json not found"
fi

echo "Checking for ESLint package in package.json..."
if grep -q "eslint" CrashPage/frontend/package.json; then
  echo "Found ESLint in package.json"
  grep -A 5 -B 5 "eslint" CrashPage/frontend/package.json
fi

echo "\nTrying to run ESLint to see specific errors..."
