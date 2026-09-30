/**
 * The page the server sends when rendering failed: it stands alone, without the app's stylesheet,
 * so its colours are Ledger's resolved light and dark values, inline. It follows the reader's
 * colour mode as the app does: the mode they chose in the app (`ledger.color-mode`), else the
 * system's.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Page unavailable — Program Assurance</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <script>(function(){try{var m=localStorage.getItem("ledger.color-mode");if(m==="light"||m==="dark")document.documentElement.dataset.colorMode=m;}catch(e){}})();</script>
    <style>
      :root {
        color-scheme: light;
        --surface: oklch(1 0 0);
        --text: oklch(0.22 0.024 258);
        --text-subtle: oklch(0.44 0.02 258);
        --border: oklch(0.6 0.014 258);
        --hovered: oklch(0.22 0.024 258 / 0.06);
        --brand: oklch(0.54 0.19 254);
        --brand-hovered: oklch(0.49 0.185 254);
        --on-brand: oklch(1 0 0);
        --focus: oklch(0.585 0.185 254);
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-color-mode="light"]) {
          color-scheme: dark;
          --surface: oklch(0.196 0.015 285);
          --text: oklch(0.945 0.008 285);
          --text-subtle: oklch(0.81 0.015 285);
          --border: oklch(0.55 0.02 285);
          --hovered: oklch(1 0 0 / 0.07);
          --brand: oklch(0.73 0.145 254);
          --brand-hovered: oklch(0.84 0.1 254);
          --on-brand: oklch(0.196 0.015 285);
          --focus: oklch(0.84 0.1 254);
        }
      }
      :root[data-color-mode="dark"] {
        color-scheme: dark;
        --surface: oklch(0.196 0.015 285);
        --text: oklch(0.945 0.008 285);
        --text-subtle: oklch(0.81 0.015 285);
        --border: oklch(0.55 0.02 285);
        --hovered: oklch(1 0 0 / 0.07);
        --brand: oklch(0.73 0.145 254);
        --brand-hovered: oklch(0.84 0.1 254);
        --on-brand: oklch(0.196 0.015 285);
        --focus: oklch(0.84 0.1 254);
      }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: var(--surface); color: var(--text); display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
      main { max-width: 28rem; width: 100%; text-align: center; padding: 2rem 0; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: var(--text-subtle); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; white-space: nowrap; }
      a:focus-visible, button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
      .primary { background: var(--brand); color: var(--on-brand); }
      .primary:hover { background: var(--brand-hovered); }
      .secondary { background: transparent; color: var(--text); border-color: var(--border); }
      .secondary:hover { background: var(--hovered); }
      @media (forced-colors: active) {
        .primary, .secondary { border-color: ButtonText; }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Page unavailable</h1>
      <p>This page could not be loaded. Retry loading it, or open your workspace.</p>
      <div class="actions">
        <button type="button" class="primary" onclick="location.reload()">Retry loading</button>
        <a class="secondary" href="/">Open workspace</a>
      </div>
    </main>
  </body>
</html>`;
}
