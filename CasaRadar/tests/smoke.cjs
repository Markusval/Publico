'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const java=fs.readFileSync('app/src/main/java/com/casaradar/dani/MainActivity.java','utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const gradle=fs.readFileSync('app/build.gradle','utf8');
assert(html.includes("indexedDB.open('CasaRadar_Local_2026'"),'Debe mantener la base de datos local');
for(const x of ['factories','models','visits','budgets','notes','attachments']) {
 assert(html.includes("'"+x+"'"),'Sección ausente: '+x);
}
assert(html.includes('function downloadBlob(b,name){'),'Debe permitir descargas');
assert(html.includes('CasaRadarNative.saveFile'),'El respaldo Android debe abrir el selector de guardado nativo');
assert(java.includes('REQUEST_PICK_FILE') && java.includes('REQUEST_SAVE_FILE'),'Faltan selectores nativos');
assert(java.includes('shouldInterceptRequest'),'El HTML debe servirse mediante origen HTTPS local');
assert(java.includes('android.webkit.JavascriptInterface') || java.includes('android.webkit.JavascriptInterface;'));
assert(manifest.includes('android:label="Casa Radar"'));
assert(/versionName\s+'1\.3\.0'/.test(gradle));
assert(/versionCode\s+10300/.test(gradle));
assert(html.includes("['accessibility','Accesibilidad y letra'"),'Menú de accesibilidad ausente');
assert(html.includes('id="access-font-range"'),'Falta control global de tamaño de texto');
assert(html.includes('localStorage.setItem(ACCESS_KEY'),'El ajuste debe persistir');
assert(html.includes('function renderAccessibility()'),'Falta pantalla de accesibilidad');
assert(html.includes('data-action="access-reset"'),'Falta restablecer texto');
assert(html.includes('data-access-toggle="highContrast"'),'Falta alto contraste');
assert(html.includes('data-access-toggle="largeControls"'),'Faltan controles grandes');
assert(java.includes('newConfig.fontScale'),'No escucha el tamaño Android');
assert(manifest.includes('fontScale'),'Configuración de escala Android ausente');
const fixedFontStyles=[...html.matchAll(/font-size\s*:\s*([0-9.]+)px/g)];
assert.equal(fixedFontStyles.length,0,'Quedan tamaños tipográficos rígidos');
assert((html.match(/var\(--font-scale\)/g)||[]).length>=70,'No se escala toda la tipografía');

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert(scripts.length>0,'Falta JavaScript');
const vm=require('node:vm');
for(const s of scripts)new vm.Script(s,{filename:'index-inline.js'});
console.log('Pruebas de proyecto Casa Radar 1.3.0 (accesibilidad): OK');