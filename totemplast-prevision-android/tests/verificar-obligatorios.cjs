/* Pruebas sin dependencias externas de v1.2 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const validator = require('../app/src/main/assets/validacion-obligatorios.js');
const html = fs.readFileSync(path.resolve(__dirname,'../app/src/main/assets/index.html'),'utf8');
const css = fs.readFileSync(path.resolve(__dirname,'../app/src/main/assets/styles.css'),'utf8');
const android = fs.readFileSync(path.resolve(__dirname,'../app/src/main/java/com/totemplast/prevision/MainActivity.java'),'utf8');

assert.deepEqual(validator.getRequiredIds('boxes',false), [
  'reference','orderPieces','cavities','injectionsPerHour',
  'piecesPerBox','boxesPerPallet','producedBoxes'
]);
assert.deepEqual(validator.getRequiredIds('pallets',true), [
  'reference','orderPieces','cavities','injectionsPerHour',
  'piecesPerBox','boxesPerPallet','producedPallets','readingDateTime'
]);
assert.equal(validator.isMissing('0'),false,'0 es un valor válido');
assert.equal(validator.isMissing(0),false);
assert.equal(validator.isMissing('   '),true);
assert.equal(validator.isMissing(''),true);
assert.equal(validator.isMissing(null),true);
assert.equal(validator.isMissing('67,2'),false);
for(const mode of ['boxes','pallets']){
  for(const historical of [false,true]){
    const required=validator.getRequiredIds(mode,historical);
    assert(!required.includes('producedExtraBoxes'));
    assert(!required.includes('producedLoosePieces'));
    assert(!required.includes('pauseLabel'));
    assert(!required.includes(mode==='boxes'?'producedPallets':'producedBoxes'));
    const empty=Object.fromEntries(required.map(id=>[id,'']));
    assert.deepEqual(validator.getMissingIds(required,empty),required);
    const complete=Object.fromEntries(required.map(id=>[id,'1']));
    if(historical)complete.readingDateTime='2026-10-15T14:00';
    complete[mode==='boxes'?'producedBoxes':'producedPallets']='0';
    assert.deepEqual(validator.getMissingIds(required,complete),[]);
    complete.injectionsPerHour='';
    assert.deepEqual(validator.getMissingIds(required,complete),['injectionsPerHour']);
  }
}
for(const id of validator.ALL_REQUIRED_IDS) assert(html.includes('id="'+id+'"'),'Falta el campo '+id);
assert(html.includes('<script src="validacion-obligatorios.js"></script>'));
assert(html.includes('updateRequiredBorders();'),'Sin actualización visual');
assert(html.includes("readOptionalNonNegative('producedExtraBoxes'"));
assert(html.includes("readOptionalNonNegative('producedLoosePieces'"));
assert(css.includes('.field input.missing-required'));
assert(android.includes('"validacion-obligatorios.js"'));
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.equal(inlineScripts.length,1,'Se esperaba un único script de interfaz');
new vm.Script(inlineScripts[0][1],{filename:'index.html inline JS'});
console.log('v1.2: comprobación de obligatorios, opcionales, ambos modos, modo histórico y sintaxis correcta.');
