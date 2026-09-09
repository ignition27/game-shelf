const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),url=require('node:url').pathToFileURL(path.join(root,'index.html')).href,out=fs.mkdtempSync('/tmp/cup-tests-');
let source=fs.readFileSync(path.join(root,'app.js'),'utf8');
function expose(name,body){const start=source.indexOf(`function ${name}(`),next=source.indexOf('\nfunction ',start+1),end=source.lastIndexOf('}',next<0?source.length-1:next-1);source=source.slice(0,end)+`\nwindow.ct.${name}={${body}};\n`+source.slice(end);}
expose('snake',`run,finish,tick,runSession,get:()=>({score,state,foods,body}),set:o=>{if(o.score!==undefined)score=o.score;if(o.body)body=o.body;if(o.foods)foods=o.foods;if(o.dir)dir=o.dir;}`);
expose('dodger',`run,damage,update,runSession,get:()=>({state,score,enemies}),set:o=>{if(o.score!==undefined)score=o.score;if(o.hp!==undefined)ship.hp=o.hp;if(o.inv!==undefined)ship.inv=o.inv;}`);
expose('flappy',`run,crash,update,runSession,get:()=>({state,score,pipes}),set:o=>{if(o.score!==undefined)score=o.score;}`);
expose('memory',`runSession,get:()=>({icons,pairs,moves,paused,over})`);
source='window.ct={};\n'+source;
const golf=fs.readFileSync(path.join(root,'golf.js'),'utf8').replace('  reset();raf=requestAnimationFrame(loop);',`  window.cg={runSession,courses,update,shoot,advance,get:()=>({state,ball,holeIndex,scores}),sink:strokes=>{ball.x=courses[holeIndex].cup[0];ball.y=courses[holeIndex].cup[1];ball.vx=ball.vy=0;state='rolling';window.cg.setStrokes(strokes);update(1/120);},setStrokes:n=>{strokes=n;}};reset();raf=requestAnimationFrame(loop);`);
(async()=>{
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1100,height:1000}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.clock.pauseAt(new Date());
 await p.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:source}));await p.route('**/golf.js',r=>r.fulfill({contentType:'text/javascript',body:golf}));await p.goto(url);
 const fixture=async(games,players=['You'],seed=12345)=>{await p.evaluate(({games,players,seed})=>{const current=JSON.parse(localStorage.getItem(GameRuns.storageKey)||'{"version":1,"days":{},"soloBest":0}');current.cup={id:'test-'+seed,seed,players,games,results:[]};localStorage.setItem(GameRuns.storageKey,JSON.stringify(current));}, {games,players,seed});await p.reload();await p.evaluate(()=>ArcadeCup.render());};
 const saved=()=>p.evaluate(()=>ArcadeCup.getState());
 const begin=async()=>{await p.locator('#cup-play').click();const g=(await saved()).games[Math.floor((await saved()).results.length/(await saved()).players.length)];if(g==='golf')await p.locator('#golf-continue').click();else if(g!=='memory')await p.locator('#start-game').click();return g;};
 const menu=()=>p.locator('[data-cup-result]').click();
 const winMemory=async()=>{const icons=await p.evaluate(()=>ct.memory.get().icons),pairs=Object.values(icons.reduce((o,x,i)=>((o[x]??=[]).push(i),o),{}));for(const pair of pairs)for(const i of pair)await p.locator('.memory button').nth(i).click();};
 // Real setup, limits, names and a unique three-game draw.
 await p.locator('[data-view="cup"]').click();await p.selectOption('#cup-mode','4');assert.equal(await p.locator('#cup-names input').count(),4);
 await p.locator('#cup-names input').nth(0).fill('<img src=x onerror=1>');await p.locator('#cup-names input').nth(1).fill('');await p.locator('#cup-setup [type="submit"]').click();
 let c=await saved();assert.equal(c.players.length,4);assert.equal(c.players[1],'Player 2');assert.equal(new Set(c.games).size,3);assert.equal(await p.locator('.events-page img').count(),0);assert.ok((await p.locator('.cup-banner h2').textContent()).includes('<img src=x'));
 await p.locator('.cup-end summary').click();await p.locator('#cup-end').click();assert.equal(await saved(),null);assert.equal(await p.locator('.cup-medals').count(),0);
 assert.equal(await p.evaluate(()=>ArcadeCup.create([])),false);assert.equal(await p.evaluate(()=>ArcadeCup.create(Array(5).fill('A'))),false);
 // Transparent formulas, clamping, exact medal boundaries, and no completion bonus for partial rounds.
 const scores=await p.evaluate(()=>({
   snake:[-1,0,1,19,20,400].map(score=>ArcadeCup.points('snake',{score})),
   shooter:[0,24,25,2499,2500,9000].map(score=>ArcadeCup.points('dodger',{score})),
   flyer:[0,1,19,20,21].map(score=>ArcadeCup.points('flappy',{score})),
   memory:[8,16,20,28,50].map(moves=>ArcadeCup.points('memory',{pairs:8,moves,complete:true})),
   golf:[6,8,9,18,30].map(total=>ArcadeCup.points('golf',{total,holed:3,holes:3,complete:true})),
   medals:[0,89,90,164,165,239,240,300].map(ArcadeCup.medal),
   partial:[ArcadeCup.points('memory',{pairs:7,moves:8,complete:true}),ArcadeCup.points('golf',{total:8,holed:2,holes:3,complete:true}),ArcadeCup.points('golf',{total:8,holed:6,holes:6,complete:true})],
   invalid:[NaN,Infinity,'100',-3,2.5].map(score=>ArcadeCup.points('snake',{score}))
 }));
 assert.deepEqual(scores.snake,[0,0,5,95,100,100]);assert.deepEqual(scores.shooter,[0,0,1,99,100,100]);assert.deepEqual(scores.flyer,[0,5,95,100,100]);assert.deepEqual(scores.memory,[100,84,76,60,60]);assert.deepEqual(scores.golf,[100,100,96,60,60]);assert.deepEqual(scores.partial,[35,40,0]);assert.deepEqual(scores.invalid,[0,0,0,0,0]);assert.deepEqual(scores.medals,['Finisher','Finisher','Bronze','Bronze','Silver','Silver','Gold','Gold']);
 // Two players complete all three rounds. Layouts repeat and equal scores share the podium.
 await fixture(['memory','snake','golf'],['Alex','Sam']);const layouts=[];
 for(let slot=0;slot<6;slot++){
   const g=await begin();assert.equal(await p.locator('#cup-session').count(),1);
   if(g==='memory'){layouts.push(await p.evaluate(()=>ct.memory.get().icons));await winMemory();}
   if(g==='snake'){
     assert.equal(await p.locator('#snake-mode').inputValue(),'wrap');assert.equal(await p.locator('#snake-speed').inputValue(),'125');assert.equal(await p.locator('#snake-food').inputValue(),'1');
     assert.equal(await p.locator('.arcade-settings select:disabled').count(),3);assert.equal(await p.locator('#restart-game').isVisible(),false);
     layouts.push(await p.evaluate(()=>ct.snake.get().foods));
     await p.evaluate(()=>{ct.snake.set({score:19,body:[[8,10],[7,10],[6,10]],dir:[1,0],foods:[[9,10]]});ct.snake.tick();ct.snake.finish();ct.snake.finish();});
   }
   if(g==='golf'){
     assert.equal(await p.evaluate(()=>cg.courses.length),3);assert.equal(await p.locator('#golf-par-row td').last().textContent(),'8');assert.equal(await p.locator('#golf-restart').isVisible(),false);
     for(let h=0;h<3;h++){await p.evaluate(n=>cg.sink(n),[2,3,3][h]);if(h<2)await p.locator('#golf-continue').click();}
     assert.equal(await p.evaluate(()=>localStorage.getItem('pocket-greens-best')),null,'Cup does not overwrite the six-hole best');
     assert.equal(await p.evaluate(()=>!!Shelf.getState().earned['golf-round']),false,'A three-hole Cup never awards a six-hole trophy');
   }
   c=await saved();assert.equal(c.results.length,slot+1);assert.equal(c.results[slot].points,100);assert.equal(await p.locator('[data-cup-result]').isVisible(),true);await menu();
   if(slot===1){const copy=await saved();await p.reload();await p.evaluate(()=>ArcadeCup.render());assert.deepEqual(await saved(),copy,'Completed scores survive refresh');}
 }
 assert.deepEqual(layouts[0],layouts[1],'Same Memory Match deck for both players');assert.deepEqual(layouts[2],layouts[3],'Same initial Snake apples for both players');
 assert.match(await p.locator('.cup-banner h2').textContent(),/shared victory/);assert.equal(await p.locator('.cup-medals span').count(),2);assert.ok((await p.locator('.cup-medals').textContent()).includes('Gold'));
 await p.screenshot({path:path.join(out,'cup-tie-desktop.png'),fullPage:true});await p.reload();await p.evaluate(()=>ArcadeCup.render());assert.match(await p.locator('.cup-banner h2').textContent(),/shared victory/);
 // Interrupted attempts retry the same slot and layout. A paused memory deck is hidden.
 await fixture(['memory','dodger','flappy']);await begin();const first=await p.evaluate(()=>ct.memory.get().icons);
 await p.locator('.memory button').nth(0).click();await p.clock.runFor(500);await p.locator('#memory-pause').click();const clock=await p.locator('[data-cup-clock]').textContent();await p.clock.fastForward(120000);
 assert.equal(await p.locator('[data-cup-clock]').textContent(),clock);assert.equal(await p.locator('.memory').evaluate(el=>getComputedStyle(el).visibility),'hidden');assert.equal((await saved()).results.length,0);
 await p.locator('#memory-resume').click();await p.locator('[data-cup-return]').click();await p.clock.fastForward(120000);assert.equal((await saved()).results.length,0,'Leaving cleans up the Cup timer');
 await p.reload();await p.evaluate(()=>ArcadeCup.render());await begin();assert.deepEqual(await p.evaluate(()=>ct.memory.get().icons),first);assert.equal(await p.locator('#score').textContent(),'0');await winMemory();await menu();
 await begin();await p.evaluate(()=>{ct.dodger.set({score:1250,hp:1,inv:0});ct.dodger.damage();ct.dodger.damage();});assert.equal((await saved()).results[1].points,50);await p.locator('#start-game').click();assert.equal(await p.locator('.cup-handoff').count(),1,'Game-over CTA reaches standings without a stale-element error');
 await begin();await p.evaluate(()=>{ct.flappy.set({score:10});ct.flappy.crash();ct.flappy.crash();});assert.equal((await saved()).results[2].points,50);await p.locator('#start-game').click();assert.match(await p.locator('.cup-banner h2').textContent(),/Silver/);
 // All five adapters handle their time limit, record once, and stop their controls.
 for(const [i,g] of Object.keys(await p.evaluate(()=>ArcadeCup.games)).entries()){
   const others=Object.keys(await p.evaluate(()=>ArcadeCup.games)).filter(id=>id!==g);await fixture([g,...others.slice(0,2)],['You'],300+i);await begin();
   if(g==='memory')await p.locator('.memory button').first().click();
   const seconds=await p.evaluate(g=>ArcadeCup.games[g].seconds,g);await p.clock.fastForward(seconds*1000+100);
   assert.equal((await saved()).results.length,1,g+' times out');assert.equal(await p.locator('[data-cup-result]').isVisible(),true);const result=(await saved()).results[0];await p.clock.fastForward(100000);assert.deepEqual((await saved()).results[0],result);
 }
 // Layout at mobile sizes, including four long player names and the narrow score table.
 await fixture(['memory','snake','golf'],['A very long player name','Second player','Third player','Fourth player']);
 for(const width of [1100,768,375,320]){
   await p.setViewportSize({width,height:1000});await p.evaluate(()=>{ArcadeCup.render();scrollTo(0,0);});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,`cup-${width}.png`),fullPage:true});
   await begin();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,`cup-memory-${width}.png`),fullPage:true});await p.locator('[data-cup-return]').click();
 }
 // A second tab reporting an older slot cannot overwrite or duplicate a saved round.
 await fixture(['memory','snake','golf'],['You'],900);
 const other=await p.context().newPage();other.on('pageerror',e=>errors.push(e.message));await other.goto(url);await other.evaluate(()=>ArcadeCup.render());await other.locator('#cup-play').click();await other.locator('.memory button').first().click();
 await begin();await winMemory();assert.equal((await saved()).results.length,1);
 await other.evaluate(()=>{const a=GameRuns.session('snake');a.start('classic-125-1');a.progress({score:10});});
 await p.reload();await p.evaluate(()=>ArcadeCup.render());assert.equal((await saved()).results.length,1,'Daily progress in another tab preserves the newest Cup result');
 await other.close();assert.deepEqual(errors,[]);await p.close();
 // Storage fallback: a whole solo Cup can complete without browser storage.
 const q=await browser.newPage();await q.clock.install();await q.clock.pauseAt(new Date());q.on('pageerror',e=>errors.push(e.message));await q.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});await q.goto(url);
 await q.evaluate(()=>{ArcadeCup.create(['You']);ArcadeCup.render();});for(let n=0;n<3;n++){
   await q.evaluate(()=>ArcadeCup.launch());
   // Exercise the adapter's timeout through the real timer, without requiring game skill.
   const game=await q.evaluate(()=>{const c=ArcadeCup.getState();return c.games[c.results.length];});
   if(game==='memory')await q.locator('.memory button').first().click();else if(game==='golf')await q.locator('#golf-continue').click();else await q.locator('#start-game').click();
   await q.clock.fastForward(181000);assert.equal(await q.evaluate(()=>ArcadeCup.getState().results.length),n+1);await q.locator('[data-cup-result]').click();
 }
 assert.equal(await q.locator('.cup-medals').count(),1);assert.match(await q.locator('.event-save-note').last().textContent(),/unavailable/);assert.deepEqual(errors,[]);await browser.close();console.log('PASS: solo and 2–4 player setup, all score and medal boundaries, actual five-game adapters, identical layouts, complete shared-win tournament, saved/abandoned/reloaded rounds, pauses, all timeouts, duplicate prevention, safe player names, blocked storage, and mobile Cup views. Screenshots:',out);
})().catch(e=>{console.error(e);process.exit(1)});
