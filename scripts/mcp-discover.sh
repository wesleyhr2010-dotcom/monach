#!/usr/bin/env bash
set -euo pipefail

URLS=(
"http://127.0.0.1:29979/mcp"
"http://host.docker.internal:29979/mcp"
"http://172.17.0.1:29979/mcp"
)
METHODS=(
"get_basic_info"
"get_selection"
"get_tree_summary"
"get_node_info"
"get_guide"
"write_html"
)

payload_base='{"jsonrpc":"2.0","id":1}'

for url in "${URLS[@]}"; do
  if curl -sS --max-time 2 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"get_basic_info","params":{},"id":1}' "$url" >/dev/null 2>&1; then
    echo "Connected to MCP at $url"
    echo "Probing methods on $url..."
    for m in "${METHODS[@]}"; do
      case "$m" in
        get_basic_info|get_selection)
          params="{}"
          ;;
        get_tree_summary)
          params="{}"
          ;;
        get_node_info)
          params="{\"id\":1}"
          ;;
        get_guide|write_html)
          params="{}"
          ;;
        *)
          params="{}"
          ;;
      esac
      resp=$(curl -sS -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"$m\",\"params\":$params,\"id\":1}" "$url") || true
      echo "  [$m] -> $resp"
    done
    exit 0
  fi
done

echo "Could not connect to any known MCP endpoints."
exit 1
