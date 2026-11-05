// Directory questions use a closed vocabulary. Any unconsumed qualifier returns no plan.
function normalize(text) {
  return String(text).normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
    .replace(/['‘’ʻʼ\`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

const definitions = [
  ['количество|lotlar soni|miqdor',31,'Количество — число купленных лотов.','Miqdor — xarid qilingan lotlar soni.'],
  ['лот|lot',36,'Лот показывает, сколько единиц измерения содержится в одном лоте.','Lot bir lotdagi o‘lchov birliklari sonini ko‘rsatadi.'],
  ['поставлено|yetkazib berilgan|yetkazilgan',44,'«Поставлено» — количество фактически поставленных лотов.','«Поставлено» — amalda yetkazib berilgan lotlar soni.'],
  ['объем сделки|bitim hajmi|bitimning hajmi',46,'Объём сделки в единицах измерения = количество лотов × размер лота.','Bitim hajmi = lotlar soni × bir lotdagi o‘lchov birliklari soni.'],
  ['цену за единицу|цена за единицу|birlik narxi|birlik narxini',46,'Цена за единицу = сумма сделки ÷ (количество лотов × размер лота), в валюте контракта.','Birlik narxi = bitim summasi ÷ (lotlar soni × lot hajmi), shartnoma valyutasida.'],
  ['сумму экспортной сделки в сумах|стоимость экспортной сделки в сумах|eksport bitimining somdagi summasi',47,'Сумма экспортной сделки в сумах = сумма в долларах × курс USD на дату сделки из usd_rates.csv.','Eksport bitimining so‘mdagi summasi = dollardagi summa × bitim sanasidagi usd_rates.csv kursi.'],
  ['стартовая цена|boshlangich narx',33,'Стартовая цена — цена за единицу измерения в валюте контракта в начале торгов.','Boshlang‘ich narx — savdo boshidagi birlik narxi, shartnoma valyutasida.'],
  ['базисная цена|bazis narxi|bazaviy narx',72,'Базисная цена — цена за единицу на дату регистрации контракта.','Bazis narxi — shartnoma ro‘yxatdan o‘tgan sanadagi birlik narxi.'],
  ['сумма залога|garov summasi',73,'Залог указан в процентах от суммы сделки.','Garov miqdori bitim summasiga nisbatan foizda ko‘rsatilgan.'],
  ['срок оплаты|tolov muddati',77,'Срок оплаты отсчитывается в календарных днях от даты сделки.','To‘lov muddati bitim sanasidan boshlab kalendar kunlarda hisoblanadi.'],
  ['срок поставки|yetkazib berish muddati',78,'Срок поставки отсчитывается в календарных днях от даты оплаты.','Yetkazib berish muddati to‘lov sanasidan boshlab kalendar kunlarda hisoblanadi.'],
  ['тип контракта|shartnoma turi',38,'Тип контракта — внутренний или экспортный.','Shartnoma turi — ichki yoki eksport.'],
  ['форма контракта|shartnoma shakli',39,'Форма контракта — спот, форвард или фьючерс.','Shartnoma shakli — spot, forvard yoki fyuchers.'],
  ['новый|yangi',54,'«Новый» — сделка заключена в последний день выгрузки, 30.10.2026.','«Новый» — bitim yuklamaning oxirgi kuni, 30.10.2026 da tuzilgan.'],
  ['не подписан|imzolanmagan',55,'«Не подписан» — договор ещё не подписан сторонами.','«Не подписан» — tomonlar shartnomani hali imzolamagan.'],
  ['заключен|tuzilgan',56,'«Заключен» — подписан форвард или фьючерс, срок оплаты ещё не истёк.','«Заключен» — forvard yoki fyuchers imzolangan, to‘lov muddati hali o‘tmagan.'],
  ['ждет оплату|tolov kutilmoqda',57,'«Ждёт оплату» — спот подписан, срок оплаты ещё не истёк.','«Ждёт оплату» — spot imzolangan, to‘lov muddati hali o‘tmagan.'],
  ['оплачен|tolangan',58,'«Оплачен» — сделка оплачена, товар ещё не поставлен.','«Оплачен» — bitim to‘langan, tovar hali yetkazilmagan.'],
  ['исполнен|bajarilgan',59,'«Исполнен» — сделка оплачена, товар полностью поставлен.','«Исполнен» — bitim to‘langan, tovar to‘liq yetkazilgan.'],
  ['исполнен частично|частично исполнен|qisman bajarilgan',60,'«Исполнен(Частично)» — поставлена часть товара. В поле «Поставлено» указано число фактически поставленных лотов.','«Исполнен(Частично)» — tovar qisman yetkazilgan. Yetkazilgan lotlar soni «Поставлено» ustunida.'],
  ['аннулирован не оплачен|аннулирован|bekor qilingan',61,'«Аннулирован(Не оплачен)» — сделка не оплачена в срок и аннулирована, она не состоялась.','«Аннулирован(Не оплачен)» — bitim o‘z vaqtida to‘lanmagan va bekor qilingan.'],
];

function definition(q, lang) {
  const question = q.match(/^(?:что (?:значит|означает|такое)|как (?:считать|посчитать|рассчитать|рассчитывается|считается|определяется)) (.+)$/)?.[1]
    || q.match(/^(.+?) (?:nima|nimani anglatadi|degani nima|qanday hisoblanadi|qanday aniqlanadi)$/)?.[1];
  if (!question) return null;
  const term = question.replace(/^(?:(?:поле|статус|состояние)(?: сделки)? |столбец )/, '').replace(/ (?:holati|ustuni)$/, '');
  const item = definitions.find(([aliases]) => aliases.split('|').includes(term));
  if (!item) return null;
  const ru = lang === 'ru';
  return {status:'ok', lang, answer:item[ru ? 2 : 3], matched:1, rows:[], columns:[],
    sources:['README.md · ' + (ru ? 'строка ' : 'qator ') + item[1]],
    method:ru ? 'Определение из словаря организаторов.' : 'Tashkilotchilar taqdim etgan lug‘atdagi ta’rif.'};
}

// Multiple directory entities or additional free text invalidate the query.
const entities = [
  ['brokers','брокер(?:ов|ы|а|ские конторы|ских контор)?|broker(?:lar(?:ning|ni|i)?|lik (?:idoralari|idorasi|kompaniyalari)|ning|ni)?','брокеры','brokerlar'],
  ['contracts','(?:карточ(?:ек|ки) )?(?:контракт|договор)(?:ов|ы|а|ах)?|shartnoma(?:lar(?:ning|da|ni|i)?|ning|da|ni)?(?: kartochka(?:lari|si))?|kontrakt(?:lar(?:ning|da|ni|i)?)?','контракты','shartnomalar'],
  ['participants','участник(?:ов|и|а)?(?: торгов)?|компани(?:й|и|я)|организаци(?:й|и)|(?:savdo )?ishtirokchi(?:lar(?:ning|i|ni)?|si|ning|ni)?|kompaniya(?:lar(?:i|ning|ni)?|si)?','участники','ishtirokchilar'],
];

const roleCriteria = [
  ['role','Продавец','продавц(?:ы|ов|а)|sotuvchi(?:lar(?:ning|i|ni)?|ning|ni)?'],
  ['role','Покупатель','покупател(?:ей|и|я)|xaridor(?:lar(?:ning|i|ni)?|ning|ni)?'],
  ['vat','Нет','неплательщик(?:и|ов)? ндс|не (?:являются )?плательщиками ндс|qqs tolamaydigan'],
  ['vat','Да','плательщик(?:и|ов)? ндс|(?:являются )?плательщиками ндс|qqs tolovchi(?:lar(?:i)?)?'],
];
const contractCriteria = [
  ['contractType','Внутренний','внутренни(?:е|х)|ichki'],
  ['contractType','Экспортный','экспортны(?:е|х)|eksport'],
  ['tradeForm','Спот','спотовы(?:е|х)|спот|spot'],
  ['tradeForm','Форвард','форвардны(?:е|х)|форвард|forvard'],
  ['tradeForm','Фьючерс','фьючерсны(?:е|х)|фьючерс|fyuchers'],
  ['currency','Узбекский сум','(?:узбекских )?сумах|uzs|somda(?:gi)?'],
  ['currency','Доллар США','долларах(?: сша)?|usd|dollarda(?:gi)?'],
];
const regions = [
 ['andijon','андижанск','Andijon viloyati','Андижанская область'],['buxoro','бухарск','Buxoro viloyati','Бухарская область'],
 ['fargona','ферганск','Farg‘ona viloyati','Ферганская область'],['jizzax','джизакск','Jizzax viloyati','Джизакская область'],
 ['namangan','наманганск','Namangan viloyati','Наманганская область'],['navoiy','навоийск','Navoiy viloyati','Навоийская область'],
 ['qashqadaryo','кашкадарьинск','Qashqadaryo viloyati','Кашкадарьинская область'],
 ['samarqand','самаркандск','Samarqand viloyati','Самаркандская область'],['sirdaryo','сырдарьинск','Sirdaryo viloyati','Сырдарьинская область'],
 ['surxondaryo','сурхандарьинск','Surxondaryo viloyati','Сурхандарьинская область'],['toshkent','ташкентск','Toshkent viloyati','Ташкентская область'],
 ['xorazm','хорезмск','Xorazm viloyati','Хорезмская область'],
];

const dimensions = [
 ['region','регионы|регионов|областей|области|hudud(?:lar(?:da|i)?)?|viloyat(?:lar(?:da|i)?)?','Регионы','Hududlar'],
 ['currency','валют(?:ы|ах)?|valyuta(?:lar(?:da|i)?)?','Валюты','Valyutalar','contracts'],
 ['tradeForm','форм(?:ы|ах)?(?: контрактов)?|shakl(?:lar(?:i)?)?','Формы','Shakllar','contracts'],
 ['contractType','тип(?:ы|ов)(?: контрактов)?|tur(?:lar(?:i)?)?','Типы','Turlar','contracts'],
 ['category','категори(?:и|й) товаров|tovar toifalari','Категории товаров','Tovar toifalari','contracts'],
 ['group','групп(?:ы)? товаров|tovar guruhlari','Группы товаров','Tovar guruhlari','contracts'],
 ['unit','единиц(?:ы)? измерения|olchov birliklari','Единицы измерения','O‘lchov birliklari','contracts'],
 ['role','рол(?:и|ей)|rol(?:lar(?:i)?)?','Роли','Rollar','participants'],
 ['type','вид(?:ы|ов) деятельности|faoliyat turlari','Виды деятельности','Faoliyat turlari','participants'],
];

const breakdowns = [
  ['region','по регионам|по областям|по каждому региону|в каждом регионе|в разрезе регионов|(?:har bir|har qaysi) (?:hudud|viloyat)da|(?:hududlar|viloyatlar) (?:kesimida|boyicha)','Регионы','Hududlar'],
  ['role','по ролям|в разрезе ролей|rollar (?:kesimida|boyicha)','Роли','Rollar','participants'],
  ['category','по категориям товаров|tovar toifalari (?:kesimida|boyicha)','Категории товаров','Tovar toifalari','contracts'],
  ['currency','по валютам|valyutalar (?:kesimida|boyicha)','Валюты','Valyutalar','contracts'],
  ['tradeForm','по формам контрактов|shartnoma shakllari (?:kesimida|boyicha)','Формы','Shakllar','contracts'],
];

const ignored = new Set(('в на из по во всего есть имеется имеются представлено представлены представлен зарегистрировано зарегистрированы зарегистрирован базе данных реестре реестра справочнике справочника наборе данном всех все общее сколько количество число какие каких список покажи перечисли назови пожалуйста укажите разные различных разных уникальных уникальные содержится содержатся используются встречаются указаны ' +
  'nechta qancha jami soni sonini korsating keltiring sanab bering royxatini royxati qanday qaysi turli turdagi mavjud bor reyestrda reestrda reyestrida reestrida reyestrdagi reestrdagi katalogda royxatdan otgan ruyxatdan royxatga olingan qayd etilgan barcha malumotlar bazasida malumotlarida malumotnomasida boyicha').split(' '));

function tokenRegex(source) {
  return new RegExp('(?:^|\\s)(' + source + ')(?=\\s|$)', 'u');
}

export function directory(question, lang, db) {
  let q = normalize(question)
    .replace(/в справочнике (контрактов|участников|брокеров)(?= |$)/gu,(_,table)=> ' справочнике '+table)
    .replace(/brokerlar malumotnomasida/gu,'malumotnomasida brokerlar');
  const desc = definition(q, lang);
  if (desc) return desc;
  const count = tokenRegex('сколько|количество|число|nechta|qancha|soni|sonini').test(q);
  const list = tokenRegex('список|перечисли|назови|покажи|какие|каких|royxatini|royxati|qanday|qaysi|sanab').test(q);
  if (!count && !list) return null;
  function take(source) {
    const rx = tokenRegex(source);
    if (!rx.test(q)) return false;
    q = q.replace(rx, ' ').trim().replace(/\s+/g,' ');
    return true;
  }
  const ru = lang === 'ru';
  const criteria = new Map();
  const breakdown = breakdowns.find(([,pattern]) => take(pattern));
  const entity = entities.find(entry => take(entry[1]));
  let table = entity?.[0];
  if(entity) { while(take(entity[1])) {} }
  // "Сколько продавцов?" is a directory question. A trade/date qualifier stays unconsumed.
  for (const [field, value, pattern] of roleCriteria) {
    if (!take(pattern)) continue;
    if ((table && table !== 'participants') || criteria.has(field)) return null;
    table = 'participants';
    criteria.set(field, value);
  }
  for (const [field, value, pattern] of contractCriteria) {
    if (!take(pattern)) continue;
    if (table !== 'contracts' || criteria.has(field)) return null;
    criteria.set(field, value);
  }
  for (const [uz, ruStem, uzName, ruName] of regions) {
    if (!take(uz + ' viloyati(?:da(?:gi)?|ning)?|' + ruStem + '(?:ой|ая|ую) област(?:и|ь)')) continue;
    if (criteria.has('region')) return null;
    criteria.set('region', table === 'contracts' ? ruName : uzName);
  }
  if (take('toshkent shah(?:ri|ar)(?:da(?:gi)?|ning)?|(?:городе |город |г )?ташкент(?:е|а)?')) {
    if (criteria.has('region')) return null;
    criteria.set('region', table === 'contracts' ? 'г. Ташкент' : 'Toshkent shahri');
  }
  if (take('qoraqalpogiston(?: respublikasi)?(?:da(?:gi)?|ning)?|(?:республик(?:а|е|и) )?каракалпакстан(?:е|а)?')) {
    if (criteria.has('region')) return null;
    criteria.set('region', table === 'contracts' ? 'Республика Каракалпакстан' : 'Qoraqalpog‘iston Respublikasi');
  }
  const dimension = dimensions.find(([, pattern,,, scope]) =>
    (!scope || !table || scope === table) && take(pattern));
  if (!table && dimension?.[4]) table = dimension[4];
  if (breakdown?.[4]) {
    if (table && table !== breakdown[4]) return null;
    table = breakdown[4];
  }
  if (!table) return null;
  if (q.split(' ').some(word => word && !ignored.has(word))) return null;
  const dataset = db[table];
  const constraints = [...criteria];
  const matches = dataset.filter(record => constraints.every(([field,val]) => record[field] === val));
  const label = entities.find(entry => entry[0] === table)[ru ? 2 : 3];
  const keys = constraints.map(([,val]) => val);
  const source = table + '.csv';
  const sources = [source];
  for (const record of matches.slice(0,2)) if (record._line) sources.push(source + ' · ' + (ru ? 'строка ' : 'qator ') + record._line);
  const base = {status:'ok',lang,sources,matched:matches.length,columns:[],rows:[]};
  const method = (ru ? 'Справочник: ' : 'Ma’lumotnoma: ') + source + '. ' + (keys.length ? keys.join(', ') + '. ' : '')
    + (ru ? 'Подсчёт по записям справочника.' : 'Ma’lumotnoma yozuvlari bo‘yicha hisoblandi.');
  if (breakdown) {
    if (dimension) return null;
    const counts = new Map();
    for (const record of matches) {
      const value = record[breakdown[0]];
      if (!value) continue;
      counts.set(value,(counts.get(value) ?? 0)+1);
    }
    const rows = [...counts].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
    return {...base,method,answer:(ru ? 'Всего записей: ' : 'Jami yozuvlar: ') + matches.length + '.',
      columns:[breakdown[ru ? 2 : 3],ru ? 'Количество' : 'Soni'],rows};
  }
  if (dimension) {
    const values = [...new Set(matches.map(row => row[dimension[0]]).filter(Boolean))].sort();
    const title = dimension[ru ? 2 : 3];
    return {...base,method,answer:title + ' · ' + values.length + (count && !list ? '.' : ': ' + values.join(', ') + '.'),
      columns:[title],rows:values.map(v=>[v])};
  }
  if (count) return {...base,method,answer:label[0].toUpperCase()+label.slice(1) + (keys.length ? ' (' + keys.join(', ') + ')' : '') + ' · ' + matches.length + '.'};
  const shown = matches.slice(0,50);
  return {...base,method,answer:ru ? 'Записей: ' + matches.length + '. Показано: ' + shown.length + '.' : 'Jami ' + matches.length + ' ta yozuv. ' + shown.length + ' tasi ko‘rsatilgan.',
    columns:[ru?'Код / ИНН':'Kod / STIR',ru?'Наименование':'Nomi',ru?'Регион':'Hudud'],rows:shown.map(record=>[record.id,record.name,record.region])};
}
