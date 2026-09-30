/**
 * Sign-in, the workspace's bootstrap states and the session's end, in the browser (G7-14). The
 * flows take a signed-out page and an account; test-session-states.mjs runs them on a disposable
 * one. They read and never save: the only requests they answer themselves are the ones they fail.
 */
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BOOTSTRAP = "**/rest/v1/rpc/ensure_personal_tenant*";
const TOKEN = "**/auth/v1/token*";
const fail = (status, body) => (route) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const signInHeading = (page) =>
  page.getByRole("heading", { level: 1, name: "Sign in to Program Assurance", exact: true });
const field = (page, name) => page.getByRole("textbox", { name, exact: true });
/** The password input: a password field has no textbox role, so it is found by its label. */
const passwordOf = (scope) => scope.locator('input[type="password"]');

async function submitCredentials(page, email, password) {
  await field(page, "Email").fill(email);
  await passwordOf(page).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

/** The account menu in the side nav's footer; on a phone the side nav opens first. */
async function openAccountMenu(page, email) {
  const account = page.getByRole("button", { name: new RegExp(escape(email)) }).first();
  if (!(await account.isVisible()))
    await page.getByRole("button", { name: "Expand side navigation", exact: true }).click();
  await account.click();
}

/** The text of the elements an element's aria-describedby names. */
const description = (locator) =>
  locator.evaluate((element) =>
    (element.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim(),
  );

/**
 * @param {import("playwright").Page} page a page in its own context, signed out
 * @param {{ origin: string; email: string; password: string; log?: (line: string) => void }} account
 */
export async function checkSessionStates(page, { origin, email, password, log = console.log }) {
  const context = page.context();
  // A deep link while signed out: the sign-in screen stands in for the route and keeps its address.
  await page.goto(`${origin}/work`);
  await expect(signInHeading(page)).toBeVisible();
  await expect(page).toHaveTitle("Sign in — Program Assurance");
  await expect(page.getByRole("main")).toHaveCount(1);

  // A refused password: the form stays, keeps what was typed, says what fixes it beside the field
  // and puts focus on the password.
  await page.route(
    TOKEN,
    fail(400, {
      code: "invalid_credentials",
      error_code: "invalid_credentials",
      msg: "Invalid login credentials",
    }),
  );
  await submitCredentials(page, email, "not-the-password");
  await expect(page.getByRole("alert").filter({ hasText: "Could not sign in" })).toBeVisible();
  await expect(passwordOf(page)).toBeFocused();
  await expect
    .poll(() => description(passwordOf(page)))
    .toContain("Email or password is incorrect");
  await expect(field(page, "Email")).toHaveValue(email);
  await expect(page).toHaveURL(`${origin}/work`);
  await page.unroute(TOKEN);
  log("PASS a refused password keeps the form, says what fixes it and focuses the password");

  // The workspace fails to open: Workspace unavailable, with Retry and Sign out.
  await page.route(BOOTSTRAP, fail(500, { message: "Injected bootstrap failure" }));
  await submitCredentials(page, email, password);
  const unavailable = page.getByRole("heading", {
    level: 1,
    name: "Workspace unavailable",
    exact: true,
  });
  await expect(unavailable).toBeVisible();
  await expect(page).toHaveTitle("Workspace unavailable — Program Assurance");
  await expect(
    page.getByRole("alert").filter({ hasText: "The workspace could not be opened" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await page.unroute(BOOTSTRAP);
  // Retry opens the page the reader asked for before signing in.
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
  await expect(page).toHaveURL(`${origin}/work`);
  log("PASS a failed bootstrap offers Retry and Sign out, and Retry opens the deep link");

  // A slow bootstrap: a busy main with a spoken, then shown, status until the workspace opens.
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const slow = async (route) => {
    await held;
    await route.continue();
  };
  await page.route(BOOTSTRAP, slow);
  await page.reload();
  const busy = page.locator('main[aria-busy="true"]');
  await expect(busy).toHaveCount(1);
  await expect(busy.getByRole("status")).toHaveText("Loading workspace…");
  await expect(busy.getByRole("heading", { level: 1 })).toHaveCount(1);
  release();
  await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
  await expect(busy).toHaveCount(0);
  await page.unroute(BOOTSTRAP, slow);
  log("PASS a slow bootstrap shows a busy main with a loading status, then the page");

  // The session ends in another tab while a Create task draft is open: the draft and the page
  // stay behind Sign in again, and signing in as the same person carries on.
  await page.getByRole("button", { name: "Create task", exact: true }).first().click();
  const createTask = page.getByRole("dialog", { name: "Create task", exact: true });
  await expect(createTask).toBeVisible();
  const draft = "A draft that outlives its session";
  await createTask.getByRole("textbox", { name: "Title" }).fill(draft);
  const other = await context.newPage();
  try {
    await other.goto(`${origin}/work`);
    await expect(other.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
    await openAccountMenu(other, email);
    await other.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await expect(signInHeading(other)).toBeVisible();
    await expect(other.getByRole("status").filter({ hasText: "You signed out" })).toBeVisible();
    await expect(signInHeading(other)).toBeFocused();
  } finally {
    await other.close();
  }
  const again = page.getByRole("alertdialog", { name: "Sign in again", exact: true });
  await expect(again).toBeVisible();
  await expect(passwordOf(again)).toBeFocused();
  await expect(again).toContainText(email);
  // Escape keeps the prompt: only signing in again, or signing out, ends it.
  await page.keyboard.press("Escape");
  await expect(again).toBeVisible();
  await passwordOf(again).fill(password);
  await again.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(again).toBeHidden();
  await expect(createTask).toBeVisible();
  await expect(createTask.getByRole("textbox", { name: "Title" })).toHaveValue(draft);
  log("PASS a session that ends elsewhere keeps the draft behind Sign in again, and carries on");

  // Closing the draft asks first; discarding it leaves the reader on the page, still signed in.
  await createTask.getByRole("button", { name: "Cancel", exact: true }).click();
  const discard = page.getByRole("alertdialog", { name: "Discard changes?", exact: true });
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(createTask).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();

  // Signing out here, with nothing open, returns to the sign-in form on its heading.
  await openAccountMenu(page, email);
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(signInHeading(page)).toBeVisible();
  await expect(signInHeading(page)).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "You signed out" })).toBeVisible();
  log("PASS signing out returns to the sign-in form, on its heading, saying so");
}
