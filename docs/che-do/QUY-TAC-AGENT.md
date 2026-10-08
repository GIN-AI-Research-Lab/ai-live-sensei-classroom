# Rules for the coding agent (Gemini 3.8 Flash, high) — read this before EVERY task

You are working on E:\ai-live-sensei-classroom, a Vietnamese JLPT web app (plain HTML/CSS/JS, no build step,
served by server.py). A reviewer (Claude) checks every task you finish. Work exactly as the task brief says.

## Hard rules (a violation = the whole task is rejected)
1. NEVER read, print, copy or open `.env` or `env.js`. NEVER put an API key anywhere. NEVER open a Gemini Live session.
2. Work in the main tree E:\ai-live-sensei-classroom (other agents edit OTHER files at the same time). Do not `git commit`, `git push`,
   `git stash`, `git reset`, `git checkout -- <path>`, `git clean` or `git add`. Leave changes uncommitted; the reviewer commits.
3. Edit ONLY the files the brief lists under "You may edit". Everything else is read-only. If you think another file
   must change, do NOT change it: describe it under "Requests" in your report.
4. Do not add npm/pip dependencies and do not use a CDN. Libraries must already be in vendor/ (GSAP is in vendor/gsap/).
5. Drive C: is almost full. Set TEMP and TMP to E:\sensei-tam\tmp before running node, Chrome or ffmpeg. Never write to C:.
6. Do not touch server.py security rules, curriculum/*.json content, or js/khau-hinh.js / js/sensei-cat-video.js / js/audio-engine.js
   unless the brief explicitly says so.
7. Code comments: Vietnamese WITHOUT diacritics. UI text: Vietnamese WITH diacritics. Keep the existing code style
   (2-space indent, LF line endings, no trailing whitespace, no TypeScript, no framework).

## How to test (mandatory before you report)
- Start your own server: `python -m http.server <free port 3900-3999> --bind 127.0.0.1` from the repo root. Kill it by PID afterwards.
- Always test with the mock lecture: `http://127.0.0.1:<port>/?noLive&moPhong&hat=7&sensei=video` (never a real Gemini session).
- Headless Chrome ONLY over `--remote-debugging-pipe` with your own `--user-data-dir` (other agents share the machine; fixed debug ports get hijacked).
- Run `node --check <file>` on every JS file you changed.
- Use the harnesses named in the brief. They live in
  C:\Users\OS\AppData\Local\Temp\claude\E--ai-live-sensei-classroom\85f3af15-28af-4f9f-8bfc-2fc053ff9125\scratchpad\
  (motion\kiem-thu.mjs and che-do\khung\kiem-che-do.mjs). Read the header of a harness before using it.
- Look at your screenshots yourself before reporting. Do not report "looks fine" without opening the images.

## Definition of done
- Every checklist item in the brief is ticked with evidence (command output or screenshot path).
- No console errors (a 404 for env.js or favicon.ico is expected).
- Pause (Tam dung) returns the static grid; the quiz card returns to its place; ids stay unique.
- No temporary files left inside the repo.

## Report format (write it to the path given in the brief, as Markdown)
1. Files changed (path, one line why each).
2. Checklist with evidence.
3. Test results (command, pass/fail, numbers).
4. Screenshots / video paths.
5. Requests (changes you needed outside your files) and known problems. Be honest: list what does not work.
   Never claim a test passed if you did not run it.
