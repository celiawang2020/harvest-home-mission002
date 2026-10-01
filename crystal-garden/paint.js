import{LIMIT,CAPACITY,GOAL,TIPS,HUBS,ROOT,BUD_TIPS,BUD_COLORS,color,alive,fruits,nextBud,available,branchSegment,preview}from'./engine.mjs';
export const COLORS=['#ff976c','#72ead3','#c095ff','#ffe18b'];
export function fruitPoints(s,tip){const p=TIPS[tip],a=fruits(s,tip);return a.map((type,i)=>({type,x:p.x+(i-(a.length-1)/2)*19,y:p.y+(i%2?3:-2),r:12}))}
export function createPainter(c,art){
  const disk=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()},ellipse=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
  function round(x,y,w,h,r,col,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
  function text(s,x,y,n=13,col='#fff1cf',align='center',weight=600){c.textAlign=align;c.font=`${weight} ${n}px system-ui`;c.fillStyle=col;c.fillText(s,x,y)}
  function sprite(id,x,y,w,h=w,angle=0){if(!art.atlas){disk(x,y,w/2,COLORS[id%4]);return}let p=art.cells[id];c.save();c.translate(x,y);c.rotate(angle);c.drawImage(art.atlas,p.x,p.y,p.w,p.h,-w/2,-h/2,w,h);c.restore()}
  function fruit(type,x,y,r=12,alpha=1,angle=0){c.save();c.globalAlpha=alpha;ellipse(x+2,y+r*.8,r*.8,r*.24,'#06182e55');sprite([0,1,2,5][type],x,y,r*2,r*2,angle);c.restore()}
  function flower(x,y,level,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);if(!level){sprite(8,0,0,23);c.globalAlpha=.45;disk(0,0,13,'#193646');c.globalAlpha=1}else{for(let i=0;i<6;i++){let a=i*Math.PI/3; sprite(6+(level%2),Math.cos(a)*11,Math.sin(a)*11,13,21,a+Math.PI/2)}sprite(2,0,0,16)}c.restore()}
  function poly(points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath()}
  function branch(a,b,width,highlight=false){c.lineCap='round';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#07283d94';c.lineWidth=width+4;c.stroke();c.strokeStyle=highlight?'#ffe6a1':'#a6936c';c.lineWidth=width;c.stroke();c.strokeStyle=highlight?'#ffffe2':'#d6c396';c.lineWidth=2;c.stroke()}
  function tray(list,y=616,ghost=false){for(let i=0;i<CAPACITY;i++){let x=50+i*58;round(x-23,y-25,46,48,12,'#142f44e6','#c4bc8a77');if(list[i]!==undefined)fruit(list[i],x,y,18,ghost?.7:1)}if(list.length>6){for(let i=6;i<list.length;i++)fruit(list[i],50+(i-6)*58,y+45,16);text('溢出',345,y+48,11,'#ffb4a0','right')}}
  function flatten(counts){return counts.flatMap((n,i)=>Array(n).fill(i))}
  return{draw({state:s,time,selected,pointer,path,transition,terminalTime,resumed}){
    const im=art.scene;c.fillStyle='#183d4c';c.fillRect(0,0,390,780);if(im)c.drawImage(im,0,0,390,780);let g=c.createLinearGradient(0,0,0,780);g.addColorStop(0,'#07243ce6');g.addColorStop(.22,'#082d3d32');g.addColorStop(.69,'#092a3a25');g.addColorStop(1,'#071f35ba');c.fillStyle=g;c.fillRect(0,0,390,780);
    round(14,15,362,125,17,'#102c40ed','#e8d49a70');text('晶枝花园',30,47,25,'#fff1c9','left',750);text('划断树枝 · 三颗同纹成组 · 开出三朵花',30,72,12,'#c4dddc','left',500);
    for(let i=0;i<3;i++)flower(262+i*40,111,s.clears>=(i+1)*2?1:0,s.clears===(i+1)*2&&transition?1+.08*Math.sin(time*16):1);
    text('余 '+Math.max(0,LIMIT-s.cuts)+' 剪',31,112,20,'#ffe6a6','left',700);text(Math.min(GOAL,s.clears)+' / '+GOAL+' 组',150,110,14,'#b3e8dd','left');text('每2组开1花',150,130,12,'#e2eddd','left');
    const next=nextBud(s);if(next>=0){text('下一芽',30,158,11,'#daeee8','left');fruit(color(s,BUD_COLORS[s.variant][next]),83,154,9);text('每剪成熟一芽 · 剪走就失去',358,158,11,'#c5ddd7','right',450)}
    // A permanent rooted tree: removed descendants are never redrawn or respawned.
    branch({x:195,y:520},ROOT,16);for(let group=0;group<3;group++){const [a,b]=branchSegment(group),live=[0,1,2,3].some(j=>alive(s,group*4+j));if(live)branch(a,b,11,selected===group);else{const p={x:a.x+(b.x-a.x)*.23,y:a.y+(b.y-a.y)*.23};branch(a,p,10);ellipse(p.x,p.y,7,3,'#fce5b1')}}
    for(let i=0;i<12;i++){let [a,b]=branchSegment(i+3);if(alive(s,i))branch(a,b,6,selected===i+3||selected===Math.floor(i/4));else if([0,1,2,3].some(j=>alive(s,Math.floor(i/4)*4+j))){let p={x:a.x+(b.x-a.x)*.22,y:a.y+(b.y-a.y)*.22};branch(a,p,5);ellipse(p.x,p.y,4,2,'#ffe4b3')}}
    for(let i=0;i<12;i++)for(let p of fruitPoints(s,i))fruit(p.type,p.x,p.y,p.r);
    for(let bi=0;bi<BUD_TIPS.length;bi++){let i=BUD_TIPS[bi];if(!alive(s,i)||(s.mature&(1<<bi)))continue;let p=TIPS[i],x=p.x+11,y=p.y+23;fruit(color(s,BUD_COLORS[s.variant][bi]),x,y,8,.55);c.strokeStyle=bi===next?'#ffebac':'#a2ccb38a';c.lineWidth=bi===next?2:1;c.beginPath();c.arc(x,y,11,0,Math.PI*2);c.stroke();text(String(bi+1),x,y+3,8,'#fff5cc')}
    // Grounded living flower bed is also the earned objective, not arbitrary confetti.
    ellipse(195,534,110,12,'#183e4059');for(let i=0;i<3;i++){ellipse(137+i*58,531,17,5,'#ceaf79a3');flower(137+i*58,520,s.clears>=(i+1)*2?1:0,1.3)}
    let show=s.tray,animation=transition?(time-transition.start):0;
    if(transition&&animation<.38)show=transition.before.tray;
    text(selected!==null?'松手后的盘':'收集盘',28,567,12,'#f0e4bc','left');text('同纹三颗自动合成，先消组再看容量',361,567,11,'#d4e7df','right',450);
    tray(flatten(show));
    if(selected!==null&&s.status==='playing'&&!transition){const p=preview(s,selected),danger=p.residual>CAPACITY;for(const i of p.ids)for(const f of fruitPoints(s,i)){c.strokeStyle=danger?'#ffac99':'#fff3bb';c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,f.r+3,0,Math.PI*2);c.stroke()}
      tray(flatten(p.tray),616,true);for(const bi of BUD_TIPS.map((_,i)=>i)){let tip=BUD_TIPS[bi];if(p.ids.includes(tip)&&!(s.mature&(1<<bi))){let b=TIPS[tip];c.strokeStyle='#ffb5a0';c.lineWidth=2;c.beginPath();c.moveTo(b.x+3,b.y+15);c.lineTo(b.x+19,b.y+31);c.moveTo(b.x+19,b.y+15);c.lineTo(b.x+3,b.y+31);c.stroke()}}
      round(24,680,342,42,13,danger?'#592b36eb':'#153c4bea',danger?'#ffa994':'#d8dea0');const harvest=p.harvest;harvest.slice(0,10).forEach((v,i)=>fruit(v,43+i*19,695,7));text(p.groups?'合 '+p.groups+' 组':'暂存',347,698,12,'#fff2c5','right');text((danger?p.residual+' / 6 槽 · 会溢出！':'剩 '+p.residual+' / 6 槽')+(p.lostBuds?' · 放弃 '+p.lostBuds+' 个芽':''),195,716,13,danger?'#ffd1bb':'#dff5db')
    }else if(!transition&&s.status==='playing'){text(resumed?'已继续上次花园 · 下方可重新开始':'小枝留余地，大枝收整簇',195,690,12,'#d3e7da','center',450)}
    if(path.length>1){c.strokeStyle='#adf7e774';c.lineWidth=8;c.lineCap='round';c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.strokeStyle='#fff5dc';c.lineWidth=2;c.stroke()}
    if(transition){const tr=transition,e=tr.effect,q=Math.min(1,animation/.36);for(let i=0;i<tr.drop.length;i++){let f=tr.drop[i],tx=50+(i%6)*58,ty=616-10*Math.floor(i/6),v=q*q;fruit(f.type,f.x+(tx-f.x)*v,f.y+(ty-f.y)*v-34*Math.sin(q*Math.PI),12+6*q,Math.max(0,1-Math.max(0,animation-.3)/.22),q*(i%2?1:-1)*.8)}
      const [a,b]=branchSegment(e.branch),mx=a.x+(b.x-a.x)*.48,my=a.y+(b.y-a.y)*.48;for(let i=0;i<10;i++){const d=animation*(50+i*10),ang=i*2.399;c.save();c.translate(mx+Math.cos(ang)*d,my+Math.sin(ang)*d+animation*animation*60);c.rotate(ang);c.globalAlpha=Math.max(0,1-animation/.6);poly([[-5,0],[0,-2],[5,0],[0,2]]);c.fillStyle=i%2?'#fbeac8':'#aa9065';c.fill();c.restore()}
      if(animation>.22&&e.groups){let p=Math.min(1,(animation-.22)/.4);for(let cl=0;cl<4;cl++)for(let k=0;k<e.clears[cl];k++){let cx=85+(cl%3)*110,cy=614;for(let i=0;i<3;i++){let ang=i*Math.PI*2/3+p*2;fruit(cl,cx+Math.cos(ang)*(1-p)*32,cy+Math.sin(ang)*(1-p)*22,14*(1-p)+3,1-p)}sprite(6+cl%3,cx,cy,28*Math.sin(p*Math.PI))}round(109,644,172,28,12,'#1c3d4de8','#ecd59b');text('合成 '+e.groups+' 组 · 空出 '+e.groups*3+' 格',195,663,12,'#fff0bd')}
      if(e.flowersAfter>e.flowersBefore&&animation>.35){let p=(animation-.35)/.4;c.save();c.globalAlpha=Math.max(0,1-p*.6);text(e.groups>=2?'整簇绽放！':'花开了',195,446,26,'#fff1b5','center',800);for(let i=0;i<14;i++){let a=i*Math.PI/7; sprite(6+i%3,195+Math.cos(a)*p*100,446+Math.sin(a)*p*45,10,19,a)}c.restore()}
    }
    if(s.status!=='playing'&&!transition){c.fillStyle='#061c3070';c.fillRect(0,145,390,590);round(35,280,320,196,24,'#12334ef5','#eedda0');text(s.status==='won'?'花园重新绽放':'这次没能开满花',195,326,26,'#fff0c6','center',750);for(let i=0;i<3;i++)flower(155+i*40,368,s.clears>=(i+1)*2?1:0,1.25);text(s.status==='won'?'你留住了余地，也收下了整簇':s.reason==='overflow'?'消组后仍有 '+s.tray.reduce((a,b)=>a+b,0)+' 颗，超过六槽':s.reason==='empty'?'树已剪空，未成熟的芽也随枝失去':'剪数用尽，还有花没开',195,414,12,'#d8e7df');text('同树再试，换个收取顺序',195,447,13,'#f6dbaa')}
    if(art.status!=='READY')text('素材未加载完整 · 备用画面',195,724,10,'#ffc7a2');
  }};
}
