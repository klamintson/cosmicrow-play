const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script id="skV9FinaleController">([\s\S]*?)<\/script>/)?.[1];
function scenario(){
 const nodes=new Map();const cls=()=>{const s=new Set();return {add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x),toggle:(x,v)=>v?s.add(x):s.delete(x)}};
 function node(id){if(!nodes.has(id))nodes.set(id,{textContent:'',dataset:{},style:{},classList:cls(),querySelector:()=>({style:{},textContent:''})});return nodes.get(id)}
 const fill={style:{}},caption={textContent:''};node('skV9Finale').querySelector=x=>x==='.fill'?fill:caption;
 const body={classList:cls()};body.classList.add('sk-story-active');let frame;const events=[];
 const document={body,getElementById:node,querySelector:()=>({textContent:''}),dispatchEvent:e=>events.push(e)};
 const context={document,requestAnimationFrame:f=>frame=f,MutationObserver:class{observe(){}},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}}};
 vm.runInNewContext(script,context);let time=0;
 function row(d,p='1:45.0'){node('hDist').textContent=`${d} m`;node('hSplit').textContent=p;frame(time+=200)}
 return {row,events,caption,fill};
}
test('V9 finale rescues TJ with sufficient rowing progress',()=>{const g=scenario();for(let d=0;d<=2000;d+=10)g.row(d,'1:40.0');assert.equal(g.events.length,1);assert.equal(g.events[0].detail.success,true)});
test('V9 finale fails when rowing too slowly',()=>{const g=scenario();for(let d=0;d<=2010;d+=10)g.row(d,'2:10.0');assert.equal(g.events.length,1);assert.equal(g.events[0].detail.success,false)});
test('V9 finale cannot win by remaining stationary',()=>{const g=scenario();for(let d=0;d<=1800;d+=10)g.row(d);for(let i=0;i<200;i++)g.row(1800);assert.equal(g.events.length,0)});
