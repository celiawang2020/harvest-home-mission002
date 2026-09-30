import {BUILD,create,act,copy,forecast,capacity,drain} from './engine.js';
import {canContinue} from './continuation.js';import {Telemetry} from './telemetry.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),qa=params.get('qa')==='1',novice=params.get('novice')==='1';
const tel=new Telemetry(qa,novice);let s=create(true,true),busy=false,mode='normal',effect='',sound=false,audio=null,epoch=0,firstPayoff=false,feedback=[];
const laneNames=['晾架前','石径上','长凳前'],xs=[65,180,295];
const crate=(x,y,scale=1,cls='')=>`<g class="${cls}" transform="translate(${x} ${y}) scale(${scale})"><path d="M-18-15L14-20L22-10L19 16L-16 20L-23 8Z" fill="#b8925f" stroke="#826441" stroke-width="2"/><path d="M-17-12L14-16L19-9L-14-4Z" fill="#d7b97f"/><path d="M-12-4L-10 17M9-8L10 15" stroke="#edcf96" stroke-width="3"/><path d="M-18 3L17-1" stroke="#977144" stroke-width="2"/></g>`;
const plank=(x,y,ghost=false)=>`<g transform="translate(${x} ${y})" opacity="${ghost?.55:1}"><rect x="-38" y="-13" width="76" height="26" rx="5" fill="#a97642" stroke="#6e5239" stroke-width="3"/><path d="M-33-4L33-4M-33 4L33 4" stroke="#d4a468" stroke-width="3"/><circle cx="-24" cy="0" r="3" fill="#f7da9b"/><circle cx="24" cy="0" r="3" fill="#f7da9b"/></g>`;
const rack=f=>`<g class="${f?'restored':''}" transform="translate(65 324)"><ellipse cy="42" rx="46" ry="9" fill="#94a87944"/><path class="rays" d="M-38-100L-20 20L-2 20L-6-100ZM7-100L18 20L42 20L27-100Z"/><path d="M-38 39L-28-53M36 39L29-53M-35-44L35-44" stroke="${f?'#9b6e3f':'#898a73'}" stroke-width="7" stroke-linecap="round"/><path d="M-30-39Q0-29 31-39" stroke="#947646" fill="none" stroke-width="3"/><g class="cloth"><path d="M-26-36L-28 20Q-7 28 6 18L3-32Z" fill="${f?'#eab952':'#a4a78c'}"/><path d="M-19-28L-18 12M-10-26L-10 16" stroke="${f?'#ffeab2':'#b3b69f'}" stroke-width="3"/><path d="M10-32L13 6Q24 11 30 2L28-37Z" fill="${f?'#73b6b4':'#9ea994'}"/></g>${f?'<path d="M-48-8Q-37-17-26-11M-50 2Q-36-6-29-1" fill="none" stroke="#f4db7c" stroke-width="3"/>':''}</g>`;
const bench=f=>`<g transform="translate(295 335)"><ellipse cy="29" rx="45" ry="9" fill="#879d7044"/><path d="M-29 5L-33 29M29 5L33 29" stroke="#856444" stroke-width="7"/><path d="M-32-23L33-23M-33-12L33-12" stroke="${f?'#c59253':'#909783'}" stroke-width="10" stroke-linecap="round"/><path d="M-37 5L37 5" stroke="${f?'#d6a568':'#a0a58e'}" stroke-width="13" stroke-linecap="round"/><path d="M5-2Q-1-17 15-19Q30-17 23-2Z" fill="${f?'#d58165':'#a1aa92'}"/>${f?'<rect x="-45" y="22" width="16" height="10" rx="3" fill="#bd9257"/>':''}</g>`;
const target=(id,label,body,x,y,w,h,glow=false)=>`<g data-act="${id}" role="button" tabindex="0" aria-label="${label}" class="${glow?'target':''}">${body}<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>${glow?`<rect class="tap-ring" x="${x-3}" y="${y-3}" width="${w+6}" height="${h+6}" rx="17"/>`:''}</g>`;
const slots=(i,n,cls='')=>Array.from({length:n},(_,k)=>crate(xs[i]+(k%2?17:-14),168+Math.floor(k/2)*39,.7,cls)).join('');
const bundleIcon=(n=3)=>`<svg viewBox="0 0 150 40" aria-hidden="true">${[0,1,2].map((i)=>i<n?crate(36+i*39,21,.67):`<rect x="${21+i*39}" y="8" width="27" height="27" rx="5" fill="none" stroke="#bba57d" stroke-width="2" stroke-dasharray="3 3"/>`).join('')}</svg>`;
function cue(type){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.connect(g);g.connect(audio.destination);o.type='sine';const f=type==='payoff'?640:type==='tide'?180:type==='board'?260:360;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.45,t+.17);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.06,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.start();o.stop(t+.31);}
function later(ms,fn){const token=epoch;setTimeout(()=>{if(token===epoch)fn();},ms);}
function moveFX(origin){const el=$('floater'),garden=$('garden').getBoundingClientRect();const x=origin?origin.left+origin.width/2-garden.left-22:garden.width/2-22,y=origin?origin.top+origin.height/2-garden.top-20:garden.height/2;el.hidden=false;el.textContent='▣';el.style.color='#bd955b';el.style.left=x+'px';el.style.top=y+'px';el.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+(garden.width/2-x-22)+'px,'+(garden.height-y-22)+'px) rotate(25deg)',opacity:0}],{duration:470,easing:'cubic-bezier(.22,.7,.3,1)'});later(480,()=>el.hidden=true);}
function logStatus(){ $('status').textContent=JSON.stringify({build:BUILD,test_stage:tel.testStage,qa,guided:s.segment===1||s.tutorial!=='free',session:tel.session,run:tel.run,events:tel.rows.length,acked:tel.acked,pending:tel.pending.length,delivery:tel.status,phase:s.phase,onboarding:s.tutorial,segment:s.segment,actions:s.actions,audio:audio?.state||'off',feedback_ms_last:feedback.at(-1)||null,novice_comprehension:'NOT_ASSESSED_BY_SOFTWARE'},null,2);}
function render(){
 const intro=['clear','reward'].includes(s.tutorial),terminal=['failed','complete'].includes(s.phase)||(s.phase==='pause'&&!canContinue(s)),p=s.phase==='failed'?s.lastPrediction:forecast(s);
 $('scene').setAttribute('viewBox',intro?'0 108 180 262':'0 0 360 385');$('scene').setAttribute('aria-label',intro?'木箱挡住晾架，来物正在靠近':'小院中的晾架、石径与长凳');
 $('actions').hidden=intro;$('footer').hidden=intro;$('sound').hidden=intro;$('qaBadge').hidden=!qa;
 const heads={clear:['阳光被挡住了',''],reward:['阳光回来了',''],big:['来物又靠近了','这一包，可以变成一道防护'],board:['给长凳留一点余地',''],free:['留住这片小院','点杂物，直接搬走']};
 let [head,hint]=heads[s.tutorial];if(s.tutorial==='free'){if(mode==='flush'){head='冲开哪里？';hint='点一处，整包冲过去';}else if(mode==='board'){head='挡在谁前面？';hint='点水边的入口';}else if(s.phase==='preview'){head='来物就在水边';hint='虚影是它们将落下的位置';}else if(s.phase==='pause'){head='这一阵潮过去了';hint=canContinue(s)?'可以停下，也可以继续整理':'这一方小院，留住了';}else if(s.phase==='complete'){head='这一方小院，留住了';hint='随时离开，也可以换个顺序重来';}else if(s.phase==='failed'){head='来物漫过了边沿';hint='停在这里，或换个顺序重来';}}
 $('heading').textContent=head;$('hint').textContent=hint;
 let art=`<defs><linearGradient id="ground" x2="0" y2="1"><stop stop-color="#eee3bb"/><stop offset="1" stop-color="#dbd5a9"/></linearGradient></defs><rect width="360" height="385" fill="url(#ground)"/><path d="M0 0H360V95Q285 76 180 100Q85 113 0 91Z" fill="#7ab7b0"/><path class="wave" d="M-5 22Q40 10 92 22T190 23T300 20T370 25M-5 48Q50 35 110 47T250 48T380 45M0 73Q70 60 130 75T260 72T370 71"/><path d="M0 100Q80 125 180 104T360 100" fill="none" stroke="#c3bc8a" stroke-width="12"/><path d="M18 127Q48 203 30 280T18 367M122 122Q142 219 125 354M234 118Q215 232 239 369M342 120Q317 213 344 360" stroke="#d3c796" stroke-width="2" fill="none"/><path d="M159 289L185 280L199 292L183 304L161 300ZM165 328L190 319L203 331L186 344L166 341ZM152 360L178 350L194 363L176 376L155 372" fill="#b7ba94" stroke="#a3aa83"/>`;
 art+=`<g class="${effect==='restore'?'burst':''}">${rack(s.fixed[0])}</g>${bench(s.fixed[1])}<g fill="#85a876"><path d="M13 378Q-1 352 12 332Q28 354 13 378M353 378Q332 357 347 338Q361 355 353 378"/><path d="M145 380Q133 362 144 349Q154 366 145 380"/></g><g fill="#dc9269"><circle cx="12" cy="345" r="6"/><circle cx="346" cy="351" r="6"/></g>`;
 if(intro){
  art+=`<path d="M65 106Q46 146 64 178" fill="none" stroke="#7cb7b0" stroke-width="20" opacity=".45"/>${crate(65,135,.55,effect==='catch'?'catch-particle':'boat')}`;
  if(s.tutorial==='clear')art+=target('move:0','移开挡住晾架的木箱',`<path d="M24 201L99 197L110 277L28 279Z" fill="#899c7188"/>${crate(65,238,1.58)}<g class="finger" fill="#fff7de" stroke="#9c794c" stroke-width="1.5"><path d="M77 283L77 274Q79 270 82 274L83 280L85 278Q89 278 91 283L89 293L81 295L74 287Q73 283 77 283Z"/></g>`,17,190,98,113,true);
  else art+=`<g fill="#ffeab0"><circle cx="23" cy="213" r="3"/><circle cx="107" cy="250" r="3"/><path d="M102 196L105 204L113 207L105 210L102 218L99 210L91 207L99 204Z"/></g>`;
 }else{
  for(let i=0;i<3;i++){
   const warning=p[i]?.overflow&&!terminal,enabled=!busy&&!terminal&&s.tutorial==='free'&&s.phase!=='preview'&&(s.n[i]>0||mode==='flush');
   art+=`<path d="M${xs[i]-43} 135Q${xs[i]} 121 ${xs[i]+43} 138L${xs[i]+40} 261Q${xs[i]} 279 ${xs[i]-43} 259Z" fill="#ebe2bd" stroke="#cfc397" stroke-width="2"/>`;
   let pile=slots(i,s.n[i]);
   if(enabled)art+=target(`lane:${i}`,mode==='flush'?`冲开${laneNames[i]}`:`搬走${laneNames[i]}的杂物`,pile,xs[i]-46,135,92,131,mode==='flush');else art+=pile;
   if(!terminal){art+=Array.from({length:p[i].raw},(_,k)=>crate(xs[i]-16+k*21,58-k%2*5,.36,effect==='tide'?'tide-particle':'incoming')).join('');if(s.phase==='preview')art+=slots(i,Math.min(5,p[i].total),'predict');if(warning)art+=`<g class="danger"><path d="M${xs[i]-43} 271Q${xs[i]} 261 ${xs[i]+43} 274L${xs[i]+38} 300L${xs[i]-40} 300Z" fill="#cd8e6744"/><text x="${xs[i]}" y="294" text-anchor="middle" font-size="21" class="threat-mark">!</text></g>`;}
   const boardGuide=s.tutorial==='board'&&i===2;const canBoard=!busy&&!terminal&&(s.tutorial==='free'&&s.phase!=='pause'&&(s.boards>0||s.mounted[i])||boardGuide);
   const boardArt=s.mounted[i]?plank(xs[i],110):boardGuide?plank(xs[i],110,true):'<path d="M'+(xs[i]-16)+' 110L'+(xs[i]+16)+' 110" stroke="#829776" stroke-width="3" stroke-dasharray="4 4"/>';
   art+=canBoard?target(`board:${i}`,s.mounted[i]?`收回${laneNames[i]}挡板`:`挡住${laneNames[i]}的来物`,boardArt,xs[i]-46,63,92,72,boardGuide||mode==='board'):boardArt;
  }
  if(effect==='catch')art+=crate(65,140,.7,'catch-particle');
 }
 $('scene').innerHTML=art;
 $('scene').querySelectorAll('[data-act]').forEach(el=>{const go=()=>{if(busy)return;const [kind,num]=el.dataset.act.split(':'),i=Number(num);if(kind==='lane'){if(mode==='flush')execute('release',i);else if(mode==='board')execute('board',i);else execute('move',i);}else execute(kind,i);};el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}if(e.key==='Escape')cancel();};});
 $('dock').innerHTML='';$('extra').innerHTML='';$('extra').className='';
 if(s.tutorial==='big'){$('dock').innerHTML=`<button id="bundle" class="primary pulse">${bundleIcon(3)}做成挡潮板 ↗</button>`;$('bundle').onclick=()=>execute('release');}
 else if(s.tutorial==='board'){$('dock').innerHTML=`<div class="packing"><svg viewBox="0 0 180 40" aria-hidden="true">${plank(42,20)}<path d="M88 20H121M112 13L123 20L112 27" stroke="#578674" stroke-width="3" fill="none"/><path d="M139 12H172M137 25H174M141 25V35M169 25V35" stroke="#b18752" stroke-width="7"/></svg><small>让它挡在长凳前</small></div>`;}
 else if(terminal){$('dock').innerHTML='<div class="packing"><svg viewBox="0 0 150 40" aria-hidden="true"><path d="M60 21L71 31L92 9" fill="none" stroke="#739f75" stroke-width="5"/></svg><small>这次整理停在这里</small></div>';}
 else if(s.phase==='pause'){$('dock').innerHTML='<div class="packing"><small>点一件真实杂物，才会继续</small></div>';}
 else if(s.phase==='preview'){$('dock').innerHTML='<button id="resolve" class="primary"><svg viewBox="0 0 150 35" aria-hidden="true"><path d="M10 12Q24 3 38 12T66 12T94 12T122 12M18 25Q32 16 46 25T74 25T102 25T130 25" stroke="#d8f0d9" stroke-width="4" fill="none"/></svg>让这一潮进来</button>';$('resolve').onclick=resolveTide;}
 else if(mode!=='normal'){$('dock').innerHTML='<button id="cancelMode">↶ 取消选择</button>';$('cancelMode').onclick=cancel;}
 else{
  if(s.dock){$('dock').innerHTML=`<button id="bundle" class="primary">${bundleIcon(s.dock)}${s.dock===3?'做成挡潮板 ↗':'现在冲开 ≋'}</button>${s.dock<3?`<div class="packing">${bundleIcon(3)}<small>再搬进来 → 留给下一潮</small></div>`:''}`;$('bundle').onclick=()=>{if(s.dock===3)execute('release');else{mode='flush';render();}};}
  else $('dock').innerHTML=`<div class="packing">${bundleIcon(0)}<small>移开的杂物，会落到这里</small></div>`;
 }
 if(s.tutorial==='free'&&!terminal){if(s.boards>0&&s.phase!=='pause'){$('extra').innerHTML='<button id="useBoard">▰ 放一道挡板</button>';$('useBoard').onclick=()=>{mode='board';render();};}else{$('extra').className='steps';$('extra').innerHTML=[0,1,2].map(i=>`<i class="pebble ${i<s.step?'used':''}"></i>`).join('');}}
 logStatus();
}
function execute(kind,arg){if(busy)return false;const t=performance.now(),before=copy(s),guided=s.tutorial!=='free'||s.segment===1;const origin=kind==='move'?document.querySelector('[data-act="'+(s.tutorial==='clear'?'move:':'lane:')+arg+'"]')?.getBoundingClientRect():null;const result=act(s,kind,arg);if(!result.ok){tel.event('input_error',{reason:result.reason,guided,segment:s.segment});return false;}
 if(['move','release'].includes(kind))tel.action(kind,s.segment,guided);
 for(const e of drain(s)){const {type,...props}=e;tel.event(type,{...props,guided,segment:s.segment});if(type==='bundle_release')tel.payoffAt=performance.now();}
 mode='normal';effect=kind==='move'?'restore':kind==='tide'?'tide':'';render();feedback.push(performance.now()-t);if(feedback.length>150)feedback.shift();cue(kind==='release'?'payoff':kind==='tide'?'tide':kind==='board'?'board':'move');
 if(kind==='move')moveFX(origin);
 if(before.tutorial==='clear'){
  busy=true;render();later(400,()=>{if(!firstPayoff){firstPayoff=true;tel.firstPayoffAt=performance.now();tel.event('first_payoff',{guided:true,kind:'rack_revealed',time_to_payoff_ms:Math.round(performance.now()-tel.start)});cue('payoff');}});
  later(850,()=>{effect='catch';render();});later(2200,()=>{busy=false;execute('tide');tel.event('guided_demonstration_end',{guided:true});tel.flush().then(logStatus);});
 }else if(kind==='tide'){later(650,()=>{effect='';render();});}
 if(s.phase==='pause')tel.event(canContinue(s)?'continuation_available':'proof_complete',{guided,segment:s.segment});
 tel.flush().then(logStatus);return true;
}
function resolveTide(){if(busy)return;busy=true;effect='tide';render();later(650,()=>{busy=false;execute('tide');});}
function cancel(){mode='normal';render();tel.event('input_cancel',{guided:s.segment===1,segment:s.segment});}
function restart(){epoch++;busy=false;mode='normal';effect='';s=create(true,true);firstPayoff=false;feedback=[];$('floater').hidden=true;tel.newRun();const start=performance.now();render();tel.event('restart_ready',{guided:true,latency_ms:performance.now()-start});tel.flush().then(logStatus);}
 $('restart').onclick=restart;$('sound').onclick=async()=>{try{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();sound=!sound;$('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',sound?'关闭声音':'开启声音');cue('payoff');tel.event('audio_toggle',{enabled:sound,state:audio.state,guided:s.segment===1});tel.flush().then(logStatus);}catch{tel.event('audio_error');}};
 $('records').onclick=()=>{logStatus();$('log').showModal();tel.flush().then(logStatus);};$('closeLog').onclick=()=>$('log').close();
 $('export').onclick=()=>{const b=new Blob([JSON.stringify({build:BUILD,qa,test_stage:tel.testStage,state:s,feedback_ms:feedback,events:tel.rows},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='v41-b01-'+tel.session+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
 document.addEventListener('pointercancel',()=>{if(s.tutorial==='free')cancel();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&s.tutorial==='free')cancel();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){tel.event('exit',{visibility_only:true,guided:s.segment===1,segment:s.segment,actions:s.actions});tel.flush();}});
 render();
