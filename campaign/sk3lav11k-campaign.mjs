/* CosmicRow SK3LAV11K campaign logic. Pure JS, no DOM and no simulated PM5 data. */
export const CHAPTERS = [
  {id:1,name:"The Last Signal",start:0,end:200,job:"Stroke to turn home"},
  {id:2,name:"First Contact",start:200,end:500,job:"Hold formation"},
  {id:3,name:"Arcade Comet",start:500,end:1000,job:"Hold, surge, break"},
  {id:4,name:"The Return",start:1000,end:1200,job:"Hold the corridor"},
  {id:5,name:"The Defender",start:1200,end:1400,job:"Match TJ's line"},
  {id:6,name:"Iron Rain",start:1400,end:1550,job:"Two ten-stroke surges"},
  {id:7,name:"Broken Formation",start:1550,end:1700,job:"Sustain in silence"},
  {id:8,name:"Skálhøvdi",start:1700,end:1830,job:"Hold steady for Echo"},
  {id:9,name:"Warden-9",start:1830,end:2000,job:"Break shields and strike"}
];
export const EVENTS = [
  [0,"blackout"],[200,"formation"],[500,"comet"],[670,"comet-surge-one"],
  [735,"comet-surge-two"],[1000,"home"],[1200,"tj-pacer"],
  [1400,"iron-rain"],[1550,"eclipse-hijacked"],[1700,"beacon-rescue"],
  [1780,"eclipse-freed"],[1830,"skálhøvdi-helm"],[1990,"final-strike"],[2000,"finish"]
];
export const ECHO = {
  blackout:"Signal confirmed. SK3LAV11K.",
  formation:"Four ships answering. Stay with them.",
  comet:"Something fast. It is cutting the corridor.",
  "comet-surge-one":"Surge. Ten strokes. Now.",
  "comet-surge-two":"Surge. Ten strokes. Now.",
  home:"There. That is Skálavík.",
  "tj-pacer":"Local defender. TJ Pacer. Do not lose him.",
  "eclipse-hijacked":"Eclipse is not answering me. Hold your line.",
  "beacon-rescue":"I am reaching her through the old beacons.",
  "skálhøvdi-helm":"Warden-9 is over the harbour. Everything you have.",
  finish:"SK3LAV11K signal restored."
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=a=>{const v=[...a].sort((x,y)=>x-y);return v.length?v[Math.floor(v.length/2)]:null;};
export function createCampaign(){return {distance:0,chapter:1,events:[],samples:[],target:null,comet:{wins:[false,false,false],seen:[false,false,false],surgeMetres:0,harbourHit:false},boss:{layers:[0,0,0],burst:0,won:false},finished:false,result:null};}
export function updateCampaign(previous,reading){
  // Caller must supply cumulative metres and split from a real PM5, or explicitly opt into DEMO.
  if(!reading||!["pm5","demo"].includes(reading.source))throw Error("Explicit PM5 or DEMO source required");
  if(!Number.isFinite(reading.distance)||reading.distance<0)throw Error("Invalid rowing distance");
  const old=previous.distance,d=clamp(reading.distance,old,2000),delta=d-old;
  const pace=Number.isFinite(reading.split)&&reading.split>0?reading.split:null;
  const s={...previous,distance:d,events:[...previous.events],samples:[...previous.samples],comet:{...previous.comet,wins:[...previous.comet.wins],seen:[...previous.comet.seen]},boss:{...previous.boss,layers:[...previous.boss.layers]}};
  if(delta===0)return s; // stopping never advances any objective
  if(pace!==null&&old<1830){s.samples.push(pace);if(s.samples.length>200)s.samples.shift();}
  if(old<500&&d>=500)s.target=median(s.samples)||pace;
  s.chapter=CHAPTERS.find(c=>d>=c.start&&d<c.end)?.id||9;
  for(const [at,name] of EVENTS)if(old<=at&&d>=at&&!s.events.includes(name))s.events.push(name);
  const target=s.target||median(s.samples)||pace;
  if(target!==null&&pace!==null){
    const sections=[[500,650,0,6],[650,800,1,6],[800,1000,2,4]];
    for(const [a,b,i,tol] of sections){
      const metres=Math.max(0,Math.min(d,b)-Math.max(old,a));
      if(!metres)continue;
      s.comet.seen[i]=true;
      if(i===1){if(pace<=target-2)s.comet.surgeMetres+=metres;if(s.comet.surgeMetres>=20)s.comet.wins[i]=true;}
      else if(pace<=target+tol)s.comet.wins[i]=true;
    }
    if(d>=1000&&s.comet.wins.filter(Boolean).length<2)s.comet.harbourHit=true;
    const bossTarget=(median(s.samples)||target)-2;
    const bossMetres=Math.max(0,Math.min(d,1990)-Math.max(old,1830));
    if(bossMetres){
      const i=s.boss.layers.findIndex(v=>v<35);
      if(i>=0){
        if(pace<=bossTarget)s.boss.layers[i]=Math.min(35,s.boss.layers[i]+bossMetres);
        else s.boss.layers[i]=Math.max(0,s.boss.layers[i]-bossMetres/2);
      }else if(pace<=bossTarget)s.boss.burst=Math.min(15,s.boss.burst+bossMetres);
    }
  }
  s.boss.won=s.boss.layers.every(v=>v>=35)&&s.boss.burst>=15;
  if(d===2000){s.finished=true;s.result=s.boss.won?"victory":"defeat";}
  return s;
}
