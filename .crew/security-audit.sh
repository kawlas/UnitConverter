#!/usr/bin/env bash
echo "=== SECURITY GUARD AUDIT ==="
echo "Checking for accidental secret leaks or API keys..."
if grep -rnwi "sk-[a-zA-Z0-9]" src/ .env 2>/dev/null; then
  echo "CRITICAL: Potential OpenAI/API key detected!"
  exit 1
else
  echo "OK: No raw API keys found in source code."
fi
echo "Security audit passed successfully."
