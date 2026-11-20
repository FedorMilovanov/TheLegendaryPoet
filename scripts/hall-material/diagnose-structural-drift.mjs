#!/usr/bin/env node
// Forensic-only witness. Never promotes or changes accepted Hall authority.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const evidenceDir = path.resolve(process.env.HALL_MATERIAL_SPIKE_EVIDENCE || 'qa-artifacts/hall-material-spike');
const policyPath = path.join(root, 'docs/hall-v3/material-gate-promotion.json');
const reportPath = path.join(evidenceDir, 'structural-drift-diagnostic.json');
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const same = (a, b) => a === b;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
function glb(file) {
  const bytes = fs.readFileSync(file);
  assert(bytes.length >= 20 && bytes.toString('ascii',0,4)==='glTF', file+' is not GLB');
  assert(bytes.readUInt32LE(8)===bytes.length,file+' GLB header length mismatch');
  let offset=12;
  while(offset+8<=bytes.length){
    const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4);
    const start=offset+8, end=start+length;
    assert(end<=bytes.length,file+' malformed chunk bounds');
    if(type===0x4e4f534a){
      const jsonBytes=bytes.subarray(start,end);
      return {bytes,jsonBytes,json:JSON.parse(jsonBytes.toString('utf8').replace(/\u0000+$/g,'').trim())};
    }
    offset=end;
  }
  throw new Error(file+' has no GLB JSON chunk');
}
const sorted = value => Array.isArray(value) ? value.map(sorted)
  : value && typeof value==='object'
    ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,sorted(value[k])]))
    : value;
function normalizedOptimizedJson(glbJson){
  const clone=JSON.parse(JSON.stringify(glbJson));
  for(const view of clone.bufferViews||[]){
    const meshopt=view?.extensions?.EXT_meshopt_compression;
    if(meshopt){delete meshopt.byteOffset;delete meshopt.byteLength;}
  }
  return JSON.stringify(sorted(clone));
}
function summary(j){
  return {generator:j.asset?.generator,version:j.asset?.version,
    nodes:(j.nodes||[]).map(n=>n.name).filter(Boolean),
    meshCount:j.meshes?.length||0,materialNames:(j.materials||[]).map(m=>m.name),
    cameraCount:j.cameras?.length||0,textureCount:j.textures?.length||0,
    accessorCount:j.accessors?.length||0,bufferViewCount:j.bufferViews?.length||0,
    extensionsUsed:j.extensionsUsed||[],extensionsRequired:j.extensionsRequired||[],
    attributeSemantics:[...new Set((j.meshes||[]).flatMap(m=>(m.primitives||[]).flatMap(p=>Object.keys(p.attributes||{}))))].sort()};
}
function main(){
  const promotion=JSON.parse(fs.readFileSync(policyPath,'utf8'));
  const policy=promotion.reproductionPolicy;
  const raw=glb(path.join(evidenceDir,'material-spike-raw.glb'));
  const optimized=glb(path.join(evidenceDir,'material-spike-optimized.glb'));
  const source=JSON.parse(fs.readFileSync(path.join(evidenceDir,'source-evidence.json'),'utf8'));
  assert(digest(raw.bytes)===source.files?.rawGlb?.sha256,'raw GLB source-evidence hash mismatched');
  assert(raw.bytes.length===source.files?.rawGlb?.bytes,'raw GLB source-evidence length mismatched');
  const stable=Object.entries(policy.acceptedHistoricalGeneratedEvidence||{}).map(([file,expected])=>{
    const actual=digest(fs.readFileSync(path.join(evidenceDir,file)));
    return {file,expected,actual,matches:actual===expected};
  });
  const rawJson=digest(raw.jsonBytes);
  const optJson=digest(Buffer.from(normalizedOptimizedJson(optimized.json),'utf8'));
  const accepted={rawBytes:policy.rawGlb.expectedBytes,rawJsonSha256:policy.rawGlb.jsonChunkSha256,
    optimizedBytes:policy.optimizedGlb.expectedBytes,normalizedOptimizedJsonSha256:policy.optimizedGlb.normalizedJsonSha256};
  const actual={rawBytes:raw.bytes.length,rawJsonSha256:rawJson,
    optimizedBytes:optimized.bytes.length,normalizedOptimizedJsonSha256:optJson};
  const drift=Object.entries(accepted).filter(([k,v])=>!same(actual[k],v)).map(([key,expected])=>({key,expected,actual:actual[key]}));
  const report={schemaVersion:1,purpose:'diagnostics-only-not-a-release-authority',
    sourceAuthority:'docs/hall-v3/material-gate-promotion.json',
    frozenHistoricArtifactId:promotion.acceptedHistoricalEvidence?.artifactId,
    currentEvidence:{sourceIdentitySelfMatched:true,historicalGeneratedEvidenceComparison:stable,
      rawGlb:{size:raw.bytes.length,sha256:digest(raw.bytes),summary:summary(raw.json)},
      optimizedGlb:{size:optimized.bytes.length,sha256:digest(optimized.bytes),summary:summary(optimized.json)}},
    accepted,actual,drift,readyToPromote:false,
    limitation:'Original approved GLB JSON must be inspected or independently approved before changing frozen accepted structural hashes.'};
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log('Hall frozen GLB diagnostic:',JSON.stringify({drift,historicalFileCount:stable.length,historicalDifferences:stable.filter(x=>!x.matches).map(x=>x.file),rawGenerator:raw.json.asset?.generator,optimizedGenerator:optimized.json.asset?.generator}));
  // Historical artifact SHA values are forensic claims, not current-byte determinism. The mandatory frozen-schema validator still determines gate status.
  if(drift.length)console.warn('Structural drift remains HOLD. Final post-material authority validator must fail until resolved.');
}
try{main();}catch(error){console.error(error.stack||String(error));process.exit(1);}
