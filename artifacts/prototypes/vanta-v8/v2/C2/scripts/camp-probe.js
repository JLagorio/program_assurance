return await page.evaluate(() => ({
  s: Object.keys(PA.S).filter((k) => /^(campaign|audit|request|after-audit)/.test(k)),
  moded: [...PA.MODED],
  tabs: [...document.querySelectorAll("#main .ak-tab")].map((t) => t.textContent.trim() + " → " + t.dataset.go),
  nav: document.getElementById("nav").innerHTML.slice(0, 1500),
  protoCls: document.getElementById("proto").className,
  top: document.querySelector("#proto .top").innerHTML.slice(0, 800),
}));
