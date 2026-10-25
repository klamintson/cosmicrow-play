const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script id="skStoryGameplay">([\s\S]*?)<\/script>/)[1];
function scenario(){
 const nodes=new Map(),cls=()=>{const s=new Set();return{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x),toggle:(x,v)=>v?s.add(x):s.delete(x)}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:cls(),style:{setProperty(){}},querySelector:()=>({style:{setProperty(){}}})});return nodes.get(id)};
 const body={classList:cls()};body.classList.add('inrace');
 const listeners={};let frame,t=0;
 const document={body,getElementById:node,querySelector:q=>q==='.stagecard.sel'?{getAttribute:()=>'skalavik'}:null,
  addEventListener:(n,f)=>listeners[n]=f};
 vm.runInNewContext(script,{document,requestAnimationFrame:f=>frame=f,performance:{now:()=>t}});
 const row=d=>{node('hDist').textContent=d+' m';t+=200;frame(t);frame(t)};
 return{node,row,fire:(n,detail)=>listeners[n]&&listeners[n]({detail}),objective:()=>node('skMissionObjective').textContent,who:()=>node('skRadioWho').textContent};
}
test('objective never says MISSION COMPLETE while the finale is still ahead',()=>{
 const g=scenario();for(let d=0;d<=1900;d+=10)g.row(d);
 assert.doesNotMatch(g.objective(),/MISSION COMPLETE/);
});
test('objective follows the story after the harbour falls',()=>{
 const g=scenario();for(let d=0;d<=1500;d+=10)g.row(d);assert.match(g.objective(),/CAPTURED/);
 for(let d=1510;d<=1800;d+=10)g.row(d);assert.match(g.objective(),/TRACTOR BEAM/);
});
test('comet result reaches the story radio',()=>{
 const g=scenario();for(let d=0;d<=800;d+=10)g.row(d);
 g.fire('cosmicrow:comet-result',{success:true});assert.match(g.objective(),/BLOCKADE BROKEN/);
 g.fire('cosmicrow:comet-result',{success:false});assert.match(g.objective(),/MISSED/);
});
test('TJ rescue result reaches the story radio',()=>{
 const g=scenario();for(let d=0;d<=1900;d+=10)g.row(d);
 g.fire('cosmicrow:v9-rescue',{success:true});assert.match(g.objective(),/RELEASED/);assert.equal(g.who(),'TJ PACER');
 g.fire('cosmicrow:v9-rescue',{success:false});assert.match(g.objective(),/INCOMPLETE/);
});
