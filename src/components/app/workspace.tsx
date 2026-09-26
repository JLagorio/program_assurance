import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, type RouterHistory } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
  Avatar,
  AvatarFallback,
  avatarInitials,
  Box,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  Heading,
  Inline,
  Input,
  KeyValue,
  PageHeader,
  Shell,
  Spinner,
  Stack,
  Text,
  VisuallyHidden,
  announce,
  toast,
} from "@ledger/design-system";
import { AlertCircle, LogOut } from "lucide-react";
import { database, loadWorkspace, type Workspace } from "@/lib/database";
import { labelFor } from "@/lib/records";

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

type Session = { signOut: () => Promise<void> };
const SessionContext = createContext<Session | null>(null);
/** Signs the reader out of this browser, once every open draft has let them go. */
export function useSignOut(): () => Promise<void> {
  const session = useContext(SessionContext);
  if (!session) throw new Error("A signed-in workspace is required.");
  return session.signOut;
}

/** The page outside the shell: the sign-in form, the workspace loading and its failure. */
export function Screen({
  children,
  busy,
  title,
}: {
  children: ReactNode;
  busy?: boolean | undefined;
  /** The browser title while this screen stands in for the route: "Sign in". */
  title?: string | undefined;
}) {
  return (
    <Inline
      as="main"
      aria-busy={busy ? true : undefined}
      className="min-h-screen"
      alignBlock="center"
      alignInline="center"
    >
      {/* React places a rendered title in the document head; it stands above the route's. */}
      {title && <title>{`${title} — Program Assurance`}</title>}
      <Box padding="space.400" className="w-full max-w-layout-measure">
        <Stack space="space.250">{children}</Stack>
      </Box>
    </Inline>
  );
}

const messageOf = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message ? cause.message : fallback;

/** What a failed sign-in means to the reader, in place of the auth service's own words. */
function signInFailure(cause: unknown) {
  const code =
    typeof cause === "object" && cause !== null && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : "";
  if (code === "invalid_credentials")
    return "Email or password is incorrect. Check both and try again.";
  const name = cause instanceof Error ? cause.name : "";
  if (name === "AuthRetryableFetchError" || name === "TypeError")
    return "The sign-in service could not be reached. Check your connection and try again.";
  return messageOf(cause, "Sign-in failed. Try again.");
}

const PROBE = "programAssuranceLeaveProbe";
let probes = 0;
/**
 * Asks every draft on the page whether the reader may leave it, through the blockers the router
 * runs before a navigation (each draft guard registers one): a dirty draft asks to discard its
 * changes, a pending save refuses. The probe replaces the current address with itself; its own
 * blocker is registered last and always stops that navigation, so reaching it means every draft
 * let the reader go. A draft that keeps the reader stops the probe first; the unreached blocker
 * then waits for the next real navigation, lets it through and resolves no.
 */
function draftsLetGo(history: RouterHistory): Promise<boolean> {
  const id = ++probes;
  return new Promise((resolve) => {
    const release = history.block({
      enableBeforeUnload: false,
      blockerFn: ({ nextLocation }) => {
        release();
        const reached = (nextLocation.state as unknown as Record<string, unknown>)[PROBE] === id;
        resolve(reached);
        return reached;
      },
    });
    const { href, state } = history.location;
    history.replace(href, { ...state, [PROBE]: id });
  });
}

type Phase = "loading" | "signedOut" | "failed" | "ready";

/**
 * The session and the workspace it opens. Signed out, it shows the sign-in form; while the
 * workspace opens, a loading screen; when it cannot open, a failure with Retry and Sign out. A
 * session that ends without the reader signing out here (another tab, an expired refresh) keeps
 * the page and its drafts behind a prompt to sign in again; only a different account, or the
 * reader choosing to sign out, clears it.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  /** The account whose workspace is on screen. */
  const identity = useRef<string | null>(null);
  /** This tab asked to sign out, so the session's end is not a surprise. */
  const leaving = useRef(false);
  const generation = useRef(0);
  /** A load of the workspace is running; it reads the session itself. */
  const opening = useRef(false);
  const focusMain = useRef(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [failure, setFailure] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [expired, setExpiredState] = useState(false);
  const isExpired = useRef(false);
  const setExpired = useCallback((value: boolean) => {
    isExpired.current = value;
    setExpiredState(value);
  }, []);

  const open = useCallback(async ({ keepScreen = false }: { keepScreen?: boolean } = {}) => {
    const run = ++generation.current;
    opening.current = true;
    if (!keepScreen) setPhase("loading");
    try {
      const value = await loadWorkspace();
      if (run !== generation.current) return;
      identity.current = value?.userId ?? null;
      setWorkspace(value);
      setPhase(value ? "ready" : "signedOut");
    } catch (cause) {
      if (run !== generation.current) return;
      setFailure(messageOf(cause, "The workspace could not be opened."));
      setPhase("failed");
    } finally {
      if (run === generation.current) opening.current = false;
    }
  }, []);

  const end = useCallback(() => {
    generation.current++;
    opening.current = false;
    leaving.current = false;
    identity.current = null;
    queryClient.clear();
    setWorkspace(null);
    setExpired(false);
    setSignedOut(true);
    setPhase("signedOut");
  }, [queryClient, setExpired]);

  useEffect(() => {
    const loads = generation;
    void open();
    let unsubscribe = () => {};
    try {
      const { data } = database().auth.onAuthStateChange((event, session) => {
        // Supabase holds its auth lock while this runs: another auth call from here would wait
        // on itself, so anything that reads the session runs on the next task.
        const user = session?.user.id ?? null;
        if (event === "SIGNED_OUT") {
          if (leaving.current) end();
          else if (identity.current !== null) setExpired(true);
          return;
        }
        if (event !== "SIGNED_IN" || user === null) return;
        if (user === identity.current) {
          // Signed in again as the same person: the page carries on and reads its records afresh.
          if (isExpired.current) {
            setExpired(false);
            window.setTimeout(() => void queryClient.invalidateQueries(), 0);
          }
          return;
        }
        // The session the client restores as the page opens is not a new sign-in: the load in
        // flight reads it, and fails with Retry if the account changes before it finishes.
        if (identity.current === null && opening.current) return;
        // Another account, or the first sign-in: nothing of the previous workspace may stay.
        queryClient.clear();
        identity.current = null;
        setWorkspace(null);
        setExpired(false);
        setSignedOut(false);
        focusMain.current = true;
        window.setTimeout(() => void open(), 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* The load error above supplies the actionable configuration message. */
    }
    return () => {
      // A load still in flight belongs to a provider that is gone.
      loads.current++;
      unsubscribe();
    };
  }, [end, open, queryClient, setExpired]);

  // After signing in, start the reader in the page they asked for, not on the body.
  useEffect(() => {
    if (phase !== "ready" || !focusMain.current) return;
    focusMain.current = false;
    const frame = requestAnimationFrame(() =>
      document.querySelector<HTMLElement>("main")?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const signOut = useCallback(async () => {
    if (leaving.current) return;
    if (!(await draftsLetGo(router.history))) return;
    leaving.current = true;
    try {
      const { error } = await database().auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (cause) {
      leaving.current = false;
      toast.add({
        type: "error",
        title: "You are still signed in",
        description: `Signing out did not finish. ${messageOf(cause, "Try again.")}`,
      });
    }
  }, [router]);
  const session = useMemo<Session>(() => ({ signOut }), [signOut]);

  /** Sign out from a screen with no drafts: the failure screen and the expired session. */
  async function leave() {
    leaving.current = true;
    try {
      await database().auth.signOut({ scope: "local" });
    } catch {
      /* The session may already be gone; the local sign-in form is still the way back. */
    }
    end();
  }

  if (phase === "ready" && workspace)
    return (
      <WorkspaceContext.Provider value={workspace}>
        <SessionContext.Provider value={session}>
          {children}
          <SignInAgain open={expired} email={workspace.email} onSignOut={() => void leave()} />
        </SessionContext.Provider>
      </WorkspaceContext.Provider>
    );
  if (phase === "loading") return <WorkspaceLoading />;
  if (phase === "failed")
    return (
      <Screen title="Workspace unavailable">
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Workspace unavailable</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertTitle>The workspace could not be opened</AlertTitle>
          <AlertDescription>Check your connection and retry.</AlertDescription>
        </Alert>
        {failure && (
          <Text as="p" size="small" color="color.text.subtle">
            {failure}
          </Text>
        )}
        <Inline space="space.100" shouldWrap>
          <Button
            variant="primary"
            isLoading={retrying}
            onClick={() => {
              if (retrying) return;
              setRetrying(true);
              void open({ keepScreen: true }).finally(() => setRetrying(false));
            }}
          >
            Retry
          </Button>
          <Button variant="subtle" iconBefore={<LogOut />} onClick={() => void leave()}>
            Sign out
          </Button>
        </Inline>
      </Screen>
    );
  return <SignIn signedOut={signedOut} />;
}

/** The first paint of every visit: nothing for a moment, then a spinner that says what it waits for. */
function WorkspaceLoading() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 400);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <Screen busy>
      <VisuallyHidden as="h1">Program Assurance</VisuallyHidden>
      <Stack space="space.150" alignInline="center">
        {shown && <Spinner size="large" isDecorative />}
        {/* The status is in the page before its words, so they are heard when they arrive. */}
        <Text as="p" role="status">
          {shown ? "Loading workspace…" : ""}
        </Text>
      </Stack>
    </Screen>
  );
}

type Credentials = { email: string; password: string };

function credentialIssues({ email, password }: Credentials) {
  const address = email.trim();
  return {
    email: !address
      ? "Enter your email address."
      : !/^[^\s@]+@[^\s@]+$/.test(address)
        ? "Enter an email address like name@example.com."
        : undefined,
    password: password ? undefined : "Enter your password.",
  };
}

/**
 * The sign-in form. It stays on screen while the credentials are checked, so a failure keeps the
 * values and the place; the workspace's loading screen follows only once they are accepted.
 */
function SignIn({ signedOut }: { signedOut: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState<"form" | "seeded" | null>(null);
  const [failure, setFailure] = useState("");
  const [failures, setFailures] = useState(0);
  const heading = useRef<HTMLElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const failureId = useId();
  const issues: Partial<ReturnType<typeof credentialIssues>> = submitted
    ? credentialIssues({ email, password })
    : {};
  // After signing out, the reader lands on the page's heading, not on the body.
  useEffect(() => {
    if (signedOut) heading.current?.focus();
  }, [signedOut]);
  // After a refused sign-in, on the password, once the fields are enabled again.
  useEffect(() => {
    if (failures) passwordInput.current?.focus();
  }, [failures]);
  async function signIn(credentials: Credentials, via: "form" | "seeded") {
    if (pending) return;
    const found = credentialIssues(credentials);
    setSubmitted(true);
    if (found.email || found.password) {
      setFailure("");
      (found.email ? emailInput : passwordInput).current?.focus();
      return;
    }
    setFailure("");
    // The fields lock while the credentials are checked: a reader who pressed Enter in one waits
    // on the primary, which keeps focus while it loads.
    if (via === "form") submitButton.current?.focus();
    setPending(via);
    announce("Signing in…");
    try {
      const { error } = await database().auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });
      if (error) throw error;
    } catch (cause) {
      setFailure(signInFailure(cause));
      setPending(null);
      setFailures((count) => count + 1);
    }
  }
  const describedBy = failure ? failureId : undefined;
  return (
    <Screen title="Sign in">
      <Stack space="space.100">
        <Heading as="h1" size="large" ref={heading} tabIndex={-1} className="outline-none">
          Sign in to Program Assurance
        </Heading>
        <Text as="p" color="color.text.subtle">
          Manage your programs and their assurance records.
        </Text>
      </Stack>
      {signedOut && !failure && (
        <Alert role="status">
          <AlertTitle>You signed out</AlertTitle>
          <AlertDescription>Sign in again to open your workspace.</AlertDescription>
        </Alert>
      )}
      {failure && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription id={failureId}>{failure}</AlertDescription>
        </Alert>
      )}
      <form
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void signIn({ email, password }, "form");
        }}
      >
        <Stack space="space.200">
          <FieldSet disabled={pending !== null}>
            <Stack space="space.200">
              <Field invalid={issues.email ? true : undefined}>
                <FieldLabel>Email</FieldLabel>
                <Input
                  ref={emailInput}
                  type="email"
                  autoComplete="username"
                  value={email}
                  aria-describedby={describedBy}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {issues.email && <FieldError>{issues.email}</FieldError>}
              </Field>
              <Field invalid={issues.password ? true : undefined}>
                <FieldLabel>Password</FieldLabel>
                <Input
                  ref={passwordInput}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-describedby={describedBy}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {issues.password && <FieldError>{issues.password}</FieldError>}
              </Field>
            </Stack>
          </FieldSet>
          <Button ref={submitButton} type="submit" variant="primary" isLoading={pending === "form"}>
            Sign in
          </Button>
          {seededUser && (
            <Button
              type="button"
              variant="secondary"
              isLoading={pending === "seeded"}
              onClick={() => {
                setEmail(seededUser.email);
                setPassword(seededUser.password);
                void signIn(seededUser, "seeded");
              }}
            >
              Sign in as seeded user
            </Button>
          )}
        </Stack>
      </form>
    </Screen>
  );
}

/**
 * The session ended while the page was open. The page, its drafts and its place stay behind this
 * prompt; signing in again as the same person carries on where they were, and Sign out gives up
 * what was not saved.
 */
function SignInAgain({
  open,
  email,
  onSignOut,
}: {
  open: boolean;
  email: string;
  onSignOut: () => void;
}) {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const [failures, setFailures] = useState(0);
  const passwordInput = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const formId = useId();
  const failureId = useId();
  useEffect(() => {
    if (open) return;
    setPassword("");
    setSubmitted(false);
    setFailure("");
  }, [open]);
  // After a refused sign-in, back on the password once the field is enabled again.
  useEffect(() => {
    if (failures) passwordInput.current?.focus();
  }, [failures]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    if (!password) {
      passwordInput.current?.focus();
      return;
    }
    // The password locks while it is checked; focus waits on the loading primary instead.
    submitButton.current?.focus();
    setPending(true);
    setFailure("");
    try {
      const { error } = await database().auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (cause) {
      setFailure(signInFailure(cause));
      setFailures((count) => count + 1);
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog
      open={open}
      pending={pending}
      onOpenChange={(next, details) => {
        // Only signing in again, or signing out, ends this prompt.
        if (!next) details.cancel();
      }}
    >
      <AlertDialogContent initialFocus={passwordInput}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign in again</AlertDialogTitle>
          <AlertDialogDescription>
            Your session ended, so nothing can be saved until you sign in. What you have not saved
            stays open behind this; signing out discards it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>Could not sign in</AlertTitle>
                  <AlertDescription id={failureId}>{failure}</AlertDescription>
                </Alert>
              )}
              <KeyValue.Group>
                <KeyValue label="Email" wrap>
                  {email}
                </KeyValue>
              </KeyValue.Group>
              <FieldSet disabled={pending}>
                <Field invalid={submitted && !password ? true : undefined}>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    ref={passwordInput}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    aria-describedby={failure ? failureId : undefined}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {submitted && !password && <FieldError>Enter your password.</FieldError>}
                </Field>
              </FieldSet>
            </Stack>
          </form>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button
            variant="subtle"
            onClick={() => {
              if (!pending) onSignOut();
            }}
          >
            Sign out
          </Button>
          <Button
            ref={submitButton}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={pending}
          >
            Sign in
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * The reader's account in the side nav's footer: who is signed in, as a menu with Sign out last.
 * `children` are the shell's own account items, before it.
 */
export function AccountMenu({ children }: { children?: ReactNode }) {
  const workspace = useWorkspace();
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Shell.Profile
            avatar={
              // The name beside it already says who this is.
              <Avatar size="small" aria-hidden="true">
                <AvatarFallback>{avatarInitials(workspace.email, 2)}</AvatarFallback>
              </Avatar>
            }
            name={workspace.email}
            description={labelFor(workspace.role)}
          />
        }
      />
      <DropdownMenuContent align="start">
        {children}
        {children ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
