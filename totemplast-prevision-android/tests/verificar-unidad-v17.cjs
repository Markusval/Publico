/* TOTEMPLAST v1.7: el numero no desaparece cuando se cambia la unidad. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Capture = require('../app/src/main/assets/captura-produccion.js');
const html = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/index.html'),'utf8');
const marker = "  $('rateUnit').addEventListener('change',()=>{";
const start=html.indexOf(marker);
assert(start>0,'No se encuentra el listener de cambio de unidad');
const end=html.indexOf("  $('readingDateTime').addEventListener",start);
assert(end>start,'Fin del listener no encontrado');
const code=html.slice(start,end);
assert(!code.includes("$('injectionsPerHour').value="),'Se borra el campo del operario');
assert(code.includes('updateRatePreview()'),'No se actualiza la vista previa');
assert(code.includes('invalidate()'),'No se invalida el informe anterior');
let listener=null, previewCalls=[], invalidateCalls=0, hintCalls=[];
const input={value:'85'}, unit={value:'per_hour',
  addEventListener:(event,handler)=>{assert.equal(event,'change');listener=handler;}};
const elements={injectionsPerHour:input,rateUnit:unit,reference:{value:'DSM-117'}};
vm.runInNewContext(code,{
  $:(id)=>{assert(elements[id],'Elemento DOM desconocido: '+id);return elements[id];},
  showRateHint:(name)=>hintCalls.push(name),
  updateRatePreview:()=>previewCalls.push(input.value.trim() ? Capture.machineRate(Number(input.value.replace(',','.')),unit.value,2).piecesPerHour : null),
  invalidate:()=>{invalidateCalls++;}
});
assert.equal(typeof listener,'function');
listener();
assert.equal(input.value,'85');
assert.equal(previewCalls.at(-1),170);
unit.value='seconds';
listener();
assert.equal(input.value,'85','El número introducido no debe cambiar al seleccionar segundos');
assert(Math.abs(previewCalls.at(-1)-(7200/85))<1e-9);
unit.value='per_hour';
listener();
assert.equal(input.value,'85','El numero debe conservarse también al volver');
assert.equal(previewCalls.at(-1),170);
input.value='67,2';unit.value='seconds';listener();
assert.equal(input.value,'67,2','No se debe cambiar tampoco la coma decimal');
assert(Math.abs(previewCalls.at(-1)-(7200/67.2))<1e-9);
unit.value='per_hour';listener();
assert.equal(input.value,'67,2');
assert.equal(previewCalls.at(-1),134.4);
input.value='';unit.value='seconds';listener();
assert.equal(input.value,'','La ausencia de dato sigue siendo ausencia de dato');
assert.equal(invalidateCalls,6);
assert.equal(hintCalls.length,6);
console.log('v1.7: dato intacto en ambos sentidos, coma decimal, vista previa actualizada y recalculo requerido.');
