const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=process.env.GAME_SHELF_ROOT||path.resolve(__dirname,'..');
const url=require('node:url').pathToFileURL(path.join(root,'index.html')).href;
let source=fs.readFileSync(path.join(root,'app.js'),'utf8');
function expose(name,body){
 const start=source.indexOf(`function ${name}(`);assert.ok(start>=0,`Missing game ${name}`);
 const next=source.indexOf('\nfunction ',start+1);const stop=next<0?source.length:next;
 const end=source.lastIndexOf('}',stop-1);
 source=source.slice(0,end)+`\nwindow.qa.${name}={${body}};\n`+source.slice(end);
}
expose('snake',`tick,reset,get:()=>({score,state}),set:o=>{if(o.score!==undefined)score=o.score;if(o.body)body=o.body;if(o.dir)dir=o.dir;if(o.foods)foods=o.foods;if(o.walls)walls=o.walls;queue=[];state='running';}`);
expose('dodger',`update,reset,startWave,get:()=>({boss,score}),set:o=>{if(o.wave)wave=o.wave;if(o.shots)shots=o.shots;}`);
expose('memory',`get:()=>({icons,moves})`);
expose('flappy',`update,reset,get:()=>({score,state}),set:o=>{if(o.score!==undefined)score=o.score;if(o.y!==undefined)y=o.y;if(o.pipes)pipes=o.pipes;state='running';}`);
expose('checkers',`get:()=>({b,over,turn}),set:arr=>{b=arr;sel=null;turn='red';over=false;mustCapture=null;render();}`);
expose('trade',`startGame,buyProperty,botAct,get:()=>({board,players,current}),at:(pos,human=true)=>{current=human?0:1;players[current].pos=pos;players[current].cash=10000;turnPhase='moved';render();}`);
source=source.replaceAll('Shelf.record(', 'qaRecord(');
source=`window.qa={};window.qaEvents=[];function qaRecord(type,data){window.qaEvents.push({type,data:JSON.parse(JSON.stringify(data))});return Shelf.record(type,data);}\n`+source;
(async()=>{
 const browser=await chromium.launch({headless:true});const p=await browser.newPage({viewport:{width:1100,height:1000}});const errors=[],dialogs=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
 await p.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:source}));
 await p.goto(url);await p.clock.install();await p.clock.pauseAt(new Date());
 const events=type=>p.evaluate(type=>qaEvents.filter(e=>e.type===type),type);
 const resetEvents=()=>p.evaluate(()=>{qaEvents=[]});
 const play=async game=>{await p.evaluate(game=>play(game),game);};
 // Opening every game records exactly its own id. Re-rendering controls does not count as another visit.
 for(const game of ['snake','dodger','memory','reaction','word','clicker','flappy','platform','tic','checkers','trade','golf']){
  await resetEvents();await play(game);assert.deepEqual(await events('game_play'),[{type:'game_play',data:{id:game}}]);
 }
 await play('snake');await resetEvents();
 await p.evaluate(()=>{qa.snake.reset();qa.snake.set({score:8,body:[[8,10],[7,10],[6,10]],dir:[1,0],foods:[[15,10]]});qa.snake.tick();});
 assert.deepEqual(await events('snake_score'),[],'Movement alone must not increase score progress');
 await p.evaluate(()=>{qa.snake.set({score:8,body:[[8,10],[7,10],[6,10]],dir:[1,0],foods:[[9,10]]});qa.snake.tick();});
 assert.deepEqual(await events('snake_score'),[{type:'snake_score',data:{score:9}}]);
 await p.evaluate(()=>{qa.snake.set({body:[[8,10],[7,10],[6,10]],dir:[1,0],foods:[[9,10]]});qa.snake.tick();});
 assert.equal((await events('snake_score')).at(-1).data.score,10);
 await p.evaluate(()=>{qa.snake.set({body:[[19,10],[18,10]],dir:[1,0],foods:[[0,0]]});qa.snake.tick();});
 assert.equal((await events('snake_score')).length,2,'Crashing does not duplicate score');
 await play('dodger');await resetEvents();await p.evaluate(()=>{qa.dodger.reset(true);qa.dodger.set({wave:5});qa.dodger.startWave();});
 assert.deepEqual(await events('shooter_boss'),[]);
 await p.evaluate(()=>{let b=qa.dodger.get().boss;b.hp=1;b.y=88;qa.dodger.set({shots:[{x:320,y:88,r:4,vx:0}]});qa.dodger.update(0);qa.dodger.update(0);});
 assert.deepEqual(await events('shooter_boss'),[{type:'shooter_boss',data:{}}]);
 await play('memory');await resetEvents();
 let icons=await p.evaluate(()=>qa.memory.get().icons);let miss=icons.findIndex(x=>x!==icons[0]);
 await p.locator('.memory button').nth(0).click();await p.locator('.memory button').nth(miss).click();
 await p.evaluate(()=>home());await p.clock.runFor(1000);assert.deepEqual(errors,[],'An abandoned mismatch must not touch the next screen');assert.deepEqual(await events('memory_win'),[]);
 await play('memory');await resetEvents();icons=await p.evaluate(()=>qa.memory.get().icons);
 const pairs=Object.values(icons.reduce((o,x,i)=>((o[x]??=[]).push(i),o),{}));
 for(let pair=0;pair<pairs.length;pair++){for(const i of pairs[pair])await p.locator('.memory button').nth(i).click();if(pair<7)assert.deepEqual(await events('memory_win'),[]);}
 assert.deepEqual(await events('memory_win'),[{type:'memory_win',data:{moves:8}}]);
 await p.locator('.memory button').nth(0).evaluate(b=>b.click());assert.equal((await events('memory_win')).length,1);
 await p.evaluate(()=>home());await p.clock.runFor(1000);assert.deepEqual(dialogs,[],'No abandoned completion alert');
 // Too-early, reset, and leaving a reaction test cancel their scheduled signals.
 await p.evaluate(()=>{Math.random=()=>0;play('reaction');qaEvents=[]});
 await p.locator('#react').click();await p.clock.runFor(500);await p.locator('#react').click();await p.clock.runFor(4000);
 assert.deepEqual(await events('reaction_result'),[]);assert.ok(!(await p.locator('#react').textContent()).includes('CLICK!'));
 await p.locator('#react').click();await p.clock.runFor(300);await play('reaction');await p.clock.runFor(4000);assert.deepEqual(await events('reaction_result'),[]);
 await p.locator('#react').click();await p.clock.runFor(1800);await p.clock.runFor(180);await p.locator('#react').click();
 assert.deepEqual(await events('reaction_result'),[{type:'reaction_result',data:{ms:180}}]);
 await p.locator('#react').click();await p.evaluate(()=>home());await p.clock.runFor(4000);assert.equal((await events('reaction_result')).length,1);
 // A completed vault is awarded immediately and is not awarded again when restored.
 await p.evaluate(()=>localStorage.setItem('word-vault-5',JSON.stringify({wins:0,played:0,streak:0,best:0,round:{answer:'APPLE',guesses:[],status:'playing'}})));
 await play('word');await resetEvents();await p.keyboard.type('crane');await p.keyboard.press('Enter');await p.clock.runFor(1000);assert.deepEqual(await events('word_win'),[]);
 await p.keyboard.type('apple');await p.keyboard.press('Enter');assert.deepEqual(await events('word_win'),[{type:'word_win',data:{guesses:2}}]);
 await p.evaluate(()=>home());await p.clock.runFor(1000);await play('word');await p.keyboard.press('Enter');assert.equal((await events('word_win')).length,1);
 // Earn upgrades with real UI interactions and reject unaffordable purchases.
 await play('clicker');await resetEvents();await p.locator('#upgrade').click();assert.deepEqual(await events('clicker_power'),[]);
 let power=1,coins=0,cost=15;
 while(power<5){while(coins<cost){await p.locator('#coin').click();coins+=power;}await p.locator('#upgrade').click();coins-=cost;power++;cost=Math.ceil(cost*1.8);assert.equal((await events('clicker_power')).at(-1).data.power,power);}
 assert.equal((await events('clicker_power')).length,4);assert.equal((await events('game_play')).length,0,'Purchases re-render without counting extra visits');
 await play('flappy');await resetEvents();await p.evaluate(()=>{qa.flappy.reset(true);qa.flappy.set({score:9,y:200,pipes:[{x:55,g:140,gap:132,passed:false}]});qa.flappy.update(0);qa.flappy.update(0);});
 assert.deepEqual(await events('flyer_score'),[{type:'flyer_score',data:{score:10}}]);
 await play('platform');await resetEvents();await p.keyboard.down('ArrowRight');await p.clock.runFor(1900);await p.keyboard.up('ArrowRight');assert.deepEqual(await events('platform_win'),[{type:'platform_win',data:{}}]);
 await p.clock.runFor(1000);assert.equal((await events('platform_win')).length,1);await play('platform');await resetEvents();await p.keyboard.down('ArrowRight');await p.clock.runFor(100);await p.evaluate(()=>home());await p.clock.runFor(3000);await p.keyboard.up('ArrowRight');assert.deepEqual(await events('platform_win'),[]);
 await p.evaluate(()=>{Math.random=()=>0;play('tic');qaEvents=[]});
 for(const i of [0,4])await p.locator(`[data-t="${i}"]`).click();assert.deepEqual(await events('tic_win'),[]);
 await p.locator('[data-t="8"]').click();assert.deepEqual(await events('tic_win'),[{type:'tic_win',data:{}}]);await p.locator('[data-t="7"]').click();assert.equal((await events('tic_win')).length,1);
 await play('checkers');await p.locator('[data-i="40"]').click();await p.locator('[data-i="33"]').click();assert.ok(await p.locator('[data-lvl="hard"]').isDisabled());await p.clock.runFor(350);assert.equal(await p.evaluate(()=>qa.checkers.get().turn),'red');
 await play('checkers');await resetEvents();await p.evaluate(()=>{const b=Array(64).fill(0);b[17]='red';b[10]='black';qa.checkers.set(b);});
 await p.locator('[data-i="17"]').click();assert.deepEqual(await events('checkers_win'),[]);await p.locator('[data-i="3"]').click();
 assert.deepEqual(await events('checkers_win'),[{type:'checkers_win',data:{}}]);await p.locator('[data-i="3"]').click();assert.equal((await events('checkers_win')).length,1);
 // Human purchases report owned-property count; bot transactions and rejected purchases do not.
 await play('trade');await p.evaluate(()=>qa.trade.startGame());await resetEvents();
 const positions=await p.evaluate(()=>qa.trade.get().board.flatMap((t,i)=>t.type==='property'?[i]:[]));
 for(let i=0;i<3;i++){await p.evaluate(pos=>{qa.trade.at(pos);qa.trade.buyProperty();qa.trade.buyProperty();},positions[i]);assert.equal((await events('trade_properties')).at(-1).data.count,i+1);}
 assert.equal((await events('trade_properties')).length,3);
 await p.evaluate(pos=>{qa.trade.at(pos,false);qa.trade.botAct();},positions[3]);assert.equal((await events('trade_properties')).length,3);
 await p.evaluate(()=>home());await p.clock.runFor(100000);assert.deepEqual(errors,[]);assert.deepEqual(dialogs,[]);
 // Verify actual achievement cards, locked controls, cosmetic use in each renderer, and persisted equipped state.
 const expected=['first-play','six-games','all-games','snake-ten','first-boss','memory-master','quick-reaction','word-win','word-two','clicker-five','flyer-ten','platform-win','tic-win','checkers-win','trade-three'];
 assert.deepEqual(await p.evaluate(()=>Object.keys(Shelf.getState().earned).sort()),expected.sort());
 await p.evaluate(()=>Shelf.render());assert.equal(await p.locator('.shelf-achievement.is-earned').count(),15);
 assert.ok(await p.locator('[data-equip-category="golf"][data-equip-id="coral"]').isDisabled());
 assert.equal(await p.evaluate(()=>Shelf.equip('golf','coral')),false);
 await p.locator('[data-equip-category="theme"][data-equip-id="ocean"]').click();
 assert.equal(await p.evaluate(()=>document.body.dataset.shelfTheme),'ocean');
 const pixelCount=category=>p.evaluate(category=>{const hex=Shelf.palette(category).main, rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),c=document.querySelector('canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;for(let i=0;i<data.length;i+=4)if(data[i]===rgb[0]&&data[i+1]===rgb[1]&&data[i+2]===rgb[2])count++;return count;},category);
 for(const [category,game,skin] of [['snake','snake','lavender'],['ship','dodger','nova'],['plane','flappy','cherry']]){
   await p.evaluate(()=>Shelf.render());await p.locator(`[data-equip-category="${category}"][data-equip-id="${skin}"]`).click();
   assert.equal(await p.locator(`[data-equip-category="${category}"][data-equip-id="${skin}"]`).getAttribute('aria-pressed'),'true');
   await play(game);assert.ok(await pixelCount(category)>20,`${category} cosmetic must appear in canvas pixels`);
 }
 const saved=await p.evaluate(()=>Shelf.getState());await p.reload();
 assert.deepEqual(await p.evaluate(()=>Shelf.getState()),saved,'Achievements and equipped cosmetics survive reloading');
 assert.equal(await p.evaluate(()=>document.body.dataset.shelfTheme),'ocean');
 await p.evaluate(()=>Shelf.render());assert.equal(await p.locator('.shelf-achievement.is-earned').count(),15);
 assert.deepEqual(errors,[]);assert.deepEqual(dialogs,[]);
 await browser.close();console.log('PASS: actual game-play events, snake score/collision boundaries, boss defeat, memory completion and cleanup, reaction early/reset/navigation timing, vault restored wins, clicker purchases, flyer score once, platform completion and cleanup, tic win once, checkers final capture, human-only trade ownership.');
})().catch(e=>{console.error(e);process.exit(1)});
