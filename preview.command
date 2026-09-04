#!/bin/bash
# ------------------------------------------------------------------
# FIBA 3x3 Nations League prototype — local preview
#
# Double-click this file. It serves this folder over http on port 8420
# and opens the home page in your browser. Close the Terminal window
# (or press Ctrl-C) to stop it.
#
# It has to be http and not a double-clicked index.html: the pages read
# their data with fetch(), and a browser refuses that on a file:// URL.
# ------------------------------------------------------------------
cd "$(dirname "$0")" || exit 1
PORT=8420

PY=$(command -v python3 || command -v python)
if [ -z "$PY" ]; then
  echo "python3 was not found. Install the Xcode command line tools with:"
  echo "    xcode-select --install"
  read -r -p "Press return to close."
  exit 1
fi

if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already serving — reusing it."
else
  "$PY" -m http.server $PORT >/dev/null 2>&1 &
  SRV=$!
  trap 'kill $SRV 2>/dev/null' EXIT INT TERM
  sleep 1
fi

BASE="http://localhost:$PORT"
cat <<TXT

  FIBA 3x3 Nations League — prototype
  ------------------------------------------------------------------
  Home, live season (Wed 26 Aug)   $BASE/index.html
  Off season   (Mon 31 Aug)        $BASE/index.html#hero=nl&season=off
  Pre season   (Mon 31 Aug, 2027   $BASE/index.html#hero=nl&season=pre
               dates published)
  Standings                        $BASE/standings.html
  Conferences                      $BASE/conferences.html
  Design system                    $BASE/system/index.html

  The four states are also the four links at the top right of every
  page: Hero / No hero / Off season / Pre season.

  Leave this window open. Close it to stop the server.
  ------------------------------------------------------------------

TXT
open "$BASE/index.html"
wait
