// In-page measurement of one region (the page area or the side panel). Loaded with addInitScript; call window.__measure({ root, vh }).
window.__measure = function ({ root: rootSel, vh }) {
  const root = document.querySelector(rootSel);
  if (!root || root.hidden) return null;
  const R = root.getBoundingClientRect();
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  // Any CSS colour string -> [r,g,b] composited over white, or null when transparent.
  const rgb = (s) => {
    if (!s || s === "none" || s === "transparent" || s.startsWith("url(")) return null;
    if (cache.has(s)) return cache.get(s);
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "rgba(0,0,0,0)"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data; let v = null;
    if (a > 6) { const al = a / 255; v = [Math.round(r * al + 255 * (1 - al)), Math.round(g * al + 255 * (1 - al)), Math.round(b * al + 255 * (1 - al))]; }
    cache.set(s, v); return v;
  };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const oklch = ([r, g, b]) => {
    const R1 = lin(r), G1 = lin(g), B1 = lin(b);
    const l = Math.cbrt(0.4122214708 * R1 + 0.5363325363 * G1 + 0.0514459929 * B1), m = Math.cbrt(0.2119034982 * R1 + 0.6806995451 * G1 + 0.1073969566 * B1), s = Math.cbrt(0.0883024619 * R1 + 0.2817188376 * G1 + 0.6299787005 * B1);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.hypot(A, B); let h = (Math.atan2(B, A) * 180) / Math.PI; if (h < 0) h += 360; return [L, C, h];
  };
  const hex = (c) => "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
  const GREY = 0.016;
  const family = (h) => (h < 40 || h >= 350 ? "red" : h < 115 ? "amber" : h < 170 ? "green" : h < 215 ? "teal" : h < 275 ? "blue" : h < 320 ? "violet" : "pink");
  const cls = (el) => (el.getAttribute && el.getAttribute("class")) || "";
  const isTextEl = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
  const radius = (cs) => parseFloat(cs.borderTopLeftRadius) || 0;
  const visibleBg = (cs) => { const c = rgb(cs.backgroundColor); return c && !(c[0] > 250 && c[1] > 250 && c[2] > 250) ? c : null; };
  const sides = (cs) => ["Top", "Right", "Bottom", "Left"].filter((s) => parseFloat(cs["border" + s + "Width"]) > 0 && !/none|hidden/.test(cs["border" + s + "Style"]) && rgb(cs["border" + s + "Color"])).length;
  const ringShadow = (cs) => cs.boxShadow && cs.boxShadow !== "none" && /0px 0px 0px [1-3]px/.test(cs.boxShadow);
  const anyShadow = (cs) => cs.boxShadow && cs.boxShadow !== "none";
  const SYM = /[←-⇿⌀-⏿■-◿☀-➿⬀-⯿]|[\u{1F300}-\u{1FAFF}]/gu;

  const colours = { text: new Map(), fill: new Map(), border: new Map(), svg: new Map() };
  const tinted = new Set();
  const addC = (bucket, c, above, el) => {
    if (!c) return; const k = hex(c); let e = colours[bucket].get(k);
    if (oklch(c)[1] >= GREY && el !== root) tinted.add(el);
    if (!e) { const [L, C, h] = oklch(c); e = { hex: k, L: +L.toFixed(3), C: +C.toFixed(3), h: Math.round(h), grey: C < GREY, fam: C < GREY ? "grey" : family(h), uses: 0, above: 0, eg: cls(el).split(" ")[0] || el.tagName.toLowerCase() }; colours[bucket].set(k, e); }
    e.uses++; if (above) e.above++;
  };
  const counts = {}; const add = (k, above, n = 1) => { counts[k] = counts[k] || { all: 0, above: 0 }; counts[k].all += n; if (above) counts[k].above += n; };
  const samples = {}; const sample = (k, el) => { samples[k] = samples[k] || new Set(); if (samples[k].size < 8) samples[k].add(cls(el).split(" ").slice(0, 2).join(".") || el.tagName.toLowerCase()); };
  const fonts = new Map(); const marked = new WeakSet(); const hiddenSet = new WeakSet();
  const inHidden = (el) => { for (let p = el; p && p !== root; p = p.parentElement) if (hiddenSet.has(p)) return true; return false; };
  const inMarked = (el) => { for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (marked.has(p)) return true; return false; };
  const mark = (k, el, above) => { marked.add(el); add(k, above); sample(k, el); };
  const els = [root, ...root.querySelectorAll("*")];
  let bigNumbers = { all: 0, above: 0 };
  for (const el of els) {
    if (!el.getClientRects || el.getClientRects().length === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width * r.height === 0 && el.tagName !== "text") continue;
    if (r.right < R.left || r.left > R.right) continue;
    if (inHidden(el)) continue;
    { const ro = (el.getAttribute && el.getAttribute("role")) || "", cc = cls(el);
      if (el !== root && (/^(menu|dialog|listbox|tooltip)$/.test(ro) || /(^|[\s-])(menu|pop|popover|tooltip|dropdown)(\s|$)/.test(cc))) {
        const px = r.left + Math.min(r.width / 2, 20), py = r.top + Math.min(r.height / 2, 12);
        const seen = py >= 0 && py < innerHeight && px >= 0 && px < innerWidth && (() => { const h = document.elementFromPoint(px, py); return h && (h === el || el.contains(h)); })();
        if (!seen) { hiddenSet.add(el); continue; }
      } }
    const above = r.top < vh && r.bottom > Math.max(0, R.top);
    const tag = el.tagName.toLowerCase(), c = cls(el), isSvg = el instanceof SVGElement;
    // colours
    if (isSvg) {
      if (/^(rect|circle|ellipse|path|line|polyline|polygon|text)$/.test(tag)) {
        if (+cs.fillOpacity > 0) addC("svg", rgb(cs.fill), above, el);
        if (cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0) addC("svg", rgb(cs.stroke), above, el);
      }
    } else {
      if (isTextEl(el)) {
        addC("text", rgb(cs.color), above, el);
        const fk = `${parseFloat(cs.fontSize)}px/${cs.fontWeight}`; const f = fonts.get(fk) || { n: 0, above: 0 }; f.n++; if (above) f.above++; fonts.set(fk, f);
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join("");
        const sy = own.match(SYM); if (sy) { add("icon:symbol", above, sy.length); sample("icon:symbol", el); }
        if (parseFloat(cs.fontSize) >= 24 && /^[\s\d.,%:+\-–\/·]+$/.test(own.trim()) && own.trim()) { bigNumbers.all++; if (above) bigNumbers.above++; }
      }
      addC("fill", visibleBg(cs), above, el);
      (cs.backgroundImage.match(/rgba?\([^)]*\)/g) || []).forEach((s) => addC("fill", rgb(s), above, el));
      ["Top", "Right", "Bottom", "Left"].forEach((s) => { if (parseFloat(cs["border" + s + "Width"]) > 0 && !/none|hidden/.test(cs["border" + s + "Style"])) addC("border", rgb(cs["border" + s + "Color"]), above, el); });
      if (anyShadow(cs)) (cs.boxShadow.match(/rgba?\([^)]*\)|oklch\([^)]*\)/g) || []).forEach((s) => { const v = rgb(s); if (v) addC("border", v, above, el); });
    }
    if (el === root) continue;
    // icons
    if (tag === "svg") {
      if (r.width <= 26 && r.height <= 26) { add("icon:svg", above); }
      else if (!inMarked(el)) {
        const circ = el.querySelectorAll("circle").length, dash = [...el.querySelectorAll("circle,path")].some((x) => (x.getAttribute("stroke-dasharray") || getComputedStyle(x).strokeDasharray) !== "none" && (x.getAttribute("stroke-dasharray") || getComputedStyle(x).strokeDasharray));
        const rects = el.querySelectorAll("rect").length, lines = el.querySelectorAll("polyline,path,line").length;
        const k = (circ && dash) || (circ >= 1 && circ <= 3 && rects === 0 && r.width < 140 && Math.abs(r.width - r.height) < 8) ? "gadget:ring/donut (svg)" : r.height <= 48 && r.width >= 50 && lines ? "gadget:sparkline (svg)" : rects >= 9 ? "gadget:bar or heat chart (svg)" : "gadget:chart/diagram (svg)";
        mark(k, el, above);
      }
      continue;
    }
    if (isSvg) continue;
    if (/(^|\s)gl(\s|$)/.test(c)) { add("icon:glyph", above); sample("icon:glyph", el); continue; }
    if (/(^|[\s-])(ic|icon|ico)(\s|$)/.test(c) && r.width <= 28) { add("icon:class", above); continue; }
    const bg = visibleBg(cs), bgN = bg && oklch(bg)[1] >= GREY, txt = (el.textContent || "").trim(), rad = radius(cs);
    // status dots: small coloured round marks with no text
    if (!txt && r.width >= 4 && r.width <= 13 && Math.abs(r.width - r.height) <= 1 && rad >= r.width / 2 - 0.5 && bgN && !inMarked(el)) { add("icon:dot", above); sample("icon:dot", el); continue; }
    if (inMarked(el)) continue;
    // gadgets by class name
    if (/(^|[\s-])ring(\s|$)/.test(c) && /(^|\s)who(\s|$)/.test(c)) { add("icon:glyph", above); sample("icon:glyph", el); continue; }
    const g = /donut/i.test(c) ? "gadget:donut" : /(^|[\s-])ring(\s|$)/.test(c) && r.width >= 14 ? "gadget:ring" : /heat/i.test(c) ? "gadget:heatmap" : /spark/i.test(c) ? "gadget:sparkline" : /tally/i.test(c) ? "gadget:tally (stacked bar)"
      : /phase|stage(?!s?-?t)|stepper/i.test(c) && r.height <= 80 ? "gadget:phase/stage bar" : /(^|[\s-])(map|strip|tilemap)(\s|$)/i.test(c) && el.children.length >= 8 ? "gadget:tile map/strip" : /meter|gauge/i.test(c) ? "gadget:meter"
      : /(^|\s)(bar|prog|progress)(\s|$)|-(prog|bar|mbar|sbar|cbar|colbar|dbar|segb|useg|seg|flowbar|prevbar|fun-bar)(\s|$)|(^|\s)(seg)(\s|$)/i.test(c) && r.height <= 24 && r.width >= 20 ? "bar" : null;
    const kids = [...el.children];
    const colouredKids = kids.filter((k) => { const b = rgb(getComputedStyle(k).backgroundColor); return b && oklch(b)[1] >= GREY && k.getBoundingClientRect().width > 0; });
    if (g === "bar" || (!g && r.height >= 3 && r.height <= 12 && r.width >= 24 && (bg || colouredKids.length) && !txt && kids.length >= 1 && kids.length <= 12 && colouredKids.length >= 1 && kids.every((k) => !k.children.length))) {
      const hues = new Set(colouredKids.map((k) => family(oklch(rgb(getComputedStyle(k).backgroundColor))[2])));
      mark(colouredKids.length >= 2 && hues.size >= 2 ? "gadget:tally (stacked bar)" : "gadget:progress bar", el, above); continue;
    }
    if (g) { mark(g, el, above); continue; }
    // tile strips: many small coloured squares
    if (kids.length >= 10) {
      const small = kids.filter((k) => { const kr = k.getBoundingClientRect(); return kr.width > 0 && kr.width <= 18 && kr.height <= 18; });
      if (small.length >= 10 && small.length >= kids.length * 0.8) { mark("gadget:tile map/strip", el, above); continue; }
    }
    // filter chips and quick views, even when they are buttons
    if (/(^|[\s-])(qv|flt|chip|chips)(\s|$)/.test(c) && r.height <= 36) { mark("pill:chip/filter", el, above); continue; }
    // buttons and tabs
    const role = el.getAttribute("role") || "";
    if (role === "tab" || /(^|[\s-])(sectab|tab)(\s|$)|tab(\s|$)/.test(c) && /^(a|button|span)$/.test(tag) && r.height <= 48) { if (!/table/.test(c)) { mark("tab", el, above); continue; } }
    const btnLook = (sides(cs) >= 3 || ringShadow(cs) || bg) && r.height >= 24 && r.height <= 46 && txt.length <= 48 && rad >= 2;
    if (tag === "button" || role === "button" || /(^|\s)btn(\s|$)/.test(c) || (tag === "a" && btnLook)) {
      if (r.height >= 14) { const filled = bg && (oklch(bg)[0] < 0.5 || bgN); mark(filled ? "button:filled" : "button:outlined/plain", el, above); continue; }
    }
    if (/(^|\s)(ib)(\s|$)/.test(c)) { mark("button:outlined/plain", el, above); continue; }
    // pills, tags, chips, counts
    const pillCls = /(^|[\s-])(pill|pills|badge|tag|tags|chip|chips|qv|flt|status)(\s|$)|-(pill|tag|chip|badge|status|tkchip|fchip|pchip|tochip|modechip|dtag|chipb)(\s|$)/.test(c);
    const pillLook = r.height >= 12 && r.height <= 28 && r.width >= 8 && r.width <= 320 && txt.length >= 1 && txt.length <= 48 && rad >= 2 && (bg || sides(cs) >= 3 || ringShadow(cs)) && !/^(input|select|textarea|td|th|tr|table|li)$/.test(tag);
    if ((pillCls && r.height <= 32 && txt.length <= 60 && !el.querySelector(".pill,.tag")) || pillLook) {
      const k = /pill|status|badge/.test(c) ? (bgN ? "pill:status (toned)" : "pill:status (neutral)") : /tag/.test(c) ? "pill:tag" : /chip|qv|flt/.test(c) ? "pill:chip/filter" : /^[\d,.%+\s]+$/.test(txt) ? "pill:count" : bgN ? "pill:other (toned)" : "pill:other (neutral)";
      mark(k, el, above); continue;
    }
    // banners and alerts
    const wide = r.width >= R.width * 0.45;
    const banCls = /banner|alert|callout|warnbox|notice|(^|[\s-])(warn|note)(\s|$)/.test(c) && r.height >= 24 && r.height <= 200 && r.width >= 200 && (bg || sides(cs) >= 1);
    if (banCls || (["alert", "status", "note"].includes(role) && (bg || sides(cs) >= 3) && r.height >= 24) || (wide && bgN && r.height >= 28 && r.height <= 160 && txt.length >= 8)) { mark(bgN ? "banner (toned)" : "banner (neutral)", el, above); continue; }
    // cards and frames
    if (r.width >= 110 && r.height >= 48 && rad >= 4 && (sides(cs) >= 3 || ringShadow(cs) || (anyShadow(cs) && rad >= 6) || (bg && !/^(td|th|tr|tbody|thead|table)$/.test(tag))) && !/^(td|th|tr|tbody|thead|input|select|textarea)$/.test(tag)) {
      if (el.querySelector("table")) { add("frame:table", above); sample("frame:table", el); }
      else { const nested = (() => { for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (p.__card) return true; return false; })(); el.__card = true; add(nested ? "card:nested" : "card:top", above); sample(nested ? "card:nested" : "card:top", el); }
    }
  }
  const pack = (m) => [...m.values()].sort((a, b) => b.uses - a.uses);
  const all = new Map(); for (const b of ["text", "fill", "border", "svg"]) for (const e of colours[b].values()) { const x = all.get(e.hex) || { ...e, uses: 0, above: 0, in: [] }; x.uses += e.uses; x.above += e.above; x.in.push(b); all.set(e.hex, x); }
  const nonGrey = (m, ab) => [...m.values()].filter((e) => !e.grey && (!ab || e.above));
  // cluster near-identical colours (OKLab distance < 0.03) so anti-aliasing and alpha mixes do not inflate the count
  const clusterN = (list) => { const reps = []; for (const e of list) { const [L, C, h] = [e.L, e.C, (e.h * Math.PI) / 180]; const a = C * Math.cos(h), b = C * Math.sin(h); if (!reps.some(([L2, a2, b2]) => Math.hypot(L - L2, a - a2, b - b2) < 0.03)) reps.push([L, a, b]); } return reps.length; };
  const summary = (ab) => {
    const o = {};
    for (const b of ["text", "fill", "border", "svg"]) o[b] = nonGrey(colours[b], ab).length;
    const ng = nonGrey(all, ab); o.together = ng.length; o.togetherClustered = clusterN(ng); o.hues = [...new Set(ng.map((e) => e.fam))].sort();
    return o;
  };
  const sum = (pre, ab) => Object.entries(counts).filter(([k]) => k.startsWith(pre)).reduce((a, [, v]) => a + (ab ? v.above : v.all), 0);
  const cat = (ab) => ({ pills: sum("pill:", ab), gadgets: sum("gadget:", ab), cards: sum("card:top", ab), cardsNested: sum("card:nested", ab), tableFrames: sum("frame:", ab), banners: sum("banner", ab), buttons: sum("button:", ab), tabs: sum("tab", ab), icons: sum("icon:", ab), bigNumbers: ab ? bigNumbers.above : bigNumbers.all });
  const marks = { all: 0, above: 0 };
  for (const el of tinted) { let p = el.parentElement, nested = false; for (let i = 0; p && p !== root && i < 3; i++, p = p.parentElement) if (tinted.has(p)) { nested = true; break; } if (nested) continue; const rr = el.getBoundingClientRect(); if (rr.width * rr.height === 0 && el.tagName !== "text") continue; marks.all++; if (rr.top < vh && rr.bottom > Math.max(0, R.top)) marks.above++; }
  const tr = [...root.querySelectorAll("tbody tr, [role=row]")].find((t) => t.getBoundingClientRect().height > 0 && !t.closest("thead"));
  const firstRow = tr ? Math.round(tr.getBoundingClientRect().top) : null;
  const ex = [...root.querySelectorAll("*")].filter((e) => e.children.length === 0 && /^example$/i.test((e.textContent || "").trim()) && e.getClientRects().length).length;
  return {
    marks, firstRow, firstRowPct: firstRow == null ? null : Math.round(((firstRow - R.top) / (vh - R.top)) * 100), examples: ex,
    rect: { x: Math.round(R.left), y: Math.round(R.top), w: Math.round(R.width), h: Math.round(Math.min(R.height, vh - R.top)) }, scrollH: root.scrollHeight,
    colours: { all: summary(false), above: summary(true) }, totals: cat(false), above: cat(true), counts,
    fonts: { distinct: fonts.size, distinctAbove: [...fonts.values()].filter((f) => f.above).length, list: [...fonts.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `${k}×${v.n}`) },
    palette: nonGrey(all, false).sort((a, b) => b.uses - a.uses).map((e) => ({ hex: e.hex, fam: e.fam, C: e.C, uses: e.uses, above: e.above, in: e.in.join("+"), eg: e.eg })),
    samples: Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, [...v]])),
  };
};

// Pixel colour load of an image region: share of colourful pixels (OKLCH chroma >= 0.04) and their hue families.
window.__pixels = async function (dataUrl) {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; const n = c.width * c.height;
  const lin = new Float32Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; lin[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  const fam = { red: 0, amber: 0, green: 0, teal: 0, blue: 0, violet: 0, pink: 0 }; let colourful = 0, strong = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) < 10) continue;
    const R1 = lin[r], G1 = lin[g], B1 = lin[b];
    const l = Math.cbrt(0.4122214708 * R1 + 0.5363325363 * G1 + 0.0514459929 * B1), m = Math.cbrt(0.2119034982 * R1 + 0.6806995451 * G1 + 0.1073969566 * B1), s = Math.cbrt(0.0883024619 * R1 + 0.2817188376 * G1 + 0.6299787005 * B1);
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s; const C = Math.hypot(A, B);
    if (C < 0.04) continue; colourful++; if (C >= 0.1) strong++;
    let h = (Math.atan2(B, A) * 180) / Math.PI; if (h < 0) h += 360;
    fam[h < 40 || h >= 350 ? "red" : h < 115 ? "amber" : h < 170 ? "green" : h < 215 ? "teal" : h < 275 ? "blue" : h < 320 ? "violet" : "pink"]++;
  }
  const famPct = Object.fromEntries(Object.entries(fam).map(([k, v]) => [k, +((v / n) * 100).toFixed(3)]));
  return { w: c.width, h: c.height, colourfulPct: +((colourful / n) * 100).toFixed(2), strongPct: +((strong / n) * 100).toFixed(2), famPct, families: Object.entries(famPct).filter(([, v]) => v >= 0.05).map(([k]) => k) };
};
