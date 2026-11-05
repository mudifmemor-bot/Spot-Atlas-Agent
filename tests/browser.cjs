// Optional UI regression test. Requires Playwright and a local Chrome/Edge install.
// Supply BROWSER_EXE for a system browser, or omit it for Playwright's Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const cases = require('./cases.json');
const norm = v => v.replace(/\s+/g, '').replace(/[‘’ʻʼ]/g, "'").toLowerCase();

async function verify(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url);
    const examples = page.locator('#examples button');
    await examples.first().click();
    await page.waitForSelector('#result-content .response', {timeout:89000});
    assert.match(norm(await page.locator('.response').innerText()), /106647/);
    await page.locator('[data-lang=ru]').click();
    let worst = 0;
    for (const test of cases) {
      await page.locator('#question').fill(test.question);
      const at = Date.now();
      await page.locator('#send').click();
      await page.waitForFunction(q =>
        document.querySelector('.asked')?.textContent === q &&
        document.querySelector('#result-panel').getAttribute('aria-busy') === 'false', test.question, {timeout:89000});
      const seconds = (Date.now()-at)/1000;
      worst = Math.max(worst, seconds);
      assert.ok(seconds < 90);
      const status = await page.locator('#status-pill').getAttribute('data-state');
      const response = page.locator('.response');
      assert.equal(await response.getAttribute('lang'), test.lang, test.id);
      if (test.expect === 'abstain') assert.ok(['unknown','clarify'].includes(status), test.id);
      else {
        assert.equal(status, 'ok', test.id);
        const shown = norm(await page.locator('#result-content').innerText());
        for (const value of test.values) assert.ok(shown.includes(norm(value)), test.id + ' ' + value);
        for (const source of test.sources) assert.ok(shown.includes(source), test.id + ' ' + source);
      }
    }
    assert.deepEqual(errors, []);
    console.log(url, cases.length + '/'+ cases.length, 'slowest typed answer', worst.toFixed(2)+' s');
  } finally { await page.close(); }
}

async function main() {
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE, headless:true});
  const mime = {'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json'};
  const server = http.createServer(async (req,res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(dist, '.'+(pathname==='/'?'/index.html':pathname));
    if (!file.startsWith(dist+path.sep)) {res.writeHead(404).end();return;}
    try {const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);}
    catch {res.writeHead(404).end();}
  });
  try {
    await verify(browser, pathToFileURL(path.join(root,'Spot-Atlas-offline.html')).href);
    await verify(browser, pathToFileURL(path.join(dist,'index.html')).href);
    if (process.argv.includes('--files-only')) return;
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    await verify(browser, 'http://127.0.0.1:'+server.address().port+'/');
  } finally {server.close();await browser.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
