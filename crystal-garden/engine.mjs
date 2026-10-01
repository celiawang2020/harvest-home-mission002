export const BUILD='crystal-branch-1.0';
export const LIMIT=12,CAPACITY=6,GOAL=6;
export const TIPS=[{x:38,y:216},{x:107,y:232},{x:40,y:306},{x:119,y:319},{x:154,y:182},{x:228,y:184},{x:151,y:268},{x:237,y:272},{x:282,y:219},{x:350,y:242},{x:283,y:309},{x:351,y:335}];
export const HUBS=[{x:81,y:368},{x:195,y:342},{x:317,y:393}],ROOT={x:195,y:480};
export const BUD_TIPS=[1,3,4,6,9,11];
// Certified recipes are installed by the bounded offline solvability check.
export const RECIPES=[[[0,0,0],[2],[3],[2],[3,3],[0],[1,1],[2],[3,3],[2],[1,1],[3]]];
export const BUD_COLORS=[[2,1,3,3,0,1]];
export function initial(seed=20261001){let variant=Math.abs(seed)%RECIPES.length,shift=Math.abs(Math.floor(seed/RECIPES.length))%4;return{seed,variant,shift,removed:0,mature:0,tray:[0,0,0,0],cuts:0,clears:0,status:'playing',reason:null}}
export const color=(s,v)=>(v+s.shift)%4;
export function leaves(branch){return branch<3?[branch*4,branch*4+1,branch*4+2,branch*4+3]:[branch-3]}
export function alive(s,i){return !(s.removed&(1<<i))}
export function fruits(s,i){if(!alive(s,i))return[];let a=RECIPES[s.variant][i].map(v=>color(s,v)),bi=BUD_TIPS.indexOf(i);if(bi>=0&&(s.mature&(1<<bi)))a.push(color(s,BUD_COLORS[s.variant][bi]));return a}
export function nextBud(s){return BUD_TIPS.findIndex((tip,bi)=>alive(s,tip)&&!(s.mature&(1<<bi)))}
export function available(s){if(s.status!=='playing')return[];return Array.from({length:15},(_,i)=>i).filter(id=>leaves(id).some(t=>fruits(s,t).length))}
export function preview(s,branch){const ids=leaves(branch).filter(i=>alive(s,i)),harvest=ids.flatMap(i=>fruits(s,i)),count=s.tray.slice();for(const c of harvest)count[c]++;const clears=count.map(n=>Math.floor(n/3)),tray=count.map(n=>n%3),lostBuds=BUD_TIPS.filter((tip,bi)=>ids.includes(tip)&&!(s.mature&(1<<bi))).length;return{ids,harvest,clears,groups:clears.reduce((a,b)=>a+b,0),tray,residual:tray.reduce((a,b)=>a+b,0),lostBuds}}
export function cut(s,branch){if(!available(s).includes(branch))return null;const p=preview(s,branch),n={...s,tray:p.tray,cuts:s.cuts+1,clears:s.clears+p.groups};for(const i of p.ids)n.removed|=1<<i;const bud=nextBud(n);if(bud>=0)n.mature|=1<<bud;if(p.residual>CAPACITY){n.status='failed';n.reason='overflow'}else if(n.clears>=GOAL){n.status='won';n.reason='restored'}else if(n.cuts>=LIMIT){n.status='failed';n.reason='cuts'}else if(!available(n).length){n.status='failed';n.reason='empty'}return{state:n,effect:{...p,branch,bud,flowersBefore:Math.floor(s.clears/2),flowersAfter:Math.min(3,Math.floor(n.clears/2))}}}
export function summary(s){return{seed:s.seed,tree:TIPS.map((_,i)=>({id:i,alive:alive(s,i),fruit:fruits(s,i)})),tray:s.tray.slice(),cuts:s.cuts,remainingCuts:LIMIT-s.cuts,clears:s.clears,flowers:Math.min(3,Math.floor(s.clears/2)),buds:BUD_TIPS.map((tip,bi)=>({tip,color:color(s,BUD_COLORS[s.variant][bi]),status:!alive(s,tip)?'forfeited_or_harvested':s.mature&(1<<bi)?'mature':'future'})),nextBud:nextBud(s),status:s.status,reason:s.reason}}
export function branchSegment(id){return id<3?[ROOT,HUBS[id]]:[HUBS[Math.floor((id-3)/4)],TIPS[id-3]]}
export function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
export function pick(s,from,to){let best=null;const len=Math.hypot(to.x-from.x,to.y-from.y);if(len<10)return null;for(let j=0;j<=Math.ceil(len/5);j++){let q=j/Math.ceil(len/5),p={x:from.x+(to.x-from.x)*q,y:from.y+(to.y-from.y)*q};for(const id of available(s)){let [a,b]=branchSegment(id),trimA={x:a.x+(b.x-a.x)*.22,y:a.y+(b.y-a.y)*.22},trimB={x:a.x+(b.x-a.x)*.75,y:a.y+(b.y-a.y)*.75},d=distance(p,trimA,trimB);if(d<12&&(!best||q<best.q||q===best.q&&d<best.d))best={id,q,d}}if(best)break}return best?.id??null}
