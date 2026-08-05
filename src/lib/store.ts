// Unified state store: localStorage always works offline; when Firebase env
// config is present (.env.local locally / GitHub Secrets in CI), the same
// state syncs in real time across every device and collaborator.
//
// Security model (deployed site):
//   - READ  : public (anyone can view the tracker)
//   - WRITE : only signed-in allowed accounts (enforced by firestore.rules)
//   - Accounts are Firebase email/password users, mapped from simple
//     usernames: "martin" -> martin@c30swap.app. No passwords in this repo.
//
// State shape (single Firestore doc: projects/c30-awd-swap/state/shared):
//   tasks:  string[]                checked phase task ids
//   verify: string[]                checked verification item ids
//   prices: Record<string, string>  part id -> current price text

export interface SharedState {
  tasks: string[];
  verify: string[];
  prices: Record<string, string>;
}

const LOCAL_KEY = "c30-shared-state-v1";
const EMPTY: SharedState = { tasks: [], verify: [], prices: {} };

function loadLocal(): SharedState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as SharedState) };
    // One-time migration from the pre-sync per-hook keys
    const tasks = JSON.parse(localStorage.getItem("c30-phase-tasks") ?? "[]");
    const verify = JSON.parse(localStorage.getItem("c30-verify-items") ?? "[]");
    const prices = JSON.parse(localStorage.getItem("c30-part-prices") ?? "{}");
    return { tasks, verify, prices };
  } catch {
    return { ...EMPTY };
  }
}

let current: SharedState = loadLocal();
const listeners = new Set<() => void>();
let writeRemote: ((s: SharedState) => void) | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function saveLocal() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(current)); } catch { /* ignore */ }
}

function emit() {
  saveLocal();
  listeners.forEach((fn) => fn());
  if (writeRemote) {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => writeRemote?.(current), 400); // debounce bursts
  }
}

export function getState(): SharedState {
  return current;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function mutate(fn: (s: SharedState) => SharedState): void {
  current = fn(current);
  emit();
}

// ---------------------------------------------------------------------------
// Auth state
// ---------------------------------------------------------------------------
export interface AuthSnapshot {
  user: string | null; // display username, e.g. "martin"
  ready: boolean;      // false until first auth event (or sync disabled)
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
};

export const SYNC_ENABLED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const AUTH_DOMAIN_SUFFIX = "@c30swap.app";

let authSnap: AuthSnapshot = { user: null, ready: !SYNC_ENABLED };
const authListeners = new Set<() => void>();
let authApi: {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} | null = null;

function setAuth(user: string | null) {
  authSnap = { user, ready: true };
  authListeners.forEach((fn) => fn());
}

export function getAuth(): AuthSnapshot {
  return authSnap;
}

export function subscribeAuth(fn: () => void): () => void {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

/** Editing is always allowed in local-only mode; in sync mode it needs login. */
export function canEdit(): boolean {
  return !SYNC_ENABLED || authSnap.user !== null;
}

export async function signIn(username: string, password: string): Promise<void> {
  if (!authApi) throw new Error("Cloud sync is not configured on this build.");
  await authApi.signIn(username.trim().toLowerCase(), password);
}

export async function signOut(): Promise<void> {
  await authApi?.signOut();
}

export interface VidaConfig {
  origin: string; // e.g. https://casitaor.duckdns.org (home vida-auth service)
  updatedAt: string;
  docs: number;
  images: number;
  diagrams: number;
}

// Last-resort origin for unauthenticated health pings (hostname is public in
// the repo's Caddyfile anyway); signed-in flows always prefer Firestore config.
export const VIDA_FALLBACK_ORIGIN = "https://casitaor.duckdns.org:8443";

/**
 * One-shot read of the VIDA config doc. Firestore rules restrict this
 * document to the two project accounts, so call it only when signed in.
 * Returns null when the import has not been configured yet (or on error).
 */
export async function getVidaConfig(): Promise<VidaConfig | null> {
  if (!SYNC_ENABLED) return null;
  try {
    const [{ getApps, getApp, initializeApp }, firestore] = await Promise.all([
      import("firebase/app"),
      import("firebase/firestore"),
    ]);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const ref = firestore.doc(
      firestore.getFirestore(app),
      "projects/c30-awd-swap/state/vida"
    );
    const snap = await firestore.getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data() as Record<string, unknown>;
    if (!d.origin) return null;
    return {
      origin: String(d.origin).replace(/\/+$/, ""),
      updatedAt: String(d.updatedAt ?? ""),
      docs: Number(d.docs ?? 0),
      images: Number(d.images ?? 0),
      diagrams: Number(d.diagrams ?? 0),
    };
  } catch (err) {
    console.warn("VIDA config unavailable:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// VIDA auth bridge: keeps the service worker supplied with a fresh Firebase
// ID token so it can attach Authorization headers to vida-origin requests.
// ---------------------------------------------------------------------------
let vidaAuthLast: { origin: string; token: string | null } | null = null;
let vidaAuthWired = false;

function postVidaAuth() {
  if (!vidaAuthLast) return;
  navigator.serviceWorker?.controller?.postMessage({
    type: "SET_VIDA_AUTH",
    ...vidaAuthLast,
  });
}

/** Re-post the last known VIDA origin/token to the SW (call before fetches). */
export function pokeVidaAuth() {
  postVidaAuth();
}

/** Fresh Firebase ID token for the current user (null if signed out). */
export async function getFreshIdToken(): Promise<string | null> {
  if (!SYNC_ENABLED) return null;
  try {
    const [{ getApps, getApp, initializeApp }, authMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return (await authMod.getAuth(app).currentUser?.getIdToken()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Wire Firebase ID-token events to the service worker. Idempotent.
 * Call once the signed-in user opens the VIDA section.
 */
export async function syncVidaAuth(origin: string): Promise<void> {
  if (!SYNC_ENABLED || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const [{ getApps, getApp, initializeApp }, authMod] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);

    const push = async () => {
      const u = auth.currentUser;
      vidaAuthLast = { origin, token: u ? await u.getIdToken() : null };
      postVidaAuth();
    };

    await push();
    if (!vidaAuthWired) {
      vidaAuthWired = true;
      authMod.onIdTokenChanged(auth, () => void push());
      navigator.serviceWorker.addEventListener("controllerchange", postVidaAuth);
    }
  } catch (err) {
    console.warn("VIDA auth sync unavailable:", err);
  }
}

// ---------------------------------------------------------------------------
// Firebase wiring (dynamic import: only loaded when config is present)
// ---------------------------------------------------------------------------
export async function initSync(): Promise<void> {
  if (!SYNC_ENABLED) return;
  try {
    const [{ initializeApp }, authMod, firestore] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);

    authMod.onAuthStateChanged(auth, (u) => {
      setAuth(u?.email ? u.email.replace(AUTH_DOMAIN_SUFFIX, "") : null);
    });
    authApi = {
      signIn: async (username, password) => {
        await authMod.signInWithEmailAndPassword(auth, username + AUTH_DOMAIN_SUFFIX, password);
      },
      signOut: () => authMod.signOut(auth),
    };

    const { getFirestore, doc, onSnapshot, setDoc } = firestore;
    const ref = doc(getFirestore(app), "projects/c30-awd-swap/state/shared");

    let applyingRemote = false;
    onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      applyingRemote = true;
      current = { ...EMPTY, ...(snap.data() as SharedState) };
      saveLocal();
      listeners.forEach((fn) => fn());
      applyingRemote = false;
    });

    writeRemote = (s) => {
      if (applyingRemote) return;
      setDoc(ref, { ...s, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {
        /* unauthenticated writes are rejected by rules; local copy kept */
      });
    };
  } catch (err) {
    console.warn("Cloud sync unavailable, continuing local-only:", err);
  }
}
