// Presentation only. No game-state mutation, input routing, score or collision rules.
const COLORS=['#ad8aff','#ff8e83','#f3c768','#64d9cf'];
export async function loadArt(){
  const read=src=>new Promise(resolve=>{const image=new Image();let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);resolve({src,image:ok?image:null,ok})};const timer=setTimeout(()=>finish(false),12000);image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=src});
  const [atlas,scene]=await Promise.all([read('assets/atlas.png'),read('assets/scene.png')]);
  const cells=[];
  // Alpha-verified source rectangles. Generated row spacing is NOT an exact 418px grid.
  // Two transparent pixels preserve antialiasing without taking pixels from the next row.
  if(atlas.ok)for(const [x,y,w,h] of [[66,52,335,343],[459,52,336,343],[851,52,336,343],[51,439,360,354],[445,438,361,355],[838,439,361,354],[58,823,342,361],[456,832,341,351],[855,830,343,354]])cells.push({x:x-2,y:y-2,w:w+4,h:h+4});
  return {atlas:atlas.image,scene:scene.image,cells,status:atlas.ok&&scene.ok?'READY':'FALLBACK',failed:[atlas,scene].filter(x=>!x.ok).map(x=>x.src)};
}
