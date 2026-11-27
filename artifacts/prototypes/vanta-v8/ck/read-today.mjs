import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const R = Object.fromEntries(fs.readFileSync('routes.txt','utf8').trim().split('\n').map(l=>l.split(':')));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('file:///home/user/program_assurance/artifacts/prototypes/vanta-v8/prototype.html');
await p.waitForTimeout(1500);
const all={};
for (const [id,r] of Object.entries(R)) {
 await p.evaluate((r) => window.PA.v3ba.see({ route: r, prog: 'wsx' }), r);
 await p.waitForTimeout(900);
 all[id] = await p.evaluate(() => {
  const m=document.getElementById('main'); const T=(e)=>e?e.innerText.replace(/\s+/g,' ').trim():'';
  const C=(s)=>s.length>90?s.slice(0,88)+'…':s;
  const crumbs=[...m.querySelectorAll('.k3-crumbs > a, .k3-crumbs > span:not(.sep), .crumbs a, .crumbs span:not(.sep)')].map(T).filter(x=>x&&x!=='›');
  const ht=m.querySelector('h1')||m.querySelector('h2,h3');
  const title=T(ht);
  let hdr=ht?ht.closest('header,.ph,.ak-ih,.k3-head')||ht.parentElement.parentElement:m;
  const pills=hdr?[...hdr.querySelectorAll('.pill,.ak-pill,.chip')].map(T).filter(Boolean).slice(0,3):[];
  const acts=hdr?[...hdr.querySelectorAll('button.btn, a.btn, summary.btn')].map(x=>[T(x)||x.getAttribute('aria-label')||'',/ink|pri/.test(x.className)]).filter(x=>x[0]).slice(0,5):[];
  const sub=T(m.querySelector('.k3-sub, .ak-sub, .ph p, header p'));
  const tabs=[...m.querySelectorAll('[role=tab], .ak-tabs > *, .k3-tabs > *')].map(t=>[T(t),t.getAttribute('aria-selected')==='true'||/\bon\b|cur/.test(t.className)]).filter(x=>x[0]).slice(0,10);
  const views=[...m.querySelectorAll('.views .qv, [aria-pressed]')].map(t=>[T(t),t.classList.contains('on')||t.getAttribute('aria-pressed')==='true']).slice(0,8);
  const tools=m.querySelector('.tools, .k3-tools, .toolbar');
  const tb=tools?{ph:(tools.querySelector('input')||{}).placeholder||'', items:[...tools.querySelectorAll('button,summary,select')].map(T).filter(Boolean).slice(0,8)}:null;
  const next=T(m.querySelector('.k3-next'));
  const banners=[...m.querySelectorAll('.ak-banner,.banner,.k3-banner,.callout,.notice')].map(T).slice(0,2).map(C);
  const seen=new Set(); const blocks=[];
  const tbl=(t)=>({cols:[...t.querySelectorAll('thead th')].map(T), rows:[...t.querySelectorAll('tbody tr')].slice(0,10).map(r=>[...r.children].map(T).map(C)), n:t.querySelectorAll('tbody tr').length});
  for(const hd of m.querySelectorAll('h2,h3,h4,.t')){ if(hd===ht) continue; const bl=hd.closest('section,.card,.k3-card,.k3-sec,.panel,details,.ak-card')||hd.parentElement; if(seen.has(bl)) continue; seen.add(bl);
    const t=bl.querySelector('table'); const dl=bl.querySelector('dl');
    const lis=[...bl.querySelectorAll('li, .row, .ak-row')].slice(0,10).map(T).map(C);
    blocks.push({h:T(hd), aside:!!hd.closest('aside,.k3-aside-s'), table:t?tbl(t):null, dl:dl?[...dl.querySelectorAll('dt')].slice(0,14).map(d=>[T(d),C(T(d.nextElementSibling))]):null, li:(t||dl)?[]:lis, text:(t||dl||lis.length)?'':C(T(bl).slice(0,200))});
  }
  [...m.querySelectorAll('table')].filter(t=>![...seen].some(s=>s.contains(t))).forEach(t=>blocks.push({h:'', aside:!!t.closest('aside'), table:tbl(t), foot:T((t.closest('.frame')||t.parentElement).querySelector('.pager'))}));
  const cards=[...m.querySelectorAll('.pcard, .ak-tile, .tile')].slice(0,8).map(T).map(C);
  return {crumbs,title,pills,acts,sub:C(sub),tabs,views,tb,next:C(next),banners,cards,blocks};
 });
}
fs.writeFileSync('x/all2.json', JSON.stringify(all));
await b.close();
