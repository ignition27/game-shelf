const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const url=require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const out=fs.mkdtempSync('/tmp/shelf-visual-tests-');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.clock.install();await page.clock.pauseAt(new Date());
  assert.equal(await page.locator('.grid .card').count(),12);
  assert.equal(await page.locator('.car-slide').count(),12);
  await page.locator('[data-view="arcade"]').click();assert.equal(await page.locator('.card').count(),10);
  await page.locator('[data-view="board"]').click();assert.equal(await page.locator('.card').count(),2);
  await page.locator('.brand').click();assert.equal(await page.locator('.hero').count(),1);
  // Actual gameplay unlocks are covered by integration.cjs; this covers every art variant.
  await page.evaluate(()=>{
    for(const id of ['snake','dodger','memory','reaction','word','clicker','flappy','platform','tic','checkers','trade','golf'])Shelf.record('game_play',{id});
    Shelf.record('daily_sets',{count:14});Shelf.record('snake_score',{score:10});Shelf.record('shooter_boss',{});Shelf.record('word_win',{guesses:2});
    Shelf.record('flyer_score',{score:10});Shelf.record('platform_win',{});
    Shelf.record('golf_hole',{strokes:1,par:2});Shelf.record('golf_round',{total:19,par:19,holed:6});
  });
  const cosmetics=await page.evaluate(()=>Shelf.cosmetics);
  const backgrounds=[];
  for(const item of cosmetics){
    await page.evaluate(()=>Shelf.render());
    const button=page.locator(`[data-equip-category="${item.category}"][data-equip-id="${item.id}"]`);
    assert.equal(await button.isDisabled(),false);await button.click();
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator(`[data-equip-category="${item.category}"][aria-pressed="true"]`).count(),1);
    if(item.category==='theme'){
      assert.equal(await page.evaluate(()=>document.body.dataset.shelfTheme),item.id);
      backgrounds.push(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor));
      await page.evaluate(()=>home());await page.screenshot({path:path.join(out,`theme-${item.id}.png`)});
    }else{
      await page.evaluate(category=>play({snake:'snake',ship:'dodger',plane:'flappy',golf:'golf'}[category]),item.category);
      const result=await page.evaluate(item=>{
        const c=document.querySelector('canvas'),rgb=[1,3,5].map(i=>parseInt(item.main.slice(i,i+2),16));
        const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let count=0;for(let i=0;i<d.length;i+=4)if(d[i]===rgb[0]&&d[i+1]===rgb[1]&&d[i+2]===rgb[2])count++;
        return {count,w:c.width,h:c.height};
      },item);
      assert.ok(result.count>15,`${item.category}:${item.id} is painted on the actual game canvas`);
      assert.deepEqual([result.w,result.h],{snake:[480,480],ship:[640,480],plane:[640,400],golf:[640,430]}[item.category]);
    }
  }
  assert.equal(new Set(backgrounds).size,4,'All shelf themes visibly differ');
  const saved=await page.evaluate(()=>Shelf.getState());await page.reload();
  assert.deepEqual(await page.evaluate(()=>Shelf.getState()),saved);
  for(const width of [1100,768,375,320]){
    await page.setViewportSize({width,height:900});
    for(const view of ['home','rewards','golf']){
      await page.evaluate(view=>{view==='home'?home():view==='rewards'?Shelf.render():play('golf');scrollTo(0,0);},view);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${view} fits ${width}px`);
      for(const box of await page.locator('nav button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().toJSON())))assert.ok(box.x>=0&&box.right<=width);
      if(view==='golf')await page.locator('#golf-continue').click();
      await page.screenshot({path:path.join(out,`${view}-${width}.png`)});
      if(view==='rewards'){
        await page.locator('[data-shelf-jump="shelf-cosmetics"]').click();
        assert.equal(await page.evaluate(()=>document.activeElement.id),'shelf-cosmetics');
        await page.screenshot({path:path.join(out,`cosmetics-${width}.png`)});
      }
    }
  }
  assert.deepEqual(errors,[]);
  await browser.close();console.log('PASS: navigation, all 18 cosmetic choices, actual canvas colours and unchanged dimensions, all four themes, saved equipment, keyboard jump links, and responsive home/rewards/golf at four sizes. Screenshots:',out);
})().catch(e=>{console.error(e);process.exit(1)});
