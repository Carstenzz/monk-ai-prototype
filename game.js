if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};

const cv=document.getElementById('c'),g=cv.getContext('2d'),ov=document.getElementById('ov');
// Arena: COLS x ROWS tiles (3 lebar x 5 tinggi). Arah: 0 atas, 1 kanan, 2 bawah, 3 kiri
const W=390,H=800,COLS=3,ROWS=5,TW=100,TH=100,BX=45,TY=64,dpr=Math.min(devicePixelRatio||1,2);
const DIR=[{dc:0,dr:-1,n:'up'},{dc:1,dr:0,n:'right'},{dc:0,dr:1,n:'down'},{dc:-1,dr:0,n:'left'}];
cv.width=W*dpr;cv.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0);
const px=c=>BX+c*TW+TW/2,py=r=>TY+r*TH+TH/2,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=()=>performance.now();
const DESC={push:'PUSH: dorong musuh di tile depanmu 1 tile menjauh',pull:'PULL: tarik musuh pertama di garis depanmu ke tile depanmu',swap:'SWAP: tukar posisi dengan musuh di tile depanmu',twist:'TWIST: balik arah hadap (180°) musuh di tile depanmu',throw:'THROW: lempar musuh di belakangmu ke tile depanmu'};
const COOLDOWN=4,CARDS=['pull','swap','push','twist','throw'];
const HINT='Swipe = jalan · tap biksu lalu tile = putar · drag kartu ↑ pakai';
let cd=-1,hooks=[],ents,ghosts,fx,cds,usedCard,kills,turn,busy,over,msg,drag,swipe,shk=0,loaded=0,tot=0,turnMode=false;
(function ld(o){for(const k in o){const v=o[k];if(v&&v.src){tot++;const i=new Image();i.onload=()=>{if(++loaded===tot)newGame()};i.src=v.src;v.im=i}else if(v&&typeof v==='object')ld(v)}})(A);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const inb=(c,r)=>c>=0&&c<COLS&&r>=0&&r<ROWS;
const at=(c,r)=>ents.find(e=>e.alive&&e.c===c&&e.r===r),pl=()=>ents[0],foes=()=>ents.filter(e=>e.alive&&e!==ents[0]);
const hookAt=(c,r)=>hooks.some(h=>h.c===c&&h.r===r);
const front=(e,n=1)=>[e.c+DIR[e.f].dc*n,e.r+DIR[e.f].dr*n],back=(e,n=1)=>[e.c-DIR[e.f].dc*n,e.r-DIR[e.f].dr*n];
function newGame(){
 ents=[{t:'monk',c:1,r:2,f:0,alive:1,gx:px(1),gy:py(2)}];ghosts=[];fx=[];turn=1;busy=false;over=0;drag=swipe=null;turnMode=false;msg=HINT;
 kills=0;cd=-1;hooks=[];
 cds=CARDS.map(()=>0);usedCard=-1;
 pickTiles(WAVE()).forEach(([c,r])=>mk(c,r));assignTypes(foes());foes().forEach(e=>e.intent=plan(e));
}
const empties=()=>{const o=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!at(c,r)&&!hookAt(c,r))o.push([c,r]);return o};
function mk(c,r,vx){const e={t:'sword',c,r,f:Math.random()*4|0,alive:1,windup:0,gx:px(c),gy:py(r),vx:vx||0};ents.push(e);return e}
function assignTypes(list){let th=ents.filter(o=>o.alive&&o.t==='thrower'&&!list.includes(o)).length;
 list.forEach(e=>{const x=Math.random();if(x<.3)e.t='archer';else if(x<.5&&!th){e.t='thrower';th++}else e.t='sword'})}
const WAVE=()=>4+(Math.random()*2|0); // jumlah musuh per gelombang: 4-5
const pickTiles=n=>shuffle(empties()).slice(0,n);
function throwHooks(n){pickTiles(n).forEach(([c,r])=>hooks.push({c,r,t0:now()}))}
async function climb(){if(!foes().length&&hooks.length<4)throwHooks(WAVE()-hooks.length);
 const hs=hooks.slice(),nw=hs.map(h=>mk(h.c,h.r,190));assignTypes(nw);await sleep(650);
 hs.forEach((h,i)=>{const o=ents.find(e=>e.alive&&e!==nw[i]&&e.c===h.c&&e.r===h.r);if(o){kill(o,-1);kill(nw[i],-1)}});hooks=[]}
// target entity jika e berdiri di (c,r) menghadap f
function tgt(e,c,r,f){const o=(a,b)=>{const x=at(a,b);return x===e?undefined:x},d=DIR[f];
 if(e.t==='sword')return o(c+d.dc,r+d.dr);
 if(e.t==='archer'){for(let a=c+d.dc,b=r+d.dr;inb(a,b);a+=d.dc,b+=d.dr){const x=o(a,b);if(x)return x}return}
 return o(c+2*d.dc,r+2*d.dr)}
// Prioritas: thrower ancang dulu -> kalau sudah kena player: ancang/attack -> kalau belum: BFS (sama seperti player: jalan 1 tile ke arah mana pun tanpa mengubah hadap, atau putar ke arah mana pun) ke posisi+arah yang mengenai player
function plan(e){
 const p=pl();if(e.t==='thrower'&&!e.windup)return{k:'ancang'};
 const hits=(c,r,f)=>tgt(e,c,r,f)===p;
 if(hits(e.c,e.r,e.f))return e.windup?{k:'attack'}:{k:'ancang'};
 const free=(c,r)=>{const o=at(c,r);return inb(c,r)&&(!o||o===e)&&!hookAt(c,r)},dist=(c,r)=>Math.abs(c-p.c)+Math.abs(r-p.r);
 for(const strict of e.t==='archer'?[1,0]:[0]){ // archer lebih suka menembak dari jarak >=2
  const goal=(c,r,f)=>hits(c,r,f)&&(!strict||dist(c,r)>=2),key=(c,r,f)=>(c*8+r)*4+f,seen=new Set([key(e.c,e.r,e.f)]);
  let q=[{c:e.c,r:e.r,f:e.f,first:null}];
  while(q.length){const nx=[];
   for(const s of q){const opts=[];
    for(let d=0;d<4;d++){const c=s.c+DIR[d].dc,r=s.r+DIR[d].dr;if(free(c,r))opts.push({c,r,f:s.f,a:{k:'move',d}})}
    for(let d=0;d<4;d++)if(d!==s.f)opts.push({c:s.c,r:s.r,f:d,a:{k:'turn',d}});
    for(const o of opts){const kk=key(o.c,o.r,o.f);if(seen.has(kk))continue;seen.add(kk);const first=s.first||o.a;
     if(goal(o.c,o.r,o.f))return first;nx.push({c:o.c,r:o.r,f:o.f,first})}}
   q=nx}
 }
 return{k:'wait'};
}
const addfx=(dur,fn)=>fx.push({t0:now(),dur,fn});
function kill(o,fall){if(o!==ents[0])kills++;o.alive=false;ghosts.push({e:o,t0:now(),fall:fall==null?-1:fall});const x=o.gx,y=o.gy;addfx(380,k=>{g.strokeStyle='#d33';g.lineWidth=3;g.globalAlpha=1-k;g.beginPath();g.arc(x,y,20+k*40,0,7);g.stroke();g.globalAlpha=1})}
function targets(e){const d=DIR[e.f];
 if(e.t==='sword')return[front(e)];
 if(e.t==='archer'){for(let a=e.c+d.dc,b=e.r+d.dr;inb(a,b);a+=d.dc,b+=d.dr)if(at(a,b))return[[a,b]];return[]}
 return[front(e,2)]}
function rayEnd(e){const d=DIR[e.f];let a=e.c,b=e.r;while(inb(a+d.dc,b+d.dr)){a+=d.dc;b+=d.dr}return[px(a)+d.dc*TW/2,py(b)+d.dr*TH/2]}
async function doAttack(e){
 const T=targets(e),d=DIR[e.f],x0=e.gx,y0=e.gy;e.atk=1;
 if(e.t==='sword'){const[c,r]=front(e),x=px(c),y=py(r);addfx(350,k=>{g.strokeStyle='#111';g.lineWidth=5;g.globalAlpha=1-k;for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(x-40,y-30+i*18);g.lineTo(x+40,y+30+i*18);g.stroke()}g.globalAlpha=1})}
 else if(e.t==='archer'){const[x1,y1]=T.length?[px(T[0][0]),py(T[0][1])]:rayEnd(e);addfx(350,k=>{g.strokeStyle='#111';g.lineWidth=4;g.globalAlpha=1-k*.6;const m=Math.min(1,k*2.5),xx=x0+(x1-x0)*m,yy=y0+(y1-y0)*m;g.beginPath();g.moveTo(x0+d.dc*20,y0+d.dr*20);g.lineTo(xx,yy);g.stroke();g.globalAlpha=1})}
 else{const[c,r]=front(e,2),x1=px(c),y1=py(r);addfx(420,k=>{const x=x0+(x1-x0)*k,y=y0+(y1-y0)*k-Math.sin(k*Math.PI)*34,rr=9+Math.sin(k*Math.PI)*8;g.fillStyle='#111';g.beginPath();g.arc(x,y,rr,0,7);g.fill()})}
 await sleep(420);T.forEach(([c,r])=>{const o=at(c,r);if(o)kill(o)});e.atk=0;await sleep(250);
}
async function enemyPhase(){
 msg='Giliran musuh…';let acted=0;
 for(const e of foes().sort((a,b)=>a.r-b.r||a.c-b.c)){
  if(!e.alive)continue;const it=e.intent||{k:'wait'};if(it.k!=='wait'){if(acted)await sleep(300);acted=1}e.act=1;await sleep(100);
  if(it.k==='move'){const c=e.c+DIR[it.d].dc,r=e.r+DIR[it.d].dr;if(inb(c,r)&&!at(c,r)&&!hookAt(c,r)){e.c=c;e.r=r;await sleep(300)}}
  else if(it.k==='turn'){e.f=it.d;await sleep(250)}
  else if(it.k==='ancang'){e.windup=1;await sleep(250)}
  else if(it.k==='attack'){e.windup=0;await doAttack(e)}
  e.act=0;if(!pl().alive)break;
 }
 if(!pl().alive)return end();
 if(hooks.length){await climb();if(!pl().alive)return end()}
 else{
  if(foes().length===0){throwHooks(WAVE());cd=-1}
  else{if(foes().length<=2&&cd<0)cd=2;
  if(cd>=0){if(cd===0){throwHooks(WAVE());cd=-1}else cd--}}
 }
 foes().forEach(e=>e.intent=plan(e));
 cds=cds.map((v,i)=>i===usedCard?v:Math.max(0,v-1));usedCard=-1;
 turn++;msg=HINT;busy=false;
}
function end(){over=1;setTimeout(()=>show('Biksu gugur…','Bertahan '+turn+' giliran, '+kills+' musuh dikalahkan.',[['Main lagi',newGame]]),600)}
async function act(fn){
 if(busy||over)return;turnMode=false;busy=true;const ok=await fn();
 if(!ok){busy=false;return}
 msg='Giliran musuh…';await sleep(500);
 await enemyPhase();
}
const bad=m=>{msg=m;shk=now();return false};
// swipe/arrow = jalan 1 tile ke arah itu, arah hadap TIDAK berubah
const doMove=d=>async()=>{const p=pl(),c=p.c+DIR[d].dc,r=p.r+DIR[d].dr;
 if(!inb(c,r))return bad('Tepi arena! Biksu bisa jatuh.');if(at(c,r))return bad('Tile terhalang.');
 p.c=c;p.r=r;await sleep(280);return true};
// tap biksu lalu tap tile (satu baris/kolom dengannya) = putar hadap ke arah itu (1 aksi)
const doFace=d=>async()=>{const p=pl();if(d===p.f)return bad('Sudah menghadap ke sana.');p.f=d;await sleep(220);return true};
const BR=BX+COLS*TW,BB=TY+ROWS*TH,tileAt=q=>({c:Math.floor((q.x-BX)/TW),r:Math.floor((q.y-TY)/TH)});
const edgeOK=d=>{const p=pl();return d===0?p.r===0:d===1?p.c===COLS-1:d===2?p.r===ROWS-1:p.c===0};
function tapDir(q){const p=pl(),c=Math.floor((q.x-BX)/TW),r=Math.floor((q.y-TY)/TH);
 if(inb(c,r)){if(Math.abs(c-p.c)+Math.abs(r-p.r)!==1)return -1;return c>p.c?1:c<p.c?3:r>p.r?2:0}
 const d=q.x<BX?3:q.x>=BR?1:q.y<TY?0:2;return edgeOK(d)?d:-1}
function tap(q){const{c,r}=tileAt(q),p=pl();
 if(turnMode){const d=tapDir(q);turnMode=false;if(d>=0)act(doFace(d));return}
 if(c===p.c&&r===p.r){turnMode=true;msg='Tap tile di sebelahnya (atau area luar di tepi) · tap biksu = batal'}}
const doWait=async()=>{msg='Menunggu…';await sleep(250);return true};
const lineFirst=(e,s)=>{const d=DIR[e.f];for(let a=e.c+d.dc*s,b=e.r+d.dr*s;inb(a,b);a+=d.dc*s,b+=d.dr*s)if(at(a,b))return at(a,b)};
function cardTiles(c){const p=pl();
 if(c==='pull'){const e=lineFirst(p,1);return e&&Math.abs(e.c-p.c)+Math.abs(e.r-p.r)>1?[[e.c,e.r]]:[]}
 return[c==='throw'?back(p):front(p)].filter(([a,b])=>inb(a,b))}
const useCard=i=>async()=>{
 if(cds[i]>0)return bad('Kartu masih cooldown ('+cds[i]+' giliran).');
 const c=CARDS[i],p=pl(),d=DIR[p.f],[fc,fr]=front(p);let e;
 const shove=(e,q,dir)=>{const[qc,qr]=q;if(!inb(qc,qr)){kill(e,dir)}else if(at(qc,qr)){const o=at(qc,qr);e.c=qc;e.r=qr;e.gx=px(qc);e.gy=py(qr);kill(o);kill(e)}else{e.c=qc;e.r=qr}};
 if(c==='push'){e=at(fc,fr);if(!e)return bad('Tidak ada musuh tepat di depan.');shove(e,front(p,2),p.f)}
 else if(c==='pull'){e=lineFirst(p,1);if(!e)return bad('Tidak ada musuh di garis depan.');if(Math.abs(e.c-p.c)+Math.abs(e.r-p.r)===1)return bad('Musuh sudah tepat di depanmu.');e.c=fc;e.r=fr}
 else if(c==='swap'){e=at(fc,fr);if(!e)return bad('Tidak ada musuh tepat di depan.');[p.c,e.c]=[e.c,p.c];[p.r,e.r]=[e.r,p.r]}
 else if(c==='twist'){e=at(fc,fr);if(!e)return bad('Tidak ada musuh tepat di depan.');e.f=(e.f+2)%4}
 else{e=at(...back(p));if(!e)return bad('Tidak ada musuh tepat di belakang.');shove(e,[fc,fr],p.f)}
 cds[i]=COOLDOWN;usedCard=i;await sleep(450);return true;
};
function show(t,b,btns){ov.innerHTML='<h2>'+t+'</h2><div>'+b+'</div>';btns.forEach(([l,f])=>{const x=document.createElement('button');x.textContent=l;x.onclick=()=>{ov.style.display='none';f()};ov.appendChild(x)});ov.style.display='flex'}
const RULES='Mode endless di arena 3×5. Saat musuh tersisa 0–2, cooldown 2 giliran dimulai lalu 4–5 musuh baru muncul acak (langsung jika arena kosong). Jatuh dari tepi arena = mati.<br>1 aksi per giliran: swipe ↑↓←→ = jalan 1 tile (arah hadap tidak berubah); putar hadap = tap biksu lalu tap salah satu dari 4 tile di sebelahnya (di tepi/sudut arena juga bisa menghadap ke luar arena); pakai 1 dari 5 kartu tetap (drag kartu ke atas ke arena; tiap kartu cooldown 4 giliran setelah dipakai, gerak/putar/tunggu tidak kena cooldown); atau tunggu 1 giliran (tombol bawah).<br>Ikon di pojok tile musuh = intensi berikutnya (panah = jalan ke arah itu (hadap tetap), panah+lengkung = putar, senjata = ancang, senjata+garis = menyerang; area serangan merah ditampilkan saat akan menyerang). Musuh bergerak seperti player: jalan ke arah mana pun tanpa mengubah hadap. Sword kena 1 tile depan, archer kena musuh/orang pertama di garis depan, thrower kena tile ke-2 di depan. Push/throw yang menabrak musuh lain membunuh keduanya.';
const slotX=i=>14+i*74,CT=590,CW=66,CH=102,WB={x:110,y:712,w:170,h:56};
const P=ev=>{const r=cv.getBoundingClientRect();return{x:(ev.clientX-r.left)*W/r.width,y:(ev.clientY-r.top)*H/r.height}};
cv.addEventListener('pointerdown',ev=>{const p=P(ev);if(over)return;
 if(!turnMode&&p.x<46&&p.y<60){show('Jeda',RULES,[['Lanjut',()=>{}],['Ulang',newGame]]);return}
 if(busy)return;
 if(p.y>=CT&&p.y<=CT+CH){for(let i=0;i<CARDS.length;i++)if(cds[i]===0&&p.x>=slotX(i)&&p.x<=slotX(i)+CW){drag={i,x:p.x,y:p.y,ox:p.x-slotX(i),oy:p.y-CT}}}
 else if(p.x>=WB.x&&p.x<=WB.x+WB.w&&p.y>=WB.y&&p.y<=WB.y+WB.h)act(doWait);
 else if(p.y<CT-2)swipe=p;
});
addEventListener('pointermove',ev=>{if(drag){const p=P(ev);drag.x=p.x;drag.y=p.y}});
addEventListener('pointerup',ev=>{const p=P(ev);
 if(drag){const i=drag.i;drag=null;if(p.y<560)act(useCard(i))}
 else if(swipe){const dx=p.x-swipe.x,dy=p.y-swipe.y;swipe=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))>28)act(doMove(Math.abs(dy)>Math.abs(dx)?(dy>0?2:0):(dx>0?1:3)));else tap(p)}
});
addEventListener('keydown',e=>{const k=e.key,m={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
 if(k in m){e.preventDefault();act(e.shiftKey?doFace(m[k]):doMove(m[k]))}
 else if(k>='1'&&k<='5')act(useCard(k-1));else if(k===' '||k==='w'||k==='W'){e.preventDefault();act(doWait)}});

// ---------- render ----------
const sprFor=(t,f,actv)=>{const s=A.sp[t],n=DIR[f].n;return t==='monk'?s[n]:(actv?s.act:s.idle)[n]};
const sprite=e=>sprFor(e.t,e.f,e.windup||e.atk);
const tintC=new Map();
function tinted(im,col){const k=im.src+col;let c=tintC.get(k);if(!c){c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);tintC.set(k,c)}return c}
function chev(x,y,d,s,col){const D=DIR[d];g.save();g.translate(x,y);g.rotate(Math.atan2(D.dr,D.dc)+Math.PI/2);g.fillStyle=col;g.beginPath();g.moveTo(0,-s);g.lineTo(-s*.9,s*.5);g.lineTo(0,s*.1);g.lineTo(s*.9,s*.5);g.closePath();g.fill();g.restore()}
const weapon=e=>({sword:'sword',archer:'arrow',thrower:'throw'}[e.t]);
function intentKey(e){const it=e.intent;if(!it)return null;const w=weapon(e);return it.k==='ancang'?w:it.k==='attack'?w+'B':null}
const clouds=[[22,170,22],[368,130,20],[20,380,24],[370,430,22],[22,540,20],[368,520,24]];
function drawHook(h,t){
 const k=Math.min(1,(t-h.t0)/450),ez=1-Math.pow(1-k,3),tx=px(h.c)+34,hx=W+30+(tx-W-30)*ez,y=py(h.r);
 g.fillStyle='rgba(0,0,0,.06)';g.fillRect(BX+h.c*TW,TY+h.r*TH,TW,TH);
 g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.moveTo(W+10,y-80);g.quadraticCurveTo((W+hx)/2,y-60+(1-ez)*-40,hx+18,y);g.stroke();
 g.lineWidth=3.5;g.beginPath();g.moveTo(hx+22,y);g.lineTo(hx,y);g.moveTo(hx+14,y-12);g.lineTo(hx,y);g.lineTo(hx+14,y+12);g.stroke();
}
function hatch(c,r){const x=BX+c*TW,y=TY+r*TH;g.save();g.beginPath();g.rect(x,y,TW,TH);g.clip();g.fillStyle='rgba(225,60,60,.14)';g.fillRect(x,y,TW,TH);g.strokeStyle='rgba(225,60,60,.92)';g.lineWidth=3;
 for(let i=-TH;i<TW;i+=16){g.beginPath();g.moveTo(x+i,y+TH);g.lineTo(x+i+TH,y);g.stroke()}g.restore()}
// area serangan: dua lapis supaya archer/thrower tampil di atas sprite
function warn(e,top){
 const f=e.f,d=DIR[f],R='rgba(225,60,60,.92)';g.save();g.strokeStyle=R;g.fillStyle=R;
 if(e.t==='sword'&&!top){const[c,r]=front(e);if(inb(c,r))hatch(c,r)}
 else if(e.t==='archer'&&top){const T=targets(e),[x1,y1]=T.length?[px(T[0][0]),py(T[0][1])]:rayEnd(e),x0=e.gx+d.dc*30,y0=e.gy-8+d.dr*30;
  g.lineWidth=4.5;g.lineCap='round';g.setLineDash([1,11]);g.lineDashOffset=-(now()/35)%12;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.setLineDash([]);
  if(T.length){g.beginPath();g.arc(x1,y1,7,0,7);g.fill()}}
 else if(e.t==='thrower'&&top){const[c,r]=front(e,2);if(inb(c,r)){const x=px(c),y=py(r);
  g.lineWidth=2.5;g.setLineDash([2,8]);g.lineCap='round';g.beginPath();g.moveTo(e.gx,e.gy-20);g.quadraticCurveTo((e.gx+x)/2,(e.gy+y)/2-60,x,y);g.stroke();g.setLineDash([]);
  g.lineWidth=3.5;g.beginPath();g.arc(x,y,16,0,7);g.stroke();g.beginPath();g.arc(x,y,3.5,0,7);g.fill();
  g.beginPath();[[-1,0],[1,0],[0,-1],[0,1]].forEach(([a,b])=>{g.moveTo(x+a*11,y+b*11);g.lineTo(x+a*28,y+b*28)});g.stroke()}}
 g.restore();
}
function drawSpr(im,x,y,h,o={}){const w=h*im.ar;g.save();g.translate(x,y+40);if(o.rot)g.rotate(o.rot);if(o.sy)g.scale(1,o.sy);if(o.a!=null)g.globalAlpha=o.a;g.drawImage(im.im,-w/2,-h,w,h);
 if(o.tint){g.globalAlpha=o.tint;g.drawImage(tinted(im.im,'#e13c3c'),-w/2,-h,w,h)}g.restore()}
function drawEnt(e,t){
 const im=sprite(e),h=A.H[e.t],it=e!==pl()&&e.intent;let ox=0,oy=0;
 if(e.act){g.fillStyle='rgba(255,215,0,.35)';g.fillRect(BX+e.c*TW,TY+e.r*TH,TW,TH)}
 if(e.atk){ox+=DIR[e.f].dc*14;oy+=DIR[e.f].dr*14}
 if(e===pl())ox+=(now()-shk<300?Math.sin(now()*.08)*5:0);
 if(it&&it.k==='attack')ox+=Math.sin(t*.05)*2.5;
 drawSpr(im,e.gx+(e.vx||0)+ox,e.gy+oy,h);
}
// ikon kecil di pojok tile musuh
function badge(e){const it=e.intent;if(!it||it.k==='wait')return;
 const ih=38,x1=e.gx+TW/2-3,y1=e.gy-TH/2+3;
 if(it.k==='move'||it.k==='turn'){const w=28,cx=x1-w/2,cy=y1+ih/2+2;g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;g.beginPath();g.rect(x1-w,y1,w,ih);g.fill();g.stroke();
  if(it.k==='move')chev(cx,cy,it.d,9,'#111');
  else{g.beginPath();g.arc(cx,y1+11,5,Math.PI*.2,Math.PI*1.8);g.stroke();chev(cx,y1+ih-12,it.d,7,'#111')}return}
 const ic=A.int[intentKey(e)];if(!ic)return;const iw=ih*ic.ar;g.drawImage(ic.im,x1-iw,y1,iw,ih)}
function draw(){
 const t=now(),p=pl();g.clearRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(0,0,W,H);
 g.strokeStyle='#111';g.lineWidth=1.5;clouds.forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,Math.PI*1.05,Math.PI*1.95);g.stroke();g.beginPath();g.arc(x+r*.7,y+4,r*.7,Math.PI*1.1,Math.PI*1.9);g.stroke()});
 // papan
 const ps=drag&&drag.y<560;
 g.setLineDash([9,7]);g.lineWidth=2.5;g.strokeStyle=ps?'#2a9d4a':'#111';g.beginPath();g.roundRect(BX-15,TY-16,COLS*TW+30,ROWS*TH+32,26);g.stroke();g.setLineDash([]);
 g.lineWidth=2.5;g.strokeStyle='#111';for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){g.fillStyle='#fff';g.fillRect(BX+c*TW,TY+r*TH,TW,TH);g.strokeRect(BX+c*TW,TY+r*TH,TW,TH)}
 g.strokeStyle='#d33';g.setLineDash([6,5]);g.lineWidth=3;g.beginPath();g.rect(BX-3,TY-3,COLS*TW+6,ROWS*TH+6);g.stroke();g.setLineDash([]);
 // pause + hud
 g.strokeStyle='#111';g.lineWidth=2.5;g.strokeRect(14,12,24,30);g.beginPath();g.moveTo(22,18);g.lineTo(22,36);g.moveTo(30,18);g.lineTo(30,36);g.stroke();
 g.fillStyle='#111';g.textAlign='center';g.font='14px "Segoe Print","Comic Sans MS",cursive';
 g.fillText('Giliran '+turn+' · Kill: '+kills+' · Musuh: '+foes().length+(hooks.length?' · Spawn: 1':cd>=0?' · Spawn: '+(cd+1):''),CX0,26);
 g.font='10.5px "Segoe Print","Comic Sans MS",cursive';g.fillStyle='#444';g.fillText(drag?DESC[CARDS[drag.i]]:msg,CX0,43);
 // panduan tile depan player
 if(!busy&&!over&&!drag){const[fc,fr]=front(p);if(inb(fc,fr))chev(px(fc),py(fr)+30,p.f,9,'rgba(0,0,0,.16)')}
 // preview kartu (tile terkena)
 if(ps)cardTiles(CARDS[drag.i]).forEach(([c,r])=>{g.fillStyle='rgba(60,120,230,.2)';g.fillRect(BX+c*TW,TY+r*TH,TW,TH);g.strokeStyle='rgba(60,120,230,.9)';g.lineWidth=3;g.strokeRect(BX+c*TW+3,TY+r*TH+3,TW-6,TH-6)});
 if(turnMode&&!busy){g.fillStyle='rgba(255,215,0,.35)';g.fillRect(BX+p.c*TW,TY+p.r*TH,TW,TH);
  for(let d=0;d<4;d++){const c=p.c+DIR[d].dc,r=p.r+DIR[d].dr,al=d===p.f?.1:.22,col='rgba(42,157,74,.8)';g.fillStyle='rgba(42,157,74,'+al+')';
   if(inb(c,r)){g.fillRect(BX+c*TW,TY+r*TH,TW,TH);chev(px(c),py(r)+(DIR[d].dr?0:30),d,10,col)}
   else{const x=d===3?BX-42:d===1?BR:BX+p.c*TW,y=d===0?TY-40:d===2?BB:TY+p.r*TH,w=DIR[d].dc?42:TW,h=DIR[d].dc?TH:(d===0?40:CT-2-BB);
    g.fillRect(x,y,w,h);g.strokeStyle='rgba(42,157,74,.6)';g.setLineDash([5,4]);g.lineWidth=2;g.strokeRect(x,y,w,h);g.setLineDash([]);chev(x+w/2,y+h/2+(d===2?3:0),d,d===2?7:10,col)}}}
 hooks.forEach(h=>drawHook(h,t));
 foes().forEach(e=>{if(e.intent&&e.intent.k==='attack'){g.fillStyle='rgba(225,60,60,.08)';g.fillRect(BX+e.c*TW,TY+e.r*TH,TW,TH);warn(e,0)}});
 [...ents.filter(e=>e.alive)].sort((a,b)=>a.gy-b.gy).forEach(e=>drawEnt(e,t));
 foes().forEach(e=>{if(e.intent&&e.intent.k==='attack')warn(e,1)});
 foes().forEach(badge);
 ghosts=ghosts.filter(o=>t-o.t0<700);
 ghosts.forEach(o=>{const k=(t-o.t0)/700,e=o.e,im=sprite(e),fd=o.fall>=0?DIR[o.fall]:{dc:0,dr:0};
  g.globalAlpha=1-k;drawSpr(im,e.gx+fd.dc*k*130,e.gy+fd.dr*k*130,A.H[e.t]*(1-k*.3*(o.fall>=0?1:0)));g.globalAlpha=1});
 fx=fx.filter(f=>t-f.t0<f.dur);fx.forEach(f=>f.fn((t-f.t0)/f.dur));
 // area kartu
 g.strokeStyle='#111';g.lineWidth=2.5;g.beginPath();g.moveTo(0,574);g.lineTo(W,574);g.stroke();
 CARDS.forEach((c,i)=>{const x=slotX(i);if(drag&&drag.i===i){g.strokeStyle='#111';g.setLineDash([5,5]);g.lineWidth=1.5;g.strokeRect(x,CT,CW,CH);g.setLineDash([]);return}
  const im=A.cards[c];g.globalAlpha=busy?.55:1;g.drawImage(im.im,x,CT,CW,CH);g.globalAlpha=1;
  if(cds[i]>0){g.fillStyle='rgba(255,255,255,.72)';g.fillRect(x,CT,CW,CH);g.strokeStyle='#111';g.lineWidth=2;g.strokeRect(x,CT,CW,CH);
   g.fillStyle='#111';g.textAlign='center';g.font='bold 34px "Segoe Print","Comic Sans MS",cursive';g.fillText(cds[i],x+CW/2,CT+CH/2+12)}});
 g.textAlign='center';g.strokeStyle='#111';g.fillStyle=busy?'#aaa':'#111';g.lineWidth=2.5;g.setLineDash([8,6]);g.beginPath();g.roundRect(WB.x,WB.y,WB.w,WB.h,16);g.stroke();g.setLineDash([]);
 g.font='15px "Segoe Print","Comic Sans MS",cursive';g.fillText('tunggu 1 giliran',WB.x+WB.w/2,WB.y+WB.h/2+5);
 if(drag){const im=A.cards[CARDS[drag.i]];g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=14;g.drawImage(im.im,drag.x-drag.ox*1.1,drag.y-drag.oy*1.1,CW*1.1,CH*1.1);g.restore()}
}
const CX0=195;
(function loop(){if(ents){for(const e of ents)if(e.alive){e.gx+=(px(e.c)-e.gx)*.25;e.gy+=(py(e.r)-e.gy)*.25;e.vx=(e.vx||0)*.88}draw()}requestAnimationFrame(loop)})();
