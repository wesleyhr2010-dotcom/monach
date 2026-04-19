#!/usr/bin/env bash
set -euo pipefail

URL="${PAPER_MCP_URL:-http://127.0.0.1:29979/mcp}"
PAYLOAD='{"jsonrpc":"2.0","method":"get_basic_info","params":{},"id":1}'

echo "[MCP Health] Checking Paper MCP at: $URL"
    response=$(curl -sS -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$URL" || true)
    echo "$response"
    # If the method is not found, attempt discovery
    if echo "$response" | grep -q "Method not found" 2>/dev/null; then
      echo "Method not found for get_basic_info. Running MCP discovery..."
      bash "$(dirname "$0")/mcp-discover.sh" || true
    fi

if [[ -z "$response" ]]; then
  echo "No response from MCP. Is the Paper MCP server running and accessible?" >&2
  exit 1
fi

echo "MCP response received. If you see an error object, check server logs." 
