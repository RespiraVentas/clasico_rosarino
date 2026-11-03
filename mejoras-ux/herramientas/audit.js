const { chromium } = require('playwright');
const fs = require('fs');
const base = process.argv[2]; const out = process.argv[3]; const path = process.argv[4]||'/';
const widths = (process.env.W||'360,390,768,1280').split(',').map(Number);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b = await chromium.launch();
  const rep = {};
  for (const w of widths){
    const ctx = await b.newContext({viewport:{width:w,height:800}, deviceScaleFactor:1, isMobile:w<700, hasTouch:w<700});
    const p = await ctx.newPage();
    const errs=[]; p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text())}); p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
    p.on('requestfailed',r=>errs.push('FAILED '+r.url().slice(0,100)));
    await p.goto(base+path,{waitUntil:'load'}); await p.waitForTimeout(800);
    // scroll through to trigger lazy stuff
    await p.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,30));} window.scrollTo(0,0);});
    await p.waitForTimeout(500);
    const r = await p.evaluate((w)=>{
      const vw = document.documentElement.clientWidth;
      const over = [];
      for (const el of document.querySelectorAll('body *')){
        const cs = getComputedStyle(el); if (cs.display==='none'||cs.visibility==='hidden') continue;
        const rc = el.getBoundingClientRect(); if (!rc.width) continue;
        if (rc.right > vw+1 || rc.left < -1){
          // ignore if inside a scroll container that clips
          let a = el.parentElement, clipped=false;
          while(a && a!==document.body){ const s=getComputedStyle(a); if(/(auto|scroll|hidden|clip)/.test(s.overflowX)){ const ar=a.getBoundingClientRect(); if(ar.right<=vw+1&&ar.left>=-1){clipped=true;break;} } a=a.parentElement; }
          if(!clipped) over.push((el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'))+' L'+Math.round(rc.left)+' R'+Math.round(rc.right));
        }
      }
      const small=[];
      for (const el of document.querySelectorAll('a,button,input,select,summary,[role=button],[tabindex]')){
        const cs = getComputedStyle(el); if (cs.display==='none'||cs.visibility==='hidden') continue;
        const rc = el.getBoundingClientRect(); if(!rc.width||!rc.height) continue;
        if (rc.width<24||rc.height<24) small.push((el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'))+' '+Math.round(rc.width)+'x'+Math.round(rc.height)+' "'+(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,25)+'"');
      }
      // text truncated
      const cut=[];
      for (const el of document.querySelectorAll('body *')){ const cs=getComputedStyle(el); if(cs.textOverflow==='ellipsis' && el.scrollWidth>el.clientWidth+1) cut.push(el.className+': '+el.textContent.trim().slice(0,30)); }
      return {scrollW:document.documentElement.scrollWidth, vw, over:over.slice(0,40), nOver:over.length, small, cut:cut.slice(0,20)};
    }, w);
    r.errs=errs;
    if (w===360||w===1280){ await p.addScriptTag({content:axeSrc}); r.axe = await p.evaluate(async()=>{ const res = await axe.run(document,{resultTypes:['violations']}); return res.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,ex:v.nodes.slice(0,4).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').split('\n').slice(1,2).join('').slice(0,140))})); }); }
    await p.screenshot({path:`${out}/full-${w}.png`, fullPage:true});
    rep[w]=r; await ctx.close();
  }
  fs.writeFileSync(out+'/rep.json', JSON.stringify(rep,null,1));
  await b.close();
})();
