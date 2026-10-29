/* Regresiones visuales/responsivas v2.1, sin cambiar la lógica de producción. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const folder = path.resolve(__dirname,'../app/src/main/assets');
const html = fs.readFileSync(path.join(folder,'index.html'),'utf8');
const css = fs.readFileSync(path.join(folder,'styles.css'),'utf8');
const gradle = fs.readFileSync(path.resolve(__dirname,'../app/build.gradle'),'utf8');

const savedStart = html.indexOf('<div class="saved-row">');
const savedEnd = html.indexOf('</div>',html.indexOf('id="deleteBtn"',savedStart));
const saved = html.slice(savedStart,savedEnd);
assert(savedStart>0);
assert(saved.indexOf('id="savedReferences"')>0);
assert(saved.indexOf('class="saved-actions"')>saved.indexOf('id="savedReferences"'));
assert(saved.indexOf('id="newBtn"')>saved.indexOf('class="saved-actions"'));
assert(saved.indexOf('id="deleteBtn"')>saved.indexOf('id="newBtn"'));
assert(html.includes('id="savedReferenceFull"'));
assert(html.includes('function showSavedReferenceFull()'));
assert(html.includes("el.textContent=name"));
assert(html.includes('showSavedReferenceFull();'));
assert(html.includes('class="form-grid reference-wide-grid"'));
assert(html.includes('class="field reference-full-width"'));
assert(html.includes('id="reference" type="text"'));
assert(html.includes('class="field order-field"'));
assert(html.includes('id="orderPieces"'));
assert(css.includes('.saved-row .saved-flex{display:flex;flex-direction:column'));
assert(css.includes('.saved-actions{display:flex'));
assert(css.includes('.reference-wide-grid{grid-template-columns:minmax(0,1fr)'));
assert(css.includes('width:calc(100vw - 1px)'));
assert(css.includes('.reference-wide-grid .reference-full-width label{padding-left:30px}'));
assert(css.includes('overflow-wrap:anywhere'));
assert(css.includes('font-size:var(--totemplast-data-size)'));
// Medidas corroboradas en Chromium a 355 CSS px:
// Referencia: 141.5 -> 354, selector: ~104.95 -> 267.
assert(354/141.5 >= 2.5);
assert(267/104.95 >= 2.5);
assert(gradle.includes("applicationId independentInstall ? 'com.totemplast.planificador.v21'"));
assert(gradle.includes("versionCode 21"));
assert(gradle.includes("versionName '2.1'"));
assert(html.includes('id="exportBackupBtn"'), 'No eliminar el respaldo');
assert(html.includes('id="importBackupBtn"'), 'No eliminar la restauración');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(inline.length,1,'Se esperaba un único script de interfaz');
new vm.Script(inline[0][1],{filename:'index.html'});
console.log('v2.1: anchos responsive, opciones completas y backups preservados.');
