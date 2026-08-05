# AGENTS.md — Operations Manual for the C30 AWD Swap Tracker

> **Read this before touching the project.** It documents architecture, credentials,
> deployment, and every environment-specific gotcha already discovered. Written for
> AI agents and humans alike. Last updated: 2026-08-05 (post-PWA deploy).

## 1. What this is

Mobile-friendly build tracker for a 2011 Volvo C30 AWD conversion (donor: 2005 S40 AWD M66).
React 19 + TypeScript + Vite 7 + Tailwind 3.4 + shadcn/ui. Four sections: Overview,
Phases (checklists), Parts (price tracker), Budget (torque specs, verification list).

| Surface | URL | Notes |
|---|---|---|
| **Live site (primary)** | https://martinestoyanov.github.io/c30-swap-tracker/ | GitHub Pages, auto-deploys from `main` |
| **Repo** | https://github.com/martinestoyanov/c30-swap-tracker | Public by design (no secrets in it) |
| **Local dev** | http://localhost:8080 | `npm run dev`, strictPort |
| **Tailscale (LAN fallback)** | http://100.124.10.99:8080 | PC "obelisk"; needs Tailscale running + firewall rule |

## 2. Repository layout

```
src/data/plan.ts            ALL content: phases, parts, budget, torque specs, verify items.
                            Edit data here — sections render from it. Part links point to FCP/IPD.
src/lib/store.ts            State engine: localStorage + Firestore sync + auth. See §3.
src/hooks/useAuth.ts        useAuth() -> { user, canEdit, signIn, signOut, syncEnabled }
src/hooks/usePersistentState.ts  usePersistentSet / usePersistentMap (synced checklists, prices)
src/components/AuthButton.tsx    Header login/logout UI (dialog)
src/sections/               Overview.tsx, Phases.tsx, Parts.tsx, Budget.tsx
src/pages/Home.tsx          Shell: header, desktop tabs, mobile bottom nav
public/manifest.webmanifest PWA manifest (start_url/scope are "./" on purpose)
public/sw.js                Service worker: offline shell; Firebase traffic NEVER cached
public/icons/               Generated PWA icons (regenerate with ../../make_icons.py)
firestore.rules             THE security model — deployed to Firebase, see §3
firebase.json / .firebaserc firebase deploy config (project: c30-swap-tracker)
.github/workflows/deploy.yml  GitHub Pages deploy (npm ci -> build -> deploy-pages)
start-tracker.cmd           Windows launcher for local dev server (see §6)
allow-port-8080-ADMIN.cmd   One-time firewall rule (Run as administrator)
```

## 3. State, sync, and security model

**One Firestore document holds all shared state:**
`projects/c30-awd-swap/state/shared` in database `(default)`, project `c30-swap-tracker`.

```
{ tasks: string[], verify: string[], prices: Record<string,string>, updatedAt: string }
```

- `store.ts` subscribes via `onSnapshot` (real-time), debounces writes 400ms,
  and always keeps a localStorage mirror (`c30-shared-state-v1`) so the app works offline.
- **Read: public. Write: two accounts only** — enforced server-side in `firestore.rules`:
  `martin@c30swap.app`, `evi@c30swap.app` (both Firebase email/password users).
- The app maps short usernames to emails: login "martin" -> `martin@c30swap.app`.
- **NO passwords, tokens, or secrets in this repo — ever.** The Firebase web config
  (apiKey etc.) is public-by-design; security comes from the rules, not from hiding keys.
- When Firebase env vars are absent, the app runs local-only (header badge shows
  "Local only"); `canEdit()` is true in that mode. With sync on, editing requires login.
- Service worker (`public/sw.js`) caches only same-origin static assets; Firestore/Auth
  API calls bypass the cache entirely.

## 4. Credentials & where they live

| What | Where |
|---|---|
| Firebase web config (local dev) | `.env.local` in repo root — **gitignored, never commit** |
| Same, for CI build | GitHub Secrets: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` |
| GitHub CLI auth | `gh auth login` keyring, user `martinestoyanov` (scopes: repo, workflow) |
| Firebase CLI auth | `C:\Users\marti\.config\configstore\firebase-tools.json` (OAuth tokens; login as martinestoyanov@gmail.com) |
| Project accounts | Firebase Auth users `martin@c30swap.app` / `evi@c30swap.app` (passwords known to owner only) |

Portable tools in the workspace (not the repo): `C30 Swap\tools\bin\gh.exe`.
Node/npm on this PC: `C:\Users\marti\AppData\Local\Programs\kimi-desktop\resources\resources\runtime\`
(`node.exe`, `npm.cmd`, `npx.cmd` — NOTE: directly in `runtime\`, NOT `runtime\node\`).
In Git Bash, `npm`/`npx` aren't on PATH: shim with
`printf '#!/bin/sh\nexec npm.cmd "$@"\n' > /tmp/bin/npm` (same for npx) and use `PATH=/tmp/bin:$PATH`.

## 5. Common operations

```bash
cd "C:\Users\marti\Documents\Kimi\Workspaces\C30 Swap\c30-swap-site"
export PATH=/tmp/bin:$PATH          # after creating the shims (see §4)

npm run dev                          # local dev on :8080 (strictPort — fails loudly if taken)
npm run build                        # tsc type-check + production build to dist/
npx firebase deploy --only firestore:rules   # after editing firestore.rules

git add -A && git commit -m "..." && git push   # push to main = auto-deploy to live site
```

**Content changes** (new part, task, spec): edit `src/data/plan.ts`, build, push. That's it.

**Add another editor account** (example with REST + the web API key):
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<VITE_FIREBASE_API_KEY>
{"email":"newname@c30swap.app","password":"<6+ chars>"}
```
Then add the email to the `in [...]` list in `firestore.rules` and redeploy rules.

**Verify the security model end-to-end** (should stay green after any rules change):
```
DOC="https://firestore.googleapis.com/v1/projects/c30-swap-tracker/databases/(default)/documents/projects/c30-awd-swap/state/shared"
curl "$DOC"                                  # 200 (public read OK)
curl -X PATCH "$DOC" -d '{...}'              # 403 (public write blocked)
# sign in via accounts:signInWithPassword, then PATCH with Authorization: Bearer <idToken> -> 200
```

## 6. Windows host specifics (Tailscale fallback path)

- `vite.config.ts`: `host: true` (binds 0.0.0.0), `port: 8080`, `strictPort: true`.
  strictPort matters: without it Vite silently hops to 8081, breaking the firewall
  rule and bookmarks. Do not remove it.
- **Firewall:** inbound TCP 8080 must be allowed (rule "C30 Swap Tracker (Tailscale 8080)";
  recreate by running `allow-port-8080-ADMIN.cmd` as administrator). Without it, LAN/
  Tailscale devices time out even though localhost works.
- **Auto-start:** `C30-Tracker-Autostart.cmd` in
  `C:\Users\marti\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
  calls `start-tracker.cmd` at logon. Task Scheduler creation is blocked by policy
  on this machine — don't bother retrying schtasks.
- Port 7100 is used by the Kimi Work preview card and binds loopback only — it is
  NOT the Tailscale server and can never be reached from other devices. Leave it alone.

## 7. Gotchas already burned into this setup (don't rediscover)

1. **Firebase ToS:** brand-new Google accounts get `403 PERMISSION_DENIED` on
   `projects:addFirebase` until the owner clicks through console.firebase.google.com once.
2. **Auth provisioning:** `CONFIGURATION_NOT_FOUND` from every Identity Toolkit API
   until someone clicks **Authentication -> Get started** in the console. There is no
   public API for first-time provisioning. After that, the admin v2 config PATCH works.
3. **Firestore API** must be enabled (`serviceusage.googleapis.com`) before
   `firestore:databases:create`; enable takes ~1 min to propagate.
4. **GitHub Pages subpath:** app must use `HashRouter` (path routing 404s under
   `/c30-swap-tracker/`). Vite `base: './'` + relative manifest/icon hrefs are deliberate.
5. **Git Bash path mangling:** arguments starting with `/` get rewritten to Windows
   paths by MSYS — quote carefully in curl loops.
6. **Killing dev servers:** Git Bash `kill`/`pkill` doesn't reliably stop Windows node
   trees; use `taskkill //PID <pid> //F //T` with the PID from netstat.
7. `npm run build` must pass before pushing — CI runs the same `tsc -b` and will fail
   the deploy on type errors.

## 8. Related project artifacts (same workspace)

- `..\C30_AWD_Swap_UNIFIED_PROJECT_PLAN.md` — the master build plan (Rev 2); `src/data/plan.ts` derives from it
- `..\C30_AWD_Swap_FCP_Parts_Price_Tracker.xlsx` — spreadsheet version of the parts tracker
- `..\PrimaryProjectData\`, `..\SecondaryProjectData\` — source research docs
- Kimi Blueprint: Dashboard `canvas_9322b6e9-5b80-474a-a6fb-96b8309cf0bd`, widget
  `widget_18927feb-074c-4de8-950c-2e39dff60e95` (legacy in-app tracker; the website supersedes it)

## 9. Rules of engagement for future agents

- Keep the repo free of secrets; keep public-read/write-restricted as the security model.
- Prefer editing `src/data/plan.ts` over touching section components.
- After any `firestore.rules` change: redeploy rules AND re-run the §5 E2E check.
- Don't break offline/local-only mode: every feature must degrade gracefully without Firebase config.
- Mobile-first: test layout at phone widths; bottom nav is the mobile primary navigation.
