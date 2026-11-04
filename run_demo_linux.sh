#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/backend"
python3 -m pip install -r requirements.txt
printf 'Open http://localhost:8000/ in your browser. Press Ctrl+C to stop.\n'
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
