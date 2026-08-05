# C30 AWD Swap — Build Tracker

> **For AI agents and maintainers: read [AGENTS.md](AGENTS.md) first** — architecture,
> credentials, deploy procedures, and known gotchas are documented there.

Mobile-friendly build tracker for the 2011 Volvo C30 AWD conversion (donor: 2005 S40 AWD M66).
React + TypeScript + Vite + Tailwind + shadcn/ui. Phase checklists, parts/price tracker,
budget roll-up, torque specs, verification list.

State (checkmarks + tracked prices) works offline in localStorage and, once Firebase is
configured, syncs in real time across every device through one shared Firestore document.

**Access model (deployed site): public read, login to edit.**
Anyone with the URL can view the tracker. Editing (checkboxes, price tracking) requires
signing in as one of the project accounts (`martin` / `evi`). Accounts are Firebase
email/password users — passwords live only in Firebase Auth, never in this repo or the
client bundle, so the repo can safely stay public. Enforcement is server-side in
`firestore.rules`, not just in the UI.

## Run locally

```bash
npm install
npm run dev        # http://localhost:8080 (strictPort; Tailscale-friendly, binds 0.0.0.0)
```

## One-time cloud setup (~10 minutes, all free)

### 1. Create the GitHub repo
- github.com → New repository (e.g. `c30-swap-tracker`), public or private.
- Push this folder:
  ```bash
  git init && git add -A && git commit -m "C30 AWD swap tracker"
  git branch -M main
  git remote add origin https://github.com/<you>/c30-swap-tracker.git
  git push -u origin main
  ```

### 2. Create the Firebase project (the sync database)
- console.firebase.google.com → **Add project** (name anything, e.g. `c30-swap-tracker`).
  Disable Google Analytics when offered — not needed.
- Build → **Firestore Database** → Create database → **Start in production mode** → pick a region.
- Build → **Authentication** → Get started → **Sign-in method** → enable **Email/Password**
  (no account-management UI needed; the two accounts are created via API at deploy time).
- Project overview → **Add app** → **Web** (`</>`) → register → copy the config values:
  `apiKey`, `authDomain`, `projectId`.
- Firestore Database → **Rules** → paste the contents of `firestore.rules` from this repo → **Publish**.

### 3. Local sync test (optional)
- Copy `.env.example` → `.env.local`, fill in the three values, `npm run dev`.
- The header badge flips from "Local only" to **"Synced"**.

### 4. Turn on GitHub Pages hosting
- Repo → **Settings** → **Pages** → Source: **GitHub Actions**.
- Repo → **Settings** → **Secrets and variables** → **Actions** → add three secrets:
  `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
  (same values as step 2).
- Push any commit (or Actions → "Deploy to GitHub Pages" → Run workflow).
- Site goes live at `https://<you>.github.io/c30-swap-tracker/`.

### 5. Share it
- Send the URL to anyone — they can read everything. Only signed-in project accounts
  (`martin`, `evi`) can edit. To collaborate on the *code*, add people under
  repo **Settings → Collaborators** (or they can fork + PR).

## Notes

- `dist/` is a plain static build — the same bundle also works on Netlify Drop,
  Cloudflare Pages, or Vercel if you ever prefer those (just set the same three
  env vars in their build settings).
- Firestore free tier (Spark): 50k reads / 20k writes per day — far beyond what
  this tracker will ever use.
- The local Tailscale setup (`start-tracker.cmd`, port 8080, firewall rule) keeps
  working independently; the cloud site does not replace it unless you want it to.
