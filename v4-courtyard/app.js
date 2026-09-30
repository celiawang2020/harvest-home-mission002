import {BUILD,create,act,copy,forecast,capacity,drain} from './engine.js';
import {canContinue} from './continuation.js';
import {Telemetry} from './telemetry.js';
const $=id=>document.getElementById(id),qa=new URLSearchParams(location.search).get('qa')==='1';
const tel=new Telemetry(qa),names=['晾架边','石径','长凳边'];let s=create(true,true),selected=null,mode='move',started=false,audio=null,sound=false,color='coral';
const palettes={coral:'#c77e65',blue:'#729da0',gold:'#c2a153'};const timing=[];
const rack=f=>`<svg viewBox="0 0 100 70" aria-hidden="true"><ellipse cx="51" cy="61" rx="39" ry="5" fill="#b8ac8780"/><path d="M18 58L25 10M77 58L74 10M20 16L79 16" stroke="${f?'#8e7852':'#9b987e'}" stroke-width="5" stroke-linecap="round"/><path d="M25 19Q50 23 74 19" fill="none" stroke="#7c795d" stroke-width="2"/><path d="M29 20L29 49Q42 54 49 48L48 21Z" fill="${f?palettes[color]:'#b9b29b'}"/><path d="M55 21L55 43Q63 48 69 43L68 20Z" fill="${f?'#eee4b8':'#b9b29b'}"/><path d="M32 24L45 25M58 25L65 24" stroke="#f8ead0" stroke-width="2"/>${f?'<path d="M7 28Q13 24 19 28M4 36Q12 31 20 35" stroke="#83b6a1" fill="none" stroke-width="2"/>':''}</svg>`;
const bench=f=>`<svg viewBox="0 0 100 70" aria-hidden="true"><ellipse cx="52" cy="60" rx="40" ry="5" fill="#b8ac8780"/><path d="M24 42L20 60M77 42L80 60" stroke="#8c7553" stroke-width="5"/><path d="M20 27L81 27M19 34L81 34" stroke="${f?'#bf9d65':'#a7a18b'}" stroke-width="7" stroke-linecap="round"/><path d="M18 44L83 44" stroke="${f?'#c9aa75':'#aaa48d'}" stroke-width="10" stroke-linecap="round"/>${f?`<path d="M56 36Q52 25 66 24Q76 26 72 37Z" fill="${palettes[color]}"/><rect x="7" y="53" width="12" height="8" rx="2" fill="#aa9066"/>`:'<path d="M33 35L44 51" stroke="#858570" stroke-width="4"/>'}</svg>`;
const stones='<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M32 54L48 48L63 53L56 60L38 60ZM42 40L54 36L66 41L59 46L45 45ZM43 23L55 19L63 24L54 31L44 28" fill="#c4c3a7" stroke="#acae92"/><path d="M19 58Q12 46 18 34Q28 43 19 58M81 58Q68 46 79 38Q86 47 81 58" fill="#92a67c"/></svg>';
function tone(type='move'){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='sine';const t=audio.currentTime;const f=type==='restore'?660:type==='tide'?170:type==='release'?440:330;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.4,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.24);o.start();o.stop(t+.25);}
function msg(text){$('message').textContent=text;}
function animate(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),600);}
function status(){ $('status').textContent=JSON.stringify({build:BUILD,qa,session:tel.session,run:tel.run,events:tel.rows.length,acked:tel.acked,pending:tel.pending.length,status:tel.status,phase:s.phase,segment:s.segment,actions:s.actions,feedback_ms_last:timing.at(-1)||null},null,2);}
function render(){
 const future=s.phase==='failed'?s.lastPrediction:forecast(s),terminal=['failed','complete'].includes(s.phase)||(s.phase==='pause'&&!canContinue(s));
 $('forecast').hidden=terminal&&s.phase!=='failed';
 $('season').textContent=terminal?(s.phase==='failed'?'这一潮停下':'本次整理完成'):s.tide<3?'第一阵潮':'第二阵潮';$('step').textContent=s.phase==='preview'?'潮水已到 · 先安排挡板':s.phase==='pause'||terminal?'这里可以安静停下':`再行动 ${3-s.step} 步 · 潮来`;
 $('dots').innerHTML=[0,1,2].map(i=>`<i class="${i<s.step?'used':''}"></i>`).join('');
 $('forecast').innerHTML=future.map((p,i)=>`<div class="${p.overflow?'danger':''}">${names[i]} · 来 ${p.raw}<b>${p.blocked||p.rack?`拦 ${p.blocked+p.rack} → `:''}${p.total}/${p.cap} ${p.overflow?(i===0?'晾架受损':i===2?'长凳受损':'石径漫出'):'✓'}</b></div>`).join('');
 $('lanes').innerHTML=[0,1,2].map(i=>{const fixed=i===0?s.fixed[0]:i===2?s.fixed[1]:false;return `<div class="lane"><button class="inlet" data-inlet="${i}" aria-label="${names[i]}${s.mounted[i]?'移回挡板':'安装挡板'}" ${!started||terminal?'disabled':''}>${s.mounted[i]?'<span class="plank">挡住 2</span>':'<span class="arrow">⌄</span>'}</button><button class="pile ${selected===i?'selected':''} ${mode==='flush'?'target':''}" data-lane="${i}" aria-label="${names[i]}，${s.n[i]}件杂物" ${!started||terminal||s.phase==='preview'?'disabled':''}>${s.n[i]?Array.from({length:s.n[i]},()=>'<span class="junk"></span>').join(''):'<span class="empty-leaf">⌁</span>'}</button><div class="capacity">${s.n[i]} / ${capacity(s,i)} ${i===2&&fixed?'· 多一格':''}</div><div class="furniture ${fixed?'fixed':''}" id="f${i}">${i===0?rack(fixed):i===2?bench(fixed):stones}</div><div class="furniture-label">${i===0?(fixed?'晾架 · 每潮拦 1':'晾架 · 清空后展开'):i===2?(fixed?'长凳 · 多留 1 格':'长凳 · 清空后修好'):'石径 · 留出余地'}</div></div>`;}).join('');
 $('dockPieces').innerHTML=[0,1,2].map(i=>`<i class="${i<s.dock?'full':''}"></i>`).join('');$('dockLabel').textContent=selected!==null?`放入 · ${names[selected]}`:`打包坞 ${s.dock}/3`;$('dockHint').textContent=s.dock===3?'满了，可以推出':selected!==null?`花 1 步${s.step===2?' · 随后潮来':''}`:'选中杂物后放入';
 $('dock').disabled=!started||terminal||s.phase==='preview'||selected===null||s.dock>=3;$('dock').classList.toggle('ready',selected!==null&&s.dock<3);
 const boardTotal=s.boards+s.mounted.filter(Boolean).length;
 $('release').innerHTML=s.dock===3?`<b>推出大包 ↗</b><small>${boardTotal<2?'得到 1 块挡板':'已有 2 板 · 不再增加'} · 花 1 步</small>`:`<b>${mode==='flush'?'选择冲刷通道':'推出小包 ↗'}</b><small>冲走 ${s.dock||'1–2'} 件 · 花 1 步</small>`;
 $('release').disabled=!started||terminal||s.phase!=='play'||s.dock===0;
 $('boardCount').textContent=s.boards;$('board').disabled=!started||terminal||s.boards===0||s.phase==='pause';$('board').classList.toggle('ready',mode==='board');
 $('tide').hidden=s.phase!=='preview';$('ending').hidden=!terminal&&s.phase!=='pause';
 if(s.phase==='failed'){$('endingTitle').textContent='这一潮，留下了痕迹';$('endingText').textContent='预告中的来物漫过了边沿。小院停在这里，可以重来，也可以离开。';}
 else if(s.phase==='pause'&&!terminal){$('endingTitle').textContent='潮退了，留下一方晴日';$('endingText').textContent='这里可以停下。若还想整理，点一件杂物、放入坞，第二阵潮才会开始。';}
 else if(terminal){$('endingTitle').textContent='这一方小院，留住了';$('endingText').textContent='本次整理到这里。恢复的颜色和留下的空间，都是你刚才的选择。';}
 for(const i of [0,2])$('f'+i).classList.toggle('threat',!!future[i]?.overflow&&!terminal);
 document.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>laneClick(Number(b.dataset.lane)));
 document.querySelectorAll('[data-inlet]').forEach(b=>b.onclick=()=>command('board',Number(b.dataset.inlet)));
 status();
}
function command(kind,arg){const before=copy(s),t=performance.now();const out=act(s,kind,arg);if(!out.ok){tel.event('input_error',{kind,reason:out.reason,segment:s.segment});msg(out.reason==='no_board'?'先推出满满一包，做一块挡潮板':out.reason==='dock_full'?'坞满了，先推出这一包':'这个动作现在不能进行');return false;}
 if(kind==='move'||kind==='release')tel.action(kind,s.segment);
 const events=drain(s);for(const e of events){const {type,...props}=e;tel.event(type,{...props,segment:s.segment});if(type==='bundle_release')tel.payoffAt=performance.now();}
 selected=null;mode='move';render();timing.push(performance.now()-t);if(timing.length>100)timing.shift();
 if(kind==='tide'){animate(document.querySelector('.court'),'wash');tone('tide');msg(out.predictions.some(p=>p.overflow)?'来物漫过边沿，受损的设施需要重新清空':out.predictions.some(p=>p.blocked||p.rack)?'拦下的来物留在水里，小院多了一点余地':'这一潮过去了');}
 else if(kind==='move'){tone();animate(document.querySelector(`[data-lane="${arg}"]`),'pop');msg('杂物进坞，留出一点空间');}
 else if(kind==='release'){tone('release');animate(document.querySelector('.court'),'flash');msg(before.dock===3?'这一包换成挡板 · 点入口安装，不花步数':`小包冲走${Math.min(before.dock,before.n[arg])}件，通道腾开了`);}
 else msg(s.mounted[arg]?'挡板已装好 · 下一潮拦住最多 2 件':'挡板已收回，可以换一道');
 for(const e of events){if(e.type==='facility_restored'){animate($('f'+(e.id===0?0:2)),'restored');tone('restore');msg(e.id===0?'晾架展开了，下次替你拦住一件来物':'长凳修好了，多留下一格空间');}if(e.type==='overflow'&&e.lane!==1)animate($('f'+e.lane),'hit');if(e.type==='facility_effect')animate(e.id==='rack'?$('f0'):document.querySelector(`[data-inlet="${e.lane}"]`),'intercept');}
 if(s.phase==='preview')msg('先看将要发生什么；已有挡板仍可换位置');
 if(s.phase==='pause')tel.event(canContinue(s)?'continuation_available':'proof_complete',{segment:s.segment});
 tel.flush().then(status);return true;
}
function laneClick(i){if(mode==='flush'){command('release',i);return;}if(mode==='board'){command('board',i);return;}if(!s.n[i]){msg('这道已经清空了');tel.event('input_error',{reason:'empty_lane',segment:s.segment});return;}selected=i;render();msg(`选中了${names[i]}的一件 · 点打包坞放入`);}
 $('dock').onclick=()=>{if(selected!==null)command('move',selected);};
 $('release').onclick=()=>{if(s.dock===3)command('release');else{mode=mode==='flush'?'move':'flush';selected=null;render();msg(mode==='flush'?`点一道，用这包冲走 ${s.dock} 件杂物`:'已取消出包');}};
 $('board').onclick=()=>{mode=mode==='board'?'move':'board';selected=null;render();msg('点一道入口装板，再点已装入口可收回');};
 $('tide').onclick=()=>command('tide');
 function cancel(){selected=null;mode='move';render();msg('选择已取消，物件都在原处');tel.event('input_cancel',{segment:s.segment});}
 $('cancel').onclick=cancel;document.addEventListener('pointercancel',cancel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&started)cancel();});
 $('restart').onclick=()=>{const t=performance.now();s=create(true,true);selected=null;mode='move';tel.newRun();render();msg('同一座小院，可以换个整理顺序');tel.event('restart_ready',{latency_ms:performance.now()-t});tel.flush().then(status);};
 $('sound').onclick=async()=>{try{audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();sound=!sound;$('sound').innerHTML=`♪<small>声音${sound?'开':'关'}</small>`;$('sound').setAttribute('aria-label',sound?'关闭声音':'开启声音');tone();tel.event('audio_toggle',{enabled:sound,state:audio.state});}catch(e){msg('声音暂时不可用，仍可静音体验');tel.event('audio_error');}};
 $('records').onclick=()=>{$('log').open=!$('log').open;status();tel.flush().then(status);};
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify({build:BUILD,qa,state:s,feedback_ms:timing,events:tel.rows},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='v4-b01-'+tel.session+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
 document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;document.documentElement.style.setProperty('--accent',palettes[color]);document.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('chosen',x===b));$('begin').disabled=false;tel.event('personal_color',{color});render();});
 $('begin').disabled=true;$('begin').onclick=()=>{started=true;$('welcome').close();render();tel.event('court_open',{color});tel.flush().then(status);};
 $('welcome').addEventListener('cancel',e=>e.preventDefault());$('qaLabel').textContent=qa?'技术 QA · 不计真人结果':'';
 document.addEventListener('visibilitychange',()=>{if(document.hidden){tel.event('exit',{meaning:'visibility_proxy_not_confirmed_quit',segment:s.segment,actions:s.actions});tel.flush();}});
 render();$('welcome').showModal();
