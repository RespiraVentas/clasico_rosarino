const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:800},locale:'es-AR',isMobile:true,hasTouch:true}); const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(process.argv[2]); await p.waitForTimeout(400);
const cnt=async()=>p.evaluate(()=>document.querySelector('#counter').textContent.trim().replace(/\s+/g,' ').slice(0,80)+' | empty:'+!document.querySelector('#empty').hidden+' rows:'+document.querySelectorAll('#tabla tbody.mt').length);
const q=async v=>{ await p.fill('#q',v); await p.waitForTimeout(350); console.log('q='+JSON.stringify(v).padEnd(22), await cnt()); };
for (const v of ['Kempes','kempes','KÉMPES','  kempes  ','Muñoz','munoz','Newell\'s','Newell’s','newells','cancha de newell\'s','1-0','1–0','2026','%','<b>','"',"\\",'zzzz','.*','( ','']) await q(v);
console.log('errs', errs);
// filter no result
await p.selectOption('#fDec','1900'); await p.waitForTimeout(200); await p.selectOption('#fAnio','2026'); await p.waitForTimeout(300); console.log('1900s+2026', await cnt());
await p.click('#clearBtn'); await p.waitForTimeout(300); console.log('clear', await cnt());
// goleadores
for (const v of ['kempes','KÉMPES','bauza','zzz','','o\'','%']){ await p.fill('#jq',v); await p.waitForTimeout(400); console.log('jq='+v, await p.evaluate(()=>{const s=document.querySelector('#jqSug,.sug,[id*=sug]'); return s? s.textContent.trim().slice(0,90)+' hidden:'+s.hidden : 'nosug'})); }
console.log('errs', errs);
// ambito click goles cell
await p.evaluate(()=>document.querySelector('#ambito').scrollIntoView());
const golTd = p.locator('#ambBody tr.r td').nth(5); await golTd.click(); await p.waitForTimeout(300);
console.log('sheet after goles click hidden:', await p.evaluate(()=>document.querySelector('#sh').hidden), errs);
await b.close();})();
