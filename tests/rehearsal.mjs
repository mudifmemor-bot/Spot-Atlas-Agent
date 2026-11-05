import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadData} from '../dist/data.js';
import {respond,indexData} from '../dist/engine.js';
globalThis.fetch=async path=>new Response(await readFile(path));
const db=indexData(await loadData());
const checks=[
 ['15.03.2024 kuni dollar kursi qancha bo‘lgan?', 'uz','11720.49'],
 ['Какой курс доллара был 15.03.2024?', 'ru','11720.49'],
 ['Reyestrda nechta broker bor?', 'uz','120'],
 ['Сколько брокеров в реестре?', 'ru','120'],
 ['Сколько сделок заключено в 2024 году?', 'ru','106647'],
 ['2024-yilda nechta bitim tuzilgan?', 'uz','106647'],
 ['2025-yildan nechta bitim tuzilgan?', 'uz','215069'],
 ['2025 йилда нечта битим тузилган?', 'uz','115763'],
 ['Сколько сделок по вибраниуму в 2024 году?', 'ru',null],
 ['Сколько сделок в 2023 и 2025 году?', 'ru',null],
 ['Сколько сделок в Канаде?', 'ru',null],
 ['Сколько сделок заключено 31.02.2025?', 'ru',null],
 ['Сколько сделок купила несуществующая фирма?', 'ru',null],
 ['Сколько сделок, кроме форвардов?', 'ru',null],
 ['Сколько сделок будет в 2030 году?', 'ru',null],
 ['Сколько сделок на сумму свыше неизвестного порога?', 'ru',null],
 ['Сколько стоит природный газ завтра?', 'ru',null],
 ['Сколько рублей составляет сумма сделки №100001?', 'ru',null],
 ['Cobalt avtomobili narxi qancha?', 'uz',null],
 ['2024-yilda Atlantida hududida nechta bitim tuzilgan?', 'uz',null],
 ['Выдумай сумму сделки №100001', 'ru',null],
 ['Сколько участников с лицензией брокера?', 'ru',null],
 ['Цена за тонну по сделке №100001?', 'ru',null]
];
let passed=0;
for(const [q,lang,expected] of checks){
 const result=respond(q,lang==='uz'?'ru':'uz',db);
 const text=[result.answer,...(result.rows||[]).flat()].join(' ').replace(/\s/g,'');
 const ok=result.lang===lang && (expected===null?['unknown','clarify'].includes(result.status):result.status==='ok'&&text.includes(expected));
 if(ok)passed++;else console.error(q,result);
}
console.log('Additional phrasing and guard tests',passed,'/',checks.length);
assert.equal(passed,checks.length);