#!/bin/bash

echo "Checking for potential ESLint-related issues in package.json..."
echo ""

echo "=== Checking for ESLint dependencies ==="
grep -i "eslint" package.json | grep -v "eslint-plugin" && echo "Simple ESLint reference found"

echo ""
echo "=== Checking for lint-related scripts ==="
grep -i "lint" package.json | grep -v "typecheck" && echo "Lint-related script found"

echo ""
echo "=== Checking for lint-related devDependencies ==="
grep -i "eslint" package.json | grep "devDependencies" || echo "No ESLint in devDependencies"

echo ""
echo "=== Checking yarn.lock for ESLint version ==="
grep -i "eslint" yarn.lock | head -5
