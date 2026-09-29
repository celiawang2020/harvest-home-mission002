export const BUILD='m002-harvest-0.1.0';
export const SIZE=6;
export const CROPS=['wheat','carrot','flower'];
export const GOALS=[6,6,6];
export const SHAPES=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]]];
export function random(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createGame(seed=Date.now(),saved=null){
 const g={seed,board:Array(36).fill(null),hand:[],repaired:[false,false,false],progress:[0,0,0],charge:[0,0,0],tools:[0,0,0],moves:0,total:0,season:1,rng:random(seed),ended:false};
 if(saved&&saved.version===1&&Array.isArray(saved.repaired)&&saved.repaired.length===3){g.repaired=saved.repaired.map(Boolean);g.season=Math.max(1,Math.min(9999,Number(saved.season)||1));g.tools=g.repaired.map(v=>v?1:0);}
 seedBoard(g);return g;
}
function seedBoard(g){
 // A legible authored opening, not a scripted harvest: the user must choose/place.
 const start={24:'wheat',25:'wheat',26:'wheat',18:'flower',19:'carrot',20:'carrot',21:'carrot',22:'carrot',12:'flower',13:'flower',14:'flower',15:'carrot',6:'wheat',7:'carrot'};
 for(const [i,c] of Object.entries(start))g.board[+i]=c;
 g.hand=[{crop:'wheat',cells:[[0,0],[1,0],[2,0]]},{crop:'carrot',cells:[[0,0],[0,1]]},{crop:'flower',cells:[[0,0],[1,0]]}];
}
export function cellsAt(piece,x,y){return piece.cells.map(([dx,dy])=>[x+dx,y+dy]);}
export function canPlace(g,piece,x,y){return !!piece&&Number.isInteger(x)&&Number.isInteger(y)&&cellsAt(piece,x,y).every(([a,b])=>a>=0&&a<6&&b>=0&&b<6&&!g.board[b*6+a]);}
export function fullLines(board){const rows=[],cols=[],indices=new Set();for(let a=0;a<6;a++){if(Array.from({length:6},(_,b)=>board[a*6+b]).every(Boolean)){rows.push(a);for(let b=0;b<6;b++)indices.add(a*6+b);}if(Array.from({length:6},(_,b)=>board[b*6+a]).every(Boolean)){cols.push(a);for(let b=0;b<6;b++)indices.add(b*6+a);}}return{rows,cols,indices:[...indices]};}
function reap(g,indices,fromTool=false){const counts=[0,0,0],cleared=[],repairs=[],charged=[];for(const i of new Set(indices)){if(!g.board[i])continue;counts[CROPS.indexOf(g.board[i])]++;cleared.push({i,crop:g.board[i]});g.board[i]=null;}
 counts.forEach((n,k)=>{if(!n)return;g.total+=n;if(!g.repaired[k]){g.progress[k]+=n;if(g.progress[k]>=GOALS[k]){g.repaired[k]=true;g.progress[k]=GOALS[k];g.tools[k]=1;repairs.push(k);}}else if(!fromTool){g.charge[k]+=n;if(g.charge[k]>=6){if(g.tools[k]===0){g.tools[k]=1;charged.push(k);}g.charge[k]%=6;}}});return{counts,cleared,repairs,charged};}
export function deal(g){return Array.from({length:3},()=>({crop:CROPS[Math.floor(g.rng()*3)],cells:SHAPES[Math.floor(g.rng()*SHAPES.length)].map(c=>[...c])}));}
export function place(g,slot,x,y){if(g.ended)return{ok:false,reason:'ended'};const p=g.hand[slot];if(!canPlace(g,p,x,y))return{ok:false,reason:'occupied_or_outside'};const planted=cellsAt(p,x,y).map(([a,b])=>b*6+a);planted.forEach(i=>g.board[i]=p.crop);g.hand[slot]=null;g.moves++;const lines=fullLines(g.board),out=reap(g,lines.indices);if(g.hand.every(p=>!p))g.hand=deal(g);return{ok:true,planted,...lines,...out};}
export function useTool(g,k,target){if(g.ended||g.tools[k]!==1)return{ok:false,reason:'unavailable'};
 if(k===0){const choices=g.hand.map((p,i)=>({p,i})).filter(x=>x.p&&x.p.cells.length>1).sort((a,b)=>b.p.cells.length-a.p.cells.length);if(!choices.length)return{ok:false,reason:'already_small'};const slot=choices[0].i;g.hand[slot]={...g.hand[slot],cells:[[0,0]]};g.tools[k]=0;g.moves++;return{ok:true,slot,cleared:[],repairs:[],charged:[],counts:[0,0,0]};}
 if(!Number.isInteger(target)||target<0||target>35)return{ok:false,reason:'target'};
 let indices=[];
 if(k===1){const x=Math.min(4,target%6),y=Math.min(4,Math.floor(target/6));indices=[y*6+x,y*6+x+1,(y+1)*6+x,(y+1)*6+x+1];}
 else{const crop=g.board[target];if(!crop)return{ok:false,reason:'empty'};indices=g.board.flatMap((c,i)=>c===crop?[i]:[]);}
 if(!indices.some(i=>g.board[i]))return{ok:false,reason:'empty'};g.tools[k]=0;g.moves++;return{ok:true,...reap(g,indices,true)};
}
export function hasMove(g){return g.hand.some(p=>p&&g.board.some((_,i)=>canPlace(g,p,i%6,Math.floor(i/6))));}
export function canAct(g){return hasMove(g)||(g.tools[0]&&g.hand.some(p=>p&&p.cells.length>1)&&g.board.some(c=>!c))||((g.tools[1]||g.tools[2])&&g.board.some(Boolean));}
export function snapshot(g){return{version:1,repaired:[...g.repaired],season:g.season+1};}
