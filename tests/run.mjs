import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {loadData} from '../dist/data.js';
import {respond,indexData} from '../dist/engine.js';
const httpFetch=globalThis.fetch;
globalThis.fetch=async url=>String(url).startsWith('file:')?new Response(await readFile(url)):httpFetch(url);
const start=performance.now(),db=indexData(await loadData());
const loadMs=Math.round(performance.now()-start);
const cases=JSON.parse(await readFile(new URL('./cases.json',import.meta.url),'utf8'));
const normalize=v=>String(v).toLowerCase().replace(/[‘’ʻʼ\x60]/g,"'").replace(/[\s\u00a0\u202f]+/g,'').replace(/,/g,'.');
const adhoc=process.argv.slice(2);
if(adhoc.length){for(const q of adhoc){console.log(q,JSON.stringify(respond(q,'uz',db)));}}
else{
  let ok=0,worst=0;
  for(const c of cases){
    const t=performance.now();
    let r;
    try{r=respond(c.question,c.lang,db);}catch(e){r={status:'error',answer:e.stack};}
    worst=Math.max(worst,performance.now()-t);
    const content=normalize([r.answer,...(r.rows||[]).flat()].join('\n'));
    const checkValue=s=>{
      if(!/^\d+(?:\.\d+)?$/.test(s))return content.includes(normalize(s));
      const pattern=n=>new RegExp('(?<!\\d)'+n.replace('.','\\.')+'(?!\\d)','u').test(content);
      return pattern(s)||(s.includes('.')&&pattern(String(Math.round(Number(s)*100)/100)));
    };
    const values=c.values.every(checkValue);
    const sourced=c.sources.every(s=>r.sources?.some(item=>String(item).includes(s)));
    const pass=(c.expect==='abstain'?['unknown','clarify'].includes(r.status):r.status==='ok'&&values&&sourced) && r.lang===c.lang;
    if(pass)ok++; else console.log('FAIL',c.id,c.question,JSON.stringify(r),{values,sourced});
  }
  console.log(JSON.stringify({passed:ok,total:cases.length,localColdLoadMs:loadMs,slowestWarmMs:Math.ceil(worst)}));if(ok!==cases.length)process.exitCode=1;
}