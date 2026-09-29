import {homeState,homeAct,homeTick} from './home.js';
export const BUILD='m003-g1-0.3.0';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const weight=s=>s.cargo.reduce((a,c)=>a+c.weight,0);
const relics=[['月牙杯',1,2,'cup'],['琥珀蛋',2,4,'egg'],['蓝晶冠',3,7,'crown'],['星核',4,10,'star'],['玉鸟',1,3,'bird']];
export function offers(s){return [0,1].map(i=>{let r=relics[(s.depth+i*2+s.trip+s.variant)%relics.length];return {name:r[0],weight:r[1],value:r[2],shape:r[3],id:`${s.trip}-${s.depth}-${i}`};});}
export function create(proof,variant=0){return {home:proof===3?homeState(variant):null,proof,variant,t:0,duration:34,started:false,done:false,events:[],cargo:[],bank:[],lost:[],depth:0,trip:0,busy:0,job:null,x:80,y:330,origin:null,dest:null,jobTotal:0,stress:0,aim:1,charge:0,charging:false,cooldown:0,flowers:[true,true,true],enemies:[],rubble:[],spawn:0,kills:0,shots:0,animals:[{id:0,name:'红围巾兔',kind:'rabbit',weight:1,x:105,y:228,status:'roof'},{id:1,name:'小熊',kind:'bear',weight:3,x:285,y:174,status:'roof'},{id:2,name:'斑点猫',kind:'cat',weight:2,x:210,y:95,status:'roof'},{id:3,name:'白耳兔',kind:'rabbit',weight:1,x:55,y:105,status:'roof'},{id:4,name:'小狐狸',kind:'fox',weight:2,x:330,y:275,status:'roof'}],message:'',flash:0,lastBlast:null};}
function emit(s,type,data={}){s.events.push({type,...data,t:s.t});}
export function drain(s){return s.events.splice(0);}
function finish(s,reason){if(s.done)return;s.done=true;s.charging=false;emit(s,'round_end',{reason,bank:s.bank.length,lost:s.lost.length,home_cleared:s.home?.cleared??null,home_damage:s.home?.damage??null});}
export function travel(s,job,dest,time){s.origin={x:s.x,y:s.y};s.dest=dest;s.busy=time;s.jobTotal=time;s.job=job;}
export function returnTime(s){return 1.4+s.depth*.52+weight(s)*.43;}
export function act(s,kind,arg){if(s.done)return {ok:false,reason:'ended'};
 if(kind==='start'){if(s.started)return {ok:false,reason:'already_started'};s.started=true;if(s.proof===2&&s.variant){const spots=s.animals.map(a=>({x:a.x,y:a.y}));s.animals.forEach((a,i)=>Object.assign(a,spots[(i+s.variant)%spots.length]));}if(s.proof===3){s.home.clean[6]=true;s.home.clean[18]=true;s.message='椅子扶好了。给自己的小屋腾出空间。';emit(s,'ownership_created',{kind:'repaired_chair'});}return {ok:true,setup:true};}
 if(!s.started)return {ok:false,reason:'not_started'};
 if(s.proof===3)return homeAct(s,kind,arg);
 if(s.busy>0)return {ok:false,reason:'in_transit'};
 if(s.proof===1){
  if(kind==='take'){if(s.depth>=6)return {ok:false,reason:'end_of_track'};const item=offers(s)[arg];if(!item)return {ok:false,reason:'invalid_target'};s.cargo.push(item);s.depth++;s.stress+=Math.max(0,weight(s)-5)*.7;travel(s,'mine',{x:Math.min(320,80+s.depth*35),y:330},.65);s.message=`${item.name}进了车，车身更沉了`;emit(s,'acquired',{item:item.name,weight:weight(s)});return {ok:true};}
  if(kind==='bank'){if(!s.cargo.length)return {ok:false,reason:'empty'};travel(s,'bank',{x:35,y:330},returnTime(s));s.message='带回去，才真正属于你';return {ok:true};}
  if(kind==='drop'){if(!s.cargo.length)return {ok:false,reason:'empty'};const item=s.cargo.pop();s.lost.push(item);s.stress=Math.max(0,s.stress-5);s.message=`放下${item.name}，矿车轻了`;emit(s,'sacrifice',{item:item.name});return {ok:true};}
 }
 if(s.proof===2){
  if(kind==='rescue'){const a=s.animals[arg];if(!a||!['roof','raft'].includes(a.status))return {ok:false,reason:'not_available'};const dist=Math.hypot(a.x-s.x,a.y-s.y);travel(s,{rescue:arg},{x:a.x,y:a.y+28},.6+dist/(145-weight(s)*12));s.message=`正在靠近${a.name}`;return {ok:true};}
  if(kind==='bank'){if(!s.cargo.length)return {ok:false,reason:'empty'};travel(s,'shelter',{x:58,y:350},.7+Math.hypot(s.x-58,s.y-350)/(125-weight(s)*10));s.message='靠岸，让它们先安全';return {ok:true};}
 }
 return {ok:false,reason:'invalid_action'};
}
export function tick(s,dt){if(!s.started||s.done)return;dt=clamp(dt,0,.1);s.t+=dt;s.flash=Math.max(0,s.flash-dt);if(s.lastBlast)s.lastBlast.age+=dt;
 if(s.busy>0){s.busy=Math.max(0,s.busy-dt);const p=1-s.busy/s.jobTotal;s.x=s.origin.x+(s.dest.x-s.origin.x)*p;s.y=s.origin.y+(s.dest.y-s.origin.y)*p;if(!s.busy){const j=s.job;s.job=null;if(j==='bank'){s.bank.push(...s.cargo);s.cargo=[];s.depth=0;s.trip++;s.stress=0;emit(s,'payoff',{kind:'bank',bank:s.bank.length});s.message='宝物进了陈列柜。裂缝里又露出光。';}if(j==='shelter'){for(const a of s.cargo)a.status='safe';s.bank.push(...s.cargo);s.cargo=[];emit(s,'payoff',{kind:'shelter',bank:s.bank.length});s.message='它们在岸边等你回来';}if(j&&typeof j==='object'){const a=s.animals[j.rescue];a.status='boat';s.cargo.push(a);emit(s,'rescued',{animal:a.name,weight:weight(s)});s.message=`${a.name}靠在船沿，船更低了`;if(weight(s)>5){for(const c of s.cargo){c.status='raft';c.x=clamp(s.x+((c.id%2)*2-1)*35,30,360);c.y=clamp(s.y-35,65,290);}s.lost.push(...s.cargo);s.cargo=[];emit(s,'capsize');s.message='超载了！它们抱住浮木，还能再接回来';s.flash=.7;}}}}
 if(s.proof===1){s.stress+=Math.max(0,weight(s)-6)*dt*1.4;if(s.stress>12&&s.cargo.length){const item=s.cargo.shift();s.lost.push(item);s.stress=0;s.flash=.6;emit(s,'cargo_slipped',{item:item.name});s.message=`${item.name}从重压下滑落了`;}}
 if(s.proof===2){for(const a of s.animals){if(a.status==='roof'&&s.t>18+a.id*2){a.status='raft';a.x=clamp(a.x+20,30,365);a.y-=10;emit(s,'roof_submerged',{animal:a.name});}}if(s.bank.length===5&&s.t>=20)finish(s,'all_safe');}
 if(s.proof===3)homeTick(s,dt);
 if(s.t>=s.duration){if(s.proof===1){s.lost.push(...s.cargo);s.cargo=[];}finish(s,'weather_closed');}
}
