const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const url=require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const out=fs.mkdtempSync('/tmp/daily-tests-');
(async()=>{
 const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:1100,height:1000},timezoneId:'America/Los_Angeles'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date('2026-09-09T10:00:00Z')});await p.clock.pauseAt(new Date('2026-09-09T10:00:00Z'));await p.goto(url);
 assert.deepEqual(await p.evaluate(()=>['2026-09-09T13:59:59Z','2026-09-09T14:00:00Z','2028-02-28T14:00:00Z'].map(t=>DailyChallenges.dayKey(Date.parse(t)))),['2026-09-09','2026-09-10','2028-02-29']);
 assert.deepEqual(await p.evaluate(()=>DailyChallenges.set('not-a-day')),[]);
 const sets=await p.evaluate(()=>Array.from({length:365},(_,i)=>{const d=new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10);return {day:d,goals:DailyChallenges.set(d)};}));
 const allIds=new Set();for(const s of sets){assert.equal(s.goals.length,3);assert.equal(new Set(s.goals.map(g=>g.game)).size,3);s.goals.forEach(g=>allIds.add(g.id));}
 assert.equal(allIds.size,12,'Every curated goal appears in the rotation');
 assert.deepEqual(await p.evaluate(()=>DailyChallenges.set('2026-09-09')),sets.find(s=>s.day==='2026-09-09').goals);
 await p.evaluate(()=>{const goals=DailyChallenges.set();goals[0].target=999;});assert.notEqual((await p.evaluate(()=>DailyChallenges.set()))[0].target,999);
 // Exercise the real shared result API, keeping attempts distinct and rules explicit.
 const snakeDay=sets.find(s=>s.day<'2026-09-09'&&s.goals.some(g=>g.id==='garden-ten')).day;
 await p.evaluate(day=>{window.attempt=GameRuns.session('snake');attempt.start('classic-125-1',day);attempt.progress({score:6});},snakeDay);
 await p.evaluate(day=>{const s=GameRuns.session('snake');s.start('classic-125-1',day);s.progress({score:4});s.dispose();s.progress({score:400});},snakeDay);
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]['garden-ten'],snakeDay),6,'Separate attempts do not add together; disposed attempts cannot report');
 await p.evaluate(day=>{const s=GameRuns.session('snake');s.start('classic-180-5',day);s.progress({score:100});for(const score of [-1,NaN,Infinity,3.5,'100'])attempt.progress({score});},snakeDay);
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]['garden-ten'],snakeDay),6,'Wrong rules and invalid metrics do not qualify');
 await p.evaluate(()=>{attempt.progress({score:10});attempt.finish({score:10});attempt.progress({score:100});});
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]['garden-ten'],snakeDay),10);
 const fullGolfDay=sets.find(s=>s.day<'2026-09-09'&&s.goals.some(g=>g.id==='golf-thirty')).day;
 await p.evaluate(day=>{const s=GameRuns.session('golf');s.start('golf-three',day);s.finish({total:8,holed:3,holes:3,complete:true});},fullGolfDay);
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]?.['golf-thirty']||0,fullGolfDay),0,'Cup golf does not satisfy a full-course challenge');
 await p.evaluate(day=>{const s=GameRuns.session('golf');s.start('golf-six',day);s.finish({total:25,holed:5,holes:6,complete:true});},fullGolfDay);
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]?.['golf-thirty']||0,fullGolfDay),0,'Pickups cannot complete a full-course daily');
 // Finish each curated kind, with failed completion attempts before the qualifying result.
 for(const id of [...allIds].filter(id=>!['camp-fifty','trail-flag'].includes(id))){
   const entry=sets.find(s=>s.day<'2026-09-09'&&s.goals.some(g=>g.id===id)),goal=entry.goals.find(g=>g.id===id);
   await p.evaluate(({day,g})=>{
     const rule={snake:'classic-125-1',flappy:'sky',dodger:'mars',memory:'eight-pairs',golf:'golf-six',word:'word-5',reaction:'signal'}[g.game];
     const s=GameRuns.session(g.game);s.start(rule,day);
     const bad={word:{guesses:5,complete:true},memory:{pairs:8,moves:21,complete:true},golf:{total:31,holed:6,holes:6,complete:true},reaction:{ms:351}}[g.kind];
     if(bad){s.finish(bad);s.reset();s.start(rule,day);}
     const data={snake:{score:g.target},score:{score:g.target},pairs:{pairs:4,moves:4},reaction:{ms:350},hole:{total:2,holed:1,holes:6},word:{guesses:4,complete:true},memory:{pairs:8,moves:20,complete:true},golf:{total:30,holed:6,holes:6,complete:true}}[g.kind];
     s.finish(data);s.finish(data);
   },{day:entry.day,g:goal});
   assert.equal(await p.evaluate(({day,id})=>DailyChallenges.getState().days[day][id],{day:entry.day,id}),goal.target,id+' qualifies at its exact boundary');
 }
 // Complete dated sets on nonconsecutive days; rewards unlock only at 3, 7 and 14.
 await p.evaluate(()=>{localStorage.removeItem(GameRuns.storageKey);localStorage.removeItem(Shelf.storageKey);});await p.reload();
 const completeSet=day=>p.evaluate(day=>{
   for(const g of DailyChallenges.set(day)){
     const rule={snake:'classic-125-1',flappy:'sky',dodger:'mars',memory:'eight-pairs',golf:'golf-six',word:'word-5',reaction:'signal'}[g.game];
     const data={snake:{score:g.target},score:{score:g.target},pairs:{pairs:4,moves:4},reaction:{ms:350},hole:{total:2,holed:1,holes:6},word:{guesses:4,complete:true},memory:{pairs:8,moves:20,complete:true},golf:{total:30,holed:6,holes:6,complete:true}}[g.kind];
     const a=GameRuns.session(g.game);a.start(rule,day);a.finish(data);a.finish(data);
   }
 },day);
 for(let i=0;i<14;i++){
   await completeSet(new Date(Date.UTC(2026,0,1+i*2)).toISOString().slice(0,10));
   assert.equal(await p.evaluate(()=>DailyChallenges.getState().badges.length),i+1);
   for(const [threshold,id] of [[3,'daily-three'],[7,'daily-seven'],[14,'daily-fourteen']])assert.equal(await p.evaluate(id=>!!Shelf.getState().earned[id],id),i+1>=threshold);
 }
 const earned=await p.evaluate(()=>DailyChallenges.getState());await completeSet('2026-01-01');assert.deepEqual(await p.evaluate(()=>DailyChallenges.getState()),earned);
 await p.reload();assert.deepEqual(await p.evaluate(()=>DailyChallenges.getState()),earned);
 assert.equal(await p.evaluate(()=>Shelf.equip('theme','daybreak')),true);assert.equal(await p.evaluate(()=>Shelf.equip('snake','ribbon')),true);assert.equal(await p.evaluate(()=>Shelf.equip('golf','twilight')),true);
 // Midnight rollover refreshes the open board; the in-flight attempt keeps its original day.
 const beforeDay=sets.find(s=>s.day>='2026-06-01'&&s.goals.some(g=>g.game==='snake')),snake=beforeDay.goals.find(g=>g.game==='snake');
 await p.clock.setSystemTime(new Date(beforeDay.day+'T13:59:59Z'));
 await p.evaluate(()=>DailyChallenges.render());await p.evaluate(()=>{window.midnightAttempt=GameRuns.session('snake');midnightAttempt.start('classic-125-1');});await p.clock.runFor(2000);
 assert.equal(await p.evaluate(()=>DailyChallenges.dayKey()),new Date(Date.parse(beforeDay.day)+86400000).toISOString().slice(0,10));
 assert.ok((await p.locator('.daily-banner').textContent()).includes(await p.evaluate(()=>DailyChallenges.dayKey())));
 await p.evaluate(target=>midnightAttempt.finish({score:target}),snake.target);
 assert.equal(await p.evaluate(({d,id})=>DailyChallenges.getState().days[d][id],{d:beforeDay.day,id:snake.id}),snake.target);
 assert.equal(await p.evaluate(()=>Object.keys(DailyChallenges.getState().days[DailyChallenges.dayKey()]||{}).length),0);
 // Real Word Vault completion keeps a saved puzzle's start day after reload.
 const wordDay=sets.find(s=>s.day>'2026-03-01'&&s.day<'2026-06-01'&&s.goals.some(g=>g.id==='vault-four')).day;
 await p.evaluate(day=>localStorage.setItem('word-vault-5',JSON.stringify({wins:0,played:0,streak:0,best:0,round:{answer:'APPLE',guesses:['CRANE'],status:'playing',challengeDay:day}})),wordDay);
 await p.reload();await p.evaluate(()=>play('word'));await p.keyboard.type('apple');await p.keyboard.press('Enter');
 assert.equal(await p.evaluate(d=>DailyChallenges.getState().days[d]['vault-four'],wordDay),1);
 for(const width of [1100,768,375,320]){
   await p.setViewportSize({width,height:1000});await p.evaluate(()=>{DailyChallenges.render();scrollTo(0,0);});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await p.locator('[data-daily-play]').count(),3);
   await p.screenshot({path:path.join(out,`daily-${width}.png`),fullPage:true});
 }
 await p.locator('[data-daily-play]').first().click();assert.equal(await p.locator('.daily-grid').count(),0);await p.clock.runFor(2000);assert.equal(await p.locator('.daily-grid').count(),0,'Daily timer is cleaned up after leaving');
 assert.deepEqual(errors,[]);await p.close();
 // Corrupted storage and blocked storage are independent fresh browser contexts.
 for(const blocked of [false,true]){
   const q=await browser.newPage();q.on('pageerror',e=>errors.push(e.message));
   await q.addInitScript(blocked=>{if(blocked){Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};}else localStorage.setItem('game-shelf-competitions-v1','{broken');},blocked);
   await q.goto(url);await q.evaluate(()=>DailyChallenges.render());assert.equal(await q.locator('.daily-card').count(),3);
   await q.evaluate(()=>{const g=DailyChallenges.set()[0],a=GameRuns.session(g.game),rule=g.game==='snake'?'classic-125-1':'standard';a.start(rule);a.finish(g.kind==='snake'?{score:10}:g.kind==='reaction'?{ms:200}:g.kind==='hole'?{total:1,holed:1,holes:6}:{pairs:4,moves:4});DailyChallenges.render();});
   assert.equal(await q.locator('.daily-card.is-complete').count(),1);if(blocked)assert.match(await q.locator('.event-save-note').first().textContent(),/unavailable/);await q.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: all daily goals, deterministic year-long rotation, time-zone-independent Brisbane midnight, cross-midnight and restored Word Vault attempts, single-round progress, exact thresholds, 3/7/14 rewards, duplicate prevention, invalid data/rules, saved and unavailable storage, mobile layouts and cleanup. Screenshots:',out);
})().catch(e=>{console.error(e);process.exit(1)});
