#!/usr/bin/env python3
"""Eighth round — 2026-08-26 (Daniel's fifth mark-up).

  A  assets   review8.css / mobile8.css on every page.
  B  data     the real stream behind each stop. Until now one video
              stood in for the whole season, so every conference on
              the site showed the Asia West/Pacific still. Each stop
              that FIBA has actually published a stream for carries
              its own id; the rest carry none, and site.js draws no
              video block for a stop with no stream.

              Ids were read off the titles of FIBA3x3's own uploads
              ("RE-LIVE | FIBA 3x3 Nations League 2026 - <conference>
              - Stop <n> | ..."). A stop whose stream could not be
              named with certainty is left empty on purpose: an
              absent block is right, a wrong video is not. In
              production this table is the YouTube Data API's job.

Idempotent: every step is guarded.
    python3 tools/p17_review8.py && python3 tools/bump_assets.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def P(*a):
    return os.path.join(ROOT, *a)


def read(p):
    return open(P(p), encoding='utf-8').read()


def write(p, s):
    open(P(p), 'w', encoding='utf-8').write(s)


PAGES = [f for f in sorted(os.listdir(ROOT))
         if f.endswith('.html') and f not in ('qualification.html',)]

log = []


# ---------------------------------------------------------------- A
def a_assets():
    for f in PAGES:
        s = read(f)
        o = s
        if 'assets/review8.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/review7\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/review8.css?v=1">', s, count=1)
        if 'assets/mobile8.css' not in s:
            s = re.sub(
                r'(<link rel="stylesheet" href="assets/mobile7\.css\?v=[^"]*">)',
                r'\1\n<link rel="stylesheet" href="assets/mobile8.css?v=1">', s, count=1)
        if s != o:
            write(f, s)
            log.append(f + ': review8 / mobile8 linked')


# ---------------------------------------------------------------- B
# conference id -> { stop number: youtube id }
STREAMS = {
    'africa-east':       {1: 'MYKEYULVsKE', 2: 't-_qR1Qht_g', 4: 'dqb7fBPCcpc'},
    'africa-north':      {1: 'FMYpEWd1KW4', 6: 'KGfCzIJiCTU'},
    'africa-south':      {1: 'I5cBHosxn-c', 2: 'VR0M2hmJ6gU', 4: '86DeBrU3EHs'},
    'americas-north':    {1: 'Gc4qxiZlHhc', 2: 'fEbNdVUq7Us', 3: '82_5wo_17zY'},
    'americas-south':    {1: '-Q5eOVU1WPc', 3: 'vTxzXmh7uL8', 4: '7YocyIjNQg0',
                          5: 'Yh2vw7X5cHk', 6: 'LDQKXBUzBEs'},
    'asia-central-east': {4: 'jh6mVvKvUkI'},
    'asia-sea':          {1: '-OJSqSANtgY', 2: 'jrfwfIa7b54'},
    'asia-west-pacific': {6: 'bN9Z4Cf7YMQ'},
    'europe-1':          {1: 'xoo2Jd0v70Y', 2: 'M5sLoCdmqx8', 3: 'IqO5YNazavI',
                          6: 'S70ZrTpZ30E'},
    'europe-2':          {1: 'zIEZv1D9M50', 2: 'nvfMBmYNgXA', 4: '9hxTyZFGwlg',
                          5: 'QSDdctUJR2E'},
    'europe-3':          {1: 'zlhEqDPEhZw', 2: 'i5f92ol9RQ8', 3: 'gx9DmtB7WGw',
                          4: 'g1mdqOqUWw8', 5: 'YwkrxTaqixs', 6: '8x0LZHVQ1ks'},
    'europe-4':          {5: 'vTiSTWoI-vE'},
    'pacific':           {3: '36bpB0_MvII', 4: '726eM_SLj00', 5: '20IplVRzpmc'},
    'u21-asia-1':        {2: '16Zl28QborU', 4: '5XV_U0LHgvo', 5: '9E9DBVliYFY',
                          6: 'PI_FnL1V3q4'},
    'u21-asia-2':        {1: 'c9_xX7yc518', 2: 'ljUvxpoBUmk', 3: '0JALWaHNeAo'},
    'u21-europe-1':      {1: 'trRfTSJ7eRQ', 2: 'D7QSdUOW__M'},
    'u21-europe-3':      {5: 'b_ny79a-BBI', 6: 'b1PFWahA8no'},
}

TODAY = '2026-08-26'


def b_streams():
    p = 'assets/data/events.json'
    events = json.load(open(P(p), encoding='utf-8'))
    hit = miss = 0
    for e in events:
        vid = STREAMS.get(e.get('conference'), {}).get(e.get('number'))
        # a stop that has not happened cannot have a recording of itself
        if vid and (e.get('start') or '9999') > TODAY:
            vid = None
        if vid:
            e['video'] = vid
            e['poster'] = 'https://i.ytimg.com/vi/' + vid + '/hq720.jpg'
            hit += 1
        else:
            e.pop('video', None)
            e.pop('poster', None)
            miss += 1
    open(P(p), 'w', encoding='utf-8').write(
        json.dumps(events, ensure_ascii=False, indent=2) + '\n')
    log.append('events.json: %d stops with a stream, %d without' % (hit, miss))


a_assets()
b_streams()

print('\n'.join(log) if log else 'nothing to do — already applied')
