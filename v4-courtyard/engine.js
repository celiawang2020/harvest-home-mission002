import {canContinue} from './continuation.js';
export const BUILD='v4-b01-0.2.0';
export const TIDES=[[1,0,1],[2,1,2],[1,1,1],[0,2,2],[2,0,1],[1,2,2]];
export const copy=s=>structuredClone(s);
export const capacity=(s,i)=>i===2&&s.fixed[1]?5:4;
export function create(repair=true,guarded=false){return {n:[2,3,2],dock:0,boards:0,mounted:[false,false,false],fixed:[false,false],step:0,tide:0,segment:1,phase:'play',overflows:0,actions:0,repair,guarded,events:[]};}
const event=(s,type,props={})=>s.events.push({type,...props});
function restore(s,i){const f=i===0?0:i===2?1:-1;if(f>=0&&s.n[i]===0&&!s.fixed[f]){s.fixed[f]=true;event(s,'facility_restored',{id:f});}}
export function forecast(s){const incoming=TIDES[s.tide]||[0,0,0];return incoming.map((raw,i)=>{const blocked=s.mounted[i]?Math.min(2,raw):0;const rack=i===0&&s.fixed[0]?Math.min(1,raw-blocked):0;const added=raw-blocked-rack;const cap=capacity(s,i);return {raw,blocked,rack,added,total:s.n[i]+added,cap,overflow:s.n[i]+added>cap};});}
export function act(s,kind,arg){
 if(kind==='board'){
  if(!['play','preview'].includes(s.phase)||![0,1,2].includes(arg))return {ok:false,reason:'not_available'};
  if(s.mounted[arg]){s.mounted[arg]=false;s.boards++;}else{if(s.boards<1)return {ok:false,reason:'no_board'};s.mounted[arg]=true;s.boards--;}
  event(s,'board_changed',{lane:arg,mounted:s.mounted[arg]});return {ok:true};
 }
 if(kind==='tide'){
  if(s.phase!=='preview')return {ok:false,reason:'not_preview'};
  const predictions=forecast(s);s.lastPrediction=copy(predictions);let failed=false;
  predictions.forEach((p,i)=>{if(p.blocked)event(s,'facility_effect',{id:'board',lane:i,amount:p.blocked});if(p.rack)event(s,'facility_effect',{id:'rack',lane:i,amount:p.rack});if(s.mounted[i]&&p.raw>0)s.mounted[i]=false;
   s.n[i]=Math.min(p.total,p.cap);if(p.overflow){s.overflows++;if(i===0)s.fixed[0]=false;if(i===2)s.fixed[1]=false;s.n[i]=Math.min(s.n[i],capacity(s,i));event(s,'overflow',{lane:i});if(i===1||s.overflows>=2)failed=true;}
  });
  s.tide++;s.step=0;event(s,'tide_resolved',{predictions});
  if(failed){s.phase='failed';event(s,'round_end',{reason:'overflow'});}else if(s.tide%3===0){s.phase=s.fixed.some(Boolean)?(s.tide===6?'complete':'pause'):'failed';event(s,s.phase==='pause'?'safe_pause':'round_end',{reason:s.phase});}else s.phase='play';
  return {ok:true,predictions};
 }
 if(s.phase==='pause'&&kind==='move'){
  if(s.guarded&&!canContinue(s))return {ok:false,reason:'proof_complete'};
  // Continuation requires an actual available move, not a separate "continue" button.
  if(s.dock>=3||!s.n[arg]||![0,1,2].includes(arg))return {ok:false,reason:s.dock>=3?'dock_full':'empty'};
  s.phase='play';s.segment=2;event(s,'next_segment_first_move',{lane:arg});
 }
 if(s.phase!=='play')return {ok:false,reason:s.phase};
 if(kind==='move'){
  if(![0,1,2].includes(arg)||s.n[arg]<=0||s.dock>=3)return {ok:false,reason:s.dock>=3?'dock_full':'empty'};
  s.n[arg]--;s.dock++;restore(s,arg);event(s,'move',{lane:arg});
 }else if(kind==='release'){
  if(!s.dock)return {ok:false,reason:'empty_dock'};
  const size=s.dock;
  if(size<3&&s.repair&&![0,1,2].includes(arg))return {ok:false,reason:'choose_lane'};
  s.dock=0;
  if(size===3){if(s.boards+s.mounted.filter(Boolean).length<2)s.boards++;}
  else if(s.repair){s.n[arg]=Math.max(0,s.n[arg]-size);restore(s,arg);}
  event(s,'bundle_release',{size,lane:size<3&&s.repair?arg:null});
 }else return {ok:false,reason:'unknown_action'};
 s.actions++;if(s.actions===1)event(s,'first_meaningful_move');
 s.step++;if(s.step===3){s.phase='preview';event(s,'tide_preview',{predictions:forecast(s)});}
 return {ok:true};
}
export function drain(s){return s.events.splice(0);}
export function coreOptions(s){if(s.phase!=='play'&&s.phase!=='pause'||s.phase==='pause'&&s.guarded&&!canContinue(s))return [];const a=[];if(s.dock<3)for(let i=0;i<3;i++)if(s.n[i])a.push(['move',i]);if(s.phase==='play'&&s.dock)if(s.dock===3||!s.repair)a.push(['release',null]);else for(let i=0;i<3;i++)a.push(['release',i]);return a;}
export function mountingOptions(s){const total=s.boards+s.mounted.filter(Boolean).length;const out=[];for(let mask=0;mask<8;mask++){const mounted=[0,1,2].map(i=>!!(mask&(1<<i)));const used=mounted.filter(Boolean).length;if(used<=total)out.push({mounted,boards:total-used});}return out;}
export function key(s){return JSON.stringify([s.n,s.dock,s.boards,s.mounted,s.fixed,s.step,s.tide,s.phase,s.overflows,s.repair]);}
