import {cut,step,drain} from './model.mjs';

// Read-only, single-release counterfactual. Uses the actual collision solver.
// Subsequent player cuts can change it; it never steers or writes the live world.
export function preview(state,id){
  const s=structuredClone(state);s.events=[];
  if(!cut(s,id))return null;
  const bead=s.balls.find(b=>b.id===id),points=[{x:bead.x,y:bead.y}],velocity=[bead.vx,bead.vy];
  let hit=null;
  for(let i=0;i<720;i++){
    step(s,1/180);
    const e=drain(s).find(e=>e.type==='fracture'&&e.ball===id);
    if(i%12===0||e||bead.parked)points.push({x:bead.x,y:bead.y});
    if(e){hit={panel:e.panel,x:e.x,y:e.y,seconds:(i+1)/180};break;}
    if(bead.parked)break;
  }
  return{id,velocity,points,hit,parked:bead.parked};
}
