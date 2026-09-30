# AILO Web - working rules

## TODO tracking (wajib)

All work on this project is tracked in [TODO.md](TODO.md) so progress survives a crash, power cut or new session.

- **Before starting** any task: read TODO.md, pick up whatever is marked `[~]` (in progress) first.
- **When starting** a task: mark it `[~]` and save the file.
- **When finishing** a task: mark it `[x]`, add a short note (what changed, commit hash, how it was verified) and save.
- **New work** (user request, QA finding, bug found while testing): add it to TODO.md before doing it.
- Never mark something `[x]` that wasn't verified (typecheck/lint/build at minimum; Playwright on live for UI work). If it was only partly verified, say so in the note.
- Keep TODO.md committed together with the code change it describes.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked / needs the user's decision.

## Deploy

- Commit to `main`, push, then on the server: `cd /home/ailolabs/apps/ailo && git checkout -- package-lock.json; ~/bin/redeploy-ailo`
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Standing decisions (from the user)

- Colours follow the logo palette (teal #00809D, orange #F37121); font Poppins everywhere; no "→"/"←" arrow glyphs.
- Only lecturers (role `dosen`) and admins have accounts. Members have no login; lab bookings use the member card number.
- Interior public pages: header = logo + Back button only (homepage keeps the full nav).
- Lecturer submissions (research, projects, news, profile) always go through admin review.
