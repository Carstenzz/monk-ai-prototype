if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};

const cv=document.getElementById('c'),g=cv.getContext('2d'),ov=document.getElementById('ov');
const W=390,H=800,N=5,TY=64,TH=100,CX=190,dpr=Math.min(devicePixelRatio||1,2);
cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0);
const rowY=p=>TY+p*TH+TH/2,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>performance.now();
const DESC={push:'PUSH: dorong musuh di depanmu 1 tile ke belakang',pull:'PULL: tarik musuh terdekat di depan ke tile tepat di depanmu',swap:'SWAP: tukar posisi dengan musuh tepat di depan',twist:'TWIST: balik arah hadap musuh tepat di depan',throw:'THROW: lempar musuh tepat di belakang ke depanmu'};
const HINT='Swipe ↕ gerak · ↔ putar · drag kartu ↑ pakai · ↓ buang semua';
let cd=-1,hooks=[],ents,ghosts,fx,deck,disc,hand,kills,turn,busy,over,msg,drag,swipe,shk=0,loaded=0,tot=0;
(function ld(o){for(const k in o){const v=o[k];if(v&&v.src){tot++;const i=new Image();i.onload=()=>{if(++loaded===tot)newGame()};i.src=v.src;v.im=i}else if(v&&typeof v==='object')ld(v)}})(A);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const at=p=>ents.find(e=>e.alive&&e.pos===p),pl=()=>ents[0],foes=()=>ents.filter(e=>e.alive&&e!==ents[0]);
const inb=q=>q>=0&&q<N;
function draw1(){if(!deck.length){deck=shuffle(disc);disc=[]}return deck.pop()}
function newGame(){
 ents=[{t:'monk',pos:2,face:1,alive:1,vy:rowY(2)}];ghosts=[];fx=[];turn=1;busy=false;over=0;drag=swipe=null;msg=HINT;
 kills=0;cd=-1;hooks=[];
 deck=shuffle(['push','pull','swap','twist','throw','push','pull','swap','twist','throw']);disc=[];hand=[draw1(),draw1(),draw1()];
 for(let i=0;i<3;i++){const em=empties();spawn(em[Math.random()*em.length|0])}fixArchers();foes().forEach(e=>e.intent=plan(e));
}
const hookAt=q=>hooks.some(h=>h.pos===q);
const empties=()=>[0,1,2,3,4].filter(p=>!at(p)&&!hookAt(p));
function spawn(pos,vx){if(pos===undefined)return;ents.push({t:['sword','archer','thrower'][Math.random()*3|0],pos,face:Math.random()<.5?1:-1,alive:1,windup:0,vy:rowY(pos),vx:vx||0})}
function archerHasCover(e){const p=pl().pos,d=Math.sign(p-e.pos);return ents.some(o=>o.alive&&o!==e&&o!==ents[0]&&Math.sign(o.pos-e.pos)===d&&Math.abs(o.pos-e.pos)<Math.abs(p-e.pos))}
function fixArchers(){ents.forEach(e=>{if(e.alive&&e.t==='archer'&&!archerHasCover(e))e.t=Math.random()<.5?'sword':'thrower'})}
function throwHooks(n){const em=shuffle(empties());for(let i=0;i<Math.min(n,em.length);i++)hooks.push({pos:em[i],t0:now()})}
async function climb(){const hs=hooks.slice(),nw=hs.map(h=>{spawn(h.pos,190);return ents[ents.length-1]});fixArchers();await sleep(650);
 hs.forEach((h,i)=>{const o=ents.find(e=>e.alive&&e!==nw[i]&&e.pos===h.pos);if(o){kill(o,1);kill(nw[i],1)}});hooks=[]}
function tgt(e,pos,face){const o=q=>{const x=at(q);return x===e?undefined:x};
 if(e.t==='sword')return o(pos+face);
 if(e.t==='archer'){for(let q=pos+face;inb(q);q+=face)if(o(q))return o(q);return}
 return o(pos+2*face)}
// Prioritas: 1) hadap player 2) posisi 3) ready weapon 4) reposisi (tanpa friendly fire sengaja) 5) attack
function plan(e){
 const p=pl(),d=Math.sign(p.pos-e.pos),dist=Math.abs(p.pos-e.pos),free=q=>inb(q)&&!at(q)&&!hookAt(q);
 const mv=x=>({k:'move',d:x}),W={k:'wait'};
 if(e.t==='thrower'&&!e.windup)return{k:'ancang'};
 if(e.face!==d)return{k:'turn'};
 const hitP=tgt(e,e.pos,e.face)===p;
 if(e.windup&&hitP)return{k:'attack'};
 let inPos=false;
 if(e.t==='sword'){if(dist>1)return free(e.pos+d)?mv(d):W;inPos=true}
 else if(e.t==='thrower'){if(dist>2)return free(e.pos+d)?mv(d):W;if(dist===1&&free(e.pos-d))return mv(-d);inPos=dist===2}
 else{if(!hitP&&free(e.pos-d))return mv(-d);inPos=true}
 if(inPos&&!e.windup&&hitP)return{k:'ancang'};
 for(const dd of[d,-d]){const q=e.pos+dd;if(free(q)&&tgt(e,q,e.face)===p)return mv(dd)}
 return W;
}
const addfx=(dur,fn)=>fx.push({t0:now(),dur,fn});
function kill(o,fall){if(o!==ents[0])kills++;o.alive=false;ghosts.push({e:o,t0:now(),fall:fall||0});const y=o.vy;addfx(380,k=>{g.strokeStyle='#d33';g.lineWidth=3;g.globalAlpha=1-k;g.beginPath();g.arc(CX,y,20+k*40,0,7);g.stroke();g.globalAlpha=1})}
function targets(e){const f=e.face;if(e.t==='sword')return[e.pos+f];
 if(e.t==='archer'){for(let q=e.pos+f;inb(q);q+=f)if(at(q))return[q];return[]}return[e.pos+2*f]}
async function doAttack(e){
 const T=targets(e),y0=rowY(e.pos),f=e.face;e.atk=1;
 if(e.t==='sword'){const y=rowY(e.pos+f);addfx(350,k=>{g.strokeStyle='#111';g.lineWidth=5;g.globalAlpha=1-k;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(CX-50,y-30+i*18);g.lineTo(CX+50,y+30+i*18);g.stroke()}g.globalAlpha=1})}
 else if(e.t==='archer'){const y1=T.length?rowY(T[0]):(f>0?TY+N*TH:TY);addfx(350,k=>{g.strokeStyle='#111';g.lineWidth=4;g.globalAlpha=1-k*.6;const yy=y0+(y1-y0)*Math.min(1,k*2.5);g.beginPath();g.moveTo(CX,y0+f*20);g.lineTo(CX,yy);g.stroke();g.globalAlpha=1})}
 else{const y1=rowY(e.pos+2*f);addfx(420,k=>{const y=y0+(y1-y0)*k,r=9+Math.sin(k*Math.PI)*8;g.fillStyle='#111';g.beginPath();g.arc(CX,y,r,0,7);g.fill()})}
 await sleep(420);T.forEach(q=>{const o=at(q);if(o)kill(o)});e.atk=0;await sleep(250);
}
async function enemyPhase(){
 msg='Giliran musuh…';
 let acted=0;
 for(const e of foes().sort((a,b)=>a.pos-b.pos)){
  if(!e.alive)continue;const it=e.intent||{k:'wait'};if(it.k!=='wait'){if(acted)await sleep(300);acted=1}e.act=1;await sleep(100);
  if(it.k==='move'){const q=e.pos+it.d;if(inb(q)&&!at(q)&&!hookAt(q)){e.pos=q;await sleep(300)}}
  else if(it.k==='turn'){e.face*=-1;await sleep(250)}
  else if(it.k==='ancang'){e.windup=1;await sleep(250)}
  else if(it.k==='attack'){e.windup=0;await doAttack(e)}
  e.act=0;if(!pl().alive)break;
 }
 if(!pl().alive)return end();
 if(hooks.length){await climb();if(!pl().alive)return end()}
 else{
  if(foes().length<=1&&cd<0)cd=2;
  if(cd>=0){if(foes().length===0||cd===0){throwHooks(1+(Math.random()*2|0));cd=-1}else cd--}
 }
 foes().forEach(e=>e.intent=plan(e));
 turn++;msg=HINT;busy=false;
}
function end(){over=1;setTimeout(()=>show('Biksu gugur…','Bertahan '+turn+' giliran, '+kills+' musuh dikalahkan.',[['Main lagi',newGame]]),600)}
async function act(fn){
 if(busy||over)return;busy=true;const ok=await fn();
 if(!ok){busy=false;return}

 msg='Giliran musuh…';await sleep(500);
 await enemyPhase();
}
const bad=m=>{msg=m;shk=now();return false};
const doMove=d=>async()=>{const q=pl().pos+d;if(!inb(q))return bad('Tepi tile! Biksu bisa jatuh.');if(at(q)||hookAt(q))return bad('Tile terhalang.');pl().pos=q;await sleep(280);return true};
const doTurn=async()=>{pl().face*=-1;await sleep(220);return true};
const discardAll=async()=>{disc.push(...hand);hand=[draw1(),draw1(),draw1()];await sleep(300);return true};
const useCard=i=>async()=>{
 const c=hand[i],p=pl(),f=p.face,P=p.pos;
 const scan=s=>{for(let q=P+s;inb(q);q+=s)if(at(q))return at(q)};
 const front=scan(f),back=scan(-f);let e;
 if(c==='push'){e=at(P+f);if(!e)return bad('Tidak ada musuh tepat di depan.');const q=P+2*f;
  if(!inb(q)){kill(e,f)}else if(at(q)){const o=at(q);e.pos=q;e.vy=rowY(q);kill(o);kill(e)}else e.pos=q}
 else if(c==='pull'){e=front;if(!e)return bad('Tidak ada musuh di depan.');if(Math.abs(e.pos-P)===1)return bad('Musuh sudah tepat di depanmu.');e.pos=P+f}
 else if(c==='swap'){e=at(P+f);if(!e)return bad('Tidak ada musuh tepat di depan.');[p.pos,e.pos]=[e.pos,p.pos]}
 else if(c==='twist'){e=at(P+f);if(!e)return bad('Tidak ada musuh tepat di depan.');e.face*=-1}
 else{e=at(P-f);if(!e)return bad('Tidak ada musuh tepat di belakang.');const q=P+f;
  if(!inb(q)){kill(e,f)}else if(at(q)){const o=at(q);e.pos=q;e.vy=rowY(q);kill(o);kill(e)}else e.pos=q}
 disc.push(c);hand[i]=draw1();await sleep(450);return true;
};
function show(t,b,btns){ov.innerHTML='<h2>'+t+'</h2><div>'+b+'</div>';btns.forEach(([l,f])=>{const x=document.createElement('button');x.textContent=l;x.onclick=()=>{ov.style.display='none';f()};ov.appendChild(x)});ov.style.display='flex'}
const RULES='Mode endless: bertahan selama mungkin. Saat musuh tersisa 1 (atau 0), tali grapple muncul 1–2 giliran sebelum musuh baru memanjat masuk dari kanan. Tile bertali terhalang; jika kartu menaruh musuh di sana, pendatang dan musuh itu jatuh bersama. Jatuh dari ujung tile = mati.<br>1 aksi per giliran: gerak (swipe ↑↓), putar (swipe ←→), pakai 1 kartu (drag ke atas), atau buang semua kartu (drag ke bawah).<br>Ikon di kanan = intensi musuh. Area merah menunjukkan tile yang akan terkena serangan. Pemanah baru bersiap jika biksu terlihat tanpa musuh yang menutupi. Push/throw yang menabrak musuh lain membunuh keduanya.';
const slotX=i=>CX+(i-1)*104-44,CT=588,CW=88,CH=135;
const P=ev=>{const r=cv.getBoundingClientRect();return{x:(ev.clientX-r.left)*W/r.width,y:(ev.clientY-r.top)*H/r.height}};
cv.addEventListener('pointerdown',ev=>{const p=P(ev);if(over)return;
 if(p.x<70&&p.y<60){show('Jeda',RULES,[['Lanjut',()=>{}],['Ulang',newGame]]);return}
 if(busy)return;
 if(p.y>=CT&&p.y<=CT+CH){for(let i=0;i<3;i++)if(p.x>=slotX(i)&&p.x<=slotX(i)+CW){drag={i,x:p.x,y:p.y,ox:p.x-slotX(i),oy:p.y-CT}}}
 else if(p.y<575)swipe=p;
});
addEventListener('pointermove',ev=>{if(drag){const p=P(ev);drag.x=p.x;drag.y=p.y}});
addEventListener('pointerup',ev=>{const p=P(ev);
 if(drag){const i=drag.i;drag=null;if(p.y<560)act(useCard(i));else if(p.y>728)act(discardAll)}
 else if(swipe){const dx=p.x-swipe.x,dy=p.y-swipe.y;swipe=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))>28){if(Math.abs(dy)>Math.abs(dx))act(doMove(dy>0?1:-1));else act(doTurn)}}
});
addEventListener('keydown',e=>{const k=e.key;
 if(k==='ArrowUp')act(doMove(-1));else if(k==='ArrowDown')act(doMove(1));else if(k==='ArrowLeft'||k==='ArrowRight')act(doTurn);
 else if(k>='1'&&k<='3')act(useCard(k-1));else if(k==='d'||k==='D')act(discardAll)});
function sprite(e){const s=A.sp[e.t],f=e.face>0?'down':'up';return e.t==='monk'?s[f]:((e.windup||e.atk)?s.act:s.idle)[f]}
function tri(x,y,dir,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y+dir*8);g.lineTo(x-8,y-dir*3);g.lineTo(x+8,y-dir*3);g.fill()}
function intentKey(e){const it=e.intent;if(!it)return null;const w={sword:'sword',archer:'arrow',thrower:'throw'}[e.t];
 return it.k==='move'?(it.d>0?'down':'up'):it.k==='turn'?'turn':it.k==='ancang'?w:it.k==='attack'?w+'B':null}
function drawHook(h,t){
 const k=Math.min(1,(t-h.t0)/450),ez=1-Math.pow(1-k,3),hx=W+30+(262-W-30)*ez,y=rowY(h.pos);
 g.fillStyle='rgba(0,0,0,.06)';g.fillRect(105,y-TH/2,170,TH);
 g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.moveTo(W+10,y-80);g.quadraticCurveTo((W+hx)/2,y-60+(1-ez)*-40,hx+18,y);g.stroke();
 g.lineWidth=3.5;g.beginPath();g.moveTo(hx+22,y);g.lineTo(hx,y);g.moveTo(hx+14,y-12);g.lineTo(hx,y);g.lineTo(hx+14,y+12);g.stroke();
}
function warn(e){
 const f=e.face,R='rgba(225,60,60,.9)';g.save();g.strokeStyle=R;g.fillStyle=R;
 if(e.t==='sword'){const q=e.pos+f;if(inb(q)){const y=TY+q*TH;g.beginPath();g.rect(105,y,170,TH);g.clip();g.fillStyle='rgba(225,60,60,.14)';g.fillRect(105,y,170,TH);g.lineWidth=3;
  for(let i=-TH;i<170;i+=16){g.beginPath();g.moveTo(105+i,y+TH);g.lineTo(105+i+TH,y);g.stroke()}}}
 else if(e.t==='archer'){const T=targets(e);for(let q=e.pos+f;inb(q);q+=f){for(let k=-1;k<=1;k++){g.beginPath();g.arc(CX,rowY(q)+k*28,4.5,0,7);g.fill()}if(T.length&&q===T[0])break}}
 else{const q=e.pos+2*f;if(inb(q)){const y=rowY(q);g.lineWidth=3;g.beginPath();g.arc(CX,y,15,0,7);g.stroke();g.beginPath();g.arc(CX,y,3,0,7);g.fill();
  g.beginPath();[[-1,0],[1,0],[0,-1],[0,1]].forEach(([a,b])=>{g.moveTo(CX+a*10,y+b*10);g.lineTo(CX+a*26,y+b*26)});g.stroke()}}
 g.restore();
}
const clouds=[[40,170,30],[335,130,26],[38,380,34],[350,430,30],[48,540,28],[345,520,34]];
function draw(){
 const t=now();g.clearRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(0,0,W,H);
 g.strokeStyle='#111';g.lineWidth=1.5;clouds.forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,Math.PI*1.05,Math.PI*1.95);g.stroke();g.beginPath();g.arc(x+r*.7,y+4,r*.7,Math.PI*1.1,Math.PI*1.9);g.stroke()});
 // board
 const ps=drag&&drag.y<560;
 g.setLineDash([9,7]);g.lineWidth=2.5;g.strokeStyle=ps?'#2a9d4a':'#111';g.beginPath();g.roundRect(90,TY-16,200,N*TH+32,26);g.stroke();g.setLineDash([]);
 g.lineWidth=2.5;g.strokeStyle='#111';for(let p=0;p<N;p++){g.fillStyle='#fff';g.fillRect(105,TY+p*TH,170,TH);g.strokeRect(105,TY+p*TH,170,TH)}
 g.strokeStyle='#d33';g.setLineDash([6,5]);g.lineWidth=3;[TY-2,TY+N*TH+2].forEach(y=>{g.beginPath();g.moveTo(100,y);g.lineTo(280,y);g.stroke()});g.setLineDash([]);
 // pause + hud
 g.strokeStyle='#111';g.lineWidth=2.5;g.strokeRect(14,12,24,30);g.beginPath();g.moveTo(22,18);g.lineTo(22,36);g.moveTo(30,18);g.lineTo(30,36);g.stroke();
 g.fillStyle='#111';g.textAlign='center';g.font='15px "Segoe Print","Comic Sans MS",cursive';
 g.fillText('Giliran '+turn+' · Kill: '+kills+' · Musuh: '+foes().length+(hooks.length?' · Spawn: 1':cd>=0?' · Spawn: '+(cd+1):''),CX+14,26);
 g.font='11px "Segoe Print","Comic Sans MS",cursive';g.fillStyle='#444';g.fillText(drag?DESC[hand[drag.i]]:msg,CX,48);
 hooks.forEach(h=>drawHook(h,t));
 foes().forEach(e=>{if(e.intent&&e.intent.k==='attack')warn(e)});
 // entities
 const sh=now()-shk<300?Math.sin(now()*.08)*5:0;
 [...ents.filter(e=>e.alive)].sort((a,b)=>a.vy-b.vy).forEach(e=>{
  const im=sprite(e),h=A.H[e.t],w=h*im.ar;let ox=0,oy=0;
  if(e.act){g.fillStyle='rgba(255,215,0,.35)';g.fillRect(105,e.vy-TH/2,170,TH)}
  if(e.intent&&e.intent.k==='attack')ox=Math.sin(t*.05)*2.5;if(e.atk)oy=e.face*14;
  if(e===pl())ox+=sh;
  g.drawImage(im.im,CX-w/2+ox+(e.vx||0),e.vy+40-h+oy,w,h);
  if(e!==pl()){const k=intentKey(e);const ic=k&&A.int[k];const ih=56,iw=ic?ih*ic.ar:44;
   if(ic)g.drawImage(ic.im,284,e.vy-ih/2,iw,ih);
   else{g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;g.fillRect(284,e.vy-28,44,56);g.strokeRect(284,e.vy-28,44,56);g.fillStyle='#111';g.font='18px sans-serif';g.fillText('…',306,e.vy+6)}}
 });
 ghosts=ghosts.filter(o=>t-o.t0<700);
 ghosts.forEach(o=>{const k=(t-o.t0)/700,e=o.e,im=sprite(e),h=A.H[e.t]*(1-k*.3*(o.fall?1:0)),w=h*im.ar;
  g.globalAlpha=1-k;g.drawImage(im.im,CX-w/2,e.vy+40-h+o.fall*k*130,w,h);g.globalAlpha=1});
 fx=fx.filter(f=>t-f.t0<f.dur);fx.forEach(f=>f.fn((t-f.t0)/f.dur));
 // hand area
 g.strokeStyle='#111';g.lineWidth=2.5;g.beginPath();g.moveTo(0,574);g.lineTo(W,574);g.stroke();
 hand.forEach((c,i)=>{if(drag&&drag.i===i){g.setLineDash([5,5]);g.lineWidth=1.5;g.strokeRect(slotX(i),CT,CW,CH);g.setLineDash([]);return}
  const im=A.cards[c];g.globalAlpha=busy?.55:1;g.drawImage(im.im,slotX(i),CT,CW,CH);g.globalAlpha=1});
 // discard zone
 const dz=drag&&drag.y>728;g.strokeStyle='#e5645b';g.fillStyle=dz?'rgba(229,100,91,.25)':'rgba(0,0,0,0)';
 g.lineWidth=dz?4:3;g.beginPath();g.moveTo(130,H);for(let i=0;i<=26;i++){const a=Math.PI+i/26*Math.PI,r=i%2?62:70;g.lineTo(CX+Math.cos(a)*r*1.6,H+Math.sin(a)*r*.9*(i?1:0)+(i?0:0))}g.lineTo(250,H);g.fill();g.stroke();
 g.fillStyle='#e5645b';g.font='11px "Segoe Print","Comic Sans MS",cursive';g.fillText('buang semua',CX,H-26);
 if(drag){const im=A.cards[hand[drag.i]];g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=14;g.drawImage(im.im,drag.x-drag.ox*1.1,drag.y-drag.oy*1.1,CW*1.1,CH*1.1);g.restore()}
}
(function loop(){if(ents){for(const e of ents)if(e.alive){e.vy+=(rowY(e.pos)-e.vy)*.25;e.vx=(e.vx||0)*.88}draw()}requestAnimationFrame(loop)})();
