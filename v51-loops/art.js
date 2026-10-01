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
export function createPainter(c){
  let art={cells:[],status:'LOADING'};
  function path(points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath()}
  function disk(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
  function ellipse(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
  function txt(text,x,y,size=14,color='#edf7f4',align='center',weight=600){c.font=`${weight} ${size}px system-ui`;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y)}
  function rounded(x,y,w,h,r,color,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
  function gradient(x,y,r,color){let g=c.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);g.addColorStop(0,'#fff9e7');g.addColorStop(.25,color);g.addColorStop(1,'#344968');return g}
  function glyph(x,y,n){rounded(x-10-n*4,y-8,20+n*8,16,8,'#182846d9','#ffefb68c');for(let i=0;i<n;i++)disk(x+(i-(n-1)/2)*8,y,2.2,'#fff4d2')}
  function sprite(index,x,y,w,h=w,angle=0){if(!art.atlas)return false;const s=art.cells[index%9];if(!s)return false;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(art.atlas,s.x,s.y,s.w,s.h,-w/2,-h/2,w,h);c.restore();return true}
  function shadow(x,y,r){ellipse(x+3,y+r*.92,r*.95,r*.26,'#041b2c45');ellipse(x+2,y+r*.95,r*.64,r*.14,'#0417283d')}
  function fallback(index,r){const color=COLORS[index%3];if(index<3){path([[0,-r],[r,0],[0,r],[-r,0]]);c.fillStyle=gradient(0,0,r,color);c.fill();c.strokeStyle='#fff4cc';c.stroke();path([[0,-r],[0,r],[-r,0]]);c.fillStyle='#ffffff35';c.fill();path([[-r,0],[0,-r*.36],[r,0],[0,r*.4]]);c.strokeStyle='#ffefc484';c.stroke()}
    else if(index<6){disk(0,0,r,gradient(0,0,r,color));c.strokeStyle='#fae4ad';c.lineWidth=3;c.beginPath();c.arc(0,0,r*.81,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);path([[0,-r*.65],[3,-r*.42],[0,-r*.3],[-3,-r*.42]]);c.fillStyle='#fcebbf';c.fill();c.restore()}disk(0,0,r*.23,'#45567d')}
    else{for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);ellipse(0,-r*.36,r*.43,r*.66,gradient(0,-r*.2,r,color));c.restore()}disk(0,0,r*.35,'#ffe2a2')}
  }
  function material(index,r){if(!sprite(index,0,0,r*2))fallback(index,r)}
  function body(b,s){const index=b.type==='facet'?b.slot%3:b.type==='target'?3+b.slot%3:6+(b.value-1)%3,color=COLORS[(b.slot??b.value-1)%4];shadow(b.x,b.y,b.r);c.save();c.translate(b.x,b.y);c.rotate(b.a||0);
    if(b.type==='facet'){path([[0,-b.r],[b.r,0],[0,b.r],[-b.r,0]]);c.save();c.clip();material(index,b.r);c.restore();c.strokeStyle='#fff2d3aa';c.lineWidth=1;c.stroke()}
    else if(b.type==='target'){c.save();c.beginPath();c.arc(0,0,b.r,0,Math.PI*2);c.clip();material(index,b.r);c.restore();c.strokeStyle='#f9dea8a0';c.lineWidth=1;c.beginPath();c.arc(0,0,b.r-.5,0,Math.PI*2);c.stroke()}
    else{if(b===s.grab){c.scale(1.06,.96)}material(index,b.r)}
    if(b.charged){c.strokeStyle='#fff4bc';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.arc(0,0,b.r+4,0,Math.PI*2);c.stroke();c.setLineDash([]);disk(-b.r*.3,-b.r*.3,3,'#fff')}
    if(b.badUntil>s.t){c.strokeStyle='#ff676e';c.lineWidth=3;c.beginPath();c.arc(0,0,b.r+4,0,Math.PI*2);c.stroke()}
    c.restore();if(b.value)glyph(b.x,b.y,b.value);
    if(b===s.grab){c.strokeStyle=b.value===s.need?'#b5ffe1':'#ff8791';c.lineWidth=1.5;c.beginPath();c.arc(b.x,b.y,b.r+7,0,Math.PI*2);c.stroke()}
  }
  function background(s){c.fillStyle='#163d4b';c.fillRect(0,0,390,780);if(art.scene){const im=art.scene,scale=Math.max(390/im.naturalWidth,780/im.naturalHeight),w=im.naturalWidth*scale,h=im.naturalHeight*scale;c.drawImage(im,(390-w)/2,(780-h)/2,w,h)}else{let g=c.createLinearGradient(0,0,390,780);g.addColorStop(0,'#546180');g.addColorStop(.45,'#226373');g.addColorStop(1,'#163f49');c.fillStyle=g;c.fillRect(0,0,390,780);for(let i=0;i<15;i++){let x=i%2?385:5,y=150+i*43;c.save();c.translate(x,y);c.rotate(i*.8);fallback(i%3,22+i%4*6);c.restore()}}
    const veil=c.createLinearGradient(0,0,0,780);veil.addColorStop(0,'#071d31ed');veil.addColorStop(.23,'#17324445');veil.addColorStop(.73,'#133a4435');veil.addColorStop(1,'#092439db');c.fillStyle=veil;c.fillRect(0,0,390,780);
    // Broad quiet stage, distinct from the detailed garden edge. No collision surface.
    ellipse(195,601,162,25,'#082c3e32');ellipse(195,593,155,20,'#d1ffdf0c');
    for(let i=0;i<12;i++){let x=26+(i*83)%337,y=190+(i*57+s.t*8)%420;disk(x,y,1.2,COLORS[i%4]+'7a')}
    rounded(18,18,354,158,19,'#10283eea','#f2d9a35a');rounded(23,23,344,148,15,'#17354b7d');
    txt('CRYSTAL GARDEN',34,41,9,'#f6d69d','left',700);txt(['SHEAR','IMPACT','UNION'][s.mode-1],355,41,9,'#b9d8dd','right',500);
    txt(['晶花切割','瓷光连锁','花核共生'][s.mode-1],34,75,26,'#fff7df','left',750);
    txt(['划过晶片，连续命中 5 次','从底部光核拖向目标，松手发射','把同样点数的花核拖进中心'][s.mode-1],34,99,11,'#cfdfdf','left',450);
    txt('得分',35,126,9,'#aec6d0','left',500);txt(String(s.score).padStart(3,'0'),35,152,26,'#fff1c7','left',750);
    txt('连击',351,126,9,'#aec6d0','right',500);txt('× '+s.streak,351,152,23,COLORS[s.mode%4],'right',750);
    for(let i=0;i<5;i++){let x=142+i*25;c.save();c.translate(x,141);path([[0,-5],[5,0],[0,5],[-5,0]]);c.fillStyle=i<s.successes%5?'#f9dc8c':'#4a6777';c.fill();c.restore()}
  }
  function core(s){const r=42+Math.min(s.stage,4)*15,col=COLORS[Math.min(s.stage,3)],pulse=Math.sin(s.corePulse*Math.PI),elastic=Math.sin(s.corePulse*Math.PI*2)*.065;shadow(195,315,r);
    c.save();c.translate(195,315);c.scale(1+pulse*.17+elastic,1-pulse*.13-elastic);material(6+Math.min(s.stage,2),r);
    for(let layer=0;layer<Math.min(s.stage,2);layer++){let n=layer?8:6;for(let i=0;i<n;i++){let a=i/n*Math.PI*2-Math.PI/2+layer*.15,rad=r*(layer?.92:.64);sprite(6+(layer+1)%3,Math.cos(a)*rad,Math.sin(a)*rad,layer?24:20,layer?33:28,a+Math.PI/2)}}
    c.restore();glyph(195,315,s.need);rounded(133,204,124,28,14,'#173348d9','#e6d49b88');txt('进化 '+s.stage+' · 需要 '+s.need+' 点',195,223,12,'#fff1cf');
    if(s.grab)txt(s.grab.value===s.need?'同纹 · 拖入核心':'纹路不同',195,630,13,s.grab.value===s.need?'#dbffe8':'#ffb2ad');
    for(let f of s.fusions){let q=f.age/.3,e=1-Math.pow(1-q,3),x=f.x+(195-f.x)*e,y=f.y+(315-f.y)*e;c.save();c.translate(x,y);c.rotate(f.angle);c.scale(1+Math.sin(q*Math.PI)*.7,1-Math.sin(q*Math.PI)*.55);sprite(6+(f.value-1)%3,0,0,58*(1-q));c.restore();for(let i=0;i<f.value+2;i++){let v=Math.max(0,Math.min(1,q*1.5-i*.12)),a=f.angle+v*Math.PI*1.5+i*.25,rr=(r+29)*(1-v);c.strokeStyle=COLORS[(i+f.value)%4];c.globalAlpha=1-q;c.lineWidth=2.5;c.beginPath();c.arc(195,315,Math.max(1,rr),a-.5,a);c.stroke();sprite(6+(f.value-1)%3,195+Math.cos(a)*rr,315+Math.sin(a)*rr,12*(1-v)+2,18*(1-v)+2,a);c.globalAlpha=1}}
  }
  function aim(s){for(let [a,b]of s.links){const p=s.bodies.find(n=>n.slot===a),q=s.bodies.find(n=>n.slot===b);if(!p||!q)continue;c.strokeStyle='#15384c85';c.lineWidth=5;c.beginPath();c.moveTo(p.x,p.y+3);c.lineTo(q.x,q.y+3);c.stroke();c.strokeStyle='#f6dca578';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke()}
    shadow(195,610,30);sprite(5,195,610,68);sprite(2,195,610,29);if(!art.atlas){c.save();c.translate(195,610);fallback(5,31);c.restore()}
    if(s.down&&s.prev){let dx=s.prev.x-195,dy=s.prev.y-610,d=Math.hypot(dx,dy)||1;c.setLineDash([3,9]);c.strokeStyle='#fff4c7';c.lineWidth=2;c.beginPath();c.moveTo(195,610);c.lineTo(195+dx/d*350,610+dy/d*350);c.stroke();c.setLineDash([])}
    for(let item of s.chainQueue){if(!item.from)continue;let q=Math.max(0,Math.min(1,(s.t-item.start)/(item.at-item.start))),x=item.from.x+(item.b.x-item.from.x)*q,y=item.from.y+(item.b.y-item.from.y)*q;c.save();c.shadowBlur=10;c.shadowColor='#ffd576';c.strokeStyle='#ffe9a3';c.lineWidth=3;c.beginPath();c.moveTo(item.from.x,item.from.y);c.lineTo(x,y);c.stroke();disk(x,y,4,'#fffbe6');c.restore()}
    for(let sh of s.shots){c.save();c.translate(sh.x,sh.y);c.rotate(Math.atan2(sh.vy,sh.vx));const g=c.createLinearGradient(-35,0,8,0);g.addColorStop(0,'#ffb15a00');g.addColorStop(1,'#fff0ac');path([[-35,-2],[3,-6],[9,0],[3,6],[-35,2]]);c.fillStyle=g;c.fill();c.restore();sprite(2,sh.x,sh.y,16)}
  }
  function pieces(s){for(let p of s.pieces){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=Math.min(1,(p.life-p.age)/.16);path(p.points);c.save();c.clip();c.save();c.rotate(p.textureAngle||0);material(p.skin??(p.kind==='cut'?0:3),p.radius||30);c.restore();c.restore();path(p.points);c.strokeStyle=p.kind==='cut'?'#edfff5d0':'#ffe0ac';c.lineWidth=p.kind==='cut'?1:1.7;c.stroke();c.restore()}}
  function effects(s){pieces(s);let j=0;for(let p of s.fx){const q=1-p.age/p.life;c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));c.globalAlpha=q;const col=COLORS[j++%4];if(j%3===0){path([[-p.r*2,0],[0,-p.r],[p.r*2,0],[0,p.r]]);c.fillStyle=col;c.fill()}else{c.strokeStyle=j%2?col:'#fff0c4';c.lineWidth=Math.max(1,p.r*.65);c.beginPath();c.moveTo(-p.r*2,0);c.lineTo(p.r,0);c.stroke()}c.restore()}
    for(let ring of s.rings){const q=ring.age/.5;c.save();c.translate(ring.x,ring.y);c.globalAlpha=(1-q)*.8;if(ring.big){for(let i=0;i<12;i++){c.save();c.rotate(i*Math.PI/6+q*.3);const d=15+q*105;path([[0,-d-14],[4,-d],[0,-d+8],[-4,-d]]);c.fillStyle=COLORS[i%4];c.fill();c.restore()}c.strokeStyle='#fff1bb';c.lineWidth=2;c.beginPath();c.arc(0,0,20+q*85,0,Math.PI*2);c.stroke()}else{c.strokeStyle='#fff5d3';c.lineWidth=2*(1-q);c.beginPath();c.arc(0,0,5+q*28,0,Math.PI*2);c.stroke()}c.restore()}
    if(s.trail.length>1&&s.mode===1){for(let width of[9,3]){c.strokeStyle=width===9?'#9bfbe858':'#fffbe4';c.lineWidth=width;c.lineCap='round';c.beginPath();s.trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}}
    for(let l of s.labels){let q=l.age/.75;c.save();c.globalAlpha=Math.min(1,(1-q)*2);let y=l.y-q*36;if(!l.text.startsWith('+')){rounded(l.x-57,y-23,114,32,12,'#173144d9','#ffe6a67e');txt(l.text,l.x,y,16,'#fff0b7')}else{c.shadowColor='#193348';c.shadowBlur=3;txt(l.text,l.x,y,19,'#fff7dc','center',800)}c.restore()}
  }
  return {setArt(value){art=value},draw(s){c.save();background(s);c.save();if(s.shake>0)c.translate(Math.sin(s.t*113)*s.shake,Math.cos(s.t*97)*s.shake*.5);if(s.mode===2)aim(s);if(s.mode===3)core(s);for(let b of s.bodies)if(s.t>=b.born||b.born===undefined)body(b,s);effects(s);c.restore();if(s.missFlash>0){c.globalAlpha=s.missFlash/.22;c.strokeStyle='#ff9090';c.lineWidth=3;c.strokeRect(16,182,358,450);c.globalAlpha=1}rounded(80,651,230,35,17,'#122d41cb','#bdd3ca2b');txt('已行动 '+s.inputNo+' 次   ·   共鸣 '+s.stage,195,673,12,'#ddeade');txt(art.status==='FALLBACK'?'资源加载失败 · 当前为备用画面':'CRYSTAL GARDEN  /  VISUAL REPAIR',195,704,8,art.status==='FALLBACK'?'#ffbd9f':'#b7cecc','center',500);c.restore()}};
}
