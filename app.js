const app=document.querySelector('#app');let clean=()=>{},carIndex=0,carTimer=null;
const games=[['snake','🐍','Neon Snake','Eat, grow, don’t crash.'],['dodger','🚀','Space Dodger','Avoid the asteroid field.'],['memory','🃏','Memory Match','Find every pair.'],['reaction','⚡','Reaction Test','How quick are you?'],['word','🔤','Word Guess','A tiny word puzzle.'],['clicker','🪙','Clicker Adventure','Tap, upgrade, grow.'],['flappy','🐦','Sky Flyer','Thread the gaps.'],['platform','🕹️','Mini Platformer','Jump for the flag.'],['tic','❌','Tic-Tac-Toe','Take on the computer.'],['checkers','♟','Checkers','Three bot difficulties.'],['trade','🏘️','City Trader','Buy streets, beat the bots.']];
function cards(filter='all'){return games.filter(g=>filter==='all'||(filter==='board'?['checkers','trade'].includes(g[0]):!['checkers','trade'].includes(g[0]))).map(g=>`<article class="card"><div class="art">${g[1]}</div><h3>${g[2]}</h3><p>${g[3]}</p><button onclick="play('${g[0]}')">Play now →</button></article>`).join('')}
function carousel(){return `<section class="carousel" aria-roledescription="carousel" aria-label="Browse all games"><div class="section-title"><div><span class="eyebrow">Spin the shelf</span><h2>Browse them all</h2></div><div class="car-controls"><button class="car-btn" id="carPrev" aria-label="Previous game">←</button><button class="car-btn" id="carNext" aria-label="Next game">→</button></div></div><div class="car-viewport"><div class="car-track" id="carTrack">${games.map(g=>`<article class="card car-slide"><div class="art">${g[1]}</div><h3>${g[2]}</h3><p>${g[3]}</p><button onclick="play('${g[0]}')">Play now →</button></article>`).join('')}</div></div><div class="car-dots" id="carDots">${games.map((_,i)=>`<button data-i="${i}" class="${i===0?'active':''}" aria-label="Go to slide ${i+1}"></button>`).join('')}</div></section>`}
function initCarousel(){let track=document.querySelector('#carTrack'),dots=[...document.querySelectorAll('#carDots button')],box=document.querySelector('.carousel'),gap=parseFloat(getComputedStyle(track).columnGap)||15;carIndex=0;let step=()=>track.children[0].getBoundingClientRect().width+gap;let go=i=>{carIndex=(i+games.length)%games.length;track.style.transform=`translateX(-${carIndex*step()}px)`;dots.forEach((d,j)=>d.classList.toggle('active',j===carIndex))};let next=()=>go(carIndex+1);let start=()=>carTimer=setInterval(next,3500);let restart=()=>{clearInterval(carTimer);start()};document.querySelector('#carNext').onclick=()=>{next();restart()};document.querySelector('#carPrev').onclick=()=>{go(carIndex-1);restart()};dots.forEach(d=>d.onclick=()=>{go(+d.dataset.i);restart()});box.onmouseenter=()=>clearInterval(carTimer);box.onmouseleave=start;box.ontouchstart=()=>clearInterval(carTimer);box.ontouchend=start;let onResize=()=>go(carIndex);addEventListener('resize',onResize);start();clean=()=>{clearInterval(carTimer);removeEventListener('resize',onResize)}}
function home(){clean();app.innerHTML=`<section class="hero"><div><span class="eyebrow">A little collection of browser games</span><h1>Pick a game.<br><em>Make a moment.</em></h1><p>Seven small games for a quick break, from arcade classics to thoughtful board games with computer opponents.</p></div><aside class="feature"><span class="kicker">Featured board game</span><b>City Trader</b><p>Build a property empire against 1–3 computer opponents of your choice.</p><button onclick="play('trade')">Play City Trader →</button></aside></section>${carousel()}<div class="section-title"><div><span class="eyebrow">The full shelf</span><h2>Choose your challenge</h2></div></div><section class="grid">${cards()}</section>`;initCarousel()}
function list(view){clean();let t=view==='board'?'Board games':'Arcade games';app.innerHTML=`<div class="game-head"><button class="back" onclick="home()">←</button><h1>${t}</h1></div><section class="grid">${cards(view)}</section>`}
function shell(title,sub,body){clean();app.innerHTML=`<div class="game-head"><button class="back" onclick="home()">←</button><div><span class="eyebrow">Game shelf</span><h1>${title}</h1></div></div><div class="game-wrap"><p>${sub}</p>${body}</div>`}
window.play=id=>({snake,dodger,memory,reaction,word,clicker,flappy,platform,tic,checkers,trade})[id]();window.home=home;document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>b.dataset.view==='home'?home():list(b.dataset.view));
function snake(){shell('Neon Snake','Use arrow keys or the buttons to collect the glowing food.',`<div class="panel"><div class="stats">SCORE <b id="score">0</b></div><canvas class="canvas" width="480" height="480"></canvas><div class="controls"><button data-d="ArrowLeft">←</button><button data-d="ArrowUp">↑</button><button data-d="ArrowDown">↓</button><button data-d="ArrowRight">→</button><button onclick="snake()">Restart</button></div></div>`);let c=document.querySelector('canvas'),x=c.getContext('2d'),s=[[10,10]],d=[1,0],next=d,food=[16,12],score=0,dead=false;let set=e=>{let k=e.key||e.target.dataset.d,ds={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(ds&&ds[0]!==-d[0]&&ds[1]!==-d[1])next=ds};addEventListener('keydown',set);document.querySelectorAll('[data-d]').forEach(b=>b.onclick=set);let draw=()=>{x.fillStyle='#172036';x.fillRect(0,0,480,480);x.fillStyle='#ff5d8f';x.fillRect(food[0]*24+3,food[1]*24+3,18,18);x.fillStyle='#67e2b1';s.forEach(p=>x.fillRect(p[0]*24+2,p[1]*24+2,20,20))};let loop=setInterval(()=>{d=next;let h=[s[0][0]+d[0],s[0][1]+d[1]];if(h[0]<0||h[1]<0||h[0]>19||h[1]>19||s.some(p=>p[0]===h[0]&&p[1]===h[1])){clearInterval(loop);dead=true;return alert('Game over — score: '+score)}s.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){score++;document.querySelector('#score').textContent=score;do food=[Math.floor(Math.random()*20),Math.floor(Math.random()*20)];while(s.some(p=>p[0]===food[0]&&p[1]===food[1]))}else s.pop();draw()},115);draw();clean=()=>{clearInterval(loop);removeEventListener('keydown',set)}}
function dodger(){shell('Space Dodger','Steer your ship and survive the asteroid field.',`<div class="panel"><div class="stats">TIME <b id="score">0.0s</b></div><canvas class="canvas" width="480" height="480"></canvas><div class="controls"><button data-d="left">←</button><button data-d="right">→</button><button onclick="dodger()">Restart</button></div></div>`);let c=document.querySelector('canvas'),x=c.getContext('2d'),px=220,rocks=[],key={},ticks=0;let kd=e=>key[e.key]=true,ku=e=>key[e.key]=false;addEventListener('keydown',kd);addEventListener('keyup',ku);document.querySelectorAll('[data-d]').forEach(b=>b.onpointerdown=()=>key[b.dataset.d]=true,b.onpointerup=()=>key[b.dataset.d]=false);let loop=setInterval(()=>{ticks++;if(key.ArrowLeft||key.left)px-=7;if(key.ArrowRight||key.right)px+=7;px=Math.max(0,Math.min(440,px));if(ticks%18===0)rocks.push([Math.random()*450,-20,3+Math.random()*5]);rocks.forEach(r=>r[1]+=r[2]);rocks=rocks.filter(r=>r[1]<510);if(rocks.some(r=>r[1]>420&&r[1]<472&&r[0]+18>px&&r[0]<px+40)){clearInterval(loop);alert('You lasted '+(ticks/60).toFixed(1)+' seconds!')}x.fillStyle='#172036';x.fillRect(0,0,480,480);x.fillStyle='#ff5d8f';rocks.forEach(r=>{x.beginPath();x.arc(r[0],r[1],11,0,7);x.fill()});x.fillStyle='#65cbff';x.beginPath();x.moveTo(px+20,420);x.lineTo(px,470);x.lineTo(px+40,470);x.fill();document.querySelector('#score').textContent=(ticks/60).toFixed(1)+'s'},16);clean=()=>{clearInterval(loop);removeEventListener('keydown',kd);removeEventListener('keyup',ku)}}
function memory(){let icons=['🌙','🌙','🍒','🍒','🪐','🪐','🎲','🎲','🌵','🌵','🎯','🎯','🦋','🦋','🎸','🎸'].sort(()=>Math.random()-.5),open=[],moves=0; shell('Memory Match','Find the eight pairs in as few moves as you can.',`<div class="panel"><div class="stats">MOVES <b id="score">0</b></div><div class="memory">${icons.map((_,i)=>`<button data-i="${i}">?</button>`).join('')}</div><div class="controls"><button onclick="memory()">New game</button></div></div>`);document.querySelectorAll('.memory button').forEach(b=>b.onclick=()=>{let i=+b.dataset.i;if(b.classList.contains('open')||b.classList.contains('done')||open.length===2)return;b.textContent=icons[i];b.classList.add('open');open.push(i);if(open.length===2){moves++;document.querySelector('#score').textContent=moves;let[a,z]=open;if(icons[a]===icons[z]){document.querySelectorAll('.memory button')[a].classList.replace('open','done');document.querySelectorAll('.memory button')[z].classList.replace('open','done');open=[];if(document.querySelectorAll('.done').length===16)setTimeout(()=>alert('You won in '+moves+' moves!'),100)}else setTimeout(()=>{[a,z].forEach(q=>{let e=document.querySelectorAll('.memory button')[q];e.textContent='?';e.classList.remove('open')});open=[]},650)}})}
function reaction(){let state='ready',start; shell('Reaction Test','Wait for green, then tap as fast as you can.',`<div class="panel"><div class="reaction" id="react">Click to start</div><div class="controls"><button onclick="reaction()">Reset</button></div></div>`);let e=document.querySelector('#react');e.onclick=()=>{if(state==='ready'){state='wait';e.textContent='Wait for green…';e.style.background='#ff5d8f';setTimeout(()=>{state='go';start=performance.now();e.textContent='CLICK!';e.style.background='#67e2b1'},1800+Math.random()*2500)}else if(state==='wait'){e.textContent='Too early — try again.';e.style.background='#e5e8ed';state='ready'}else if(state==='go'){e.textContent=Math.round(performance.now()-start)+' ms — click to go again';e.style.background='#e5e8ed';state='ready'}}}
function word(){let words=['ORBIT','JAZZ','PIXEL','GHOST','MANGO','ROBOT'],answer=words[Math.floor(Math.random()*words.length)],guessed=[],lives=6;let render=()=>{shell('Word Guess','Guess the secret five-letter word before the stars run out.',`<div class="panel"><div class="stats">STARS LEFT <b id="score">${lives}</b></div><div class="word">${[...answer].map(x=>guessed.includes(x)?x:'_').join(' ')}</div><div class="letters">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(x=>`<button ${guessed.includes(x)?'disabled':''} data-l="${x}">${x}</button>`).join('')}</div><div class="controls"><button onclick="word()">New word</button></div></div>`);document.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{let l=b.dataset.l;guessed.push(l);if(!answer.includes(l))lives--;if(answer.split('').every(x=>guessed.includes(x)))return alert('You got it! '+answer);if(!lives)return alert('The word was '+answer);render()})};render()}
function checkers(){
  let b=Array(64).fill(0),sel=null,turn='red',level='medium',note='Your turn',over=false,mustCapture=null,pending=null;
  for(let i=0;i<24;i++)if((i+Math.floor(i/8))%2)b[i]='black';
  for(let i=40;i<64;i++)if((i+Math.floor(i/8))%2)b[i]='red';

  let moves=i=>{
    let p=b[i];if(!p)return[];
    let r=i>>3,c=i%8,dirs=(p==='red')?[-1]:(p==='black')?[1]:[-1,1],a=[];
    for(let dr of dirs)for(let dc of[-1,1]){
      let n=(r+dr)*8+c+dc,j=(r+2*dr)*8+c+2*dc;
      if(n>=0&&n<64&&Math.abs(n%8-c)===1&&!b[n])a.push({from:i,to:n});
      if(j>=0&&j<64&&Math.abs(j%8-c)===2&&b[n]&&b[n][0]!==p[0]&&!b[j])a.push({from:i,to:j,cap:n});
    }
    return a;
  };
  let allMoves=color=>b.flatMap((p,i)=>p&&p[0]===color?moves(i):[]);
  let legalMovesFor=i=>{
    if(over||turn!=='red')return[];
    if(mustCapture!==null)return i===mustCapture?moves(i).filter(m=>m.cap):[];
    let caps=allMoves('r').filter(m=>m.cap),opts=moves(i);
    return caps.length?opts.filter(m=>m.cap):opts;
  };
  let apply=m=>{
    let piece=b[m.from];
    b[m.to]=piece;b[m.from]=0;
    if(m.cap)b[m.cap]=0;
    let row=m.to>>3;
    if(piece==='red'&&row===0)b[m.to]='redK';
    else if(piece==='black'&&row===7)b[m.to]='blackK';
  };

  let render=()=>{
    let targets=(!over&&sel!==null)?legalMovesFor(sel).map(m=>m.to):[];
    shell('Checkers','Capture every opposing piece. Pick how tactical the computer should be.',`<div class="difficulty">${['easy','medium','hard'].map(x=>`<button class="choice ${x===level?'active':''}" data-lvl="${x}">${x}</button>`).join('')}</div><div class="stats">${note}</div><div class="checkers">${b.map((p,i)=>`<button class="square ${(i+(i>>3))%2?'dark':''}${i===sel?' selected':''}${targets.includes(i)?' move':''}" data-i="${i}">${p?`<span class="piece ${p[0]==='r'?'red':''}${p.endsWith('K')?' king':''}"></span>`:''}</button>`).join('')}</div><div class="controls"><button onclick="checkers()">New game</button></div>`);
    document.querySelectorAll('[data-lvl]').forEach(x=>x.onclick=()=>{level=x.dataset.lvl;render()});
    document.querySelectorAll('.square').forEach(x=>x.onclick=()=>click(+x.dataset.i));
    clean=()=>clearTimeout(pending);
  };

  let advanceToBot=()=>{
    if(allMoves('b').length===0){note='You win! The bot has no moves left.';over=true;return render()}
    turn='black';note='Bot is thinking…';render();
    pending=setTimeout(()=>botStep(null),300);
  };
  let afterBot=()=>{
    if(allMoves('r').length===0){note='Bot wins! You have no moves left.';over=true;return render()}
    turn='red';note='Your turn';render();
  };
  let botStep=forcedFrom=>{
    let opts;
    if(forcedFrom!=null)opts=moves(forcedFrom).filter(m=>m.cap);
    else{let caps=allMoves('b').filter(m=>m.cap);opts=caps.length?caps:allMoves('b')}
    if(!opts.length)return afterBot();
    if(level==='hard'&&forcedFrom==null)opts=[...opts].sort((x,y)=>(y.cap?2:0)-(x.cap?2:0));
    let pick=forcedFrom!=null?opts[Math.floor(Math.random()*opts.length)]:opts[Math.floor(Math.random()*Math.min(opts.length,level==='easy'?opts.length:3))];
    apply(pick);
    note=pick.cap?'Bot captured your piece!':'Bot moved.';
    render();
    if(pick.cap){
      let follow=moves(pick.to).filter(x=>x.cap);
      if(follow.length){note='Bot captured your piece and jumps again…';render();pending=setTimeout(()=>botStep(pick.to),450);return}
    }
    afterBot();
  };

  let click=i=>{
    if(over||turn!=='red')return;
    let p=b[i];
    if(mustCapture!==null){
      if(i===mustCapture||(p&&p[0]==='r'))return;
      let m=legalMovesFor(mustCapture).find(x=>x.to===i);
      if(!m)return;
      apply(m);
      if(m.cap){
        let follow=moves(m.to).filter(x=>x.cap);
        if(follow.length){sel=m.to;mustCapture=m.to;note='Capture again with the same piece.';return render()}
      }
      sel=null;mustCapture=null;
      return advanceToBot();
    }
    if(p&&p[0]==='r'){
      if(legalMovesFor(i).length===0){
        note=allMoves('r').some(m=>m.cap)?'A capture is available — choose a piece that can capture.':'That piece has no legal moves.';
        sel=null;return render();
      }
      sel=i;note='Choose a highlighted square to move to.';return render();
    }
    if(sel===null)return;
    let m=legalMovesFor(sel).find(x=>x.to===i);
    if(!m){sel=null;note='Your turn';return render()}
    apply(m);
    if(m.cap){
      let follow=moves(m.to).filter(x=>x.cap);
      if(follow.length){sel=m.to;mustCapture=m.to;note='Capture again with the same piece.';return render()}
    }
    sel=null;
    advanceToBot();
  };

  render();
}
function trade(){
  const GROUP_COLORS={A:'var(--pink)',B:'var(--yellow)',C:'var(--blue)',D:'var(--mint)',E:'var(--violet)'};
  const TEMPLATE=[
    {name:'Founders Square',type:'start'},
    {name:'Cedar Row',type:'property',group:'A',price:60},
    {name:'Harbor Row',type:'property',group:'A',price:60},
    {name:'City Hall Fee',type:'tax',amount:50},
    {name:'Fortune',type:'event'},
    {name:'Maple Avenue',type:'property',group:'B',price:100},
    {name:'Birch Avenue',type:'property',group:'B',price:100},
    {name:'Elm Street',type:'property',group:'B',price:120},
    {name:'Rest Stop',type:'rest'},
    {name:'Cliffside',type:'property',group:'C',price:140},
    {name:'Fortune',type:'event'},
    {name:'Bayview',type:'property',group:'C',price:140},
    {name:'Market Square',type:'property',group:'C',price:160},
    {name:'City Hall Fee',type:'tax',amount:75},
    {name:'Riverside',type:'property',group:'D',price:180},
    {name:'Fortune',type:'event'},
    {name:'Riverside Park',type:'property',group:'D',price:180},
    {name:'Old Town',type:'property',group:'D',price:200},
    {name:'Grand Terminal',type:'property',group:'E',price:220},
    {name:'Uptown Heights',type:'property',group:'E',price:240}
  ];
  const HOUSE_LIMIT=4,START_CASH=1000,PASS_BONUS=150;
  const EVENTS=[{delta:120,text:'Tourism boom — extra visitors spend big.'},{delta:-60,text:'Unexpected repair bill.'},{delta:80,text:'City grant received.'},{delta:-40,text:'Parking fine issued.'},{delta:150,text:'Investor windfall!'},{delta:-90,text:'Storm damage cleanup.'}];
  const AVATARS=['🧑','🤖','🐙','🦊'];
  const cap=s=>s[0].toUpperCase()+s.slice(1);

  let stage='setup',botCount=2,difficulty='normal';
  let board=[],players=[],current=0,turnPhase='idle',log=[],pendingTimer=null,lastRoll=null;

  const rentOf=t=>t.rentBase*(t.houses+1);
  const houseCost=t=>Math.round(t.price*0.6);
  const addLog=m=>{log.unshift(m);if(log.length>40)log.length=40};
  const schedule=(fn,ms)=>{pendingTimer=setTimeout(fn,ms)};
  const owner=t=>t.owner!=null?players.find(x=>x.id===t.owner):null;

  function newBoard(){return TEMPLATE.map(t=>({...t,rentBase:t.price?Math.round(t.price*0.15):0,owner:null,houses:0}))}

  function startGame(){
    board=newBoard();
    players=[{id:0,name:'You',human:true,cash:START_CASH,pos:0,avatar:AVATARS[0]}];
    for(let i=0;i<botCount;i++)players.push({id:i+1,name:'Bot '+(i+1),human:false,cash:START_CASH,pos:0,avatar:AVATARS[i+1]});
    current=0;turnPhase='idle';log=[];lastRoll=null;
    addLog(`New game: You vs ${botCount} bot${botCount>1?'s':''} (${difficulty} difficulty).`);
    stage='playing';
    render();
  }

  function shouldBuyProperty(p,tile){
    let afford=p.cash-tile.price;
    if(difficulty==='easy')return tile.price<=140?Math.random()<0.7:Math.random()<0.15;
    if(difficulty==='hard')return afford>=200;
    return afford>=150&&tile.price<=p.cash*0.6;
  }
  function shouldBuyHouse(p,tile){
    let cost=houseCost(tile);
    if(difficulty==='easy')return p.cash-cost>=100&&Math.random()<0.1;
    if(difficulty==='hard')return p.cash-cost>=250;
    return p.cash-cost>=150&&Math.random()<0.6;
  }

  function resolveTile(p){
    let tile=board[p.pos];
    if(tile.type==='tax'){let pay=Math.min(p.cash,tile.amount);p.cash-=pay;addLog(`${p.name} paid a $${pay} city hall fee at ${tile.name}.`)}
    else if(tile.type==='event'){let e=EVENTS[Math.floor(Math.random()*EVENTS.length)];p.cash=Math.max(0,p.cash+e.delta);addLog(`${p.name} hit Fortune: ${e.text} (${e.delta>0?'+':''}$${e.delta})`)}
    else if(tile.type==='property'){
      if(tile.owner==null)addLog(`${p.name} landed on ${tile.name} — unowned, $${tile.price}.`);
      else if(tile.owner===p.id)addLog(`${p.name} landed on their own property, ${tile.name}.`);
      else{let o=owner(tile),rent=rentOf(tile),pay=Math.min(p.cash,rent);p.cash-=pay;o.cash+=pay;addLog(`${p.name} paid $${pay} rent to ${o.name} for ${tile.name}.`)}
    }else if(tile.type==='start')addLog(`${p.name} is resting at ${tile.name}.`);
    else addLog(`${p.name} stopped to rest.`);
  }

  function doRoll(){
    let p=players[current],d=1+Math.floor(Math.random()*6),total=p.pos+d;
    lastRoll=d;
    if(total>=board.length){p.cash+=PASS_BONUS;addLog(`${p.name} passed ${board[0].name} and collected $${PASS_BONUS}.`)}
    p.pos=total%board.length;
    addLog(`${p.name} rolled a ${d} and moved to ${board[p.pos].name}.`);
    resolveTile(p);
    turnPhase='moved';
  }

  function rollDice(){if(stage==='playing'&&turnPhase==='idle'&&players[current].human){doRoll();render()}}
  function buyProperty(){
    if(stage!=='playing'||turnPhase!=='moved')return;
    let p=players[current],tile=board[p.pos];
    if(!p.human||tile.type!=='property'||tile.owner!=null||p.cash<tile.price)return;
    p.cash-=tile.price;tile.owner=p.id;
    addLog(`${p.name} bought ${tile.name} for $${tile.price}.`);
    render();
  }
  function buyHouse(){
    if(stage!=='playing'||turnPhase!=='moved')return;
    let p=players[current],tile=board[p.pos],cost=houseCost(tile);
    if(!p.human||tile.type!=='property'||tile.owner!==p.id||tile.houses>=HOUSE_LIMIT||p.cash<cost)return;
    p.cash-=cost;tile.houses++;
    addLog(`${p.name} built a house on ${tile.name} — rent is now $${rentOf(tile)}.`);
    render();
  }
  function endTurn(){if(stage==='playing'&&turnPhase==='moved'&&players[current].human)advanceTurn()}
  function advanceTurn(){
    current=(current+1)%players.length;
    turnPhase='idle';lastRoll=null;
    render();
    if(!players[current].human)schedule(botTurn,700);
  }
  function botTurn(){
    if(stage!=='playing'||players[current].human)return;
    doRoll();render();
    schedule(botAct,900);
  }
  function botAct(){
    let p=players[current],tile=board[p.pos];
    if(tile.type==='property'&&tile.owner==null&&p.cash>=tile.price&&shouldBuyProperty(p,tile)){
      p.cash-=tile.price;tile.owner=p.id;
      addLog(`${p.name} bought ${tile.name} for $${tile.price}.`);
      render();
    }else if(tile.type==='property'&&tile.owner===p.id&&tile.houses<HOUSE_LIMIT&&p.cash>=houseCost(tile)&&shouldBuyHouse(p,tile)){
      let cost=houseCost(tile);p.cash-=cost;tile.houses++;
      addLog(`${p.name} built a house on ${tile.name} — rent is now $${rentOf(tile)}.`);
      render();
    }
    schedule(advanceTurn,700);
  }

  const tilePlayers=i=>players.filter(p=>p.pos===i);

  function renderSetup(){
    shell('City Trader','Set up your game, then roll to build a property empire.',`
      <div class="trade-setup">
        <div class="setup-row"><span class="setup-label">Computer opponents</span><div class="difficulty">${[1,2,3].map(n=>`<button class="choice ${n===botCount?'active':''}" data-bots="${n}" aria-label="${n} bot${n>1?'s':''}">${n}</button>`).join('')}</div></div>
        <div class="setup-row"><span class="setup-label">Bot difficulty</span><div class="difficulty">${['easy','normal','hard'].map(x=>`<button class="choice ${x===difficulty?'active':''}" data-diff="${x}" aria-label="Difficulty ${x}">${cap(x)}</button>`).join('')}</div></div>
        <p class="setup-note">You'll play as <b>You</b> against ${botCount} computer opponent${botCount>1?'s':''} set to <b>${difficulty}</b> difficulty.</p>
        <div class="controls"><button class="action" id="startTradeBtn">Start game</button></div>
      </div>`);
    document.querySelectorAll('[data-bots]').forEach(b=>b.onclick=()=>{botCount=+b.dataset.bots;renderSetup()});
    document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.diff;renderSetup()});
    document.querySelector('#startTradeBtn').onclick=startGame;
  }

  function renderGame(){
    let p=players[current],tile=board[p.pos];
    let canBuyProp=p.human&&turnPhase==='moved'&&tile.type==='property'&&tile.owner==null&&p.cash>=tile.price;
    let canBuyHouse=p.human&&turnPhase==='moved'&&tile.type==='property'&&tile.owner===p.id&&tile.houses<HOUSE_LIMIT&&p.cash>=houseCost(tile);
    let canRoll=p.human&&turnPhase==='idle';
    let canEnd=p.human&&turnPhase==='moved';
    shell('City Trader',`You vs ${players.length-1} bot${players.length>2?'s':''} · Difficulty: ${cap(difficulty)}`,`
      <div class="trade-shell">
        <div class="turn-banner" role="status">${p.human?'Your turn':`${p.name}'s turn (thinking…)`} — standing on <b>${tile.name}</b>${turnPhase==='moved'&&lastRoll?` (rolled a ${lastRoll})`:''}</div>
        <div class="trade-layout">
          <div class="trade-board" role="list" aria-label="City board">${board.map((t,i)=>`
            <div class="tile ${t.type}${i===p.pos?' current-tile':''}${t.owner!=null?' owned':''}" role="listitem">
              ${t.group?`<span class="tile-stripe" style="background:${GROUP_COLORS[t.group]}"></span>`:''}
              <span class="tile-name">${t.name}</span>
              <span class="tile-meta">${t.type==='property'?(t.owner!=null?`${owner(t).name}${t.houses?' · '+t.houses+' 🏠':''}`:'$'+t.price):t.type==='tax'?'Fee $'+t.amount:t.type==='event'?'Event':t.type==='start'?'Start & collect':'Rest'}</span>
              <span class="tile-tokens">${tilePlayers(i).map(pp=>`<span class="token" title="${pp.name}">${pp.avatar}</span>`).join('')}</span>
            </div>`).join('')}</div>
          <aside class="trade-side">
            <div class="side-panel players-panel">
              <h3>Players</h3>
              <ul class="player-list">${players.map((pl,i)=>`<li class="${i===current?'active-player':''}"><span class="p-avatar">${pl.avatar}</span><span class="p-name">${pl.name}</span><span class="p-cash">$${pl.cash}</span></li>`).join('')}</ul>
            </div>
            <div class="side-panel property-panel">
              <h3>Current property</h3>
              ${tile.type==='property'?`
                <p class="prop-name">${tile.name}</p>
                <dl class="prop-facts">
                  <div><dt>Price</dt><dd>$${tile.price}</dd></div>
                  <div><dt>Owner</dt><dd>${tile.owner!=null?owner(tile).name:'Unowned'}</dd></div>
                  <div><dt>Base rent</dt><dd>$${tile.rentBase}</dd></div>
                  <div><dt>Houses</dt><dd>${tile.houses} / ${HOUSE_LIMIT}</dd></div>
                  <div><dt>Current rent</dt><dd>${tile.owner!=null?'$'+rentOf(tile):'—'}</dd></div>
                </dl>`:`<p>${tile.name} has no purchasable property.</p>`}
            </div>
            <div class="side-panel trade-actions">
              <h3>Actions</h3>
              <div class="controls">
                <button class="action" id="rollBtn" ${canRoll?'':'disabled'}>Roll dice</button>
                <button id="buyPropBtn" ${canBuyProp?'':'disabled'}>Buy property${tile.type==='property'&&tile.owner==null?' ($'+tile.price+')':''}</button>
                <button id="buyHouseBtn" ${canBuyHouse?'':'disabled'}>Buy house${tile.type==='property'?' ($'+houseCost(tile)+')':''}</button>
                <button id="endTurnBtn" ${canEnd?'':'disabled'}>End turn</button>
              </div>
              ${!p.human?'<p class="bot-note">Waiting for the bot to play…</p>':''}
            </div>
            <div class="side-panel log-panel">
              <h3>Activity log</h3>
              <ul class="log-list" aria-live="polite">${log.map(l=>`<li>${l}</li>`).join('')}</ul>
            </div>
          </aside>
        </div>
        <div class="side-panel props-table-wrap">
          <h3>All properties</h3>
          <table class="props-table">
            <caption class="sr-only">Every property's price, owner, base rent, houses, and current rent</caption>
            <thead><tr><th>Name</th><th>Price</th><th>Owner</th><th>Base rent</th><th>Houses</th><th>Current rent</th></tr></thead>
            <tbody>${board.filter(t=>t.type==='property').map(t=>`<tr><td>${t.name}</td><td>$${t.price}</td><td>${t.owner!=null?owner(t).name:'—'}</td><td>$${t.rentBase}</td><td>${t.houses}</td><td>${t.owner!=null?'$'+rentOf(t):'—'}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="controls"><button onclick="trade()">New game</button></div>
      </div>`);
    document.querySelector('#rollBtn').onclick=rollDice;
    document.querySelector('#buyPropBtn').onclick=buyProperty;
    document.querySelector('#buyHouseBtn').onclick=buyHouse;
    document.querySelector('#endTurnBtn').onclick=endTurn;
  }

  function render(){
    stage==='setup'?renderSetup():renderGame();
    clean=()=>clearTimeout(pendingTimer);
  }
  render();
}
function clicker(){let coins=0,power=1,cost=15;let render=()=>{shell('Clicker Adventure','Tap the coin, buy a better tap, and watch your pile grow.',`<div class="panel"><div class="stats">COINS <b>${coins}</b> · TAP POWER <b>${power}</b></div><button id="coin" style="font-size:100px;border:0;background:transparent">🪙</button><div class="controls"><button id="upgrade">Upgrade tap — ${cost} coins</button><button onclick="clicker()">New game</button></div></div>`);document.querySelector('#coin').onclick=()=>{coins+=power;render()};document.querySelector('#upgrade').onclick=()=>{if(coins>=cost){coins-=cost;power++;cost=Math.ceil(cost*1.8);render()}}};render()}
function tic(){let b=Array(9).fill(''),note='Your turn',wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],won=()=>wins.find(x=>x.every(i=>b[i]&&b[i]===b[x[0]]));let render=()=>{shell('Tic-Tac-Toe','You are X. Can you beat the computer?',`<div class="panel"><div class="stats">${note}</div><div class="memory" style="grid-template-columns:repeat(3,1fr);max-width:300px">${b.map((x,i)=>`<button data-t="${i}" style="height:92px">${x}</button>`).join('')}</div><div class="controls"><button onclick="tic()">New game</button></div></div>`);document.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>move(+x.dataset.t))};let move=i=>{if(b[i]||won())return;b[i]='X';if(won()){note='You win!';return render()}if(b.every(Boolean)){note='Draw.';return render()}let open=b.map((x,i)=>x?'':i).filter(x=>x!==''),pick=open.find(i=>{b[i]='O';let yes=!!won();b[i]='';return yes})??open[Math.floor(Math.random()*open.length)];b[pick]='O';note=won()?'Computer wins.':'Your turn';render()};render()}
function flappy(){shell('Sky Flyer','Click, tap, or press Space to flap through the openings.',`<div class="panel"><div class="stats">SCORE <b id="score">0</b></div><canvas class="canvas" width="480" height="360"></canvas><div class="controls"><button id="flap">Flap</button><button onclick="flappy()">Restart</button></div></div>`);let c=document.querySelector('canvas'),x=c.getContext('2d'),y=150,v=0,pipes=[],score=0,t=0;let flap=()=>v=-6;addEventListener('keydown',flap);document.querySelector('#flap').onclick=flap;let loop=setInterval(()=>{t++;v+=.38;y+=v;if(t%95===0)pipes.push({x:480,g:70+Math.random()*170});pipes.forEach(p=>p.x-=3);pipes=pipes.filter(p=>p.x>-50);if(y<0||y>360||pipes.some(p=>p.x<145&&p.x+45>105&&(y<p.g||y>p.g+100))){clearInterval(loop);alert('Score: '+score)}if(t%95===45){score++;document.querySelector('#score').textContent=score}x.fillStyle='#65cbff';x.fillRect(0,0,480,360);x.fillStyle='#67e2b1';pipes.forEach(p=>{x.fillRect(p.x,0,45,p.g);x.fillRect(p.x,p.g+100,45,360)});x.fillStyle='#ffd65c';x.beginPath();x.arc(120,y,15,0,7);x.fill()},16);clean=()=>{clearInterval(loop);removeEventListener('keydown',flap)}}
function platform(){shell('Mini Platformer','Use left/right and Space. Reach the flag at the far side.',`<div class="panel"><canvas class="canvas" width="480" height="300"></canvas><div class="controls"><button data-p="left">←</button><button data-p="jump">Jump</button><button data-p="right">→</button><button onclick="platform()">Restart</button></div></div>`);let c=document.querySelector('canvas'),x=c.getContext('2d'),px=25,y=230,v=0,key={};let down=e=>key[e.key||e.target.dataset.p]=true,up=e=>key[e.key||e.target.dataset.p]=false;addEventListener('keydown',down);addEventListener('keyup',up);document.querySelectorAll('[data-p]').forEach(q=>{q.onpointerdown=down;q.onpointerup=up});let loop=setInterval(()=>{if(key.ArrowLeft||key.left)px-=4;if(key.ArrowRight||key.right)px+=4;if((key[' ']||key.jump)&&y>=230)v=-10;v+=.55;y=Math.min(230,y+v);px=Math.max(0,px);if(px>435){clearInterval(loop);alert('Level complete!')}x.fillStyle='#bdefff';x.fillRect(0,0,480,300);x.fillStyle='#67e2b1';x.fillRect(0,260,480,40);x.fillStyle='#ff5d8f';x.fillRect(450,195,5,65);x.fillStyle='#ffd65c';x.fillRect(455,195,20,14);x.fillStyle='#172036';x.fillRect(px,y,22,30)},16);clean=()=>{clearInterval(loop);removeEventListener('keydown',down);removeEventListener('keyup',up)}}
home();
