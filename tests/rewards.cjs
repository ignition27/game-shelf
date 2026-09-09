/* Run: node tests/rewards.cjs [directory containing rewards.js and rewards.css]
 * Optional: PLAYWRIGHT_MODULE=/absolute/path/to/playwright
 * Uses a real Chromium page and isolated browser storage for each scenario.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
let playwright;
for (const name of [process.env.PLAYWRIGHT_MODULE, 'playwright'].filter(Boolean)) {
  try { playwright = require(name); break; } catch {}
}
if (!playwright) throw new Error('Install Playwright, or set PLAYWRIGHT_MODULE to its installed directory.');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const fixture = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Rewards test</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/rewards.css"></head><body><header><a class="brand" href="#">GAME SHELF</a><nav><button>Home</button></nav></header><main id="app"></main><script>window.clean=()=>{};window.shell=(title,sub,body)=>{clean();document.getElementById('app').innerHTML='<div class="game-head"><h1>'+title+'</h1></div><div class="game-wrap"><p>'+sub+'</p>'+body+'</div>';};</script><script src="/rewards.js"></script></body></html>`;
const server = http.createServer((req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); return res.end(fixture); }
  const name = (req.url || '').slice(1);
  if (!['rewards.js', 'rewards.css', 'style.css'].includes(name)) { res.statusCode = 404; return res.end(); }
  let filename = path.join(root, name);
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/css');
  res.end(fs.readFileSync(filename));
});
const checks = [];
function check(name, fn) { checks.push({name, fn}); }
let browser, origin;
const state = page => page.evaluate(() => Shelf.getState());
const record = (page, event, data) => page.evaluate(({event, data}) => Shelf.record(event, data), {event, data});
async function fresh(options = {}) {
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, ...options});
  const page = await context.newPage();
  page.on('pageerror', error => { throw error; });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  return {context, page};
}
async function scenario(fn, options) { const {context, page} = await fresh(options); try { await page.goto(origin); await fn(page, context); } finally { await context.close(); } }
async function dismissAll(page) { for (let i = 0; i < 30; i++) { if (!await page.locator('#shelf-toast:visible').count()) return; await page.getByRole('button', {name: 'Dismiss achievement notification'}).click(); } throw new Error('Toast queue did not empty.'); }

check('fresh state, free defaults, safe palette, and immutable API data', () => scenario(async page => {
  const initial = await state(page);
  assert.equal(Object.keys(initial.earned).length, 0);
  assert.equal(initial.stats.played.length, 0);
  assert.deepEqual(initial.equipped, {theme: 'classic', snake: 'classic', ship: 'classic', plane: 'classic', golf: 'classic'});
  assert.equal(await page.evaluate(() => Shelf.catalog.length), 22);
  assert.equal(await page.evaluate(() => Shelf.cosmetics.length), 18);
  assert.deepEqual(await page.evaluate(() => Shelf.palette('snake')), {main: '#397665', accent: '#244f47'});
  assert.deepEqual(await page.evaluate(() => Shelf.palette('ship')), {main: '#cfe4db', accent: '#9fced0'});
  assert.deepEqual(await page.evaluate(() => Shelf.palette('plane')), {main: '#f3bd70', accent: '#dd765b'});
  assert.deepEqual(await page.evaluate(() => Shelf.palette('nonsense')), {main: '#fffdf3', accent: '#8bdcc0'});
  assert.equal(await page.evaluate(() => {const copy = Shelf.getState(); copy.stats.played.push('snake'); copy.earned.forged=1; copy.equipped.snake='lavender'; return Shelf.getState().stats.played.length;}), 0);
  assert.equal(await page.evaluate(() => Object.isFrozen(Shelf) && Object.isFrozen(Shelf.catalog) && Shelf.catalog.every(Object.isFrozen) && Object.isFrozen(Shelf.cosmetics) && Shelf.cosmetics.every(Object.isFrozen)), true);
  for (const category of ['theme', 'snake', 'ship', 'plane', 'golf']) assert.equal(await page.evaluate(category => Shelf.equip(category, 'classic'), category), true);
}));

check('distinct games unlock at 1, 6, and 12; repeat opens are idempotent', () => scenario(async page => {
  assert.deepEqual(await record(page, 'game_play', {id:'snake'}), ['first-play']);
  const savedFirst = (await state(page)).earned['first-play'];
  assert.deepEqual(await record(page, 'game_play', {id:'snake'}), []);
  assert.equal((await state(page)).earned['first-play'], savedFirst);
  assert.deepEqual(await record(page, 'game_play', {id:'invalid-game'}), []);
  for (const id of ['dodger','memory','reaction','word']) await record(page, 'game_play', {id});
  assert.equal(Object.hasOwn((await state(page)).earned, 'six-games'), false);
  assert.deepEqual(await record(page, 'game_play', {id:'clicker'}), ['six-games']);
  for (const id of ['flappy','platform','tic','checkers','trade']) await record(page, 'game_play', {id});
  assert.equal(Object.hasOwn((await state(page)).earned, 'all-games'), false);
  assert.deepEqual(await record(page, 'game_play', {id:'golf'}), ['all-games']);
  assert.equal((await state(page)).stats.played.length, 12);
}));

check('all game achievement thresholds, best values, and duplicate prevention', () => scenario(async page => {
  const thresholdCases = [
    ['snake_score', {score:9}, {score:10}, 'snake-ten', 'snakeScore'],
    ['memory_win', {moves:17}, {moves:16}, 'memory-master', 'memoryMoves'],
    ['reaction_result', {ms:250.1}, {ms:250}, 'quick-reaction', 'reactionMs'],
    ['clicker_power', {power:4}, {power:5}, 'clicker-five', 'clickerPower'],
    ['flyer_score', {score:9}, {score:10}, 'flyer-ten', 'flyerScore'],
    ['trade_properties', {count:2}, {count:3}, 'trade-three', 'tradeProperties']
  ];
  for (const [event, before, pass, id, metric] of thresholdCases) {
    assert.deepEqual(await record(page, event, before), []);
    assert.equal(Object.hasOwn((await state(page)).earned, id), false);
    assert.deepEqual(await record(page, event, pass), [id]);
    const value = (await state(page)).stats[metric], timestamp = (await state(page)).earned[id];
    assert.deepEqual(await record(page, event, before), []);
    assert.deepEqual(await record(page, event, pass), []);
    assert.equal((await state(page)).stats[metric], value);
    assert.equal((await state(page)).earned[id], timestamp);
  }
  for (const [event, id] of [['shooter_boss','first-boss'], ['platform_win','platform-win'], ['tic_win','tic-win'], ['checkers_win','checkers-win']]) {
    assert.deepEqual(await record(page, event, {}), [id]); assert.deepEqual(await record(page, event, {}), []);
  }
  assert.deepEqual(await record(page, 'word_win', {guesses:3}), ['word-win']);
  assert.deepEqual(await record(page, 'word_win', {guesses:2}), ['word-two']);
  assert.deepEqual(await record(page, 'word_win', {guesses:1}), []);
  assert.equal((await state(page)).stats.wordGuesses, 1);
  assert.deepEqual(await record(page, 'golf_hole', {strokes:2,par:3}), ['golf-first']);
  assert.deepEqual(await record(page, 'golf_hole', {strokes:1,par:2}), ['golf-ace']);
  assert.deepEqual(await record(page, 'golf_hole', {strokes:1,par:2}), []);
  assert.deepEqual(await record(page, 'golf_round', {total:10,par:19,holed:5}), []);
  assert.deepEqual(await record(page, 'golf_round', {total:20,par:19,holed:6}), ['golf-round']);
  assert.deepEqual(await record(page, 'golf_round', {total:19,par:19,holed:6}), ['golf-par']);
  assert.deepEqual(await record(page, 'golf_round', {total:6,par:19,holed:6}), []);
  assert.equal((await state(page)).stats.golfBestDelta, -13);
  for (const id of ['snake','dodger','memory','reaction','word','clicker','flappy','platform','tic','checkers','trade','golf']) await record(page, 'game_play', {id});
  assert.equal(Object.keys((await state(page)).earned).length, 19);
  await page.evaluate(() => Shelf.render());
  assert.equal(await page.locator('.shelf-achievement.is-earned').count(), 19);
  assert.equal(await page.locator('[data-equip-category]:disabled').count(), 3, 'Daily rewards stay locked after game achievements');
  assert.deepEqual(await record(page,'daily_sets',{count:2}),[]);
  assert.deepEqual(await record(page,'daily_sets',{count:3}),['daily-three']);
  assert.deepEqual(await record(page,'daily_sets',{count:7}),['daily-seven']);
  assert.deepEqual(await record(page,'daily_sets',{count:14}),['daily-fourteen']);
  assert.deepEqual(await record(page,'daily_sets',{count:7}),[]);
  await page.evaluate(()=>Shelf.render());
  assert.equal(await page.locator('[data-equip-category]:disabled').count(),0);
  assert.equal(Object.keys((await state(page)).earned).length,22);
}));

check('rejects nonfinite, negative, fractional and impossible metrics without writes', () => scenario(async page => {
  const result = await page.evaluate(() => {
    let writes = 0; const original = Storage.prototype.setItem; Storage.prototype.setItem = function(...args) { writes++; return original.apply(this,args); };
    const numericEvents = [['snake_score','score'], ['memory_win','moves'], ['reaction_result','ms'], ['word_win','guesses'], ['clicker_power','power'], ['flyer_score','score'], ['trade_properties','count']];
    for (const [event,key] of numericEvents) for (const value of [NaN,Infinity,-Infinity,'10',null,undefined,{},[],true,-1]) Shelf.record(event,{[key]:value});
    for (const [event,key] of numericEvents.filter(([event]) => event !== 'reaction_result')) Shelf.record(event,{[key]:8.5});
    for (const [event, data] of [['snake_score',{score:401}], ['memory_win',{moves:7}], ['word_win',{guesses:7}], ['word_win',{guesses:0}], ['reaction_result',{ms:0}], ['reaction_result',{ms:60001}], ['clicker_power',{power:0}], ['golf_hole',{strokes:0,par:2}], ['golf_hole',{strokes:1,par:0}], ['golf_hole',{strokes:'1',par:2}], ['golf_round',{total:5,par:19,holed:6}], ['golf_round',{total:19,par:19,holed:'6'}], ['golf_round',{total:19,par:19,holed:5}], ['trade_properties',{count:101}]]) Shelf.record(event,data);
    for (const payload of [null,[],1,true,'value']) Shelf.record('shooter_boss',payload);
    Shelf.record('__proto__',{}); Shelf.record('unknown',{}); Shelf.record(null,{}); Shelf.record('game_play',{id:'<img src=x onerror=alert(1)>'});
    return {state:Shelf.getState(), writes};
  });
  assert.equal(Object.keys(result.state.earned).length, 0);
  assert.equal(result.writes, 0);
  assert.equal(result.state.stats.reactionMs, null);
  assert.equal(result.state.stats.golfRounds, 0);
}));

check('locked equipment cannot be selected; every earned cosmetic can be equipped and persists', () => scenario(async page => {
  await page.evaluate(() => Shelf.render());
  assert.equal(await page.locator('[data-equip-category]:disabled').count(), 13);
  assert.equal(await page.locator('[data-equip-category][aria-pressed="true"]').count(), 5);
  const before = await state(page);
  assert.equal(await page.evaluate(() => Shelf.equip('snake','lavender')), false);
  assert.equal(await page.evaluate(() => Shelf.equip('__proto__','classic')), false);
  assert.equal(await page.evaluate(() => Shelf.equip('theme','missing')), false);
  assert.deepEqual(await state(page), before);
  await record(page, 'game_play', {id:'snake'});
  await record(page, 'snake_score', {score:10});
  await record(page, 'shooter_boss', {});
  await record(page, 'flyer_score', {score:10});
  await record(page, 'golf_hole', {strokes:2,par:3});
  await page.evaluate(() => Shelf.render());
  await dismissAll(page);
  for (const [category,id] of [['theme','sunset'],['snake','lavender'],['ship','nova'],['plane','sky'],['golf','coral']]) {
    await page.locator(`[data-equip-category="${category}"][data-equip-id="${id}"]`).click();
    assert.equal((await state(page)).equipped[category], id);
    assert.equal(await page.locator(`[data-equip-category="${category}"][data-equip-id="${id}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.equipCategory), category);
  }
  assert.equal(await page.locator('body').getAttribute('data-shelf-theme'), 'sunset');
  const equipped = await state(page);
  await page.reload();
  assert.deepEqual(await state(page), equipped);
  assert.equal(await page.locator('body').getAttribute('data-shelf-theme'), 'sunset');
  assert.equal(await page.locator('#shelf-toast:visible').count(), 0);
  await page.evaluate(() => Shelf.render());
  assert.match(await page.locator('[data-cosmetic="snake:lavender"]').innerText(), /Equipped/);
  assert.deepEqual(await page.evaluate(() => Shelf.palette('golf')), {main:'#ff936f',accent:'#aa452f'});
  await page.locator('[data-equip-category="theme"][data-equip-id="classic"]').click();
  assert.equal(await page.locator('body').getAttribute('data-shelf-theme'), 'classic');
  assert.equal((await state(page)).equipped.snake, 'lavender');
}));

check('malformed storage, legacy scores, invalid metrics and forged reward IDs do not unlock cosmetics', () => scenario(async page => {
  const malformed = ['{not-json', 'null', '[]', '"text"', '{"version":900,"stats":{"played":["snake"]}}', '{"version":1,"stats":null}'];
  for (const input of malformed) {
    await page.evaluate(input => {localStorage.setItem(Shelf.storageKey,input);localStorage.setItem('garden-snake-classic-125-1','300');localStorage.setItem('pocket-greens-best','6');},input);
    await page.reload();
    assert.equal(Object.keys((await state(page)).earned).length,0);
    assert.equal((await state(page)).equipped.golf,'classic');
  }
  await page.evaluate(() => localStorage.setItem(Shelf.storageKey,JSON.stringify({version:1,stats:{played:['snake','snake','golf','evil'],snakeScore:'10',bossWins:2,memoryMoves:-1,reactionMs:0,wordWins:0,wordGuesses:1,clickerPower:-5,golfHoles:0,golfBestHole:1,golfRounds:0,golfBestDelta:-19},earned:{'snake-ten':10,'golf-par':10,evil:5,'first-play':'wrong'},equipped:{theme:'ocean',snake:'lavender',golf:'gold',plane:'unknown'}})));
  await page.reload();
  const loaded = await state(page);
  assert.deepEqual(loaded.stats.played,['snake','golf']);
  assert.deepEqual(Object.keys(loaded.earned),['first-play']);
  assert.equal(typeof loaded.earned['first-play'],'number');
  assert.equal(loaded.equipped.theme,'classic');
  assert.equal(loaded.equipped.snake,'classic');
  assert.equal(loaded.equipped.golf,'classic');
  assert.equal(loaded.stats.golfBestHole,null);
  assert.equal(loaded.stats.golfBestDelta,null);
  assert.equal(loaded.stats.wordGuesses,null);
}));

check('unavailable storage retains session progress and equipment with an honest notice', async () => {
  const {context,page}=await fresh();
  try {
    await page.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
    await page.goto(origin);
    assert.deepEqual(await record(page,'game_play',{id:'snake'}),['first-play']);
    assert.equal(await page.evaluate(() => Shelf.equip('theme','sunset')),true);
    await page.evaluate(() => Shelf.render());
    assert.match(await page.locator('.shelf-storage-note').innerText(),/will not survive a reload/);
    assert.equal((await state(page)).equipped.theme,'sunset');
    await page.reload();
    assert.equal(Object.keys((await state(page)).earned).length,0);
  } finally { await context.close(); }
});

check('quota failure preserves active progress and future successful saves recover', () => scenario(async page => {
  await page.evaluate(() => {window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
  await record(page,'snake_score',{score:10});
  await page.evaluate(() => Shelf.equip('snake','lavender'));
  assert.equal((await state(page)).equipped.snake,'lavender');
  await page.evaluate(() => Shelf.render());
  assert.match(await page.locator('.shelf-storage-note').innerText(),/unavailable/);
  await page.evaluate(() => {Storage.prototype.setItem=window.originalSet;});
  await record(page,'game_play',{id:'snake'});
  await page.reload();
  assert.equal((await state(page)).equipped.snake,'lavender');
  assert.equal(Object.keys((await state(page)).earned).length,2);
}));

check('queued live notifications are singular, dismissible, ordered, and reduced-motion friendly', () => scenario(async page => {
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.deepEqual(await record(page,'word_win',{guesses:2}),['word-win','word-two']);
  assert.equal(await page.locator('#shelf-toast').count(),1);
  assert.equal(await page.locator('#shelf-toast [role="status"]').getAttribute('aria-live'),'polite');
  assert.match(await page.locator('#shelf-toast').innerText(),/Vault unlocked/);
  assert.match(await page.locator('#shelf-toast').innerText(),/Autumn harvest/);
  assert.equal(await page.locator('#shelf-toast').evaluate(el => getComputedStyle(el).animationName),'none');
  await page.getByRole('button',{name:'Dismiss achievement notification'}).click();
  assert.match(await page.locator('#shelf-toast').innerText(),/Code whisperer/);
  await record(page,'word_win',{guesses:2});
  await page.getByRole('button',{name:'Dismiss achievement notification'}).click();
  assert.equal(await page.locator('#shelf-toast:visible').count(),0);
}));

check('achievement progress, cosmetic jump links, desktop/mobile layouts and keyboard focus', () => scenario(async page => {
  for (const id of ['snake','memory','golf']) await record(page,'game_play',{id});
  await record(page,'snake_score',{score:7});
  await record(page,'memory_win',{moves:20});
  await page.evaluate(() => Shelf.render());
  await dismissAll(page);
  assert.equal(await page.locator('[data-achievement="six-games"] progress').getAttribute('value'),'3');
  assert.equal(await page.locator('[data-achievement="snake-ten"] progress').getAttribute('value'),'7');
  assert.match(await page.locator('[data-achievement="memory-master"]').innerText(),/Best: 20 moves/);
  assert.equal(await page.locator('[data-achievement="memory-master"] progress').getAttribute('value'),'0');
  await page.getByRole('button',{name:'Choose cosmetics'}).click();
  assert.equal(await page.evaluate(() => document.activeElement.id),'shelf-cosmetics');
  const resultsDirectory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'shelf-rewards-tests-'));
  await page.screenshot({path:path.join(resultsDirectory,'rewards-cosmetics-desktop.png'),fullPage:false});
  await page.evaluate(() => scrollTo(0,0));
  await page.screenshot({path:path.join(resultsDirectory,'rewards-desktop.png'),fullPage:false});
  for (const width of [390,320,768,1280]) {
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`No horizontal overflow at ${width}px`);
    const buttons = await page.locator('[data-equip-category]').evaluateAll(elements => elements.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
    assert.equal(buttons.every(button=>button.width>=44&&button.height>=30),true);
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(() => scrollTo(0,0));
  await page.screenshot({path:path.join(resultsDirectory,'rewards-mobile.png'),fullPage:false});
  await page.getByRole('button',{name:'Choose cosmetics'}).click();
  await page.screenshot({path:path.join(resultsDirectory,'rewards-cosmetics-mobile.png'),fullPage:false});
  await page.evaluate(() => {document.getElementById('app').innerHTML=Shelf.summary();});
  assert.match(await page.locator('.shelf-home-progress').innerText(),/1 \/ 22 achievements/);
  await page.getByRole('button',{name:'Achievements & style'}).click();
  assert.equal(await page.getByRole('heading',{name:'Your trophy shelf'}).count(),1);
}));

(async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
  browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox']});
  let failed=0;
  try {
    for (const {name,fn} of checks) {
      try {await fn();process.stdout.write(`PASS ${name}\n`);}catch(error){failed++;process.stderr.write(`FAIL ${name}\n${error.stack}\n`);}
    }
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
  process.stdout.write(`${checks.length-failed}/${checks.length} rewards test groups passed.\n`);
  process.exitCode=failed?1:0;
})().catch(error=>{process.stderr.write(`${error.stack}\n`);server.close();process.exitCode=1;});
