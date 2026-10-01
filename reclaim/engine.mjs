export const W=390,H=760,BUILD='reclaim-1.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function event(s,type,data={}){s.events.push({t:+s.t.toFixed(2),type,...data});if(s.events.length>160)s.events.shift()}
export function create(){return{build:BUILD,t:0,status:'ready',p:{x:230,y:622,a:0,hp:3,inv:0,left:false,right:false,front:0,leftCD:0,rightCD:0},covers:[{id:'left',x:176,y:552,r:25,alive:true},{id:'right',x:309,y:268,r:25,alive:true}],walls:[{x:120,y:366,w:39,h:26},{x:231,y:366,w:39,h:26}],enemies:[],shots:[],fx:[],events:[],spawn:0,nextId:1,kills:0,exit:false,cause:'',volley:0,lastWeapon:''}}
export function start(s){if(s.status==='ready'){s.status='playing';event(s,'start')}}
export function pause(s,reason='button'){if(s.status==='playing'){s.status='paused';event(s,'pause',{reason})}}
export function resume(s){if(s.status==='paused'){s.status='playing';event(s,'resume')}}
export function parts(p){const out=[{x:p.x,y:p.y,r:17}];for(const [key,sign]of [['left',-1],['right',1]])if(p[key])out.push({x:p.x+Math.cos(p.a)*sign*26,y:p.y+Math.sin(p.a)*sign*26,r:13});return out}
function rectHit(c,r){return Math.hypot(c.x-clamp(c.x,r.x,r.x+r.w),c.y-clamp(c.y,r.y,r.y+r.h))<c.r}
export function blocked(s,p){return parts(p).some(c=>c.x-c.r<16||c.x+c.r>374||c.y-c.r<106||c.y+c.r>707||s.walls.some(r=>rectHit(c,r))||s.covers.some(v=>v.alive&&dist(c,v)<c.r+v.r))}
export function capture(s){for(const c of s.covers)if(c.alive&&dist(s.p,c)<57){c.alive=false;s.p[c.id]=true;s.p.x=clamp(s.p.x,16+(s.p.left?39:17),374-(s.p.right?39:17));event(s,'capture',{side:c.id,coverRemoved:true});burst(s,c.x,c.y,'capture',18)}}
export function hurt(s,cause){if(s.status!=='playing'||s.p.inv>0)return;s.p.hp--;s.p.inv=1.7;s.cause=cause;event(s,'damage',{cause,hp:s.p.hp});burst(s,s.p.x,s.p.y,'damage',16);if(s.p.hp<=0){s.status='lost';event(s,'lost',{cause})}}
function burst(s,x,y,kind,n=8){for(let i=0;i<n;i++)s.fx.push({x,y,vx:Math.cos(i*2.399)* (35+i*5),vy:Math.sin(i*2.399)*(35+i*5),life:.6,max:.6,kind,i});s.fx=s.fx.slice(-150)}
export function fire(s,kind){s.volley++;s.lastWeapon=kind;const p=s.p,ang=p.a+(kind==='left'?-Math.PI/2:kind==='right'?Math.PI/2:0),speed=kind==='right'?460:350;for(const spread of kind==='left'?[-.21,0,.21]:[0]){const a=ang+spread;s.shots.push({x:p.x+Math.sin(ang)*30,y:p.y-Math.cos(ang)*30,vx:Math.sin(a)*speed,vy:-Math.cos(a)*speed,r:kind==='right'?6:3,life:1.4,kind,enemy:false,damage:kind==='front'?.65:kind==='right'?2.4:1.5,hit:[]})}}
function spawn(s){const n=s.nextId++,heavy=s.t>=34&&n%3===0;const spots=[[45,575],[54,220],[337,170],[337,610],[45,140],[195,120]];const ordered=spots.map((_,i)=>spots[(n-1+i)%spots.length]);const [x,y]=ordered.find(([x,y])=>Math.hypot(x-s.p.x,y-s.p.y)>115&&!s.enemies.some(e=>Math.hypot(x-e.x,y-e.y)<48))||ordered.reduce((a,b)=>Math.hypot(...[a[0]-s.p.x,a[1]-s.p.y])>Math.hypot(...[b[0]-s.p.x,b[1]-s.p.y])?a:b);s.enemies.push({id:n,x,y,a:0,r:heavy?22:17,hp:heavy?6:n===1?1.5:2.5,heavy,entry:.85,cd:n===1?1.5:2.1,hit:0,lock:null});event(s,'enemy',{id:n,heavy});if(n===1){const id=s.nextId++;s.enemies.push({id,x,y:clamp(y+35,120,680),a:0,r:17,hp:1.5,heavy:false,entry:.85,cd:2,hit:0,lock:null});event(s,'enemy',{id,heavy:false})}}
export function step(s,dt,target=null){if(s.status!=='playing'||dt<=0||dt>.1)return;s.t+=dt;const p=s.p;p.inv=Math.max(0,p.inv-dt);p.bump=Math.max(0,(p.bump||0)-dt);capture(s);for(const c of s.covers)c.flash=Math.max(0,(c.flash||0)-dt);
 if(target){let dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);if(d>3){const move=Math.min(d,215*dt);let q={...p,x:p.x+dx/d*move};if(!blocked(s,q))p.x=q.x;else if(Math.abs(dx)>3)p.bump=.15;q={...p,y:p.y+dy/d*move};if(!blocked(s,q))p.y=q.y;else if(Math.abs(dy)>3)p.bump=.15;}}
 for(const [kind,cd,interval]of [['front','front',.8],['left','leftCD',.48],['right','rightCD',1.1]]){p[cd]-=dt;if((kind==='front'||p[kind])&&p[cd]<=0){p[cd]=interval;fire(s,kind)}}
 s.spawn-=dt;if(s.spawn<=0&&s.enemies.length<10){spawn(s);s.spawn=s.t<18?4.7:s.t<34?3.8:2.8}
 for(const e of s.enemies){if(e.entry>0){e.entry-=dt;continue}e.hit=Math.max(0,e.hit-dt);const d=dist(e,p),dx=(p.x-e.x)/(d||1),dy=(p.y-e.y)/(d||1);e.a=Math.atan2(dx,-dy);if(d>88){const q={x:e.x+dx*dt*(e.heavy?18:24),y:e.y+dy*dt*(e.heavy?18:24),r:e.r};if(!s.walls.some(r=>rectHit(q,r))&&!s.covers.some(c=>c.alive&&dist(q,c)<q.r+c.r)){e.x=q.x;e.y=q.y}}e.cd-=dt;if(e.cd<.75&&!e.lock)e.lock={x:p.x,y:p.y};if(e.cd<=0){const a=Math.atan2(e.lock.y-e.y,e.lock.x-e.x);for(const offset of e.heavy?[-.18,0,.18]:[0])s.shots.push({x:e.x,y:e.y,vx:Math.cos(a+offset)*(e.heavy?115:105),vy:Math.sin(a+offset)*(e.heavy?115:105),r:e.heavy?6:5,life:6,kind:'hostile',enemy:true});e.cd=e.heavy?2.7:3.3;e.lock=null;}if(d<e.r+17)hurt(s,'撞上追击车');}
 for(const b of s.shots){b.life-=dt;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/5));for(let i=0;i<steps&&b.life>0;i++){b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;const shield=s.covers.find(c=>c.alive&&dist(b,c)<c.r+b.r);if(s.walls.some(r=>rectHit(b,r))||shield){if(shield){if(!shield.flash)event(s,'cover-block',{side:shield.id});shield.flash=.3;}b.life=0;burst(s,b.x,b.y,'cover',3);break}if(b.enemy){if(parts(p).some(c=>dist(c,b)<c.r+b.r)){b.life=0;hurt(s,'被红色炮弹击中')}}else for(const e of s.enemies)if(e.hp>0&&!b.hit.includes(e.id)&&dist(e,b)<e.r+b.r){e.hp-=b.damage;e.hit=.18;b.hit.push(e.id);if(b.kind!=='right')b.life=0;if(b.kind==='left'){e.x=clamp(e.x+b.vx/350*17,24,366);e.y=clamp(e.y+b.vy/350*17,110,698)}burst(s,e.x,e.y,'hit',4);if(e.hp<=0){s.kills++;event(s,'destroy',{enemy:e.id,weapon:b.kind});burst(s,e.x,e.y,'destroy',14)}}}}
 s.enemies=s.enemies.filter(e=>e.hp>0);s.shots=s.shots.filter(b=>b.life>0&&b.x>-20&&b.x<410&&b.y>75&&b.y<750).slice(-140);for(const f of s.fx){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.95;f.vy*=.95}s.fx=s.fx.filter(f=>f.life>0);
 if(s.t>=52&&s.kills>=4&&!s.exit){s.exit=true;event(s,'exit-open')}
 if(s.exit&&Math.hypot(p.x-195,p.y-133)<43){s.status='won';event(s,'won',{kills:s.kills});burst(s,p.x,p.y,'capture',32)}
 if(s.t>=85&&s.status==='playing'){s.status='lost';s.cause='撤离窗口关闭';event(s,'lost',{cause:s.cause})}
}








