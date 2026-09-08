const {chromium}=require('playwright');
const fs=require('fs'); const assert=require('node:assert/strict');
const path=require('node:path'); const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const screenshots=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'game-shelf-tests-'));
(async()=>{
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1100,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.clock.install();
await page.evaluate(()=>play('snake'));await page.click('#start-game');await page.keyboard.press('w');await page.clock.runFor(125);await page.keyboard.press('p');assert.equal(await page.textContent('#snake-state'),'PAUSED');await page.clock.runFor(3000);assert.equal(await page.textContent('#snake-state'),'PAUSED');await page.keyboard.press('p');assert.equal(await page.textContent('#snake-state'),'RUNNING');
await page.selectOption('#snake-mode','wrap');await page.click('#start-game');await page.clock.runFor(6000);assert.equal(await page.textContent('#snake-state'),'RUNNING');
await page.selectOption('#snake-mode','classic');await page.click('#start-game');await page.clock.runFor(2000);assert.equal(await page.textContent('#snake-state'),'OVER');await page.click('#start-game');assert.equal(await page.textContent('#score'),'00');
await page.evaluate(()=>play('flappy'));await page.keyboard.press('a');assert.equal(await page.textContent('#flight-state'),'READY');await page.click('#start-game');await page.clock.runFor(1000);assert.equal(await page.textContent('#score'),'00');await page.keyboard.down('w');await page.clock.runFor(1200);await page.keyboard.up('w');assert.equal(await page.textContent('#flight-state'),'OVER');await page.click('#restart-game');await page.keyboard.press('p');assert.equal(await page.textContent('#flight-state'),'PAUSED');await page.clock.runFor(3000);await page.keyboard.press('p');assert.equal(await page.textContent('#flight-state'),'RUNNING');await page.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal(await page.textContent('#flight-state'),'PAUSED');
await page.evaluate(()=>home());await page.clock.runFor(5000);assert.equal(await page.locator('.hero').count(),1);
// Instrument a separate page to exercise deterministic edge cases in the actual game functions.
let source=fs.readFileSync(path.join(root,'app.js'),'utf8');
source=source.replace('};reset();\n}',`};window.snakeTest={tick,steer,pause,reset,get:()=>({body,dir,queue,foods,walls,score,state}),set:o=>{if(o.body)body=o.body;if(o.dir)dir=o.dir;if(o.foods)foods=o.foods;if(o.walls)walls=o.walls;queue=[];state='running';}};reset();\n}`);
source=source.replace('};reset();raf=requestAnimationFrame(loop);',`};window.flyTest={update,pause,reset,draw,level,difficulty,theme,hud,get:()=>({y,v,pipes,score,state}),set:o=>{if(o.score!==undefined)score=o.score;if(o.y!==undefined)y=o.y;if(o.pipes)pipes=o.pipes;state='running';},keys,touch};reset();raf=requestAnimationFrame(loop);`);
await page.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:source}));await page.reload();await page.evaluate(()=>play('snake'));
assert.ok(await page.evaluate(()=>!!window.snakeTest));
await page.evaluate(()=>{snakeTest.set({body:[[2,2],[2,3],[1,3],[1,2]],dir:[-1,0],foods:[[15,15]]});snakeTest.tick();});assert.equal(await page.evaluate(()=>snakeTest.get().state),'running');
await page.evaluate(()=>{snakeTest.set({body:[[2,2],[2,3],[1,3],[1,2]],dir:[0,1],foods:[[15,15]]});snakeTest.tick();});assert.equal(await page.evaluate(()=>snakeTest.get().state),'over');
await page.selectOption('#snake-mode','wrap');await page.evaluate(()=>{snakeTest.set({body:[[19,10],[18,10]],dir:[1,0],foods:[[15,15]]});snakeTest.tick();});assert.deepEqual(await page.evaluate(()=>snakeTest.get().body[0]),[0,10]);
await page.selectOption('#snake-mode','maze');assert.equal(await page.evaluate(()=>snakeTest.get().walls.length),20);await page.evaluate(()=>{snakeTest.set({body:[[4,4]],dir:[0,1]});snakeTest.tick();});assert.equal(await page.evaluate(()=>snakeTest.get().state),'over');
await page.selectOption('#snake-mode','feast');assert.equal(await page.evaluate(()=>snakeTest.get().foods.length),8);assert.ok(await page.isDisabled('#snake-food'));
await page.selectOption('#snake-mode','classic');await page.selectOption('#snake-food','5');assert.equal(await page.evaluate(()=>snakeTest.get().foods.length),5);
await page.evaluate(()=>{snakeTest.set({body:[[8,10],[7,10],[6,10]],dir:[1,0],foods:[[9,10]]});snakeTest.tick();});assert.equal(await page.evaluate(()=>snakeTest.get().score),1);assert.equal(await page.evaluate(()=>snakeTest.get().body.length),4);
await page.evaluate(()=>{snakeTest.reset();snakeTest.steer('a');});assert.deepEqual(await page.evaluate(()=>snakeTest.get().dir),[1,0]);
await page.evaluate(()=>{snakeTest.steer('w');snakeTest.steer('a');snakeTest.tick();snakeTest.tick();});assert.deepEqual(await page.evaluate(()=>snakeTest.get().body[0]),[7,9]);
// Full board: no unbounded food-spawn loop and a clean win.
await page.evaluate(()=>{const body=[];for(let r=0;r<20;r++)for(let c=0;c<20;c++)if(c!==0||r!==0)body.push([c,r]);snakeTest.set({body,dir:[-1,0],foods:[[0,0]],walls:[]});snakeTest.tick();});assert.equal(await page.textContent('#overlay-title'),'Garden complete!');
await page.evaluate(()=>play('flappy'));await page.evaluate(()=>{flyTest.set({y:200,pipes:[{x:57,g:140,gap:132,passed:false}]});flyTest.update(.02);});assert.equal(await page.evaluate(()=>flyTest.get().score),1);await page.evaluate(()=>flyTest.update(.02));assert.equal(await page.evaluate(()=>flyTest.get().score),1);
await page.evaluate(()=>{flyTest.reset(true);flyTest.set({y:100,pipes:[{x:120,g:140,gap:132,passed:false}]});flyTest.update(.01);});assert.equal(await page.evaluate(()=>flyTest.get().state),'over');
// Gravity, one impulse per press, and held-key repeat suppression.
await page.evaluate(()=>{flyTest.reset(true);for(let i=0;i<10;i++)flyTest.update(.02);});assert.ok(await page.evaluate(()=>flyTest.get().y>200));
await page.evaluate(()=>flyTest.reset(true));await page.keyboard.down('w');assert.equal(await page.evaluate(()=>flyTest.get().v),-260);
await page.evaluate(()=>{for(let i=0;i<10;i++)flyTest.update(.02);});assert.ok(await page.evaluate(()=>flyTest.get().y<200));
const afterLift=await page.evaluate(()=>flyTest.get().v);await page.keyboard.down('w');assert.equal(await page.evaluate(()=>flyTest.get().v),afterLift);
await page.evaluate(()=>{for(let i=0;i<25;i++)flyTest.update(.02);});assert.ok(await page.evaluate(()=>flyTest.get().v>0));
await page.keyboard.up('w');await page.keyboard.down('w');assert.equal(await page.evaluate(()=>flyTest.get().v),-260);await page.keyboard.up('w');
await page.evaluate(()=>{flyTest.reset(true);flyTest.keys.add('s');for(let i=0;i<10;i++)flyTest.update(.02);});assert.ok(await page.evaluate(()=>flyTest.get().v>140));
await page.evaluate(()=>{flyTest.pause();});assert.equal(await page.evaluate(()=>flyTest.keys.size),0);
await page.evaluate(()=>{flyTest.reset();});await page.locator('[data-flight="w"]').dispatchEvent('pointerdown',{pointerId:1});assert.equal(await page.evaluate(()=>flyTest.get().state),'running');assert.equal(await page.evaluate(()=>flyTest.get().v),-260);await page.evaluate(()=>{for(let i=0;i<25;i++)flyTest.update(.02);});assert.ok(await page.evaluate(()=>flyTest.get().v>0));await page.locator('[data-flight="w"]').dispatchEvent('pointercancel',{pointerId:1});assert.equal(await page.evaluate(()=>flyTest.touch.size),0);
// Exact ten-gate boundaries, queued gap assignment, and increasing difficulty.
await page.evaluate(()=>{flyTest.reset(true);flyTest.set({score:9,y:200,pipes:[{x:55,g:140,gap:132,passed:false},{x:400,g:140,gap:132,passed:false}]});flyTest.update(.01);});
assert.equal(await page.evaluate(()=>flyTest.level()),2);
assert.ok((await page.textContent('#flight-level')).includes('Midnight Drift'));
assert.ok(await page.evaluate(()=>flyTest.get().pipes.find(p=>p.x>390&&p.x<410).gap===132));
assert.ok(await page.evaluate(()=>flyTest.get().pipes.find(p=>p.x>650).gap<132));
await page.evaluate(()=>flyTest.update(.01));assert.equal(await page.evaluate(()=>flyTest.get().score),10);
for(const score of [0,9,10,19,20,29,30,39,40,49,50,99,100]){
  await page.evaluate(score=>{flyTest.reset(true);flyTest.set({score});flyTest.update(0);flyTest.hud();flyTest.draw();},score);
  assert.equal(await page.evaluate(()=>flyTest.level()),Math.floor(score/10)+1);
  assert.ok(await page.evaluate(()=>flyTest.get().pipes.every(p=>p.gap>=76&&p.g+p.gap<388)));
}
assert.ok(await page.evaluate(()=>{let prev=flyTest.difficulty(1);for(let n=2;n<=100;n++){const next=flyTest.difficulty(n);if(next.gap>=prev.gap||next.speed<=prev.speed||next.gap<76||next.speed>255)return false;prev=next;}return true;}));
// Collision uses each gate's actual gap, including a safe old gate after a level-up.
await page.evaluate(()=>{flyTest.reset(true);flyTest.set({score:40,y:200,pipes:[{x:120,g:100,gap:132,passed:false}]});flyTest.update(0);});assert.equal(await page.evaluate(()=>flyTest.get().state),'running');
await page.evaluate(()=>{flyTest.reset(true);flyTest.set({score:40,y:200,pipes:[{x:120,g:100,gap:90,passed:false}]});flyTest.update(0);});assert.equal(await page.evaluate(()=>flyTest.get().state),'over');
for(const score of [0,10,20,30,40,50]){await page.evaluate(score=>{flyTest.reset(true);flyTest.set({score,pipes:[{x:440,g:100,gap:flyTest.difficulty(Math.floor(score/10)+1).gap,passed:false}]});flyTest.hud();flyTest.draw();},score);await page.screenshot({path:path.join(screenshots,`level-${score/10+1}.png`),fullPage:true});}
await page.evaluate(()=>flyTest.reset());assert.equal(await page.evaluate(()=>flyTest.level()),1);
// Desktop and mobile rendering, including ready-state overlay bounds.
for(const width of [1100,375]){await page.setViewportSize({width,height:1000});for(const game of ['snake','flappy']){await page.evaluate(g=>play(g),game);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const overlay=await page.locator('#game-overlay').boundingBox(),button=await page.locator('#start-game').boundingBox();assert.ok(button.y+button.height<=overlay.y+overlay.height);await page.screenshot({path:path.join(screenshots,`${game}-${width}.png`),fullPage:true});await page.click('#start-game');await page.screenshot({path:path.join(screenshots,`${game}-${width}-playing.png`),fullPage:true});}}
await page.evaluate(()=>play('checkers'));assert.equal(await page.locator('.square').count(),64);await page.evaluate(()=>play('trade'));assert.ok(await page.locator('.trade-setup').count());assert.deepEqual(errors,[]);await browser.close();console.log('Screenshots:',screenshots);console.log('PASS: level boundaries, themes, queued gaps, progressive difficulty, per-gate collisions, browser controls, modes, food/growth, full-board win, collisions, scoring, pause, restart, navigation cleanup, touch release, mobile layout, and board-game smoke checks. No browser exceptions.');
})().catch(e=>{console.error(e);process.exit(1)});
