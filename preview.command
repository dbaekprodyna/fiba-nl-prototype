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

  FIBA 3x3 Nations League — prototype · review 18
  ------------------------------------------------------------------
  The in-season day is now Wed 12 Aug 2026: two conferences on,
  both with complete results, and Bratislava carrying a real stream.

  START HERE                       $BASE/index.html

  This round, in the order it was asked for
  ------------------------------------------------------------------
  Seeding, waiting on data         $BASE/standings.html
    ...a sortable Seed column showing an em dash until Rob's data
       lands. Also on Statistics and on a federation's cards.

  Search, several teams per        $BASE/index.html
  federation                         ...open the magnifier and type
       Germany   -> four sides      GER   -> Germany first, then Algeria
       U21       -> only U21        women -> only women's sides
       Mombasa   -> who plays there (Kigali is not in the data —
                    it was a dummy string in the mock-up)

  Live now, the World Tour table   $BASE/index.html
    ...the gender switch is at the head of the open accordion now,
       and every stop is a column: the finish over the points it paid.

  Conferences, no Schedule block   $BASE/conferences.html
  Conference, stops as tabs        $BASE/conference.html?id=europe-4
    ...STOP 5 is live, STOP 6 is not played and does not link.
       Stop by stop is gone: it was the standings without two columns.
  A conference running U23 and     $BASE/conference.html?id=africa-north
  U21 in one table

  Statistics, aligned with         $BASE/stats.html
  the player table                   ...Spotlight gone, thirty rows,
       Points added, and an Export button on both tables.

  Federation Overview              $BASE/team.html?ioc=GER
    ...All is the page a federation opens on. GER fields four sides;
       SOM fields two: $BASE/team.html?ioc=SOM

  The month                        $BASE/calendar.html
    ...cards go to a stop; a finished one carries the winner in the
       gender the switch is set to. Click a date to open its list.

  The loading state, held open     $BASE/standings.html#skeleton=hold
    ...el-26 over the real table. Any page takes the hash.

  Off / pre season                 $BASE/index.html#season=off
                                   $BASE/index.html#season=pre
  Design system                    $BASE/system/index.html

  Leave this window open. Close it to stop the server.
  ------------------------------------------------------------------

TXT
open "$BASE/index.html"
wait
