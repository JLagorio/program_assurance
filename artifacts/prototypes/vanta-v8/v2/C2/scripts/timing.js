return await page.evaluate(async () => {
  const out = {};
  const t0 = performance.now();
  for (let i = 0; i < 5; i++) { document.body.click(); window.PA.v2hubs.count("evidence", "All"); window.PA.v2hubs.count("findings", "All"); window.PA.mywork.data(); window.PA.reviewQueue.total(); }
  out.countsPerNav = Math.round((performance.now() - t0) / 5);
  const routes = ["overview", "controls", "evidence", "findings", "my-work", "home", "review-queue", "people"];
  const t1 = performance.now();
  for (const r of routes) { location.hash = r; await new Promise((res) => setTimeout(res, 0)); }
  out.navAvg = Math.round((performance.now() - t1) / routes.length);
  return out;
});
