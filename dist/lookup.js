// Exact-key lookups. All numbers, company names and dates originate in the selected records.
const t = (lang, ru, uz) => lang === 'uz' ? uz : ru;
const vocab = {
  id:['Номер','Raqam'], date:['Дата сделки','Bitim sanasi'], time:['Время сделки','Bitim vaqti'],
  type:['Тип торгов','Savdo turi'], quantity:['Количество лотов','Lotlar soni'], amount:['Сумма сделки','Bitim summasi'],
  startPrice:['Стартовая цена','Boshlang‘ich narx'], contract:['Номер контракта','Shartnoma raqami'],
  product:['Наименование товара','Tovar nomi'], lot:['Размер лота','Lot hajmi'], unit:['Единица измерения','O‘lchov birligi'],
  region:['Регион','Hudud'], contractType:['Тип контракта','Shartnoma turi'], tradeForm:['Форма контракта','Shartnoma shakli'],
  status:['Состояние сделки','Bitim holati'], seller:['Продавец','Sotuvchi'], buyer:['Покупатель','Xaridor'],
  sellerBroker:['Брокер продавца','Sotuvchi brokeri'],buyerBroker:['Брокер покупателя','Xaridor brokeri'],
  paymentDate:['Дата оплаты','To‘lov sanasi'],deliveryDate:['Дата поставки','Yetkazish sanasi'],
  delivered:['Поставлено, лотов','Yetkazilgan lotlar'], name:['Наименование','Nomi'],
  brand:['Марка','Marka'],size:['Размер товара','Tovar o‘lchami'],grade:['Сорт','Nav'],kind:['Тип товара','Tovar turi'],
  class:['Класс товара','Tovar sinfi'],hsCode:['Код ТН ВЭД','TIF TN kodi'],group:['Группа товара','Tovar guruhi'],
  category:['Категория товара','Tovar toifasi'],industry:['Отрасль','Sanoat tarmog‘i'],currency:['Валюта','Valyuta'],
  basePrice:['Базисная цена','Bazis narxi'],deposit:['Залог','Garov'],basis:['Базис поставки','Yetkazib berish bazisi'],
  warehouse:['Адрес склада','Ombor manzili'],paymentTerm:['Срок оплаты, дней','To‘lov muddati, kun'],
  deliveryTerm:['Срок поставки, дней','Yetkazish muddati, kun'], package:['Упаковка','Qadoq'],
  registered:['Дата регистрации','Ro‘yxatga olingan sana'],validTo:['Действует до','Amal qilish muddati'],
  tin:['ИНН','STIR'],role:['Роль','Ishtirokchi roli'],vat:['Плательщик НДС','QQS to‘lovchisi'],
  volume:['Объём в единицах измерения','O‘lchov birligidagi hajm'],unitPrice:['Цена за единицу','Birlik narxi'],
  converted:['Сумма в сумах','So‘mdagi summa'],paymentDue:['Предельная дата оплаты','To‘lovning oxirgi sanasi'],
  deliveryDue:['Предельная дата поставки','Yetkazishning oxirgi sanasi'],remaining:['Не поставлено, лотов','Yetkazilmagan lotlar'],
  rate:['Курс USD','USD kursi']
};
const label = (key, lang) => vocab[key][lang === 'uz' ? 1 : 0];
const strip = s => s.normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/['‘’ʼʻ\`´]/g,'').replace(/[–—]/g,'-');
const uzCyr = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'o',қ:'q',ғ:'g',ҳ:'h'};
const textUZ = (s,lang) => strip(lang==='uz' ? s.toLowerCase().replace(/[а-яёўқғҳ]/g, l => uzCyr[l]??l) : s);
const entities = {
  deals:'сделк[а-я]*|bitim[a-z]*', contracts:'контракт[а-я]*|договор[а-я]*|shartnoma[a-z]*|kontrakt[a-z]*',
  participants:'участник[а-я]*|компани[а-я]*|предприяти[а-я]*|организаци[а-я]*|инн|stir|ishtirokchi[a-z]*|kompaniya[a-z]*|korxona[a-z]*',
  brokers:'брокер[а-я]*|broker[a-z]*'
};
function locate(q) {
  const broker = /(?<![a-zа-я0-9])(?:bk|вк|бк)\s*-?\s*(\d{3})(?!\d)/i.exec(q);
  if (broker) return {table:'brokers',key:'BK'+broker[1],span:broker[0]};
  for(const [table,noun] of Object.entries(entities)){
    const left = new RegExp('(?:'+noun+')\\s*(?:(?:за номером|номер[а-я]*|raqam[a-z]*|kodi|inn|инн|stir|no|n)\\s*)?[№#:]?\\s*(\\d{1,12})(?!\\d)','u').exec(q);
    if(left) return {table,key:left[1],span:left[0]};
    const right=new RegExp('(?<!\\d)(\\d{1,12})[ -]*(?:sonli|raqamli|raqamdagi|raqamli|номер[а-я]*|номера)?\\s*(?:'+noun+')','u').exec(q);
    if(right) return {table,key:right[1],span:right[0]};
  }
  const tin=/(?<!\d)\d{9}(?!\d)/.exec(q);
  if(tin && /инн|stir|компани|ishtirokchi|участник|korxona/.test(q)) return {table:'participants',key:tin[0],span:tin[0]};
  return null;
}
const monthStems = ['январ|yanvar','феврал|fevral','март|mart','апрел|aprel','ма[йея]|may','июн|iyun','июл|iyul','август|avgust','сентябр|sentabr|sentyabr','октябр|oktabr|oktyabr','ноябр|noyabr','декабр|dekabr'];
function dateOf(q) {
  let hit=/\b(\d{4})-(\d{2})-(\d{2})\b/.exec(q);
  const val=(d,m,y,span)=>({date:[String(d).padStart(2,'0'),String(m).padStart(2,'0'),String(y)].join('.'),span});
  if(hit) return val(hit[3],hit[2],hit[1],hit[0]);
  hit=/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/.exec(q);
  if(hit) return val(hit[1],hit[2],hit[3],hit[0]);
  for(let i=0;i<monthStems.length;i++){
    const month='(?:'+monthStems[i]+')[a-zа-я]*';
    hit=new RegExp('(\\d{1,2})[\\s-]+'+month+'[\\s,]+(\\d{4})').exec(q);
    if(hit)return val(hit[1],i+1,hit[2],hit[0]);
    hit=new RegExp('(\\d{4})(?:[\\s-]*yil[a-z]*)?[\\s,]+(\\d{1,2})[\\s-]*'+month).exec(q);
    if(hit)return val(hit[2],i+1,hit[1],hit[0]);
  }
  return null;
}
const number = s => {
  const m = /^([+-]?\d+)(?:\.(\d+))?$/.exec(String(s).replace(/\s/g,''));
  if(!m)throw Error('Invalid source number');
  const digits=m[2]||'';
  return [BigInt(m[1]+digits),digits.length];
};
const dec=(n,places)=>{
  let s=(n<0n?-n:n).toString().padStart(places+1,'0');
  if(places)s=(s.slice(0,-places)+'.'+s.slice(-places).replace(/0+$/,'')).replace(/\.$/,'');
  return (n<0n?'-':'')+s;
};
const mul=(a,b)=>{const [x,p]=number(a),[y,q]=number(b); return dec(x*y,p+q);};
const divide=(a,b)=>{
  const [x,p]=number(a),[y,q]=number(b);
  if(y===0n) return '';
  const precision=8, numerator=x*10n**BigInt(q+precision), denominator=y*10n**BigInt(p);
  return dec((numerator+denominator/2n)/denominator,precision);
};
function addDays(date,days){
  if(!date || !/^\d+$/.test(days))return '';
  const [d,m,y]=date.split('.').map(Number),v=new Date(Date.UTC(y,m-1,d+Number(days)));
  return [String(v.getUTCDate()).padStart(2,'0'),String(v.getUTCMonth()+1).padStart(2,'0'),v.getUTCFullYear()].join('.');
}
const methods = {
  volume:['Количество × Лот','Lotlar soni × lot hajmi'],unitPrice:['Сумма сделки ÷ (Количество × Лот), до 8 знаков','Bitim summasi ÷ (lotlar soni × lot hajmi), 8 kasr xonasigacha'],
  converted:['Для USD: сумма × курс на дату сделки; для UZS: сумма сделки','USD uchun: summa × bitim sanasidagi kurs; UZS uchun: bitim summasi'],
  paymentDue:['Дата сделки + срок оплаты (календарные дни)','Bitim sanasi + to‘lov muddati (kalendar kunlar)'],
  deliveryDue:['Дата оплаты + срок поставки (календарные дни)','To‘lov sanasi + yetkazish muddati (kalendar kunlar)'],
  remaining:['Количество − Поставлено','Lotlar soni − yetkazilgan lotlar']
};
const rules=[
 ['converted',/сумм[а-я]*\s+(?:(?:этой|данной)\s+)?в\s+(?:узбекских\s+)?сумах|в\s+сумах|so(?:mda[a-z]*|m\s+hisobida)|milliy valyuta[a-z]*/],
 ['unitPrice',/(?:цен[а-я]*|стоимост[а-я]*)\s+(?:за\s+|одной\s+|1\s+)?единиц[а-я]*|bir(?:lik| birlik)[a-z]*(?:\s+(?:uchun|mahsulot|tovar[a-z]*))*\s+narx[a-z]*|bir dona[a-z]*\s+narx[a-z]*|цена\s+за\s+(?:тонну|килограмм|метр)|birlikka/],
 ['volume',/объем[а-я]*|hajm[a-z]*|miqdor[a-z]*\s+olchov\s+birli[a-z]*/],
 ['startPrice',/стартов[а-я]*\s+цен[а-я]*|начальн[а-я]*\s+цен[а-я]*|boshlangich\s+narx[a-z]*/],
 ['basePrice',/базисн[а-я]*\s+цен[а-я]*|базов[а-я]*\s+цен[а-я]*|bazi[sz]\s+narx[a-z]*|bazaviy\s+narx[a-z]*/],
 ['paymentDue',/крайн[а-я]*\s+(?:срок|дат[а-я]*)\s+оплат[а-я]*|(?:не\s+позднее|до)\s+како[а-я]*\s+дат[а-я]*\s+(?:долж[а-я]*\s+)?(?:оплат[а-я]*|заплат[а-я]*)|(?:предельн[а-я]*|последн[а-я]*)\s+дат[а-я]*\s+оплат[а-я]*|tolov[a-z]*\s+(?:oxirgi|songgi)\s+sana[a-z]*|qachongacha\s+tola[a-z]*/],
 ['deliveryDue',/крайн[а-я]*\s+(?:срок|дат[а-я]*)\s+поставк[а-я]*|(?:предельн[а-я]*|последн[а-я]*)\s+дат[а-я]*\s+поставк[а-я]*|yetkaz[a-z]*(?:\s+berish[a-z]*)?\s+(?:oxirgi|songgi)\s+sana[a-z]*|qachongacha\s+yetkaz[a-z]*/],
 ['paymentTerm',/срок[а-я]*\s+оплат[а-я]*|tolov[a-z]*\s+muddat[a-z]*/],
 ['deliveryTerm',/срок[а-я]*\s+поставк[а-я]*|yetkaz[a-z]*(?:\s+berish[a-z]*)?\s+muddat[a-z]*/],
 ['remaining',/не\s+поставлен[а-я]*|остал[а-я]*\s+поставить|yetkazilmagan[a-z]*/],
 ['sellerBroker',/брокер[а-я]*\s+(?:со стороны\s+)?продав[а-я]*|sotuvchi[a-z]*\s+broker[a-z]*/],
 ['buyerBroker',/брокер[а-я]*\s+(?:со стороны\s+)?покупател[а-я]*|(?:xaridor|oluvchi)[a-z]*\s+broker[a-z]*/],
 ['paymentDate',/(?:дат[а-я]*\s+)?оплат[а-я]*|оплачен[а-я]*|(?:tolov[a-z]*\s+sana[a-z]*|tolandi|tolangan[a-z]*)/],
 ['deliveryDate',/(?:дат[а-я]*\s+поставк[а-я]*|когда\s+поставлен[а-я]*|yetkaz[a-z]*(?:\s+ber[a-z]*)?\s+sana[a-z]*|qachon\s+yetkaz[a-z]*(?:\s+ber[a-z]*)?)/],
 ['delivered',/поставлен[а-я]*|yetkaz[a-z]*(?:\s+ber[a-z]*)?/],
 ['lot',/размер[а-я]*\s+лот[а-я]*|(?:bir\s+)?lot[a-z]*\s+(?:hajm[a-z]*|olcham[a-z]*)/],
 ['quantity',/(?:количеств[а-я]*\s+)?лот[а-я]*|количеств[а-я]*|lot(?:lar[a-z]*|dan|ni|i)?|miqdor[a-z]*/],
 ['amount',/сумм[а-я]*|(?:стоимост[а-я]*|суммарн[а-я]*\s+стоимост[а-я]*)|summ[a-z]*|qiymat[a-z]*/],
 ['group',/групп[а-я]*|guruh[a-z]*/],['category',/категори[а-я]*|toifa[a-z]*|kategoriya[a-z]*/],
 ['hsCode',/(?:код[а-я]*\s+)?тн\s*вэд|(?:tif|tn)\s*(?:tn|ved|vedi)\s*(?:kod[a-z]*)?/],
 ['grade',/сорт[а-я]*|nav(?:i|ini|dagi)?/],['brand',/марк[а-я]*|marka[a-z]*/],
 ['kind',/тип[а-я]*\s+товар[а-я]*|tovar[a-z]*\s+turi/],['size',/размер[а-я]*|olcham[a-z]*/],
 ['class',/класс[а-я]*|sinf[a-z]*/],['industry',/отрасл[а-я]*|sanoat\s+tarmog[a-z]*/],
 ['unit',/единиц[а-я]*\s+измерени[а-я]*|olchov\s+birli[a-z]*/],
 ['contractType',/тип[а-я]*\s+(?:контракт|договор)[а-я]*|shartnoma[a-z]*\s+turi/],
 ['tradeForm',/форм[а-я]*\s+(?:контракт|договор|торг)[а-я]*|shartnoma[a-z]*\s+shakl[a-z]*/],
 ['type',/тип[а-я]*\s+(?:торг|аукцион)[а-я]*|savdo[a-z]*\s+turi|вид[а-я]*\s+деятельност[а-я]*|faoliyat[a-z]*\s+turi/],
 ['registered',/дат[а-я]*\s+регистраци[а-я]*|регистр[а-я]*|royxat[a-z]*\s+(?:olingan|otgan)(?:\s+sana[a-z]*)?/],
 ['validTo',/действует\s+до|действи[а-я]*|действител[а-я]*|amal\s+(?:qilish|qiladi)[a-z]*(?:\s+muddat[a-z]*)?/],
 ['basis',/базис[а-я]*(?:\s+поставк[а-я]*)?|yetkaz[a-z]*(?:\s+berish[a-z]*)?\s+bazis[a-z]*/],
 ['deposit',/залог[а-я]*|garov[a-z]*/],['package',/упаков[а-я]*|qadoq[a-z]*/],
 ['warehouse',/адрес[а-я]*(?:\s+склад[а-я]*)?|склад[а-я]*|ombor[a-z]*(?:\s+manzil[a-z]*)?/],
 ['seller',/продав[а-я]*|продал[а-я]*|sotuvchi[a-z]*|sotgan[a-z]*|sotdi/],
 ['buyer',/покупа[а-я]*|купил[а-я]*|xaridor[a-z]*|sotib\s+ol[a-z]*/],
 ['status',/состоян[а-я]*|статус[а-я]*|holat[a-z]*|maqom[a-z]*/],
 ['currency',/валют[а-я]*|valyuta[a-z]*/],['region',/регион[а-я]*|област[а-я]*|hudud[a-z]*|viloyat[a-z]*/],
 ['vat',/(?:плательщик[а-я]*\s+)?ндс|qqs(?:\s+tolovchi[a-z]*)?/],
 ['role',/роль|роли|rol[a-z]*/],['tin',/инн|stir[a-z]*/],
 ['contract',/(?:номер[а-я]*\s+)?(?:контракт[а-я]*|договор[а-я]*)|shartnoma[a-z]*(?:\s+raqam[a-z]*)?/],
 ['product',/товар[а-я]*|продукт[а-я]*|tovar[a-z]*|mahsulot[a-z]*/],
 ['name',/наименован[а-я]*|назван[а-я]*|назван[а-я]*|называ[а-я]*|nom(?:i|ini|lanadi|lanishi)?/],
 ['time',/врем[а-я]*|vaqt[a-z]*|soatda/],['date',/дат[а-я]*|когда|qachon|sana[a-z]*/],
];
const ignore = /^(?:и|или|а|в|во|у|из|с|со|по|на|к|от|для|о|об|про|при|же|ли|эт[а-я]*|данн[а-я]*|за|его|ее|как|како[а-я]*|каков[а-я]*|каки[а-я]*|чему|чем|чей|что|кто|был[а-я]*|есть|состав[а-я]*|составил[а-я]*|сколько|равн[а-я]*|назов[а-я]*|назват[а-я]*|укаж[а-я]*|покаж[а-я]*|вывед[а-я]*|сообщ[а-я]*|найд[а-я]*|найти|рассчита[а-я]*|определ[а-я]*|расскаж[а-я]*|пожалуйста|расшифру[а-я]*|подробност[а-я]*|сведени[а-я]*|информаци[а-я]*|карточк[а-я]*|запис[а-я]*|реестр[а-я]*|участник[а-я]*|компани[а-я]*|организаци[а-я]*|брокер[а-я]*|номер[а-я]*|код[а-я]*|день|дней|дня|календарных|покупки|заключен[а-я]*|фактическ[а-я]*|всего|узбекских|валюте|валюты|рубежом|склада|n|no|va|yoki|ham|uchun|bilan|boyicha|haqida|dagi|da|ga|dan|ning|ni|bu|shu|ushbu|qaysi|qanday|qancha|nechta|necha|nechaga|kim|kimga|nima|nim[a-z]*|qayerda|menga|iltimos|ayt[a-z]*|korsat[a-z]*|top[a-z]*|hisobla[a-z]*|ber[a-z]*|malumot[a-z]*|tafsilot[a-z]*|kartochka[a-z]*|yozuv[a-z]*|raqam[a-z]*|kodi|soni|ta|teng|bolgan|boldi|edi|ekan|xaqida|jami|asosida|tuzil[a-z]*|amalga|oshirilgan|birj[a-z]*|kun|kuni|kunda|kunlarda|haqiqiy|reyestr[a-z]*|broker[a-z]*|kompaniya[a-z]*|ishtirokchi[a-z]*|shaxs[a-z]*|nomli|aniq|aniqlang|olib)$/;
const enumUz = { 'Исполнен':'To‘liq bajarilgan','Исполнен(Частично)':'Qisman bajarilgan','Аннулирован(Не оплачен)':'Bekor qilingan (to‘lanmagan)','Новый':'Yangi','Не подписан':'Imzolanmagan','Заключен':'Tuzilgan','Ждёт оплату':'To‘lov kutilmoqda','Оплачен':'To‘langan','Внутренний':'Ichki','Экспортный':'Eksport','Спот':'Spot','Форвард':'Forvard','Фьючерс':'Fyuchers','Да':'Ha','Нет':'Yo‘q','Продавец':'Sotuvchi','Покупатель':'Xaridor','Узбекский сум':'O‘zbekiston so‘mi','Доллар США':'AQSh dollari','Английский аукцион':'Ingliz auksioni','Обратный аукцион':'Teskari auksion','Двусторонний аукцион':'Ikki tomonlama auksion'};
const value=(s,lang)=>lang==='uz' && enumUz[s] ? enumUz[s]+' ('+s+')' : s;
const src = r => r._file+' · '+r._line;
function result(lang,status,answer,rows=[],sources=[],method=''){
  return {lang,status,answer,columns:rows.length?[t(lang,'Поле','Maydon'),t(lang,'Значение','Qiymat')]:[],rows,sources,method,matched:status==='ok'?1:0};
}
const unsupported=lang=>result(lang,'clarify',t(lang,'Не могу проверить все условия этого вопроса. Укажите один номер записи и нужное поле.','Savoldagi barcha shartlarni tekshira olmadim. Bitta yozuv raqami va kerakli maydonni ko‘rsating.'));
const absent=(lang,ref,files=[])=>result(lang,'unknown',t(lang,'В предоставленных данных запись не найдена: ','Berilgan ma’lumotlarda yozuv topilmadi: ')+ref,[],files);
const allFields = {
  deals:['id','date','time','product','contract','status','seller','buyer','amount','quantity','lot','unit','region','type','contractType','tradeForm','startPrice','sellerBroker','buyerBroker','paymentDate','deliveryDate','delivered'],
  contracts:['id','name','brand','size','grade','kind','class','hsCode','group','category','industry','unit','lot','currency','basePrice','deposit','basis','region','warehouse','type','contractType','tradeForm','paymentTerm','deliveryTerm','package','seller','registered','validTo'],
  brokers:['id','name','tin','region'],participants:['id','name','region','type','role','vat']
};
function findDeal(db,key){
  let lo=0,hi=db.deals.length-1,id=Number(key);
  while(lo<=hi){const i=Math.floor((lo+hi)/2),curr=Number(db.deals.get(i,'id'));if(id===curr)return i;if(id<curr)hi=i-1;else lo=i+1;}
  return -1;
}
const byIndex = (db,table,key) => db.by?.[table]?.get(key) ?? db[table]?.find(r => r[table==='rates'?'date':'id']===key);
function fx(q,lang,db){
  if(!/курс|kurs/.test(q))return null;
  if(!/курс|kurs/.test(q)||!/доллар|usd|dollar|aqsh/.test(q))return null;
  const d=dateOf(q);
  if(!d)return null;
  const words=q.replace(d.span,' ').match(/[\p{L}\p{N}]+/gu)||[];
  if(words.some(w=>!ignore.test(w)&&!/^(?:курс[а-я]*|доллар[а-я]*|сша|сум[а-я]*|usd|dollar[a-z]*|aqsh|kurs[a-z]*|som[a-z]*|yil[a-z]*|год[а-я]*|turgan|равнялся|стоила|стоит|стои[а-я]*)$/.test(w)))return unsupported(lang);
  const row=byIndex(db,'rates',d.date);
  if(!row)return absent(lang,d.date,['usd_rates.csv']);
  return result(lang,'ok',d.date+' · 1 USD = '+row.rate+' UZS',[ [label('rate',lang),row.rate+' UZS/USD'] ],[src(row)],t(lang,'Точное совпадение даты в таблице курсов.','Kurs jadvalidan sana bo‘yicha aniq moslik.'));
}
function readFields(rest){
  const fields=[];
  // Longest matching field phrase wins (e.g. “срок оплаты” before “оплаты”).
  let tokens=rest;
  while(true){
    let best=null;
    for(const [field,pattern] of rules){
      const re=new RegExp('(?<![\\p{L}\\p{N}])(?:'+pattern.source+')(?![\\p{L}\\p{N}])','u');
      const m=re.exec(tokens); if(m && (!best||m[0].length>best.str.length)) best={field,str:m[0],index:m.index};
    }
    if(!best)break;
    fields.push(best.field);
    tokens=tokens.slice(0,best.index)+' '+tokens.slice(best.index+best.str.length);
  }
  const residue=tokens.match(/[\p{L}\p{N}]+/gu)||[];
  return {fields:[...new Set(fields)],safe:residue.every(w=>ignore.test(w))};
}
function renderLookup(key,table,row,db,fields,sources,lang,summarize){
  const refs=new Set(sources), formulas=new Set(), output=[];
  const contract = table==='deals' ? byIndex(db,'contracts',row.contract) : table==='contracts'?row:null;
  const linkContract=()=> {if(contract) refs.add(src(contract));return contract;};
  const identifier=(dimension,id)=>{
    const party=byIndex(db,dimension,id);
    if(!party)return id;
    refs.add(src(party));return party.name+' · '+id;
  };
  const blank=t(lang,'Поле пустое в источнике','Manbada maydon bo‘sh');
  function fieldValue(f){
    if(f==='product' && table==='contracts') f='name';
    if(f==='name' && table==='deals')f='product';
    if(f==='tin' && table==='participants')f='id';
    if(f==='contract' && table==='contracts')f='id';
    if(f==='seller'||f==='buyer'){
      if(!(f in row))return undefined;
      return identifier('participants',row[f]);
    }
    if(f==='sellerBroker'||f==='buyerBroker'){
      if(!(f in row))return undefined;
      return identifier('brokers',row[f]);
    }
    if(table==='deals'){
      if(f==='amount'||f==='startPrice') return row[f]+(linkContract()?' '+value(contract.currency,lang):'');
      if(f in methods){
        formulas.add(label(f,lang)+' = '+methods[f][lang==='uz'?1:0]);
        if(f==='volume')return mul(row.quantity,row.lot)+' '+row.unit;
        if(f==='remaining')return row.delivered===''?'':(BigInt(row.quantity)-BigInt(row.delivered)).toString();
        const c=linkContract();
        if(!c)return '';
        if(f==='unitPrice')return divide(row.amount,mul(row.quantity,row.lot))+' '+value(c.currency,lang)+' / '+row.unit;
        if(f==='paymentDue')return addDays(row.date,c.paymentTerm);
        if(f==='deliveryDue')return addDays(row.paymentDate,c.deliveryTerm);
        if(f==='converted'){
          if(c.currency==='Узбекский сум') return row.amount+' UZS';
          if(c.currency!=='Доллар США')return '';
          const rate=byIndex(db,'rates',row.date);
          if(!rate)return '';
          refs.add(src(rate));return mul(row.amount,rate.rate)+' UZS';
        }
      }
      if(!(f in row) && contract && f in contract) return value(linkContract()[f],lang);
    }
    if(!(f in row))return undefined;
    return value(row[f],lang);
  }
  for(const f of fields){
    let entry=fieldValue(f);
    if(entry===undefined)return unsupported(lang);
    const title=f==='type'&&table==='participants'?t(lang,'Вид деятельности','Faoliyat turi'):label(f,lang);
    output.push([title,entry||blank]);
  }
  const details=summarize ? t(lang,'Карточка записи ','Yozuv kartochkasi ')+key : output.map(([a,b])=>a+' — '+b).join('\n');
  const empty=output.every(r=>r[1]===blank);
  return result(lang,empty?'unknown':'ok',details,output,[...refs],[t(lang,'Точный поиск по идентификатору.','Identifikator bo‘yicha aniq qidiruv.'),...formulas].join(' '));
}
export function lookup(question,lang,db){
  const q=textUZ(question,lang);
  const target=locate(q);
  if(!target)return fx(q,lang,db);
  const {table,key,span}=target;
  if((table==='contracts'||table==='participants'||table==='brokers') && /сделк[а-я]*|bitim[a-z]*|оборот|aylanma/.test(q))return null;
  if(table==='contracts' && /сколько контракт|shartnomalar soni/.test(q))return null;
  let rest=q.replace(span,' ');
  const exportFilter=/экспортн[а-я]+|eksport[a-z]*/.exec(rest);
  if(exportFilter)rest=rest.replace(exportFilter[0],' ');
  rest=rest.replace(/сколько\s+сумов|сумм[а-я]*\s+в\s+сумах|(?:пересчит[а-я]*\s+)?в\s+сумы/g,'в сумах')
    .replace(/по\s+курсу\s+на\s+дату\s+(?:заключения\s+)?сделки/g,'в сумах')
    .replace(/(?:bir\s+)?olchov\s+birlig[a-z]*\s+narx[a-z]*/g,'birlik narxi')
    .replace(/soat\s+nechada/g,'vaqti').replace(/tegishli/g,' ')
    .replace(/физическ[а-я]*\s+объем/g,'объем')
    .replace(/(в|выраженный\s+в)\s+единиц[а-я]*\s+измерени[а-я]*/g,' ')
    .replace(/какую\s+дату\s+фактически\s+оплачен[а-я]*|когда\s+оплат[а-я]*/g,'дата оплаты')
    .replace(/когда\s+(?:товар\s+)?(?:по\s+)?\s*(?:был[а-я]*\s+)?поставлен[а-я]*/g,'дата поставки');
  if(table==='brokers' && /hudud|регион/.test(rest))rest=rest.replace(/royxat[a-z]*\s+olingan|зарегистрирован[а-я]*/g,' ');
  let {fields,safe}=readFields(rest);
  if(!safe)return unsupported(lang);
  if(fields.includes('product') && fields.includes('name'))fields=fields.filter(f=>f!=='name');
  // A broker or party relationship may qualify “region”, “INN” or “name”.
  // Resolve these from the related row instead of returning the warehouse region.
  const roles=fields.filter(f=>['seller','buyer','sellerBroker','buyerBroker'].includes(f));
  const related=fields.filter(f=>['tin','name','region','vat','type','role'].includes(f));
  const dealIndex=table==='deals'?findDeal(db,key):-1;
  const row=table==='deals'?(dealIndex>=0?db.deals.row(dealIndex):null):byIndex(db,table,key);
  if(!row)return absent(lang,key,table==='deals'?db.manifest.sources.map(s=>s.file).filter(f=>f.startsWith('deals_')):[table+'.csv']);
  const source=table==='deals'?db.deals.source(dealIndex):null;
  const requestedUnit=rest.match(/цена\s+за\s+(тонну|килограмм|метр)/u);
  if(requestedUnit && row.unit!==({тонну:'тонна',килограмм:'килограмм',метр:'метр'}[requestedUnit[1]]))return unsupported(lang);
  if(exportFilter && row.contractType!=='Экспортный')return absent(lang,key+' · '+exportFilter[0],source?[source.file+' · '+source.line]:[src(row)]);
  const refs=source?[source.file+' · '+source.line]:[src(row)];
  if(roles.length && related.length && (table==='deals'||table==='contracts')){
    if(roles.length!==1||fields.some(f=>!roles.includes(f)&&!related.includes(f))) return unsupported(lang);
    const role=roles[0], dimension=role.endsWith('Broker')?'brokers':'participants';
    const party=byIndex(db,dimension,row[role]);
    if(!party)return absent(lang,row[role]||label(role,lang),refs);
    return renderLookup(party.id,dimension,party,db,related,[...refs,src(party)],lang,false);
  }
  if(table==='brokers')fields=fields.filter(f=>f!=='sellerBroker'&&f!=='buyerBroker');
  if(!fields.length && /сколько|қанча|qancha|nechta|когда|qachon/.test(rest))return unsupported(lang);
  return renderLookup(key,table,row,db,fields.length?fields:allFields[table],refs,lang,!fields.length);
}
