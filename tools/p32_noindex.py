#!/usr/bin/env python3
"""Keep the prototype out of search results — 2026-09-04.

  A  every .html that has a <head> gets
     <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
     as the first thing after <meta charset>.
  B  a robots.txt at the repo root.

WHAT ACTUALLY DOES THE WORK. The meta tag. GitHub Pages serves a
project site at <user>.github.io/<repo>/, and a crawler only reads
robots.txt at the DOMAIN root — <user>.github.io/robots.txt, which
is served by the user-site repo, not by this one. So the robots.txt
written here is read by nothing on github.io. It is written anyway
for the day the prototype sits on a domain of its own, where it is
the file that counts.

The two must not be made to fight, either: a Disallow that stopped
the crawl would stop the crawler reading the noindex, and a page
that is merely uncrawled can still be listed. So robots.txt asks
for no crawling of the assets and leaves the pages readable, and
every page says noindex for itself.

Idempotent:
    python3 tools/p32_noindex.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = '<meta content="noindex, nofollow, noarchive, nosnippet" name="robots"/>'
SKIP = {'_to_delete', '.git', 'node_modules'}

added, already, fragment = [], 0, []

for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        p = os.path.join(base, f)
        rel = os.path.relpath(p, ROOT)
        s = open(p, encoding='utf-8').read()
        if re.search(r'<meta[^>]+name="robots"', s, re.I):
            already += 1
            continue
        m = re.search(r'<meta charset="[^"]*"\s*/?>', s, re.I)
        if not m:
            fragment.append(rel)          # a partial, not a page
            continue
        s = s[:m.end()] + '\n' + TAG + s[m.end():]
        open(p, 'w', encoding='utf-8').write(s)
        added.append(rel)

open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(
    "# Work in progress. Every page also carries <meta name=\"robots\"\n"
    "# content=\"noindex\">, which is what actually keeps this out of a\n"
    "# search index — a project site on github.io is served under a\n"
    "# domain whose robots.txt lives in another repository, so this\n"
    "# file only takes effect on a domain of its own.\n"
    "#\n"
    "# The pages are left crawlable on purpose: a crawler has to be\n"
    "# able to fetch a page to read the noindex on it.\n"
    "User-agent: *\n"
    "Disallow: /assets/\n"
    "Disallow: /figma-export/\n"
    "Disallow: /partials/\n"
    "\n"
    "# No sitemap. Nothing here asks to be found.\n"
)

print('noindex added to %d file(s)' % len(added))
for r in added:
    print('   +', r)
print('already had it: %d' % already)
if fragment:
    print('fragments with no <head> (left alone): %d' % len(fragment))
print('robots.txt written')
