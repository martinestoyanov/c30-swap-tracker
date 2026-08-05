import { useSyncExternalStore } from "react";
import {
  getAuth,
  subscribeAuth,
  canEdit as storeCanEdit,
  signIn,
  signOut,
  SYNC_ENABLED,
  type AuthSnapshot,
} from "@/lib/store";

export interface Auth extends AuthSnapshot {
  canEdit: boolean;
  syncEnabled: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): Auth {
  const snap = useSyncExternalStore(subscribeAuth, getAuth, getAuth);
  return {
    ...snap,
    canEdit: storeCanEdit(),
    syncEnabled: SYNC_ENABLED,
    signIn,
    signOut,
  };
}
