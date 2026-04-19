#!/usr/bin/env bash
set -euo pipefail

# Auto-detect runtime environment and choose MCP host accordingly

PREFERRED_URL_1="http://127.0.0.1:29979/mcp"
PREFERRED_URL_2="http://host.docker.internal:29979/mcp"

in_docker=false
if [ -f "/.dockerenv" ]; then
  in_docker=true
else
  if [ -f "/proc/1/cgroup" ]; then
    if grep -qE 'docker|kubepod|containerd' /proc/1/cgroup; then
      in_docker=true
    fi
  fi
fi

chosen_url="${PREFERRED_URL_1}"
if [ "$in_docker" = true ]; then
  # In Docker, prefer the host-mapped MCP URL
  if curl -fsS --max-time 2 "$PREFERRED_URL_2" >/dev/null 2>&1; then
    chosen_url="$PREFERRED_URL_2"
  else
    chosen_url="$PREFERRED_URL_1"
  fi
else
  # Not in Docker: default to localhost
  if curl -fsS --max-time 2 "$PREFERRED_URL_1" >/dev/null 2>&1; then
    chosen_url="$PREFERRED_URL_1"
  elif curl -fsS --max-time 2 "$PREFERRED_URL_2" >/dev/null 2>&1; then
    chosen_url="$PREFERRED_URL_2"
  else
    chosen_url="$PREFERRED_URL_1"
  fi
fi

cat > opencode.json <<EOF
{
  "mcp": {
    "paper": {
      "type": "remote",
      "url": "$chosen_url",
      "enabled": true
    }
  }
}
EOF

echo "Wrote opencode.json with Paper MCP URL: $chosen_url"
