import {lookup} from './lookup.js';
import {directory} from './directory.js';
import {analyze} from './analytics.js';

export function indexData(data){
  data.by = Object.fromEntries(['contracts','participants','brokers','rates'].map(table=>
    [table,new Map(data[table].map(r=>[table==='rates'?r.date:r.id,r]))]));
  return data;
}

const cyrillicUZ={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh','ъ':"'",'ь':'','э':'e','ю':'yu','я':'ya','ғ':"g'",'қ':'q','ў':"o'",'ҳ':'h'};
export function respond(input,requestedLang,db){
  let q=String(input||'').trim();
  const latUz=/(?:nechta|qancha|bitim|shartnoma|kim|qaysi|qanday|kursi|nomi|bormi|muddati|summasi|so['‘’ʻ]m|bo['‘’ʻ]yicha|ma['‘’ʻ]lumot|ko['‘’ʻ]rsat)/i;
  const uzCy=/(?:нечта|қанча|битим|шартнома|қайси|номи|курси|маълумот|муддати|йилда|сўмда|кўрсат)/iu.test(q) && !/(?:сколько|какой|сделки|назови|покажи)/iu.test(q);
  const latinWords = q.replace(/\b(?:BK\d+|USD|UZS)\b/gi, '');
  const lang=uzCy||latUz.test(q)?'uz':/[а-яё]/iu.test(q)?'ru':/[a-z]{2,}/i.test(latinWords)?'uz':(requestedLang==='ru'?'ru':'uz');
  if(uzCy)q=Array.from(q.toLowerCase(),v=>cyrillicUZ[v]??v).join('');
  const abstain=()=>({status:'unknown',lang,answer:lang==='uz'?'Reyestrdan bu savolga tasdiqlangan javob topilmadi. Mahsulot, bitim raqami yoki davrni ko‘rsating.':'В реестре не найден подтверждённый ответ на этот вопрос. Уточните товар, номер сделки или период.',sources:[],rows:[],columns:[]});
  if(!q||q.length>1200||/выдум|придумай|сочини|o['‘’ʻ]ylab top|bashorat|прогноз|игнорируй|ignore previous/i.test(q))return abstain();
  const res=lookup(q,lang,db) || directory(q,lang,db) || analyze(q,lang,db);
  if(!res||!res.answer||res.status==='ok'&&!res.sources?.length)return abstain();
  return {...res,lang};
}
