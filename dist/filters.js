// Deal filters are intersected. An unrecognized qualifier remains for the caller's refusal gate.
export function normalizeFilterText(value) {
  return String(value ?? '').toLowerCase().replace(/ё/g,'е').replace(/[‘’ʻʼ\`´]/g,"'").replace(/[‑–—−]/g,'-').replace(/\s+/g,' ').trim();
}
const clean=normalizeFilterText;
const left='(?<![\\p{L}\\p{N}])', right='(?![\\p{L}\\p{N}])';
const rx=(s,flags='u')=>new RegExp(left+'(?:'+s+')'+right,flags);
const esc=s=>s.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g,'\\$&');
const uzCase="(?:lar(?:i)?|i)?(?:dagi|dan|ning|ni|da|ga|ida|idan|ining|ini)?";
// Products grouped by the codes observed in contracts.csv. Diesel and fuel oil share a code.
const products=[
 ['100199',String.raw`пшениц[ауыей]*|bug'doy`],
 ['100630',String.raw`рис(?:а|у|ом)?(?: шлифованн[а-я]*)?|guruch`],
 ['110100',String.raw`(?:пшеничн[а-я]* )?мук[аиуе](?: пшеничн[а-я]*)?|bug'doy un[i]?|un`],
 ['151219',String.raw`(?:масл[аоу] подсолнечн[а-я]*|подсолнечн[а-я]* масл[аоу])|kungaboqar (?:moy|yog')i?`],
 ['151229',String.raw`(?:масл[аоу] хлопков[а-я]*|хлопков[а-я]* масл[аоу])|paxta (?:moy|yog')i?`],
 ['170199',String.raw`сахар(?:а|ом)?(?:-песок| бел[а-я]*)?|shakar`],
 ['220190',String.raw`(?:питьев[а-я]* вод[ауы]|вод[ауы] питьев[а-я]*)|ichimlik suv[i]?`],
 ['230610',String.raw`шрот[а-я]*(?: хлопков[а-я]*(?: семян)?)?|paxta shrot[i]?`],
 ['230990',String.raw`комбикорм[а-я]*|кормосмес[а-я]*|omuxta yem`],
 ['250100',String.raw`сол[ьи](?: (?:поваренн[а-я]* )?пищев[а-я]*)?|osh tuz[i]?|tuz`],
 ['252020',String.raw`гипс[а-я]*(?: строительн[а-я]*)?|gips`],
 ['252210',String.raw`извест[ьи](?: (?:негашен|строительн)[а-я]*)?|ohak`],
 ['252329',String.raw`портландцемент[а-я]*|цемент[а-я]*(?: портландск[а-я]*)?|sement`],
 ['271012',String.raw`бензин[а-я]*(?: автомобильн[а-я]*)?|benzin`],
 ['271019',String.raw`дизельн[а-я]* топлив[а-я]*|топлив[а-я]* дизельн[а-я]*|dizel(?: yoqilg'i(?:si)?)?`,/дизель/],
 ['271019',String.raw`мазут[а-я]*(?: топочн[а-я]*)?|mazut`,/мазут/],
 ['271112',String.raw`сжиженн[а-я]*(?: углеводородн[а-я]*)? газ[а-я]*|газ[а-я]* сжиженн[а-я]*|suyultirilgan gaz`],
 ['271320',String.raw`битум[а-я]*(?: нефтян[а-я]*)?|bitum`],
 ['280421',String.raw`аргон[а-я]*(?: газообразн[а-я]*)?|argon`], ['280430',String.raw`азот[а-я]*|azot`],
 ['280700',String.raw`серн[а-я]* кислот[а-я]*|кислот[а-я]* серн[а-я]*|sulfat kislota(?:si)?`],
 ['281511',String.raw`каустическ[а-я]* сод[а-я]*|сод[а-я]* каустическ[а-я]*|kaustik soda`],
 ['310210',String.raw`карбамид[а-я]*|мочевин[а-я]*|karbamid`], ['310230',String.raw`аммиачн[а-я]* селитр[а-я]*|селитр[а-я]* аммиачн[а-я]*|ammiakli selitra`],
 ['320810',String.raw`эмал[ьи](?: алкидн[а-я]*)?|emal`], ['390120',String.raw`полиэтилен[а-я]*|polietilen`],
 ['390210',String.raw`полипропилен[а-я]*|polipropilen`], ['390410',String.raw`поливинилхлорид[а-я]*|polivinilxlorid`],
 ['391721',String.raw`труб[а-я]* (?:пэ|полиэтилен[а-я]*)|полиэтилен[а-я]* труб[а-я]*|polietilen quvur`],
 ['440711',String.raw`пиломатериал[а-я]*(?: обрезн[а-я]*)?|arralangan yog'och`],
 ['520100',String.raw`хлоп(?:ок|ка|ку|ком)(?:[- ]сыр(?:ец|ца|цу|цом))?|(?:xom )?paxta(?: xomashyosi)?`],
 ['520512',String.raw`пряж[а-я]*(?: хлоп[а-я]*)?|paxta (?:ipi|kalavasi)|ip kalava`],
 ['690410',String.raw`кирпич[а-я]*(?: керамическ[а-я]*)?|g'isht`], ['700529',String.raw`стекл[аоу](?: (?:листов[а-я]*|флоат))?|shisha`],
 ['720853',String.raw`лист[а-я]* стальн[а-я]* горячекатан[а-я]*|po'lat list`],
 ['721420',String.raw`арматур[а-я]*(?: стальн[а-я]*)?|armatura`], ['721710',String.raw`проволок[а-я]*(?: арматурн[а-я]*)?|armatura sim[i]?`],
 ['740311',String.raw`(?:катод[а-я]* медн[а-я]*|медн[а-я]* катод[а-я]*)|mis katod[i]?`],
 ['760421',String.raw`(?:профил[а-я]* алюминиев[а-я]*|алюминиев[а-я]* профил[а-я]*)|alyuminiy profil[i]?`],
 ['848210',String.raw`подшипник[а-я]*|podshipnik`], ['854449',String.raw`кабел[а-я]*(?: силов[а-я]*)?|kuch kabel[i]?`]
];
const regions=[
 ['andijon viloyati','andijon','андижан'],['buxoro viloyati','buxoro','бухар'],["farg'ona viloyati","farg'ona","ферган"],
 ['jizzax viloyati','jizzax','джизак'],['namangan viloyati','namangan','наманган'],['navoiy viloyati','navoiy','навоий'],
 ['qashqadaryo viloyati','qashqadaryo','кашкадарьин'],['samarqand viloyati','samarqand','самарканд'],
 ['sirdaryo viloyati','sirdaryo','сырдарьин'],['surxondaryo viloyati','surxondaryo','сурхандарьин'],
 ['xorazm viloyati','xorazm','хорезм'],
 ["qoraqalpog'iston respublikasi","qoraqalpog'iston","каракалпакстан"]
];
const monthAliases=['январ[а-я]*|yanvar','феврал[а-я]*|fevral','март[а-я]*|mart','апрел[а-я]*|aprel','ма[ейяю]|may','июн[а-я]*|iyun','июл[а-я]*|iyul','август[а-я]*|avgust','сентябр[а-я]*|sentabr|sentyabr','октябр[а-я]*|oktabr|oktyabr','ноябр[а-я]*|noyabr','декабр[а-я]*|dekabr'];
const yearToken=String.raw`((?:19|20)\d{2})(?:\s*[- ]?\s*(?:yil(?:dagi|ning|dan|da|gacha|i)?|г(?:од[а-я]*|г)?\.?))?`;
function isoDate(day,month,year) {
  const value=new Date(Date.UTC(+year,+month-1,+day));
  return value.getUTCDate()===+day && value.getUTCMonth()===+month-1 && value.getUTCFullYear()===+year?value.toISOString().slice(0,10):null;
}
function dealISO(d){return d.slice(6,10)+'-'+d.slice(3,5)+'-'+d.slice(0,2)}
function periodText(lo,hi){return lo===hi?lo:lo+' … '+hi}
const cache=new WeakMap();
function indexFor(db){
 if(cache.has(db))return cache.get(db);
 const entities=[...db.participants.map(item=>[item,'participants']),...db.brokers.map(item=>[item,'brokers'])];
 const names=new Map();
 for(const [item,table] of entities){
  const full=clean(item.name).replace(/["«»]/g,'').trim();
  for(const key of [full,full.replace(/\s+(?:mchj|aj|ооо|ао|дп|чп|хк|гп|якка тартибдаги тадбиркор)$/u,'').trim()]){
    if(key.length<4) continue;
    const rows=names.get(key)??[]; if(!rows.some(r=>r.item===item)) rows.push({item,table}); names.set(key,rows);
  }
 }
 const index={names,contracts:db.contracts.map(c=>({c,text:clean([c.name,c.brand,c.size,c.grade,c.kind,c.class].join(' '))}))};
 cache.set(db,index); return index;
}
function dates(state, lang) {
 const named=monthAliases.map(x=>'('+x+')').join('|');
 const monthNum=s=>monthAliases.findIndex(x=>rx(x).test(s))+1;
 const ms='(?:'+monthAliases.join('|')+')';
 const uzMonth='(?:-?(?:oy(?:i)?(?:dagi|da|dan|gacha|ning)?|idagi|ida|da|dagi|dan|gacha))?';
 const atoms=[], dateWords=[];
 function mark(pattern,cb){
   state.text=state.text.replace(rx(pattern,'gu'),(...args)=>{
     const token=args[0]; const period=cb(...args);
     if(!period || !period[0] || !period[1]) state.error=lang==='ru'?'Проверьте календарную дату или границы периода.':'Sanani yoki davr chegaralarini tekshiring.';
     dateWords.push(token); atoms.push(period||[]); return ' @date'+(atoms.length-1)+'@ ';
   });
 }
 const daySuffix='(?:\\s*-?(?:kuni|kunida|sana(?:sida)?|dagi|da|dan|gacha))?';
 mark('(\\d{4})-(\\d{2})-(\\d{2})'+daySuffix,(_,y,m,d)=>[isoDate(d,m,y),isoDate(d,m,y)]);
 mark('(\\d{1,2})[./](\\d{1,2})[./](\\d{4})'+daySuffix,(_,d,m,y)=>[isoDate(d,m,y),isoDate(d,m,y)]);
 mark('(\\d{1,2})\\s*[- ]?\\s*('+ms+')\\s+'+yearToken+daySuffix,(_,d,m,y)=>[isoDate(d,monthNum(m),y),isoDate(d,monthNum(m),y)]);
 mark(yearToken+'\\s+(\\d{1,2})\\s*[- ]?\\s*('+ms+')'+daySuffix,(_,y,d,m)=>[isoDate(d,monthNum(m),y),isoDate(d,monthNum(m),y)]);
 const month=(y,m)=>{
  const n=monthNum(m);return [isoDate(1,n,y),isoDate(new Date(Date.UTC(+y,n,0)).getUTCDate(),n,y)];
 };
 mark('('+ms+')'+uzMonth+'\\s+'+yearToken,(_,m,y)=>month(y,m));
 mark(yearToken+'(?:ning)?\\s+('+ms+')'+uzMonth+'(?:\\s+oy(?:i)?(?:da|dagi|dan|ning)?)?',(_,y,m)=>month(y,m));
 const ordinal='([1-4]|iv|iii|ii|i|перв[а-я]*|втор[а-я]*|трет[а-я]*|четверт[а-я]*|birinchi|ikkinchi|uchinchi|to\\x27rtinchi)';
 const quarter=ordinal+'(?:\\s*[- ]?\\s*(?:й|м|ом|ый|ой|chi))?\\s*[- ]?\\s*(?:квартал[а-я]*|chorak(?:dagi|da|dan|ning|i|ida)?|kvartal(?:da|i|ida)?)';
 const q=(y,t)=>{
   const n=+t||({i:1,ii:2,iii:3,iv:4}[t])||(/^(перв|bir)/.test(t)?1:/^(втор|ik)/.test(t)?2:/^(трет|uch)/.test(t)?3:4);
   return [isoDate(1,n*3-2,y),isoDate(new Date(Date.UTC(+y,n*3,0)).getUTCDate(),n*3,y)];
 };
 mark(quarter+'\\s+'+yearToken,(_,t,y)=>q(y,t));
 mark(yearToken+'\\s+'+quarter,(_,y,t)=>q(y,t));
 mark(yearToken,(_,y)=>[y+'-01-01',y+'-12-31']);
 if(!atoms.length || state.error)return;
 let [lo,hi]=atoms[0];
 if(atoms.length===1 && /(?:dan|gacha)$/u.test(dateWords[0])){
   if(/dan$/u.test(dateWords[0]))hi='2026-10-30';else lo='2022-01-01';
 }
 if(atoms.length===2 && dateWords[0].endsWith('dan') && dateWords[1].endsWith('gacha') && /@date0@\s+@date1@/u.test(state.text)){
   state.text=state.text.replace(/@date0@\s+@date1@/u,'@date0@ - @date1@');
 } 
 if(atoms.length===2 && /@date0@\s*(?:[-…]|по|до|dan|с)\s*@date1@/u.test(state.text)){
   hi=atoms[1][1]; state.text=state.text.replace(/(?:с\s+|от\s+)?@date0@\s*(?:[-…]|по|до|dan|с)\s*@date1@/u,' ');
 } else if(atoms.length===2 && /(?:с|от)\s+@date0@\s+по\s+@date1@/u.test(state.text)){
   hi=atoms[1][1];state.text=state.text.replace(/(?:с|от)\s+@date0@\s+по\s+@date1@/u,' ');
 } else if(atoms.length===1){
   const before=state.text.match(/(?:начиная с|после|раньше|до|не позднее|не ранее|с)\s*@date0@/u);
   if(before){
    const exclusive=/^(после|раньше|до)/u.test(before[0]);
    // Open-ended intervals may require data outside the release; ask for both endpoints.
    state.error=lang==='ru'?'Укажите обе границы периода.':'Davrning boshlanish va tugash sanalarini kiriting.'; return;
   }
   // A year alone is valid, but a residual month/quarter must be validated by the caller.
   state.text=state.text.replace('@date0@',' ');
 } else {
   state.error=lang==='ru'?'Укажите один период или один диапазон дат.':'Bitta davr yoki sanalar oralig‘ini ko‘rsating.';return;
 }
 // The file has whole calendar years except 2026, which ends in October.
 if(lo>hi || lo<'2022-01-01' || lo>'2026-10-30' || hi>'2026-12-31' ||
    (hi>'2026-10-30' && hi!=='2026-12-31' && !(lo==='2026-10-01' && hi==='2026-10-31'))){
  state.error=lang==='ru'?'Период выходит за пределы данных (2022 – 30.10.2026).':'Davr mavjud ma’lumotlar chegarasidan tashqarida (2022 – 30.10.2026).';return;
 }
 hi=hi>'2026-10-30'?'2026-10-30':hi;
 state.add(periodText(lo,hi),i=>{const d=dealISO(state.db.deals.get(i,'date'));return d>=lo&&d<=hi});
}
function categorical(state,field,pairs){
 const links=[];
 for(const [value,pattern] of pairs){
  const m=state.text.match(rx(pattern));
  if(m)links.push({value,m});
 }
 if(links.length>1){
  state.error=state.lang==='ru'?'Уточните одно значение для каждого фильтра.':'Har bir filtr uchun bitta qiymatni tanlang.';return;
 }
 if(links.length){
  const {value,m}=links[0];state.text=state.text.replace(m[0],' ');
  state.add(value,i=>state.db.deals.get(i,field)===value);
 }
}
function contractFilter(state,label,predicate){
 const ids=new Set(state.index.contracts.filter(predicate).map(({c})=>c.id));
 if(!ids.size){state.error=state.lang==='ru'?'В справочнике контрактов такого значения нет.':'Shartnomalar ma’lumotnomasida bunday qiymat yo‘q.';return}
 state.sources.add('contracts.csv');
 state.add(label,i=>ids.has(state.db.deals.get(i,'contract')));
}
function detectRegion(state){
 const values=[
 ['toshkent shahri',"(?:г\\.?\\s*|город[а-я]*\\s+)ташкент[а-я]*|ташкент[ае]|toshkent sh(?:ahar|ahr)[a-z']*"],
 ['toshkent viloyati',"ташкентск[а-я]*(?: обл(?:аст[а-я]*|\\.))?|toshkent viloyat[a-z']*"]
 ];
 for(const [value,lat,cyr] of regions)values.push([value,lat+"(?: (?:viloyat|respublika)[a-z']*)?"+uzCase+'|'+(cyr==='каракалпакстан'?'(?:республик[а-я]* )?':'')+cyr+'[а-я]*(?: обл(?:аст[а-я]*|\\.))?']);
 let found=false;
 for(const [v,pattern] of values){
  const match=state.text.match(rx(pattern));if(!match)continue;
  if(found){state.error=state.lang==='ru'?'Уточните один регион склада.':'Ombor joylashgan bitta hududni ko‘rsating.';return;}found=true;
  state.text=state.text.replace(match[0],' ');
  state.add(v,i=>clean(state.db.deals.get(i,'region'))===v);
 }
}
function productFilters(state){
 const matches=[];
 for(const [code,pattern,nameTest] of products){
   const match=state.text.match(rx('(?:'+pattern+')'+uzCase));
   if(match) matches.push({code,match,nameTest});
 }
 // When a more specific name contains a generic one ("paxta moyi"), use the specific name.
 matches.sort((a,b)=>b.match[0].length-a.match[0].length);
 if(matches.length){
   const {code,match,nameTest}=matches[0];
   state.text=state.text.replace(match[0],' ');
   contractFilter(state,match[0]+' · '+code,({c})=>c.hsCode===code && (!nameTest||nameTest.test(clean(c.name))));
 }
 for(const [field,value,pattern] of [
 ['group','Высоколиквидные товары','высоколиквидн[а-я]*(?: товар[а-я]*)?|yuqori likvid(?:li)?(?: tovar[a-z]*)?'],
 ['group','Прочие товары','проч[а-я]* товар[а-я]*|boshqa tovar[a-z]*'],
 ['category','Сельскохозяйственная продукция','сельскохозяйственн[а-я]* продукци[а-я]*|qishloq xo\\x27jaligi mahsulot[a-z]*'],
 ['category','Металлопродукция','металлопродукци[а-я]*|metall mahsulot[a-z]*'],
 ['category','Строительные материалы','строительн[а-я]* материал[а-я]*|qurilish material[a-z]*'],
 ['category','Химическая продукция','химическ[а-я]* продукци[а-я]*|kimyoviy mahsulot[a-z]*'],
 ['category','Промышленные товары','промышленн[а-я]* товар[а-я]*|sanoat tovar[a-z]*'],
 ['category','Нефтепродукты','нефтепродукт[а-я]*|neft mahsulot[a-z]*'],
 ['category','Продовольственные товары','продовольственн[а-я]* товар[а-я]*|oziq[- ]ovqat (?:mahsulot|tovar)[a-z]*'],
 ['category','Полимерная продукция','полимерн[а-я]* продукци[а-я]*|polimer mahsulot[a-z]*']
 ]){
   const m=state.text.match(rx(pattern));if(m){state.text=state.text.replace(m[0],' ');contractFilter(state,value,({c})=>c[field]===value);}
 }
 const code=state.text.match(rx('(?:код(?:у|ом|а)?\\s*(?:товара\\s*)?(?:тн\\s*вэд)?|тн\\s*вэд(?:\\s+код)?|tif\\s*tn(?:\\s+kodi)?|hs(?:\\s+code)?)\\s*[:№#]?\\s*(\\d{6})'));
 if(code){state.text=state.text.replace(code[0],' ');contractFilter(state,'ТН ВЭД '+code[1],({c})=>c.hsCode===code[1]);}
}
function attributes(state){
 const words={1:['1','i','перв[а-я]*','birinchi'],2:['2','ii','втор[а-я]*','ikkinchi'],3:['3','iii','трет[а-я]*','uchinchi'],4:['4','iv','четверт[а-я]*',"to'rtinchi"]};
 for(const [kind,uz,ru] of [['grade','nav','сорт'],['class','sinf','класс']]){
   for(const [n,alternatives] of Object.entries(words)){
     const pattern='(?:'+alternatives.join('|')+')(?:-?го|-?й|-?ый|-?chi)?[-\\s]*(?:'+ru+'[а-я]*|'+uz+uzCase+')';
     const match=state.text.match(rx(pattern));if(!match)continue;
     state.text=state.text.replace(match[0],' ');
     const valueRx=rx('(?:'+alternatives.join('|')+')[-\\s]*'+ru+'[а-я]*');
     contractFilter(state,n+' '+ru,({text})=>valueRx.test(text));
   }
 }
 const high=state.text.match(rx('высш[а-я]* сорт[а-я]*|oliy nav'+uzCase+'|в/с'));
 if(high){state.text=state.text.replace(high[0],' ');contractFilter(state,high[0],({text})=>/высш[а-я]*(?: сорт[а-я]*)?|в\/с/u.test(text));}
 // Alphanumeric brand, size and grade tokens map to the printed values in the catalogs.
 const normAttr=value=>clean(value).replace(/[х×]/g,'x').replace(/аи/g,'ai').replace(/\s+/g,'');
 if(!state.index.attr){
   const byKey=new Map();
   for(const {c} of state.index.contracts)for(const value of [c.brand,c.size,c.class,c.kind]){
     if(!value || value.length<3 || !/[\p{L}]/u.test(value))continue;
     if(/класс|высш|сорт/u.test(clean(value)))continue;
     const k=normAttr(value);
     if(!byKey.has(k))byKey.set(k,new Set());
     byKey.get(k).add(clean(value));
   }
   state.index.attr=[...byKey].sort((a,b)=>b[0].length-a[0].length);
 }
 for(const [key,values] of state.index.attr){
   const pattern=[...values].map(v=>esc(v).replace(/ /g,'\\s*').replace(/х/gu,'[хx×]').replace(/аи/gu,'(?:аи|ai)')).join('|');
   const match=state.text.match(rx('(?:(?:марк[а-я]*|размер[а-я]*)\\s+)?(?:'+pattern+')'));
   if(!match)continue;
   state.text=state.text.replace(match[0],' ');
   contractFilter(state,match[0],({text})=>normAttr(text).includes(key));
 }
}
function entities(state){
 // Remove registered names before interpreting words inside them as regions or commodities.
 const quote=state.text.match(/["«]([^"»]+)["»]/u);
 if(quote){
   const hit=state.index.names.get(clean(quote[1]));
   if(!hit || hit.length!==1){state.error=state.lang==='ru'?'Название отсутствует или неоднозначно. Укажите ИНН или код брокера.':'Nom topilmadi yoki bir nechta yozuvga mos. STIR yoki broker kodini kiriting.';return}
   state.text=state.text.replace(quote[0],hit[0].item.id);
 } else {
   // Exact unquoted directory names. Require full word boundaries and one matching identifier.
   const names=[];
   for(const [name,items] of state.index.names){
     if(!state.text.includes(name))continue;
     const m=state.text.match(rx(esc(name)));if(m)names.push({name,m,items});
   }
   if(names.length){
    names.sort((a,b)=>b.name.length-a.name.length);
    const best=names[0];
    if(best.items.length!==1){state.error=state.lang==='ru'?'Уточните ИНН или код брокера.':'STIR yoki broker kodini aniqlashtiring.';return;}
    state.text=state.text.replace(best.m[0],best.items[0].item.id);
   }
 }
 const idNames=[
 ['seller','продав(?:ец|ца|цом|цу|це)|sotuvchi'+uzCase],['buyer','покупател[а-я]*|xaridor'+uzCase],
 ['sellerBroker','брокер[а-я]* продав[а-я]*|sotuvchi(?:ning)? broker'+uzCase],
 ['buyerBroker','брокер[а-я]* покупател[а-я]*|xaridor(?:ning)? broker'+uzCase]
 ];
 for(const field of ['sellerBroker','buyerBroker','seller','buyer']){
  const pattern=idNames.find(x=>x[0]===field)[1], broker=field.endsWith('Broker');
  const numeric=broker?'(bk\\d{3})':'(\\d{9})';
  const prefix='(?:инн|stir|код(?:ом)?|kod(?:i)?)?\\s*[:№#]?\\s*';
  const m=state.text.match(rx('(?:'+pattern+')\\s*'+prefix+numeric+'(?:\\s*[- ]?\\s*(?:ning|ning\\s+|tomonidan))?')) ||
          state.text.match(rx(numeric+'\\s+(?:'+pattern+')'));
  if(!m)continue;
  const entity=m[1].toUpperCase();state.text=state.text.replace(m[0],' ');
  const table=broker?'brokers':'participants';
  if(!state.db[table].some(item=>item.id===entity)){state.error=state.lang==='ru'?'Идентификатор отсутствует в справочнике.':'Identifikator ma’lumotnomada topilmadi.';return;}
  state.sources.add(table+'.csv');
  state.add(field+' '+entity,i=>state.db.deals.get(i,field)===entity);
 }
 const either=state.text.match(rx('(?:(?:участник[а-я]*|компани[а-я]*|брокер[а-я]*|ishtirokchi|kompaniya|broker|инн|stir)\\s+)?(?:инн\\s+|stir\\s+)?(\\d{9}|bk\\d{3})(?:-?(?:ning|dagi|dan|da))?'));
 if(either){
   const entity=either[1].toUpperCase(), broker=entity.startsWith('BK'), table=broker?'brokers':'participants';
   if(!state.db[table].some(item=>item.id===entity)){state.error=state.lang==='ru'?'Идентификатор отсутствует в справочнике.':'Identifikator ma’lumotnomada topilmadi.';return;}
   const fields=broker?['sellerBroker','buyerBroker']:['seller','buyer'];
   state.text=state.text.replace(either[0],' ');state.sources.add(table+'.csv');
   state.add(fields.join(' / ')+' '+entity,i=>fields.some(f=>state.db.deals.get(i,f)===entity));
 }
 const contract=state.text.match(rx('(?:контракт[а-я]*|shartnoma(?:si|ning)?)(?:\\s+(?:номер[а-я]*|raqam[i]?))?\\s*[:№#]?\\s*(\\d{6})'))||
    state.text.match(rx('(\\d{6})(?:-sonli|[- ]raqamli)?\\s+shartnoma'+uzCase));
 if(contract){
  state.text=state.text.replace(contract[0],' ');contractFilter(state,'№ '+contract[1],({c})=>c.id===contract[1]);
 }
}
export function parseFilters(question,lang,db){
 const predicates=[],labels=[],sources=new Set();
 const state={db,lang,text:clean(question),sources,index:indexFor(db),add(label,test){labels.push(label);predicates.push(test)}};
 const result=()=>({test:i=>!state.error && predicates.every(f=>f(i)),remaining:state.text.replace(/\s+/gu,' ').trim(),labels,sources:[...sources],...(state.error?{error:state.error}:{})});
 if(rx('кроме|исключая|помимо|or|либо|или|котор[а-я]* не|tashqari|bundan mustasno|yoki|emas').test(state.text)){
  state.error=lang==='ru'?'Для этого условия нужна более точная формулировка.':'Bu shartni aniqroq ko‘rsating.';return result();
 }
 entities(state);if(state.error)return result();
 dates(state,lang);if(state.error)return result();
 detectRegion(state);if(state.error)return result();
 const u=uzCase;
 categorical(state,'status',[
 ['Исполнен(Частично)','(?:частично\\s+исполн[а-я]*|исполнен\\s*\\(частично\\)|частичн[а-я]* постав[а-я]*|qisman (?:bajarilgan|ijro etilgan|yetkazib berilgan))'],
 ['Аннулирован(Не оплачен)','аннулирован[а-я]*(?:\\s*\\(не оплачен\\)|\\s+из-за неоплаты)?|bekor qilingan|bekor bo\\x27lgan'],
 ['Не подписан','не подписан[а-я]*|неподписан[а-я]*|imzolanmagan'],
 ['Заключен','(?:со статусом|со статусами|в состоянии|статус)\\s+заключен[а-я]*'],
 ['Ждёт оплату','ждет оплат[а-я]*|ожидающ[а-я]* оплат[а-я]*|to\\x27lovni kut(?:ayotgan|moqda)'],
 ['Новый','нов[ыао][а-я]*|yangi'],
 ['Оплачен','оплаченн?[а-я]*|to\\x27langan'],
 ['Исполнен','полностью исполн[а-я]*|исполн[а-я]*|to\\x27liq (?:bajarilgan|ijro etilgan)|bajarilgan']
 ].map(([v,p])=>[v,p]));
 if(state.error && /частично|qisman|не оплачен\s*\)/u.test(clean(question))){
   // Long status names contain shorter ones. Resolve an exact single long phrase only.
   const input=state.text;
   const partial=rx('(?:частично\\s+исполн[а-я]*|исполнен\\s*\\(частично\\)|qisman (?:bajarilgan|ijro etilgan|yetkazib berilgan))');
   const annulled=rx('аннулирован[а-я]*\\s*\\(не оплачен\\)');
   const m=input.match(partial)||input.match(annulled);
   if(m && !rx('оплачен[а-я]*|исполн[а-я]*|bajarilgan|to\\x27langan').test(input.replace(m[0],' '))){
     state.error=undefined;state.text=input.replace(m[0],' ');
     const v=partial.test(m[0])?'Исполнен(Частично)':'Аннулирован(Не оплачен)';
     state.add(v,i=>db.deals.get(i,'status')===v);
   }
 }
 if(state.error)return result();
 categorical(state,'contractType',[['Экспортный','экспорт[а-я]*|eksport'+u],['Внутренний','внутренн[а-я]*|ichki']]);
 categorical(state,'tradeForm',[['Спот','спот(?:ов[а-я]*)?|spot'+u],['Форвард','форвард[а-я]*|forvard'+u],['Фьючерс','фьючерс[а-я]*|fyuchers'+u]]);
 categorical(state,'type',[
 ['Английский аукцион','английск[а-я]* аукцион[а-я]*|ingliz(?:cha)? (?:auksion|kim oshdi savdo)'+u],
 ['Обратный аукцион','обратн[а-я]* аукцион[а-я]*|teskari (?:auksion|kim oshdi savdo)'+u],
 ['Двусторонний аукцион','двусторонн[а-я]* аукцион[а-я]*|ikki tomonlama (?:auksion|kim oshdi savdo)'+u]]);
 if(state.error)return result();
 productFilters(state);if(state.error)return result();
 attributes(state);
 return result();
}
