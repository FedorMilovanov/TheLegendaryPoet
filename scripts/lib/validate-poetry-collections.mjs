// Build-time-only public collection boundary. Structure is not owner approval or provider publication proof.
function nonempty(v){return typeof v==="string"&&v.trim().length>0;}

function publicHttps(v){return nonempty(v)&&/^https:\/\/(?:[a-z0-9-]+\.)+[a-z0-9-]+(?:[/?#][^\s]*)?$/iu.test(v)&&!/\s/u.test(v);}

function validTimestamp(v){
  if(typeof v!=="string")return false;
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(v);
  if(!m)return false;
  const [,y,mo,d,h,mi,s,z]=m;
  if(+y<1900||+mo<1||+mo>12||+d<1||+h>23||+mi>59||+s>59||/^[+-]14:(?!00)/.test(z))return false;
  return +d<=new Date(Date.UTC(+y,+mo,0)).getUTCDate()&&Number.isFinite(Date.parse(v));
}

function collectionReleaseIssues(c){
  const issues=[];
  for(const field of ["title","description","cover","coverAlt","coverCredit"])if(!nonempty(c[field]))issues.push({entry:"",message:"missing collection "+field});
  if(!/^https:\/\/www\.youtube\.com\/playlist\?list=[A-Za-z0-9_-]+$/.test(c.playlistUrl??""))issues.push({entry:"",message:"collection playlist must use a canonical public YouTube playlist URL"});
  if(!Array.isArray(c.entries)||!c.entries.length){issues.push({entry:"",message:"public collection must contain at least one released or scheduled entry"});return issues;}
  const videos=new Set();
  for(const e of c.entries){
    const fail=message=>issues.push({entry:e.id,message});
    for(const field of ["title","poetId","poetName","essaySlug"])if(!nonempty(e[field]))fail("missing entry "+field);
    const v=e.video;
    if(!v||!["scheduled","published"].includes(v.status))fail("public entry requires explicit scheduled or published video state");
    else{
      if(!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(v.url??""))fail("video must use a canonical public YouTube watch URL");
      else if(videos.has(v.url))fail("duplicate video in collection");else videos.add(v.url);
      const field=v.status==="scheduled"?"scheduledFor":"publishedAt",other=v.status==="scheduled"?"publishedAt":"scheduledFor";
      if(!validTimestamp(v[field]))fail("invalid or missing "+field+" (timezone required)");
      if(Object.prototype.hasOwnProperty.call(v,other))fail("video state contains conflicting "+other);
    }
    if(!Array.isArray(e.sources)||!e.sources.length){fail("public entry requires literary sources");continue;}
    for(const s of e.sources){
      for(const field of ["title","date","fragment"])if(!nonempty(s[field]))fail("source "+s.id+": missing "+field);
      if(!publicHttps(s.url))fail("source "+s.id+": invalid public HTTPS edition URL");
      if(s.prose===true?!!s.poemId:!nonempty(s.poemId))fail("source "+s.id+": distinguish prose from a linked canonical poem");
    }
  }
  return issues;
}

// Mirror the actual Music page and collection component anchor namespace.
function collectionAnchorIssues(collections){
  const anchors=new Map([
    ["poetry-collections","collection section"],
    ["poetry-collections-title","collection section heading"],
    ["featured-release-title","featured release heading"],
    ["upcoming-releases-title","upcoming releases heading"],
    ["release-archive-title","release archive heading"],
  ]);
  const issues=[];
  const claim=(anchor,owner)=>{
    const existing=anchors.get(anchor);
    if(existing!==undefined)issues.push({anchor,owner,existing});
    else anchors.set(anchor,owner);
  };
  for(const collection of collections){
    const id=collection.id, owner="collection "+id;
    claim(id,owner);
    claim(id+"-title",owner+" heading");
    claim(id+"-releases",owner+" releases");
    if(Array.isArray(collection.entries)){
      for(const entry of collection.entries)claim(id+"-"+entry.id,owner+" entry "+entry.id);
    }
  }
  return issues;
}

function normalizedFragment(t){return t.normalize("NFC").toLocaleLowerCase("ru-RU").replace(/\u0301/gu,"").replace(/ё/gu,"е").replace(/[^\p{L}\p{N}]+/gu," ").trim();}

function readerSourceIssues(essay,source){
  if(!essay)return [];
  const matches=essay.blocks.flatMap((b,i)=>b.type==="section"&&b.anchor==="literary-fragment-"+source.id?[i]:[]);
  if(matches.length!==1)return ["expected exactly one Reader anchor"];
  const start=matches[0],next=essay.blocks.findIndex((b,i)=>i>start&&b.type==="section");
  const content=essay.blocks.slice(start+1,next<0?undefined:next);
  const target=normalizedFragment(source.fragment??"");
  const found=content.some(b=>[b.text,b.lines].some(t=>typeof t==="string"&&target&&(" "+normalizedFragment(t)+" ").includes(" "+target+" ")));
  const cited=content.some(b=>Array.isArray(b.sourceIds)&&b.sourceIds.includes(source.id));
  return [...(found?[]:["Reader anchor does not contain its advertised literary fragment"]),...(cited?[]:["Reader anchor does not cite its mapped source"])];
}

function runCollectionContractSelfTest(){
  const fixture={id:"season",title:"Collection",description:"Description",cover:"/cover.webp",coverAlt:"Cover",coverCredit:"Editorial",playlistUrl:"https://www.youtube.com/playlist?list=PLExample",entries:[{id:"work",title:"Work",poetId:"poet",poetName:"Author",essaySlug:"essay",video:{status:"published",url:"https://www.youtube.com/watch?v=abcdefghijk",publishedAt:"2026-11-27T17:30:27+03:00"},sources:[{id:"verse",title:"Poem",date:"1840",fragment:"Новый год",url:"https://example.org/poem",poemId:"poem"},{id:"letter",title:"Letter",date:"1847 (?)",fragment:"давайте нам жизни",url:"https://example.org/letter",prose:true}]}]};
  const cases=[
    ["valid",()=>{},false],
    ["scheduled",c=>{c.entries[0].video={status:"scheduled",url:"https://www.youtube.com/watch?v=abcdefghijk",scheduledFor:"2026-12-01T19:00:00+03:00"}},false],
    ["draft",c=>c.entries[0].video.status="draft",true],
    ["private Suno",c=>c.entries[0].video.url="https://suno.com/song/private",true],
    ["playlist as clip",c=>c.entries[0].video.url=c.playlistUrl,true],
    ["missing timezone",c=>c.entries[0].video.publishedAt="2026-11-27T17:30:27",true],
    ["impossible date",c=>c.entries[0].video.publishedAt="2026-02-30T12:00:00Z",true],
    ["mixed state",c=>c.entries[0].video.scheduledFor="2026-12-01T19:00:00Z",true],
    ["duplicate video",c=>c.entries.push({...c.entries[0],id:"second"}),true],
    ["empty collection",c=>c.entries=[],true],
    ["empty map",c=>c.entries[0].sources=[],true],
    ["missing poem",c=>delete c.entries[0].sources[0].poemId,true],
    ["prose as poem",c=>c.entries[0].sources[1].poemId="poem",true],
    ["bad source protocol",c=>c.entries[0].sources[0].url="javascript:alert(1)",true],
    ["empty fragment",c=>c.entries[0].sources[0].fragment="",true],
    ["source whitespace",c=>c.entries[0].sources[0].url="https://example.org/a b",true],
    ["wrong playlist host",c=>c.playlistUrl="https://www.youtube.com.evil.example/playlist?list=PLExample",true]
  ];
  let passed=0;
  for(const [name,mutate,invalid] of cases){
    const c=JSON.parse(JSON.stringify(fixture));mutate(c);
    if((collectionReleaseIssues(c).length>0)!==invalid)throw new Error("Collection contract regression: "+name);
    passed++;
  }
  const anchorCases=[
    ["valid anchor namespace",()=>{},false],
    ["reserved section",cs=>{cs[0].id="poetry-collections"},true],
    ["reserved page heading",cs=>{cs[0].id="featured-release-title"},true],
    ["entry collides with heading",cs=>{cs[0].entries[0].id="title"},true],
    ["entry collides with releases",cs=>{cs[0].entries[0].id="releases"},true],
    ["collection collides with another entry",cs=>{cs.push({...cs[0],id:"season-work"})},true],
    ["compound entry collision",cs=>{cs[0].entries[0].id="winter-work";cs.push({...cs[0],id:"season-winter",entries:[{...cs[0].entries[0],id:"work"}]})},true],
    ["independent collections",cs=>{cs.push({...cs[0],id:"winter"})},false],
  ];
  for(const [name,mutate,invalid] of anchorCases){
    const cs=[JSON.parse(JSON.stringify(fixture))];mutate(cs);
    if((collectionAnchorIssues(cs).length>0)!==invalid)throw new Error("Collection anchor contract regression: "+name);
    passed++;
  }
  const s=fixture.entries[0].sources[0];
  const essay={blocks:[{type:"section",anchor:"literary-fragment-verse"},{type:"paragraph",text:"«Новый год!»",sourceIds:["verse"]},{type:"section",anchor:"another"},{type:"paragraph",text:"Другой текст",sourceIds:["verse"]}]};
  const rCases=[
    ["valid anchor",()=>{},false],
    ["missing anchor",e=>e.blocks[0].anchor="wrong",true],
    ["duplicate anchor",e=>e.blocks.push({...e.blocks[0]}),true],
    ["fragment outside section",e=>{e.blocks[1].text="не тот текст";e.blocks[3].text="Новый год"},true],
    ["wrong citation",e=>e.blocks[1].sourceIds=["another"],true],
    ["poem excerpt",e=>{e.blocks[1]={type:"poem",lines:"Новый год\nПришел в ночи"};e.blocks.splice(2,0,{type:"note",text:"Источник",sourceIds:["verse"]})},false]
  ];
  for(const [name,mutate,invalid] of rCases){
    const e=JSON.parse(JSON.stringify(essay));mutate(e);
    if((readerSourceIssues(e,s).length>0)!==invalid)throw new Error("Collection Reader contract regression: "+name);
    passed++;
  }
  return passed;
}

export { collectionReleaseIssues, collectionAnchorIssues, readerSourceIssues, runCollectionContractSelfTest };
