# tools

One-off scripts used to derive `assets/*.css` from the original
`design-system/*.html` specimen sheets.

| script | what it does |
|---|---|
| `merge.py`   | parses the 6 source stylesheets, resolves conflicts |
| `build.py`   | writes tokens / base / elements / modules / motion / docs CSS |
| `relink2.py` | rebuilds the specimen sheets against the extracted CSS (`system/_check/`) |

**These are archaeology, not a build step.** `assets/*.css` is now the source of
truth and is edited by hand. Do not re-run these — they would overwrite manual work.
