const copy = {
  uz: {
    workspace: 'TAHLIL MAYDONI', title: 'Birja reyestri yordamchisi',
    intro: 'Birja bitimlari haqida rus yoki o‘zbek tilida so‘rang. Har bir javobning hisoblash usuli va manbasini ko‘ring.',
    queryTag: 'SO‘ROV', askTitle: 'Savolingiz', submit: 'Javob olish', examples: 'Sinab ko‘ring',
    answerTag: 'NATIJA', answerTitle: 'Javob va dalillar', standby: 'Savol yuboring. Bu yerda javob, hisoblash usuli va manbalar ko‘rinadi.',
    dataTag: 'MA’LUMOTLAR', registryTitle: 'Reyestr qamrovi', registered: 'qayd etilgan bitim',
    perYear: 'YILLAR KESIMIDA', cutoff: '* 2026-yil ma’lumotlari 30-oktabrgacha.',
    related: 'MA’LUMOTNOMALAR', contracts: 'Shartnomalar', members: 'Ishtirokchilar', brokers: 'Brokerlar',
    footer: 'UZEX AI Hackathon · Sun’iy test ma’lumotlari', placeholder: 'Masalan, 2024-yilda nechta bitim tuzilgan?',
    loading: 'Reyestr tekshirilmoqda…', working: 'Tekshirilmoqda', method: 'Hisoblash usuli', sources: 'Manbalar',
    matched: 'Mos yozuvlar', elapsed: 'Vaqt', seconds: 's', ok: 'Hisoblandi', unknown: 'Javob topilmadi',
    clarify: 'Aniqlashtiring', failure: 'Reyestrni yuklash yoki o‘qishda xatolik yuz berdi. Internet aloqasini tekshirib, savolni qayta yuboring.',
    timeout: 'Savol belgilangan vaqt ichida tekshirilmadi. Qayta urinib ko‘ring.', error: 'Xatolik', empty: 'Savol kiriting.',
    table: 'Javobga asos bo‘lgan yozuvlar', done: 'Tekshiruv tugadi.', langLabel: 'Interfeys tili',
    prompts: [
      ['Yillik bitimlar', '2024-yilda nechta bitim tuzilgan?'],
      ['Dollar kursi', '15.03.2024 kuni dollar kursi qancha bo‘lgan?'],
      ['Brokerlar soni', 'Reyestrda nechta broker bor?'],
    ],
  },
  ru: {
    workspace: 'РАБОЧАЯ ОБЛАСТЬ', title: 'Помощник по реестру сделок',
    intro: 'Спросите о биржевых сделках на русском или узбекском языке. Для каждого ответа можно посмотреть способ расчёта и источник.',
    queryTag: 'ЗАПРОС', askTitle: 'Ваш вопрос', submit: 'Получить ответ', examples: 'Попробуйте',
    answerTag: 'РЕЗУЛЬТАТ', answerTitle: 'Ответ и обоснование', standby: 'Задайте вопрос. Здесь появятся ответ, способ расчёта и источники.',
    dataTag: 'ДАННЫЕ', registryTitle: 'Состав реестра', registered: 'зарегистрированных сделок',
    perYear: 'СДЕЛКИ ПО ГОДАМ', cutoff: '* В 2026 году учтены данные по 30 октября.',
    related: 'СПРАВОЧНИКИ', contracts: 'Контракты', members: 'Участники', brokers: 'Брокеры',
    footer: 'UZEX AI Hackathon · Синтетические тестовые данные', placeholder: 'Например, сколько сделок заключено в 2024 году?',
    loading: 'Проверяем данные реестра…', working: 'Идёт поиск', method: 'Способ расчёта', sources: 'Источники',
    matched: 'Подходящие записи', elapsed: 'Время', seconds: 'с', ok: 'Рассчитано', unknown: 'Нет ответа',
    clarify: 'Уточните запрос', failure: 'Не удалось загрузить или прочитать реестр. Проверьте соединение и повторите запрос.',
    timeout: 'Проверка заняла больше отведённого времени. Повторите запрос.', error: 'Ошибка', empty: 'Введите вопрос.',
    table: 'Записи, подтверждающие ответ', done: 'Проверка завершена.', langLabel: 'Язык интерфейса',
    prompts: [
      ['Сделки за год', 'Сколько сделок заключено в 2024 году?'],
      ['Курс доллара', 'Какой курс доллара был 15.03.2024?'],
      ['Число брокеров', 'Сколько брокеров в реестре?'],
    ],
  },
};
const select = selector => document.querySelector(selector);
const form = select('#ask-form');
const input = select('#question');
const panel = select('#result-panel');
const output = select('#result-content');
const pill = select('#status-pill');
const announcer = select('#live');
const annual = [[2022,84299],[2023,93985],[2024,106647],[2025,115763],[2026,99306]];
let lang = 'uz';
let last = null;
let pending = null;
let worker = null;
let seq = 0;

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

function formatCount(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function drawChart() {
  const chart = select('#chart');
  const max = Math.max(...annual.map(row => row[1]));
  for (const [year, count] of annual) {
    const row = make('div', 'chart-row');
    row.setAttribute('role', 'listitem');
    const track = make('div', 'track');
    track.setAttribute('aria-hidden', 'true');
    const bar = make('span', 'bar');
    bar.style.width = (count / max * 100) + '%';
    track.append(bar);
    row.append(make('span', '', year === 2026 ? '2026*' : year), track, make('strong', '', formatCount(count)));
    chart.append(row);
  }
}

function setLanguage(next) {
  lang = next;
  const t = copy[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i]').forEach(node => { node.textContent = t[node.dataset.i]; });
  document.querySelectorAll('[data-lang]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.lang === lang)); });
  select('.languages').setAttribute('aria-label', t.langLabel);
  input.placeholder = t.placeholder;
  input.setCustomValidity('');
  const examples = select('#examples');
  examples.replaceChildren();
  for (const [label, question] of t.prompts) {
    const btn = make('button', 'example', label + ' ↗');
    btn.type = 'button';
    btn.title = question;
    btn.setAttribute('aria-label', question);
    btn.disabled = Boolean(pending);
    btn.addEventListener('click', () => { input.value = question; input.setCustomValidity(''); form.requestSubmit(); });
    examples.append(btn);
  }
  if (pending) showProgress();
  else if (last) renderLast();
}

function status(state, label) {
  pill.dataset.state = state;
  pill.textContent = label;
  pill.hidden = !label;
}

function setBusy(on) {
  panel.setAttribute('aria-busy', String(on));
  select('#send').disabled = on;
  document.querySelectorAll('.example').forEach(btn => { btn.disabled = on; });
}

function showProgress() {
  const t = copy[lang];
  status('pending', t.working);
  const line = make('div', 'progress-line');
  const spinner = make('span', 'spinner');
  spinner.setAttribute('aria-hidden', 'true');
  line.append(spinner, make('span', '', pending.progress || t.loading));
  output.replaceChildren(line);
}

// Sources and row values are data. Append them as text so quotes and names remain literal.
function display(value) {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.map(display).join(' · ');
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => k + ': ' + display(v)).join(' · ');
  return String(value);
}

function addTable(columns, rows, t) {
  if (!Array.isArray(rows) || !rows.length || !Array.isArray(columns) || !columns.length) return;
  const wrap = make('div', 'table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', t.table);
  const table = make('table');
  table.append(make('caption', 'sr-only', t.table));
  const head = table.createTHead().insertRow();
  for (const column of columns) {
    const th = make('th', '', typeof column === 'object' ? column.label || column.key : column);
    th.scope = 'col';
    head.append(th);
  }
  const body = table.createTBody();
  for (const entry of rows) {
    const row = body.insertRow();
    columns.forEach((column, idx) => {
      const key = typeof column === 'object' ? column.key : column;
      const value = Array.isArray(entry) ? entry[idx] : entry?.[key];
      row.append(make('td', '', display(value)));
    });
  }
  wrap.append(table);
  output.append(wrap);
}

function renderLast() {
  const t = copy[lang];
  const {question, result, seconds, errorKey} = last;
  output.replaceChildren(make('p', 'asked', question));
  if (errorKey) {
    status('unknown', t.error);
    output.append(make('p', 'response', t[errorKey]));
    return;
  }
  status(result.status, t[result.status] || t.unknown);
  const answer = make('p', 'response', result.answer);
  if (['ru','uz'].includes(result.lang)) answer.lang = result.lang;
  output.append(answer);
  addTable(result.columns, result.rows, t);
  if (result.method || result.sources?.length) {
    const evidence = make('div', 'evidence');
    if (result.method) evidence.append(make('h3', '', t.method), make('p', 'method', display(result.method)));
    if (result.sources?.length) {
      evidence.append(make('h3', 'sources-title', t.sources));
      const sources = Array.isArray(result.sources) ? result.sources : [result.sources];
      sources.forEach(source => evidence.append(make('span', 'source', display(source))));
    }
    output.append(evidence);
  }
  const metadata = make('div', 'metadata');
  if (result.matched != null) metadata.append(make('span', '', t.matched + ' · ' + formatCount(result.matched)));
  metadata.append(make('span', '', t.elapsed + ' · ' + seconds.toFixed(2) + ' ' + t.seconds));
  output.append(metadata);
}

function finish(result, errorKey = null) {
  if (!pending) return;
  clearTimeout(pending.timer);
  last = {question:pending.question, result, errorKey, seconds:(performance.now()-pending.since)/1000};
  pending = null;
  setBusy(false);
  renderLast();
  announcer.textContent = errorKey ? copy[lang][errorKey] : copy[lang].done + ' ' + String(result.answer || '').slice(0, 220);
  if (matchMedia('(max-width:700px)').matches) panel.scrollIntoView({block:'nearest'});
}

function resetWorker(errorKey) {
  if (worker) worker.terminate();
  worker = null;
  finish(null, errorKey);
}

function getWorker() {
  if (!worker) {
    const embedded = document.getElementById('bundled-worker');
    const parts = embedded ? [embedded.textContent] : window.spotLocalParts;
    if (parts) {
      const url = URL.createObjectURL(new Blob(parts, {type:'text/javascript'}));
      try { worker = new Worker(url); }
      finally { URL.revokeObjectURL(url); }
    } else {
      worker = new Worker('./worker.js', {type:'module'});
    }
    worker.addEventListener('message', event => {
      const message = event.data || {};
      if (!pending) return;
      if (message.type === 'progress') {
        if (message.id != null && message.id !== pending.id) return;
        pending.progress = typeof message.message === 'string' ? message.message : message.message?.[lang];
        showProgress();
      } else if (message.id === pending.id) {
        if (message.result && typeof message.result.answer === 'string' && ['ok','unknown','clarify'].includes(message.result.status)) finish(message.result);
        else finish(null, 'failure');
      }
    });
    worker.addEventListener('error', () => resetWorker('failure'));
    worker.addEventListener('messageerror', () => resetWorker('failure'));
  }
  return worker;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (pending) return;
  const question = input.value.trim();
  if (!question) {
    input.setCustomValidity(copy[lang].empty);
    input.reportValidity();
    return;
  }
  const id = ++seq;
  pending = {id,question,since:performance.now(),timer:setTimeout(() => resetWorker('timeout'), 89000)};
  setBusy(true);
  showProgress();
  announcer.textContent = copy[lang].loading;
  try { getWorker().postMessage({id,question,lang}); }
  catch { resetWorker('failure'); }
});
input.addEventListener('input', () => input.setCustomValidity(''));
input.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); form.requestSubmit(); }
});
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
drawChart();
setLanguage('uz');
setBusy(false);
document.querySelector('#startup')?.remove();
