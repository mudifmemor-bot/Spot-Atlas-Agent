import { parseFilters } from './filters.js';

const normal = s => s.toLowerCase().replaceAll('ё','е').replace(/[ʼʻ’‘\x60]/g,"'").replace(/[–—]/g,'-');
const bi = (ru, uz, lang) => lang === 'ru' ? ru : uz;
const groups = [
  ['seller', /продав(?:ец|ца|цы|цам|цов|цам|цами)|sotuvchi(?:lar(?:ning|ni|ga)?|ning)?/u,'Продавец','Sotuvchi'],
  ['buyer', /покупател(?:ь|я|и|ям|ей|ями)|xaridor(?:lar(?:ning|ni|ga)?|ning)?/u,'Покупатель','Xaridor'],
  ['sellerBroker', /брокер(?:ы|ов|ам|а)? продавц(?:а|ов)|sotuvchi broker(?:lari|lar)?/u,'Брокер продавца','Sotuvchi brokeri'],
  ['buyerBroker', /брокер(?:ы|ов|ам|а)? покупател(?:я|ей)|xaridor broker(?:lari|lar)?/u,'Брокер покупателя','Xaridor brokeri'],
  ['region', /регион(?:ам|ы|ов|е|ах)?|област(?:ям|и|ей)|hudud(?:lar(?:ga|da|ning)?|da)?|viloyat(?:lar(?:ga|da|ning)?|da)?/u,'Регион склада','Ombor hududi'],
  ['group', /групп(?:а|ы|ам|е) товар(?:а|ов)|tovar guruh(?:lari|i)?/u,'Группа товара','Tovar guruhi'],
  ['category', /категори(?:ям|и|я|й) товар(?:а|ов)|tovar toifa(?:lari|si)?/u,'Категория товара','Tovar toifasi'],
  ['product', /товар(?:ы|ов|ам|а)?|mahsulot(?:lar(?:ning)?|ning)?|tovar(?:lar(?:ning)?|ning)?/u,'Название в карточке','Kartochkadagi nom'],
  ['status', /статус(?:ам|ы|ов)?|состояни(?:ям|я|ю)|holat(?:lar(?:i)?|i)?/u,'Статус','Holat'],
  ['year', /год(?:ам|ы|а|у|ов)|yil(?:lar(?:da|i)?|da)?/u,'Год','Yil'],
  ['month', /месяц(?:ам|ы|а|е|ев)|oy(?:lar(?:da|i)?|da)?/u,'Месяц','Oy'],
  ['date', /дн(?:ям|и|ей)|день|kun(?:lar(?:i|da)?|i)?/u,'Дата','Sana'],
  ['contract', /контракт(?:ам|ы|ов|а)?|shartnoma(?:lar(?:i)?|si)?/u,'Контракт','Shartnoma'],
  ['deal', /сдел(?:ка|ки|ок|ку)|bitim(?:lar(?:ni|i)?|ni)?/u,'Сделка','Bitim']
];
const fields = [groups[2],groups[3],...groups.filter(g=>!['sellerBroker','buyerBroker'].includes(g[0]))];
const err = (lang, msg) => ({status:'clarify',lang,answer:msg || bi('Уточните один показатель, период и условие отбора. Я не могу подтвердить ответ на этот вопрос по реестру.','Bitta ko‘rsatkich, davr va tanlash shartini aniqlashtiring. Bu savolga reyestr asosida tasdiqlangan javob bera olmayman.',lang),sources:[],rows:[],columns:[]});
const boundary = r => new RegExp('(?<![\\p{L}\\d])(?:'+r.source+')(?![\\p{L}\\d])','u');


function grouping(text) {
  let q=text.replace(/и сколько их(?=\s*[?!.]*$)/u,' '), group=null, limit=null, top=false, asc=false;
  let m=q.match(/(?:топ|top|eng yaxshi)[ -]*(\d{1,3})|(?:первые|первых|первую|первый|покажи|назови)\s+(\d{1,3})(?=\s)|(?:eng (?:ko'p|katta|yuqori|kichik))\s+(\d{1,3})\s*(?:ta)?/u);
  if(m){limit=Number(m[1]||m[2]||m[3]);top=true;q=q.replace(m[0],' ');}
  const high=/больше всего|наибольш(?:ий|им|ая|ей|ее)|наиболее|на первом месте|лидирует|максимальн(?:ый|ая|ым|ой|ую|ое)|сам(?:ый|ая|ую|ые) (?:крупн(?:ый|ая|ую|ые)|дорог(?:ой|ая|ую|ие))|eng (?:ko'p|katta|yuqori|qimmat)|yetakchi/u;
  const low=/меньше всего|наименьш(?:ий|ая|им|ее)|минимальн(?:ый|ая|ым|ой|ое)|eng (?:kam|kichik|past|arzon)/u;
  const extreme=high.test(q)||low.test(q);asc=low.test(q);
  if(extreme){top=true;limit??=1;}
  let head=/в разрезе|с разбивкой по|разбей по|разбивка по|по каждому|по каждой|по всем|по/u;
  for(const g of fields){
    const ending='(?![\\p{L}\\d])';
    const explicit=new RegExp('(?:'+head.source+')\\s+(?:'+g[1].source+')'+ending+'|(?:'+g[1].source+')\\s+(?:bo\\x27yicha|kesimida|bo\\x27lib)'+ending,'u');
    const pref=q.match(explicit);
    if(pref && g[0]!=='deal' && !/^(по (?:контракту|сделке))/.test(pref[0])){group=g;q=q.replace(pref[0],' ');break;}
    if(top && boundary(g[1]).test(q) && (!['year','month','date'].includes(g[0]) || /(?:како[йм]|какие|qaysi|top|топ)\s+(?:месяц|год|день|yil|oy|kun)/u.test(q))){ 
      // Ranked transactions have their own identifier; prefer participant, region,
      // or product if mentioned in a ranking request.
      group=g;q=q.replace(boundary(g[1]),' ');break;
    }
  }
  if(top && group){q=q.replace(high,' ').replace(low,' ').replace(/\btop\b|топ/u,' ');}
  return {q,group,limit,top,asc};
}

const metricRules=[
  ['unitPrice',/цен[ауые] (?:за |одной |на )?единиц[уы]|birlik narx(?:i|ini)?|bir birlik(?:ning)? narx(?:i)?/u,'Цена за единицу','Birlik narxi'],
  ['price',/стартов(?:ая|ую|ой|ые) цен[ауы]|boshlang'ich narx(?:i|ini)?/u,'Стартовая цена','Boshlang‘ich narx'],
  ['amount',/оборот(?:а|у|ом)?|сумм(?:а|у|ы|е|ой|арный объем)|стоимост(?:ь|и)|денежный объем|aylanma(?:si|sini)?|summ(?:asi|asini|a|ada|asi)?|qiymat(?:i|ini)?/u,'Сумма сделок','Bitimlar summasi'],
  ['delivered',/поставлен(?:о|ных|ные) лот(?:ы|ов|а)?|yetkazib berilgan lot(?:lar)?/u,'Поставлено, лотов','Yetkazilgan lotlar'],
  ['lots',/количество лотов|число лотов|лот(?:ов|ы)|lot(?:lar(?:ning|i)?|ni)?/u,'Количество лотов','Lotlar soni'],
  ['volume',/физическ(?:ий|ого) объем(?:а)?|объем(?:а)?|hajm(?:i|ini)?/u,'Физический объём','Jismoniy hajm'],
  ['count',/количеств(?:о|у|ом)|числ(?:о|у|ом)|сколько|nechta|nechtas[i]?|son(?:i|ini)?|qancha/u,'Число сделок','Bitimlar soni']
];

const stopRU = /^(?:в|во|с|со|из|по|за|к|на|от|у|для|всего|все|всех|весь|всю|всем|всеми|вся|всей|период|периода|реестр(?:е|а)?|бирж(?:е|и|евых)|сдел(?:ки|ка|ок|ок|кам|ках|ку|кой)|был[оаи]?|есть|составил[аои]?|заключен(?:о|ы|ных|ным|ные|а)?|зарегистрирован(?:о|ы|ных)?|совершен(?:о|ы|ных)?|прошл[ио]|прошедших|покажи(?:те)?|назови(?:те)?|укажи(?:те)?|сколько|каков[аоы]?|како(?:й|м|е|го)|какая|какие|кто|чему|рав(?:ен|на|но|ны)|общ(?:ая|ий|ее|ей|ую|ему|им)|суммарн(?:ая|ый|ое|ой)|итого|количеств(?:о|у)|числу|данным|данных|пожалуйста|посчитай(?:те)?|вошл[ио]|попал[ио]|лишь|только)$/u;
const stopUZ = /^(?:reyestr(?:ida|da|dagi|idagi|ning)?|birja(?:da|dagi|sida)?|bitim(?:lar(?:ning|i|ni|da|dan|ining)?|ning|ni|i)?|nechta|ta|jami|jamiysi|umumiy|barcha|butun|davr(?:da|dagi)?|tuzilgan(?:ligi)?|amalga|oshirilgan|bor|mavjud|qancha|qanday|qaysi|kim|bo'lgan|bo'ldi|bo'yicha|uchun|ko'rsating|ko'rsat|ayting|hisoblang|hisobla|tashkil|etadi|etgan|soni|necha|miqdori|eng|ning|da|dan|ga|bering|iltimos)$/u;

function plan(question,db,lang){
  const norm=normal(question);
  let {q,group,limit,top,asc}=grouping(norm);
  if(limit!==null && (limit<1||limit>100))return null;
  let op='sum';
  const avg=/(?:средн(?:яя|юю|ее|ей|ий|ему)|в среднем|o'rtacha)/u;
  const min=/(?:минимум|минимальн(?:ая|ую|ое)|наименьш(?:ая|ую)|eng (?:past|kichik)|minimum)/u;
  const max=/(?:максимум|максимальн(?:ая|ую|ое)|наибольш(?:ая|ую)|eng (?:yuqori|katta)|maksimum)/u;
  if(avg.test(q)){op='avg';q=q.replace(avg,' ');}
  else if(min.test(q)){op='min';q=q.replace(min,' ');}
  else if(max.test(q)){op='max';q=q.replace(max,' ');}
  else if(top&&!group)return null;
  let currency=null;
  const uzs=/\buzs\b|в (?:узбекских )?сумах|so'm(?:da|ga)\b/u, usd=/\busd\b|в долларах(?: сша)?|dollar(?:da|larda)\b/u;
  if(uzs.test(q)){currency='UZS';q=q.replace(uzs,' ').replace(/aylantirilganda|после конвертации/u,' ');}
  if(usd.test(q)){if(currency)return null;currency='USD';q=q.replace(usd,' ');}
  const filters=parseFilters(q,lang,db);
  if(filters.error)return {error:filters.error};
  let rest=filters.remaining;
  let metric=metricRules.find(x=>boundary(x[1]).test(rest));
  if(!metric && group?.[0]==='deal' && top){metric=metricRules.find(x=>x[0]==='amount');}
  if(!metric && group && /больше всего|eng ko'p/.test(norm) && /сдел|bitim/.test(norm)){metric=metricRules.at(-1);}
  if(!metric)return null;
  rest=rest.replace(boundary(metric[1]),' ');
  // A second substantive measure cannot be silently ignored.
  const leftovers=rest.replace(/[?!.,:;«»"'()[\]№]/g,' ').trim().split(/\s+/).filter(Boolean);
  if(leftovers.some(w=>!stopRU.test(w)&&!stopUZ.test(w)))return null;
  if(metric[0]==='count' && (op!=='sum'||currency))return null;
  if(metric[0]==='volume' && /объем торгов|savdo hajmi/u.test(norm) && !currency)return null;
  if(currency && !['amount','price','unitPrice'].includes(metric[0]))return null;
  if(group?.[0]==='deal' && !top)return null;
  if(['price','unitPrice'].includes(metric[0])&&op==='sum' && group?.[0]!=='deal')return null;
  if(top && !group && op==='sum')return null;
  return {filters,metric,op,group,limit,top,asc,currency};
}

// Fixed point values. Currency and FX inputs are exact to hundredths in the registry.
// UZS conversions are accumulated to four decimal places before final formatting.
const hundred=s=>{const raw=String(s).replaceAll(' ','');if(!/^\d+(?:\.\d{1,2})?$/.test(raw))throw Error('invalid decimal');const [a,b='']=raw.split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));};
function rounded(n,d){if(d<=0n)throw Error('empty denominator');return (n*2n+d)/(d*2n);}
function display(n,digits){const z=n.toString().padStart(digits+1,'0');return digits?z.slice(0,-digits)+(z.slice(-digits).replace(/0+$/,'')?'.'+z.slice(-digits).replace(/0+$/,''):''):z;}
function keyFor(g,i,t,c){
  if(!g)return '';
  if(['category','group'].includes(g))return c[g];
  if(g==='product')return c.name;
  if(g==='deal')return t.get(i,'id');
  if(g==='year')return t.get(i,'date').slice(6);
  if(g==='month')return t.get(i,'date').split('.').slice(1).reverse().join('-');
  return t.get(i,g);
}
function pretty(key,g,db){
  const dir=['seller','buyer'].includes(g)?db.by.participants:['sellerBroker','buyerBroker'].includes(g)?db.by.brokers:null;
  return dir? key+' · '+(dir.get(key)?.name||''):key;
}
export function analyze(question,lang,db){
  const p=plan(question,db,lang), L=(a,b)=>bi(a,b,lang);
  if(!p||p.error)return err(lang,p?.error);
  const {metric,op,group,filters,currency}=p, kind=metric[0], d=db.deals;
  const sources=new Set(filters.sources), units=new Set(), buckets=new Map(), evidence=[], rates=new Map();
  const money=['amount','unitPrice','price'].includes(kind);
  let count=0, fx=false, dollarConflict=false, firstUnit='';
  const groupKey=group?.[0];
  if(groupKey==='product'||groupKey==='category'||groupKey==='group'||money)sources.add('contracts.csv');
  if(groupKey==='buyer'||groupKey==='seller')sources.add('participants.csv');
  if(groupKey?.endsWith('Broker'))sources.add('brokers.csv');
  for(let i=0;i<d.length;i++){
    if(!filters.test(i))continue;
    const c=(money||['product','category','group'].includes(groupKey))?db.by.contracts.get(d.get(i,'contract')):null;
    const key=keyFor(groupKey,i,d,c);
    let bucket=buckets.get(key);
    if(!bucket){bucket={key,n:0,total:0n,den:0n,ext:null,extDen:1n};buckets.set(key,bucket);}
    count++;bucket.n++;
    const file='deals_'+d.get(i,'date').slice(6)+'.csv';
    if(!sources.has(file)){sources.add(file);}
    if(evidence.length<3){const ref=d.source(i);evidence.push(ref.file+' #'+ref.line+' · №'+d.get(i,'id'));}
    if(kind==='count')continue;
    let n=0n,den=1n;
    if(['volume','unitPrice','price'].includes(kind)){
      firstUnit=d.get(i,'unit');units.add(firstUnit);
      if(units.size>1)return err(lang,L('В выборке разные единицы измерения. Укажите товар или одну единицу.','Tanlangan bitimlarda o‘lchov birliklari har xil. Bitta mahsulot yoki o‘lchov birligini ko‘rsating.'));
    }
    if(money){
      const isUSD=c.currency==='Доллар США';
      if(!isUSD && c.currency!=='Узбекский сум')return err(lang);
      if(currency==='USD'&&!isUSD){dollarConflict=true;break;}
      n=hundred(d.get(i,kind==='price'?'startPrice':'amount'))*100n;
      if(isUSD && currency!=='USD'){
        const date=d.get(i,'date');
        if(!rates.has(date))rates.set(date,hundred(db.by.rates.get(date).rate));
        n=n*rates.get(date)/100n;fx=true;
      }
      if(kind==='unitPrice')den=BigInt(d.get(i,'quantity'))*BigInt(d.get(i,'lot'));
    }else{
      const a=d.get(i,kind==='delivered'?'delivered':'quantity');
      if(a==='')return err(lang,L('В выборке есть пустые значения поставки. Уточните статус или сделку.','Tanlovda yetkazilgan miqdor ko‘rsatilmagan yozuvlar bor. Holat yoki bitimni aniqlashtiring.'));
      n=BigInt(a);
      if(kind==='volume')n*=BigInt(d.get(i,'lot'));
    }
    bucket.total+=n;bucket.den+=den;
    if(op==='min'||op==='max'){
      if(bucket.ext===null || (op==='min'?n*bucket.extDen<bucket.ext*den:n*bucket.extDen>bucket.ext*den)){bucket.ext=n;bucket.extDen=den;}
    }
  }
  if(dollarConflict)return err(lang,L('Для суммы в USD уточните экспортные сделки. В выборке есть контракты в сумах.','USD summasi uchun eksport bitimlarini ko‘rsating. Tanlovda so‘mdagi shartnomalar ham bor.'));
  if(fx)sources.add('usd_rates.csv');
  if(!count)return {lang,status:'unknown',answer:L('По этим условиям в реестре не найдено сделок.','Bu shartlarga mos bitim reyestrda topilmadi.'),columns:[],rows:[],matched:0,method:filters.labels.join(' · '),sources:[...new Set([...sources,...db.manifest.sources.map(s=>s.file||s.filename||s.name).filter(s=>/^deals_/.test(s))])]};
  const unit=money?((currency==='USD'?'USD':'UZS')+(kind==='unitPrice'||kind==='price'?' / '+firstUnit:'')):kind==='volume'?firstUnit:'';
  for(const b of buckets.values()){
    if(kind==='count'){b.num=BigInt(b.n);b.div=1n;}
    else if(op==='max'||op==='min'){b.num=b.ext;b.div=b.extDen;}
    else{b.num=b.total;b.div=(kind==='unitPrice'||op==='avg')?b.den:1n;}
    const digits=money?4:op==='avg'?2:0;
    b.value=display(rounded(b.num*(digits===2&&!money?100n:1n),b.div),digits);
  }
  let sorted=[...buckets.values()];
  if(group){const cmp=(a,b)=>a.num*b.div-b.num*a.div;
    sorted.sort((a,b)=>{const c=cmp(a,b);return c===0n?a.key.localeCompare(b.key):((c>0n?-1:1)*(p.asc?-1:1));});
    if(p.limit && sorted.length>p.limit){
      let end=p.limit;while(end<sorted.length && cmp(sorted[end],sorted[end-1])===0n)end++;
      sorted=sorted.slice(0,end);
    }else if(!p.top && ['month','year','date'].includes(groupKey)){
      const dateKey=k=>groupKey==='date'?k.split('.').reverse().join(''):k;
      sorted.sort((a,b)=>dateKey(a.key).localeCompare(dateKey(b.key)));
    }
  }
  const tag=(op==='avg'?L('Среднее','O‘rtacha'):op==='min'?L('Минимум','Minimum'):op==='max'?L('Максимум','Maksimum'):'');
  const label=[tag,metric[lang==='ru'?2:3],unit].filter(Boolean).join(' · ');
  const format=b=>{const [whole,frac]=b.value.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(frac?'.'+frac:'');};
  const rows=group?sorted.slice(0,100).map(b=>[pretty(b.key,groupKey,db),b.value,String(b.n)]):[];
  const gLabel=group?.[lang==='ru'?2:3];
  const answer=group?gLabel+' · '+rows[0][0]+' — '+label+' '+format(sorted[0])+(sorted.length>100?L('. Показаны первые 100 строк.','. Dastlabki 100 qator ko‘rsatildi.'):''):label+' — '+format(sorted[0])+'.';
  const method=[...filters.labels,L('Все подходящие записи, включая аннулированные, если статус не указан.','Holat ko‘rsatilmasa barcha mos yozuvlar, shu jumladan bekor qilingan bitimlar ham qamrab olinadi.'),fx?L('USD × курс на дату сделки.','USD × bitim sanasidagi kurs.'):null,kind==='unitPrice'?L('Общая сумма / общий объём для среднего.','O‘rtacha narx = jami summa / jami jismoniy hajm.'):null,kind==='volume'?L('Количество × лот.','Miqdor × lot.'):null].filter(Boolean).join(' ');
  return {status:'ok',lang,answer,columns:group?[gLabel,label,L('Число записей','Yozuvlar soni')]:[],rows,sources:[...sources,...evidence],method,matched:count};
}
