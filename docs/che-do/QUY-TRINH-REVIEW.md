# Review protocol (what Claude does after each Gemini task)

Per task, in order. Stop at the first failure and send the fix list back to Gemini.

1. **Scope check** — `git diff --stat` on the task branch. Any file outside the brief's "You may edit" list -> reject that part.
   Any change to .env/env.js/server.py/curriculum -> reject the whole task.
2. **Secrets and safety** — grep the diff for keys, `apiKey`, `AIza`, `eval(`, `innerHTML` with unescaped data, CDN URLs.
3. **Syntax** — `node --check` on every changed JS file.
4. **Independent tests** (run by the reviewer, not by trusting the report):
   - default-look regression: `kiem-thu.mjs smoke T1 T3 T11 T13 T14 A2 A5 RB --them "&phongCach=mac-dinh"`
   - for a stage mode: `kiem-che-do.mjs <mode> all`
5. **Look at the pictures** — open the side-by-side sheet (live vs prototype) and 3-4 raw screenshots at 1440x900 and 390x844.
   Reject on: empty regions, half-faded text, clipped/cut-off elements, overlapping text, cat covered, wrong furigana, unreadable contrast.
6. **Timing** — highlights/focus must land on the spoken word: cue time minus ~80 ms, focus motion <= 200 ms. Check the log the harness writes.
7. **Performance** — median fps >= 50 during a beat change on 1440x900; no full-screen live blur, no per-frame canvas noise.
8. **Verdict** — ACCEPT (reviewer commits) / FIX (numbered list back to Gemini) / REJECT (revert the branch, rewrite the brief).
   Keep a log line per task: task id, verdict, number of fix rounds, what Gemini got wrong (used to tighten future briefs).

Rule of thumb for the split of work: Gemini writes code from a precise brief; Claude designs, writes the briefs, runs tests and judges visuals.
