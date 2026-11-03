const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const W=+(process.env.VW||390);
const p=await b.newPage({viewport:{width:W,height:800},locale:'es-AR'});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.argv[2]); await p.waitForTimeout(400);
const targets = await p.evaluate(()=>{ const out=[]; const secs={}; document.querySelectorAll('main [data-l],main [data-p],main [data-jug],main [data-gl]').forEach((e,i)=>{ const s=(e.closest('section')||{}).id||'?'; secs[s]=(secs[s]||0)+1; if(secs[s]<=4 && e.getClientRects().length && getComputedStyle(e).visibility!=='hidden'){ e.setAttribute('data-smoke',i); out.push([s,i]); } }); return out; });
const probs=[]; let ok=0;
for(const [s,i] of targets){
  const el=p.locator(`[data-smoke="${i}"]`);
  try{ await el.scrollIntoViewIfNeeded({timeout:1000}); await el.focus(); await p.keyboard.press('Enter'); }catch(e){ probs.push(s+' noclick '+i); continue; }
  await p.waitForTimeout(120);
  const r=await p.evaluate(()=>{ const sh=document.querySelector('#sh'); const d=document.querySelector('dialog.ficha'); return {sh:!sh.hidden, dlg: d&&d.open, txt:(sh.hidden?'':document.querySelector('#shBody').textContent).trim().slice(0,70), act:document.activeElement&&document.activeElement.id}; });
  if(!r.sh && !r.dlg){ probs.push(s+' nada abre '+i); continue; }
  if(/no está disponible|undefined|NaN/.test(r.txt)) probs.push(s+' MAL: '+r.txt);
  // tab trap check
  let escaped=false; for(let k=0;k<25;k++){ await p.keyboard.press('Tab'); const inside=await p.evaluate(()=>{const a=document.activeElement; return a===document.body||!a||!!a.closest('#sh,dialog');}); if(!inside){escaped=true;break;} }
  if(escaped) probs.push(s+' foco se escapa del panel');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  const back=await p.evaluate(i=>{ const a=document.activeElement; return {open:!document.querySelector('#sh').hidden, ret: a && a.getAttribute('data-smoke')===String(i)}; }, i);
  if(back.open) probs.push(s+' no cierra con Escape'); else if(!back.ret) probs.push(s+' foco no vuelve '+i);
  ok++;
}
const agg={}; probs.forEach(x=>{const k=x.replace(/ \d+$/,''); agg[k]=(agg[k]||0)+1});
console.log('probados',ok,'de',targets.length); console.log(agg); console.log('errs',errs.slice(0,5));
await b.close();})();
