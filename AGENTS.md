# AGENTS.md — Operations Manual for the C30 AWD Swap Tracker

> **Read this before touching the project.** It documents architecture, credentials,
> deployment, and every environment-specific gotcha already discovered. Written for
> AI agents and humans alike. Last updated: 2026-08-05 (VIDA content service live).

## 1. What this is

Mobile-friendly build tracker for a 2011 Volvo C30 AWD conversion (donor: 2005 S40 AWD M66).
React 19 + TypeScript + Vite 7 + Tailwind 3.4 + shadcn/ui. Six sections: Overview,
Phases (checklists), Parts (price tracker), Budget, Docs (build documentation),
VIDA (auth-gated workshop manual library — see §10).

| Surface | URL | Notes |
|---|---|---|
| **Live site (primary)** | https://martinestoyanov.github.io/c30-swap-tracker/ | GitHub Pages, auto-deploys from `main` |
| **Repo** | https://github.com/martinestoyanov/c30-swap-tracker | Public by design (no secrets in it) |
| **Local dev** | http://localhost:8080 | `npm run dev`, strictPort |
| **Tailscale (LAN fallback)** | http://100.124.10.99:8080 | PC "obelisk"; needs Tailscale running + firewall rule |
| **VIDA content service** | https://casita-ha.tail162aff.ts.net (443) | Tailscale Funnel → home Docker host, Firebase-token gated; see §10 |

## 2. Repository layout

```
src/data/plan.ts            ALL content: phases, parts, budget, torque specs, verify items.
                            Edit data here — sections render from it. Part links point to FCP/IPD.
src/lib/store.ts            State engine: localStorage + Firestore sync + auth. See §3.
src/hooks/useAuth.ts        useAuth() -> { user, canEdit, signIn, signOut, syncEnabled }
src/hooks/usePersistentState.ts  usePersistentSet / usePersistentMap (synced checklists, prices)
src/components/AuthButton.tsx    Header login/logout UI (dialog)
src/sections/               Overview.tsx, Phases.tsx, Parts.tsx, Budget.tsx, Docs.tsx, Vida.tsx
src/pages/Home.tsx          Shell: header, desktop tabs, mobile bottom nav (6 tabs incl. Docs+VIDA)
public/manifest.webmanifest PWA manifest (start_url/scope are "./" on purpose)
public/sw.js                Service worker v3: offline shell; Firebase traffic NEVER cached;
                            VIDA origin requests get auth header injected + cache-first (§10)
public/icons/               Generated PWA icons (regenerate with ../../make_icons.py)
vida-server/                Committed copy of the home-server stack (compose, Caddyfile,
                            Dockerfile.caddy, FastAPI app, test_auth.py) — deploy target is
                            /opt/vida-tracker on the Docker host; see §10
firestore.rules             THE security model — deployed to Firebase, see §3
firebase.json / .firebaserc firebase deploy config (project: c30-swap-tracker).
                            Also has a hosting block (dist + SPA rewrite) — Firebase Hosting
                            is a ready alternative deploy target if Pages is ever dropped.
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
| Home server SSH | `~/.ssh/casita_ed25519` on this PC; pubkey authorized for `casita@192.168.1.10` |
| DuckDNS API token | `/opt/vida-tracker/.env` on the Docker host ONLY (chmod 600). Also visible at duckdns.org account page and in the FreshTomato DDNS config. **Never commit it.** |

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
8. **Firebase Storage is not available on Spark:** since 2024-10-30, provisioning a new
   default bucket requires Blaze; the API 404s and raw GCS create fails with billing
   errors. This is why the VIDA library lives on the home server (§10), not in Storage.
   (`storage.rules` + the firebase.json storage block are dormant Blaze-ready config.)
9. **DuckDNS DNS is flaky:** the first DNS-01 attempt typically SERVFAILs with
   "could not determine zone". Caddy retries every 60s and succeeds — don't tear
   anything down on the first failure.
10. Docker host compose conventions: existing stacks (homelab, watchtower) have stale
    config paths (/data/compose/... doesn't exist) — hands off. Watchtower only updates
    registry images; vida-tracker's images are locally built and left alone.
11. **T-Mobile and corporate networks filter egress to non-standard ports.** The VIDA
    service launched on :8443 and was unreachable from T-Mobile cell data and the
    owner's work network while answering fine from the open internet. Public-facing
    home services must live on 443 (or 80). The 8443 listener may still exist in the
    Caddyfile as a transition leftover — it is safe to remove along with its router rule.
12. **The home ISP blocks INBOUND 443/80 (residential port block)** — proven 2026-08-05:
    hairpin (LAN→WAN IP) worked and DuckDNS was fine, but independent external probes
    (allorigins, jina) could not reach :443, while :8443 inbound had worked. Combined
    with gotcha 11, NO static inbound port satisfies both sides. That deadlock is why
    the public path is Tailscale Funnel (outbound tunnel), not router port forwarding.
    ERR_CONNECTION_CLOSED on the phone (not NAME_NOT_RESOLVED) was the tell that it
    wasn't DNS. Funnel gotchas: needs `funnel` nodeAttr in tailnet policy (enable via
    the link `tailscale funnel` prints), and root/operator on the node
    (`sudo tailscale set --operator=casita`). Portainer owns host :8000 — vida-auth
    binds 127.0.0.1:8100 instead.

## 10. VIDA workshop library (home-server content service)

**Data.** Licensed VIDA 2014D static extraction at `C:\Users\marti\Vida Web Access\vida-manual`
(PC "obelisk"). Imported subset: model 1033 (C30) + 1014 (S40), all sections EXCEPT
diagnostics → 2,528 docs, 7,891 images, 981 diagram SVGs (~356 MB, 11,402 files).
Import pipeline: `..\vida-import\import_vida.py` in the Kimi workspace (NOT in the repo;
contains staging artifacts). Stages: `manifest` → `process` (strips scripts/header/
sidebar/breadcrumbs, keeps relative refs, originals never modified) → `pack` (tarball).

**Server.** Docker host `casita-ha` (192.168.1.10), stack at `/opt/vida-tracker/`
(committed copy in `vida-server/`; compose project `vida-tracker`):

- **Tailscale Funnel (PRIMARY, public path).** The server funnels outbound to
  Tailscale's edge: `https://casita-ha.tail162aff.ts.net` (443, automatic cert,
  IPv4+IPv6 DNS) proxies to `http://127.0.0.1:8100` (vida-auth host bind).
  Enabled via `tailscale funnel --bg --https=443 8100`; requires the `funnel`
  nodeAttr in the tailnet policy (enabled 2026-08-05) and operator rights
  (`tailscale set --operator=casita` done). Check with `tailscale funnel status`.
- `caddy` (SECONDARY, LAN/hairpin only) — custom image with `caddy-dns/duckdns`,
  serving `casitaor.duckdns.org` on 443 + 8443. The home ISP blocks inbound
  443/80 (gotcha 12), so this path only works from the LAN. Kept for local use;
  cert renewal via DNS-01 needs no inbound. Token in `/opt/vida-tracker/.env`.
- `vida-auth` — FastAPI (`vida-server/app/main.py`). Every `/vida/*` request needs
  `Authorization: Bearer <Firebase ID token>`; verifies RS256 against Google certs,
  checks `email in ALLOWED_EMAILS` (martin/evi), caches verified tokens until their
  `exp`. Serves `/opt/vida-tracker/content/vida` read-only; path traversal blocked;
  CORS limited to the tracker origins. `/healthz` is open (uptime checks).
  Bound on host as `127.0.0.1:8100` (Portainer owns 8000).

**App flow.** `Vida.tsx` reads the origin from Firestore doc
`projects/c30-awd-swap/state/vida` (auth-only read in firestore.rules; fields:
origin, docs, images, diagrams, updatedAt) → fetches `index.json` and doc HTML with
explicit Authorization headers → docs render in an srcdoc iframe with `<base>`
injected so relative image/css refs resolve against the vida origin → the service
worker (`sw.js`) holds the current token (posted via `SET_VIDA_AUTH` from
`store.ts syncVidaAuth`) and injects it into subresource requests, caching
responses cache-first for offline garage use.

**Ops.**
```bash
ssh -i ~/.ssh/casita_ed25519 casita@192.168.1.10
cd /opt/vida-tracker
docker compose ps && docker compose logs -f caddy      # status / cert events
docker compose restart vida-auth                       # after app/main.py changes
# smoke test (mint a token via accounts:signInWithPassword first):
docker compose exec -T -e TEST_TOKEN=<idToken> vida-auth python - < test_auth.py
```
Expected: healthz 200; no-auth/bogus → 401; real token → 200; traversal → 404.

**Content updates.** Re-run the import pipeline, scp the tarball, extract over
`/opt/vida-tracker/content/` — no restart needed (files served from disk).

**Moving/changing the origin** (new hostname or port): update the Firestore vida
doc's `origin` field — the app picks it up with no redeploy — plus Caddyfile,
compose ports, and the router forward.

## 8. Related project artifacts (same workspace)

- `..\C30_AWD_Swap_UNIFIED_PROJECT_PLAN.md` — the master build plan (Rev 2); `src/data/plan.ts` derives from it
- `..\C30_AWD_Swap_FCP_Parts_Price_Tracker.xlsx` — spreadsheet version of the parts tracker
- `..\PrimaryProjectData\`, `..\SecondaryProjectData\` — source research docs
- Kimi Blueprint: Dashboard `canvas_9322b6e9-5b80-474a-a6fb-96b8309cf0bd`, widget
  `widget_18927feb-074c-4de8-950c-2e39dff60e95` (legacy in-app tracker; the website supersedes it)

## 9. Rules of engagement for future agents

- Keep the repo free of secrets; keep public-read/write-restricted as the security model.
  The DuckDNS token and any SSH private keys are NEVER committed.
- Prefer editing `src/data/plan.ts` over touching section components.
- After any `firestore.rules` change: redeploy rules AND re-run the §5 E2E check.
- After any `vida-server/` change: redeploy on the Docker host and re-run the §10
  smoke test — the 401s must stay 401. The vida-auth email allowlist stays martin/evi.
- Don't break offline/local-only mode: every feature must degrade gracefully without Firebase config.
- Mobile-first: test layout at phone widths; bottom nav is the mobile primary navigation.
