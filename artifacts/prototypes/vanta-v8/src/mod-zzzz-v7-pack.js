// Screenshots come in a few pack files (JPEGs end to end) (rv/pack.py), since one artifact version holds at most 512 files.
// An <img> whose src is a packed path (ck/cur-*.jpg, rv/*.jpg) is given its bytes from the pack, fetched once.
// When the packs cannot be fetched (opened from the file), the img keeps its own src.
(function () {
  const P = window.PA_PACK;
  if (!P || !/^https?:/.test(location.protocol)) return;
  const packs = {}, urls = {};
  const pack = (n) => packs[n] || (packs[n] = fetch(P.packs[n]).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }));
  function url(path) {
    if (urls[path]) return urls[path];
    const [n, off, len] = P.files[path];
    return (urls[path] = pack(n).then((buf) => URL.createObjectURL(new Blob([buf.slice(off, off + len)], { type: "image/jpeg" }))));
  }
  function load(img) {
    const src = img.getAttribute("src");
    if (!src || !P.files[src]) return;
    url(src).then((u) => { if (img.getAttribute("src") === src) img.src = u; }, () => {});
  }
  // Images keep their lazy loading: a pack is fetched only once one of its images nears the viewport.
  const near = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { near.unobserve(e.target); load(e.target); } }), { rootMargin: "800px 0px" });
  function fix(img) {
    const src = img.getAttribute("src");
    if (!src || !P.files[src]) return;
    if (img.loading === "lazy") near.observe(img); else load(img);
  }
  const scan = (root) => { if (root.tagName === "IMG") fix(root); if (root.querySelectorAll) root.querySelectorAll("img[src]").forEach(fix); };
  new MutationObserver((ms) => ms.forEach((m) => { if (m.type === "attributes") fix(m.target); else m.addedNodes.forEach((x) => x.nodeType === 1 && scan(x)); }))
    .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  scan(document.documentElement);
})();
