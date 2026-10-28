/* Regresión v1.6: los ritmos son por INYECTADA, no por pieza, y
   las piezas pueden contarse directamente, sin límite de caja. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const Capture = require('../app/src/main/assets/captura-produccion.js');
const E = require('../app/src/main/assets/app.js');
const V = require('../app/src/main/assets/validacion-obligatorios.js');
const html = fs.readFileSync(path.join(__dirname,'../app/src/main/assets/index.html'),'utf8');
const css = fs.readFileSync(path.join(__dirname,'../app/src/main/assets/styles.css'),'utf8');
const java = fs.readFileSync(path.join(__dirname,'../app/src/main/java/com/totemplast/prevision/MainActivity.java'),'utf8');

for (const [cavities, expected] of [[1,85],[2,170],[6,510],[8,680]]) {
  const rate=Capture.machineRate(85,'per_hour',cavities);
  assert.equal(rate.injectionsPerHour,85);
  assert.equal(rate.piecesPerHour,expected);
}
assert(Math.abs(Capture.machineRate(85,'seconds',2).piecesPerHour-7200/85)<1e-9);
assert.equal(Capture.machineRate('67,2','seconds',1).injectionsPerHour,3600/67.2);

const common={piecesPerBox:32,boxesPerPallet:24,producedBoxes:'0',
  producedPallets:'0',producedExtraBoxes:'0',producedLoosePieces:'6000',producedPieces:'6000'};
const direct=Capture.parseProduction({...common,mode:'pieces'});
assert.deepEqual(direct,{fullBoxes:0,loosePieces:6000,produced:6000});
const fromBoxes=Capture.parseProduction({...common,mode:'boxes'});
const fromPallets=Capture.parseProduction({...common,mode:'pallets'});
assert.equal(fromBoxes.produced,6000);
assert.equal(fromPallets.produced,6000);
const normalized=Capture.distributePieces(6000,32,24);
assert.deepEqual(normalized,{producedPieces:6000,producedBoxes:187,
  producedPallets:7,producedExtraBoxes:19,producedLoosePieces:16});
for(const mode of ['pieces','boxes','pallets'])
 assert.equal(Capture.parseProduction({mode,piecesPerBox:32,boxesPerPallet:24,...normalized}).produced,6000);
assert.equal(Capture.parseProduction({...common,mode:'boxes',producedBoxes:0,producedLoosePieces:''}).produced,0);
assert.throws(()=>Capture.parseProduction({...common,mode:'pieces',producedPieces:-1}));
assert.throws(()=>Capture.parseProduction({...common,mode:'pieces',producedPieces:'6.5'}));

const input={reference:'TEST 2 CAV',orderPieces:10000,cavities:2,
  injectionsPerHour:Capture.machineRate(85,'per_hour',2).injectionsPerHour,
  piecesPerBox:32,boxesPerPallet:24,...direct};
const r=E.forecast(input,new Date(2026,9,20,9,0),{holidays:[],pauses:[]});
assert.equal(r.piecesPerHour,170);
assert.equal(r.produced,6000);
assert.equal(r.piecesPending,4000);
assert.equal(r.injectionsPending,2000);
assert(Math.abs(r.productiveMsPending/3600000-2000/85)<1e-9);
assert.equal(r.breakdownProduced.pallets,7);
assert.equal(r.breakdownProduced.boxes,19);
assert.equal(r.breakdownProduced.loose,16);
for(const c of [1,6,8]) {
  const v=E.forecast({...input,cavities:c},new Date(2026,9,20,9,0),{holidays:[],pauses:[]});
  assert.equal(v.piecesPerHour,85*c);
}
assert(V.getRequiredIds('pieces',false).includes('producedPieces'));
assert(!V.getRequiredIds('pieces',false).includes('producedBoxes'));
assert(!V.getRequiredIds('pieces',false).includes('producedPallets'));
assert(!V.getRequiredIds('boxes',false).includes('producedPieces'));
assert(V.getRequiredIds('pieces',true).includes('readingDateTime'));
for(const name of ['piecesMode','piecesInputs','producedPieces','additionalPiecesInputs','machineRatePreview','rateUnit'])
 assert(html.includes('id="'+name+'"'), 'Falta '+name);
assert(html.includes('<option value="per_hour" selected>'));
assert(html.includes("  $('rateUnit').value='per_hour';"),'Ritmo por hora predeterminado en nuevas consultas');
assert(html.includes("setMode('pieces',true)"));
assert(html.includes("Capture.parseProduction("));
assert(html.includes("Capture.machineRate("));
assert(html.includes("<script src=\"captura-produccion.js\"></script>"));
assert(java.includes('"captura-produccion.js"'));
assert(!fs.readFileSync(path.join(__dirname,'../app/src/main/assets/app.js'),'utf8').includes('if (loosePieces >= piecesPerBox)'));
assert(css.includes('.machine-rate-preview'));
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
new vm.Script(scripts[0][1],{filename:'index.html'});
console.log('v1.6: máquinas, cavidades, 6000 piezas directas, normalización, calendario y sintaxis OK.');
