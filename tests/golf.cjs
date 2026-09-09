const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=process.env.GAME_SHELF_ROOT||path.resolve(__dirname,'..'),assets=process.env.GOLF_ASSET_ROOT||root,out=fs.mkdtempSync('/tmp/golf-tests-');
const source=fs.readFileSync(path.join(assets,'golf.js'),'utf8'),anchor='  reset();raf=requestAnimationFrame(loop);';
assert.ok(source.includes(anchor),'instrumentation anchor exists');
const instrumented=source.replace(anchor,`  window.gt={courses,update,draw,shoot,reset,advance,pause,settle,finish,hud,loadHole,get:()=>({holeIndex,ball,lie,strokes,scores,holed,state,angle,power,drag,best,disposed}),set:o=>{if(o.ball)Object.assign(ball,o.ball);if(o.lie)lie=o.lie;if(o.holeIndex!==undefined)holeIndex=o.holeIndex;if(o.strokes!==undefined)strokes=o.strokes;if(o.state)state=o.state;if(o.angle!==undefined)angle=o.angle;if(o.power!==undefined)power=o.power;}};${anchor}`);
(async()=>{
  const browser=await chromium.launch({headless:true}),p=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('node:url').pathToFileURL(path.join(root,'index.html')).href);
  await p.clock.install();await p.clock.pauseAt(new Date());
  await p.addScriptTag({content:instrumented});await p.addStyleTag({path:path.join(assets,'golf.css')});
  await p.evaluate(()=>{window.golfEvents=[];const realShelf=window.Shelf;window.Shelf={...realShelf,record:(event,data)=>{golfEvents.push({event,data});return realShelf.record(event,data);},palette:()=>({main:'#fff8de',accent:'#dd723e'})};golf();});
  const get=()=>p.evaluate(()=>gt.get());
  const flush=()=>p.evaluate(()=>{for(let i=0;i<2400&&gt.get().state==='rolling';i++)gt.update(1/120);gt.draw();return gt.get();});
  const putt=async(a,power)=>{await p.evaluate(({a,power})=>{gt.set({angle:a,power});gt.shoot();},{a,power});return flush();};
  const reset=async()=>p.evaluate(()=>{gt.reset(true);golfEvents.length=0;});
  assert.equal((await get()).state,'ready');assert.equal(await p.locator('#golf-putt').isDisabled(),true);
  await p.click('#golf-continue');assert.equal((await get()).state,'aiming');
  assert.equal(await p.locator('#golf-par-row td').last().textContent(),'19');
  await p.keyboard.press('ArrowRight');assert.equal((await get()).angle,5);
  await p.keyboard.press('Shift+ArrowLeft');assert.equal((await get()).angle,4);
  await p.keyboard.press('ArrowUp');assert.equal((await get()).power,55);
  await p.keyboard.press('Shift+ArrowDown');assert.equal((await get()).power,54);
  await p.keyboard.press('Space');assert.equal((await get()).strokes,1);assert.equal((await get()).state,'rolling');
  await p.keyboard.press('Space');assert.equal((await get()).strokes,1,'cannot double-hit rolling ball');
  await p.clock.runFor(200);assert.ok((await get()).ball.x>100,'animation loop moves ball');
  await p.keyboard.press('p');const paused=(await get()).ball;await p.clock.runFor(1000);assert.deepEqual((await get()).ball,paused);
  await p.click('#golf-continue');await flush();assert.equal((await get()).state,'aiming');
  await p.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal((await get()).state,'paused');await p.click('#golf-pause');
  await p.click('#golf-restart');assert.equal((await get()).strokes,0);assert.equal((await get()).holeIndex,0);
  // Power endpoints, angle wrap, slider semantics, and no shot when editing a slider.
  await p.evaluate(()=>{gt.set({angle:179,power:100});gt.hud();document.querySelector('#golf-course').focus();});
  await p.keyboard.press('ArrowRight');assert.equal((await get()).angle,-176);await p.keyboard.press('ArrowUp');assert.equal((await get()).power,100);
  await p.evaluate(()=>{const n=document.querySelector('#golf-power');n.value='10';n.dispatchEvent(new Event('input'));});assert.equal((await get()).power,10);
  await p.focus('#golf-power');await p.keyboard.press('Space');assert.equal((await get()).strokes,0);
  // Real mouse drag, outside release, click without a drag, cancel, and unrelated pointer.
  await reset();await p.locator('#golf-course').scrollIntoViewIfNeeded();let box=await p.locator('#golf-course').boundingBox();
  const pt=(x,y)=>({x:box.x+x*box.width/640,y:box.y+y*box.height/430});
  let from=pt(100,215),to=pt(10,215);await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move(to.x,to.y);assert.ok((await get()).drag);await p.mouse.up();assert.equal((await get()).state,'rolling');assert.equal((await get()).strokes,1);assert.ok((await get()).ball.vx>0);await flush();
  await reset();await p.mouse.click(from.x,from.y);assert.equal((await get()).strokes,0,'tap does not count a stroke');
  await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move(to.x,to.y);await p.locator('#golf-course').dispatchEvent('pointercancel',{pointerId:1});await p.mouse.up();assert.equal((await get()).strokes,0);assert.equal((await get()).drag,null);
  await p.mouse.click(pt(400,300).x,pt(400,300).y);assert.equal((await get()).strokes,0);
  // Touch events through Chromium's input protocol exercise the browser's real pointer stream.
  const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from.x,y:from.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:to.x,y:to.y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await get()).strokes,1,'touch drag putts');await flush();
  // Turf drag and wall reflection at the fixed timestep; fast shots cannot tunnel through hedges.
  await reset();await p.evaluate(()=>{gt.set({ball:{x:607,y:80,vx:520,vy:0},state:'rolling',strokes:1});gt.update(1/120);});assert.ok((await get()).ball.vx<0);assert.ok((await get()).ball.x<=609);
  await p.evaluate(()=>{gt.set({holeIndex:1,state:'aiming'});gt.loadHole();gt.set({ball:{x:276,y:250,vx:520,vy:0},state:'rolling',strokes:1});gt.update(1/120);});assert.ok((await get()).ball.vx<0);assert.ok((await get()).ball.x<=278);
  const surface=await p.evaluate(()=>{gt.reset(true);gt.set({ball:{x:290,y:210,vx:200,vy:0},state:'rolling',strokes:1});gt.update(1/120);const grass=gt.get().ball.vx;gt.set({holeIndex:2,ball:{x:290,y:210,vx:200,vy:0},state:'rolling',strokes:1});gt.update(1/120);return {grass,sand:gt.get().ball.vx};});assert.ok(surface.sand<surface.grass,'sand slows ball more than grass');
  await p.evaluate(()=>{gt.reset(true);gt.set({holeIndex:3});gt.loadHole();gt.set({ball:{x:260,y:160,vx:100,vy:0},state:'rolling',strokes:1});gt.update(1/120);});assert.equal((await get()).strokes,2);assert.equal((await get()).state,'aiming');assert.deepEqual([(await get()).ball.x,(await get()).ball.y],[95,320]);assert.match(await p.textContent('#golf-message'),/penalty/);
  // A cup captures slow balls, rejects very fast ones, and emits exactly one hole event.
  await reset();await p.evaluate(()=>{gt.set({ball:{x:516,y:215,vx:400,vy:0},state:'rolling',strokes:1});gt.update(1/120);});assert.equal((await get()).state,'rolling');
  await p.evaluate(()=>{gt.set({ball:{x:516,y:215,vx:50,vy:0},state:'rolling',strokes:2});gt.update(1/120);gt.update(1/120);});assert.equal((await get()).state,'hole');assert.equal(await p.evaluate(()=>golfEvents.length),1);assert.deepEqual(await p.evaluate(()=>golfEvents[0]),{event:'golf_hole',data:{strokes:2,par:2}});
  // Every hole is playable from its actual tee with legitimate strokes. Intermediate targets
  // avoid obstacles; the final shot uses the physics' distance-to-speed relationship.
  const paths=[[[520,215]],[[150,95],[520,100]],[[185,75],[460,75],[540,215]],[[165,85],[535,100]],[[155,95],[335,95],[335,340],[520,340],[545,105]],[[180,330],[490,360],[560,240],[545,105]]];
  await reset();const reachable=[];
  for(let i=0;i<6;i++){
    for(const target of paths[i]){
      let s=await get();if(s.state!=='aiming')break;
      const dx=target[0]-s.ball.x,dy=target[1]-s.ball.y,d=Math.hypot(dx,dy),power=Math.max(10,Math.min(100,(d*1.05+8)/5.2));
      s=await putt(Math.atan2(dy,dx)*180/Math.PI,power);
    }
    let s=await get();
    for(let j=0;j<3&&s.state==='aiming';j++){
      const cup=await p.evaluate(()=>gt.courses[gt.get().holeIndex].cup),dx=cup[0]-s.ball.x,dy=cup[1]-s.ball.y;
      s=await putt(Math.atan2(dy,dx)*180/Math.PI,Math.max(10,Math.min(100,(Math.hypot(dx,dy)*1.05+8)/5.2)));
    }
    assert.equal(s.holed[i],true,`hole ${i+1} is reachable: ${JSON.stringify(s)}`);assert.ok(s.strokes<10);reachable.push(s.strokes);
    if(i<5)await p.click('#golf-continue');
  }
  assert.equal((await get()).state,'round');assert.equal((await get()).holed.filter(Boolean).length,6);assert.equal(await p.evaluate(()=>golfEvents.filter(e=>e.event==='golf_hole').length),6);assert.equal(await p.evaluate(()=>golfEvents.filter(e=>e.event==='golf_round').length),1);
  const legitTotal=(await get()).scores.reduce((a,b)=>a+b);
  const golfEarned=await p.evaluate(()=>Shelf.getState().earned);assert.ok(golfEarned['golf-first']);assert.ok(golfEarned['golf-round']);if(legitTotal<=19)assert.ok(golfEarned['golf-par']);assert.equal(await p.evaluate(()=>Number(localStorage.getItem('pocket-greens-best'))),legitTotal);
  await p.screenshot({path:path.join(out,'round-desktop.png'),fullPage:true});
  // Per-hole limit includes water penalties, never exceeds 10 and cannot grant a sink.
  await reset();await p.evaluate(()=>{gt.set({strokes:9,ball:{x:100,y:215,vx:0,vy:0},angle:180,power:10});gt.shoot();});await flush();assert.equal((await get()).state,'hole');assert.equal((await get()).scores[0],10);assert.equal((await get()).holed[0],false);assert.equal(await p.evaluate(()=>golfEvents.length),0);
  await reset();await p.evaluate(()=>{gt.set({holeIndex:3});gt.loadHole();gt.set({strokes:10,ball:{x:260,y:150,vx:100,vy:0},state:'rolling'});gt.update(1/120);});assert.equal((await get()).scores[3],10);assert.equal((await get()).holed[3],false);
  await reset();for(let i=0;i<6;i++){await p.evaluate(()=>{gt.set({strokes:10,state:'rolling'});gt.settle();});if(i<5)await p.click('#golf-continue');}
  assert.equal((await get()).state,'round');assert.deepEqual(await p.evaluate(()=>golfEvents),[{event:'golf_round',data:{total:60,par:19,holed:0}}]);assert.equal((await get()).best,legitTotal);assert.match(await p.textContent('#golf-overlay-note'),/Hole every ball/);
  // Medal boundaries, best remains a minimum, and storage failure remains playable.
  for(const [scoreList,medal] of [[[2,3,3,3,4,4],'Gold'],[[3,4,4,4,5,5],'Silver'],[[4,5,5,5,6,6],'Bronze']]){
    await reset();for(let i=0;i<6;i++){await p.evaluate(strokes=>{const cup=gt.courses[gt.get().holeIndex].cup;gt.set({strokes,state:'rolling',ball:{x:cup[0],y:cup[1],vx:0,vy:0}});gt.update(1/120);},scoreList[i]);if(i<5)await p.click('#golf-continue');}
    assert.match(await p.textContent('#golf-overlay-title'),new RegExp(medal));
  }
  assert.equal((await get()).best,Math.min(legitTotal,19));
  await p.evaluate(()=>{localStorage.setItem('pocket-greens-best','NaN');golf();});assert.equal((await get()).best,null);
  await p.evaluate(()=>{Storage.prototype.getItem=()=>{throw new Error('storage blocked')};Storage.prototype.setItem=()=>{throw new Error('storage blocked')};golf();gt.reset(true);});
  for(let i=0;i<6;i++){await p.evaluate(()=>{const cup=gt.courses[gt.get().holeIndex].cup;gt.set({strokes:1,state:'rolling',ball:{x:cup[0],y:cup[1],vx:0,vy:0}});gt.update(1/120);});if(i<5)await p.click('#golf-continue');}
  assert.equal((await get()).best,6);assert.equal((await get()).state,'round');
  // Deterministic 6,000-step play on all six courses remains bounded and finite.
  const stress=await p.evaluate(()=>{const failures=[];for(let h=0;h<6;h++){gt.reset(true);gt.set({holeIndex:h});gt.loadHole();for(let k=0;k<8;k++){if(gt.get().state!=='aiming')break;gt.set({angle:k*47-180,power:100});gt.shoot();for(let i=0;i<1000&&gt.get().state==='rolling';i++){gt.update(1/120);const b=gt.get().ball;if(!Number.isFinite(b.x+b.y+b.vx+b.vy)||b.x<30.9||b.x>609.1||b.y<36.9||b.y>399.1)failures.push([h,k,i,b]);}}}return failures;});assert.deepEqual(stress,[]);
  // The full overlay/action and scorecard must fit on small screens as well as desktop.
  for(const width of [1100,375,320]){
    await p.setViewportSize({width,height:1000});await p.evaluate(()=>gt.reset());
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px page has no horizontal overflow`);
    const a=await p.locator('#golf-overlay').boundingBox(),b=await p.locator('#golf-continue').boundingBox();assert.ok(b.y+b.height<=a.y+a.height+1,`${width}px welcome action fits`);
    await p.screenshot({path:path.join(out,`ready-${width}.png`),fullPage:true});
    await p.click('#golf-continue');await p.evaluate(()=>{gt.set({holeIndex:3});gt.loadHole();gt.draw();});await p.screenshot({path:path.join(out,`water-${width}.png`),fullPage:true});
    await p.evaluate(()=>{gt.set({strokes:10,state:'rolling'});gt.settle();});const c=await p.locator('#golf-overlay').boundingBox(),d=await p.locator('#golf-continue').boundingBox();assert.ok(d.y+d.height<=c.y+c.height+1,`${width}px results action fits`);
  }
  await p.evaluate(()=>{gt.reset(true);home();});assert.equal((await get()).disposed,true);await p.keyboard.press('Space');await p.clock.runFor(3000);assert.equal(await p.locator('.hero').count(),1);
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS: Mini Golf keyboard, mouse and real touch, sliders, pause/blur/restart, fixed-step physics, wall bounces, sand/water, all six reachable holes, scoring/events, pickup limit, medals/best/storage failure, stress simulation, responsive layouts and cleanup. Legitimate round strokes:',reachable,'Screenshots:',out);
})().catch(e=>{console.error(e);process.exit(1)});
