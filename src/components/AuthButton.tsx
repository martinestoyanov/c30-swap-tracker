import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogIn, LogOut, UserRound } from "lucide-react";

export default function AuthButton() {
  const { user, syncEnabled, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!syncEnabled) return null; // local-only build: editing is open, no login

  if (user) {
    return (
      <button
        onClick={() => void signOut()}
        className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-muted"
        title="Sign out"
      >
        <UserRound className="h-3.5 w-3.5 text-emerald-600" />
        {user}
        <LogOut className="h-3 w-3 text-muted-foreground" />
      </button>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
      setOpen(false);
      setPassword("");
    } catch {
      setError("Wrong username or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]">
          <LogIn className="h-3.5 w-3.5" /> Sign in to edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Viewing is open to everyone. Editing requires a project account.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Input
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !username || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
