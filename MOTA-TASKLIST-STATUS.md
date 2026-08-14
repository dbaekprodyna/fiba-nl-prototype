# Mota task list — status against the current build

36 tasks from `NL_designer_task_list_Mota.xlsx`, checked against the design
system and the prototype as they stand.

## Landing page

| ID | Task | Status |
|---|---|---|
| LP-01 | Home entry in the nav | **Done** — the wordmark is Home on desktop, an explicit Home tab on mobile (F-03m). Documented in F-03. |
| LP-02 | Remove the hero banner | **Done** — no hero on T · Home. |
| LP-03 | About section | **Done** — About is a nav item and C-01 AboutBlock exists. Copy is placeholder. |
| LP-04 | Rework keyword placement | **Not started** — copywriting, not design. |
| LP-05 | Rebalance the type scale | **Done** — Foundations defines one scale, every module uses it. |
| LP-06 | White background | **Done** — `--surface-page` is white; only the chrome bars are dark. |
| LP-07 | Benchmark against World Tour | **Done** — the diagnosis document and F-03 follow the WT nav pattern. |
| LP-08 | Accordions to drill into detail | **Done** — S-01 LiveConferenceAccordion, working in the prototype. |
| LP-09 | Reorder into 5 blocks | **Partly** — Status, Qualification, Live, Photos, Search are all present; the mobile order is not yet enforced because there is no mobile layout. |
| LP-10 | Delete Overview / Stat Leaders | **Open question** — S-09 SeasonStatus still shows 18 Conferences / 108 Stops. This is the block LP-10 asks to remove, and it is also the block you asked me to animate. Needs a decision. |
| LP-11 | Qualification in place of Standings | **Done** — R-01 QualificationBoard on the landing page, Standings on its own page. |
| LP-12 | Qualification content spec | **Not done** — currently a general federation table. Needs: only qualified and shortlisted, out of 20, per row position 1–20, country name, flag, status label. |
| LP-13 | Men / Women switch on Qualification | **Not done** — el-02 GenderSwitch exists but is not wired. |
| LP-14 | Live block shows live conferences only | **Partly** — shows conferences that have played; no live flag in the data yet. |
| LP-15 | Remove the games list from the live block | **Done** — the live block is stop number plus standings. |
| LP-16 | Live block = stop number + conference standings | **Done**. |
| LP-17 | Behaviour on a non-live date | **Open question** — unanswered from the deck. My proposal: the strip shows that day's stops; an empty day shows the next one with "Next up". |

## Cross-page naming

| ID | Task | Status |
|---|---|---|
| NM-01 | Append age category to conference names | **Not done** — the live data returns "Africa East", not "Africa East U23". Easy to append, but I would rather take it from the source than invent it. |
| NM-02 | Remove the standalone U23 / U21 column | **Done** — no such column exists. |
| NM-03 | Win ratio and Pts in conference standings | **Done** — R-03 carries both. |

## Standings page

| ID | Task | Status |
|---|---|---|
| ST-01 | Keep Standings in the nav | **Done**. |
| ST-03 | Two concepts only | **Done** — Competition Standings and Qualification. |
| ST-04 | Adapt the WT structure | **Done** — R-02 follows it. |
| ST-05 | Men / Women switch | **Not done** — control is there, not wired. |
| ST-06 | Default table, 12 teams alphabetical | **Partly** — table exists, sorted by points not alphabetically, not capped at 12. |
| ST-07 | Expanded full standings | **Done** — R-02 has the expanded variant. |
| ST-08 | Sorting or search on team names | **Not done** — the field is not wired. |
| ST-09 | Unified qualified / shortlisted view | **Not done** — same as LP-12. |
| ST-10 | End-of-competition state | **Not done** — no variant designed. |

## Conference page

| ID | Task | Status |
|---|---|---|
| CF-01 | Header with stop navigation | **Done** — F-04 SubHeader plus S-02 StopTimeline. |
| CF-02 | Conference standings table | **Done**. |
| CF-03 | Results and schedule by stop | **Blocked** — the module is designed (S-04 GameList) but there are no game scores in the snapshot, so it renders empty. Needs a third data pass. |

## Player page

| ID | Task | Status |
|---|---|---|
| PL-01 | Player identity header | **Done** — E-05, real name, IOC, flag. |
| PL-02 | Season stats block | **Blocked** — E-06 is designed; per-game statistics are not in the snapshot. |
| PL-03 | Game log and media | **Blocked** — same reason. |

## Summary

- **Done: 20** — the design work is largely complete.
- **Not done: 9** — all interaction wiring on the prototype (switches, filters,
  search) plus the Qualification content specification (LP-12 / ST-09 / ST-10).
- **Blocked on data: 3** — everything that needs individual game results.
- **Open questions: 2** — LP-10 (does SeasonStatus stay?) and LP-17 (non-live
  date behaviour).
