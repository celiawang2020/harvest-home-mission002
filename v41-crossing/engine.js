export const BUILD='v41-b03-0.1.0';
export const LAYOUTS=Object.freeze({A:Object.freeze({SHORT:0,LONG:2}),B:Object.freeze({SHORT:1,LONG:1}),C:Object.freeze({SHORT:0,LONG:1})});
export class Game{
 constructor(seed='C'){this.seed=LAYOUTS[seed]?seed:'C';this.phase='FIRST';this.plate='ROOF';this.cart='START';this.route=null;this.impacts=0;this.drag=null;}
 begin(id){if(this.drag||!['FIRST','CHOICE'].includes(this.phase))return false;this.drag={id,origin:this.plate};return true;}
 cancel(id){if(this.drag?.id!==id)return false;this.drag=null;return true;}
 drop(id,target){if(this.drag?.id!==id)return false;this.drag=null;if(this.phase==='FIRST'&&target==='FIRST_BRIDGE'){this.plate=target;this.route='FIRST';this.phase='TRAVEL';return true;}if(this.phase==='CHOICE'&&['ROOF','SHORT_BRIDGE'].includes(target)){this.plate=target;this.route=target==='ROOF'?'LONG':'SHORT';this.phase='TRAVEL';return true;}return false;}
 hit(){if(this.phase!=='TRAVEL'||this.route==='FIRST'||this.impacts>=LAYOUTS[this.seed][this.route])return null;const before=this.plate;this.impacts++;if(before==='ROOF')this.plate='BROKEN';else this.phase='LOST';return {plateBefore:before,plateAfter:this.plate,rockIndex:this.impacts};}
 finish(){if(this.phase!=='TRAVEL')return false;if(this.route==='FIRST'){this.cart='LEDGE';this.phase='CHOICE';return true;}if(this.impacts!==LAYOUTS[this.seed][this.route])return false;this.cart='HOME';this.phase='WON';return true;}
 restart(){return new Game(this.phase==='WON'?{C:'A',A:'B',B:'C'}[this.seed]:this.seed);}
}
