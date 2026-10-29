/* Pruebas de copia/restore v2.0: portabilidad, datos completos, seguridad, merge y rollback. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Backup=require('../app/src/main/assets/respaldo.js');
const base=path.resolve(__dirname,'../app');
const html=fs.readFileSync(path.join(base,'src/main/assets/index.html'),'utf8');
const java=fs.readFileSync(path.join(base,'src/main/java/com/totemplast/prevision/MainActivity.java'),'utf8');
const css=fs.readFileSync(path.join(base,'src/main/assets/styles.css'),'utf8');
const gradle=fs.readFileSync(path.join(base,'build.gradle'),'utf8');
function example(){
  return {references:{
    'DSM 113':{reference:'DSM 113',orderPieces:6048,cavities:1,piecesPerBox:28,
      boxesPerPallet:18,measuredRateValue:67.2,measuredRateUnit:'seconds',
      fullBoxes:42,loosePieces:0,readAt:'2026-10-13T07:31:00.000Z',mode:'pallets'},
    'CHH-04':{reference:'CHH-04',piecesPerBox:240,boxesPerPallet:24,orderPieces:'',cavities:'',
      fullBoxes:0,loosePieces:0,readAt:null,mode:'pallets',informedPallets:16,informedExtraBoxes:11},
    'DSM-117':{reference:'DSM-117',piecesPerBox:18,boxesPerPallet:18,orderPieces:'',cavities:'',
      fullBoxes:0,loosePieces:0,readAt:null,mode:'pallets',informedPallets:10,informedExtraBoxes:0}
  },calendar:{holidays:['2026-12-25'],pauses:[
    {start:'2026-12-24T06:00',end:'2026-12-28T06:00',label:'Navidad'}
  ]},accessibility:{size:24,bold:true}};
}
const initial=example();
const backup=Backup.exportText(initial,new Date('2026-10-28T12:35:00Z'));
const restored=Backup.readText(backup);
assert.equal(restored.createdAt,'2026-10-28T12:35:00.000Z');
assert.equal(restored.appVersion,'2.0');
assert.deepEqual(JSON.parse(JSON.stringify(restored.data)),initial);
assert.equal(JSON.parse(backup).format,'totemplast-production-backup');
assert.equal(JSON.parse(backup).schemaVersion,1);
assert.equal(Backup.readText('\uFEFF'+backup).data.references['DSM 113'].fullBoxes,42);
const local=example();
local.references['DSM 113'].orderPieces=9999;
local.references['MI LOCAL']={reference:'MI LOCAL',fullBoxes:0};
local.calendar.holidays.push('2026-10-29');
local.calendar.pauses.push({start:'2026-10-30T07:00',end:'2026-10-30T10:00',label:'Máquina'});
local.accessibility={size:18,bold:false};
const merged=Backup.combine(local,restored.data,'merge');
assert.equal(merged.conflicts,3);
assert.equal(merged.newReferences,3);
assert.equal(merged.data.references['DSM 113'].orderPieces,6048);
assert.equal(merged.data.references['MI LOCAL'].reference,'MI LOCAL');
assert.deepEqual(merged.data.calendar.holidays,['2026-10-29','2026-12-25']);
assert.equal(merged.data.calendar.pauses.length,2);
assert.equal(merged.data.accessibility.size,24);
const replaced=Backup.combine(local,restored.data,'replace');
assert.equal(Object.keys(replaced.data.references).length,3);
assert(!replaced.data.references['MI LOCAL']);
assert.deepEqual(replaced.data.calendar.holidays,['2026-12-25']);
for(const bad of [
 '{}', 'null', 'texto no JSON',
 JSON.stringify({...JSON.parse(backup),format:'otro-formato'}),
 JSON.stringify({...JSON.parse(backup),schemaVersion:7})
])assert.throws(()=>Backup.readText(bad));
const polluted=JSON.parse(backup);
polluted.data.references['__proto__']={reference:'__proto__'};
assert.throws(()=>Backup.readText(JSON.stringify(polluted)));
const incorrect=JSON.parse(backup);
incorrect.data.references['DSM 113'].fullBoxes=-1;
assert.throws(()=>Backup.readText(JSON.stringify(incorrect)));
const invalidDate=JSON.parse(backup);
invalidDate.data.calendar.pauses[0].end='2026-12-20T06:00';
assert.throws(()=>Backup.readText(JSON.stringify(invalidDate)));
const overlarge=' '.repeat(Backup.MAX_CHARS+10);
assert.throws(()=>Backup.readText(overlarge));
const mem=new Map();
const storage={
 getItem:key=>mem.has(key)?mem.get(key):null,
 setItem:(key,value)=>mem.set(key,String(value)),
 removeItem:key=>mem.delete(key)
};
Backup.writeStorage(storage,merged.data);
assert.equal(JSON.parse(mem.get(Backup.STORAGE_KEYS.references))['DSM 113'].orderPieces,6048);
assert.equal(JSON.parse(mem.get(Backup.STORAGE_KEYS.calendar)).holidays.length,2);
assert.equal(JSON.parse(mem.get(Backup.STORAGE_KEYS.accessibility)).size,24);
assert.equal(mem.get(Backup.STORAGE_KEYS.migration),'1');
assert.equal(mem.get(Backup.STORAGE_KEYS.catalog),'1');
const before=new Map(mem);
const brokenStorage={
 getItem:storage.getItem,
 removeItem:storage.removeItem,
 setItem:(key,value)=>{
   if(key===Backup.STORAGE_KEYS.calendar && !brokenStorage.failed){
     brokenStorage.failed=true;throw new Error('Sin espacio');
   }
   storage.setItem(key,value);
 }
};
assert.throws(()=>Backup.writeStorage(brokenStorage,restored.data),/No se ha podido guardar/);
assert.deepEqual(mem,before,'Debe restaurar las claves anteriores tras fallo');
for(const id of ['backupCount','exportBackupBtn','importBackupBtn','backupImportMode',
  'backupFileInput','backupStatus'])assert(html.includes('id="'+id+'"'), 'Falta el campo '+id);
assert(html.includes('Backup.writeStorage(localStorage,result.data)'));
assert(html.includes('window.location.reload()'));
assert(html.includes("window.Android.exportBackup(json,filename)"));
assert(html.includes("window.Android.importBackup()"));
assert(html.includes('Backup.acceptFile=applyBackupText'));
assert(java.includes('Intent.ACTION_CREATE_DOCUMENT'));
assert(java.includes('Intent.ACTION_OPEN_DOCUMENT'));
assert(java.includes('JSONObject.quote(json)'));
assert(java.includes('JSONObject.quote(message)'));
assert(java.includes('"respaldo.js"'));
assert(css.includes('.backup-panel'));
assert(gradle.includes("applicationId independentInstall ? 'com.totemplast.planificador.v2'"));
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(inlineScripts.length,1);
new vm.Script(inlineScripts[0][1],{filename:'index.html'});
console.log('v2.0: copia/restauración, mezcla, reemplazo, calendario, formato y rollback OK.');
