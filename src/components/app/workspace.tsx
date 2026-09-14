import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Field, FieldLabel, Inline, Input, Stack } from "@ledger/design-system";
import { database, loadWorkspace, type Workspace } from "@/lib/database";

const seededUser = (() => {
  if (!import.meta.env.DEV) return null;
  try {
    const url = new URL(import.meta.env["VITE_SUPABASE_URL"]);
    if (
      url.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.port !== "54321" ||
      url.username ||
      url.password
    )
      return null;
    return {
      email: "developer@program-assurance.local",
      password: "local-program-assurance",
    };
  } catch {
    return null;
  }
})();

const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("A signed-in workspace is required.");
  return workspace;
}
export function Screen({ children }: { children: ReactNode }) {
  return (
    <Inline className="min-h-screen" alignBlock="center" alignInline="center">
      <Box padding="space.400" className="w-full max-w-layout-measure">
        <Stack space="space.250">{children}</Stack>
      </Box>
    </Inline>
  );
}
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const identity = useRef<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void loadWorkspace()
      .then((value) => {
        if (active) {
          identity.current = value?.userId ?? null;
          setWorkspace(value);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "Could not load the workspace.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    let unsubscribe = () => {};
    try {
      const { data } = database().auth.onAuthStateChange((event, session) => {
        if (
          event === "SIGNED_OUT" ||
          (event === "SIGNED_IN" && session?.user.id !== identity.current)
        ) {
          queryClient.clear();
          identity.current = session?.user.id ?? null;
          setWorkspace(null);
          setAttempt((value) => value + 1);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* The load error above supplies the actionable configuration message. */
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt, queryClient]);
  async function signIn(credentials: { email: string; password: string }) {
    setError("");
    setLoading(true);
    try {
      const { error } = await database().auth.signInWithPassword(credentials);
      if (error) throw error;
      setPassword("");
      setAttempt((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
      setLoading(false);
    }
  }
  if (loading)
    return (
      <Screen>
        <p role="status">Loading workspace…</p>
      </Screen>
    );
  if (workspace)
    return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
  return (
    <Screen>
      <h1 className="font-heading-large font-semibold">Program Assurance</h1>
      <p className="text-subtle">Sign in to manage your programs and assurance records.</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void signIn({ email, password });
        }}
      >
        <Stack space="space.200">
          <Field>
            <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
            <Input
              id="sign-in-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <Input
              id="sign-in-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary">
            Sign in
          </Button>
          {seededUser && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEmail(seededUser.email);
                setPassword(seededUser.password);
                void signIn(seededUser);
              }}
            >
              Sign in as seeded user
            </Button>
          )}
        </Stack>
      </form>
      {error && (
        <Button variant="subtle" onClick={() => setAttempt((value) => value + 1)}>
          Retry connection
        </Button>
      )}
    </Screen>
  );
}
