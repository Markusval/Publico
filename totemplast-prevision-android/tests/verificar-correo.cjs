/* Pruebas de regresión del correo: la v1.4 abría algunos clientes sin asunto ni cuerpo. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const cp = require('node:child_process');

const dir = path.resolve(__dirname, '../app/src/main');
const java = fs.readFileSync(path.join(dir,'java/com/totemplast/prevision/MainActivity.java'),'utf8');
const html = fs.readFileSync(path.join(dir,'assets/index.html'),'utf8');
assert(java.includes('new Intent(Intent.ACTION_SENDTO)'), 'Usar SENDTO para filtrar clientes de correo');
assert(java.includes('Uri.parse(EmailDraft.mailtoUri(subject,body))'), 'El mailto debe contener asunto e informe');
assert(java.includes('email.putExtra(Intent.EXTRA_SUBJECT,subject)'));
assert(java.includes('email.putExtra(Intent.EXTRA_TEXT,body)'));
assert(java.includes('email.putExtra(Intent.EXTRA_EMAIL,new String[]{EmailDraft.RECIPIENT})'));
assert(html.includes("window.Android.prepareMail(subject,body)"));
assert(html.includes("const body=formatReport(lastReport)"), 'Enviar el informe completo');
assert(html.includes('MATRIZ DE CORTES (06:00 H):'), 'El informe debe incluir la matriz');

const subject = 'DSM 113 - Previsión de producción - Martes, 13/10/2026';
const body = 'LECTURA: 13/10/2026\nPEDIDO: 6.048 piezas\nMATRIZ DE CORTES (06:00 H):\nS | FALTAN 859 piezas\nPARADAS & festivos 100%';
const snippet = html.slice(html.indexOf('  function mailReport() {'),html.indexOf('  async function shareReport() {'));
assert(snippet.includes('function mailReport()'), 'No se encuentra mailReport');
const calls = [];
const report = {reference:'DSM 113',readAt:'2026-10-13T09:31:00'};
const params={lastReport:report,dateShort:()=>subject.split(' - ').slice(-1)[0],
  formatReport:()=>body,window:{Android:{prepareMail:(s,b)=>calls.push([s,b])}},location:{href:''}};
vm.runInNewContext(snippet+'\nmailReport();',params);
assert.equal(calls.length,1);
assert.equal(calls[0][0],subject);
assert.equal(calls[0][1],body);
assert(params.location.href==='');
const fallback={...params,window:{},location:{href:''}};
vm.runInNewContext(snippet+'\nmailReport();',fallback);
assert(fallback.location.href.startsWith('mailto:daniel@totemplast.com?subject='));
assert.equal(new URL(fallback.location.href).searchParams.get('subject'),subject);
assert.equal(new URL(fallback.location.href).searchParams.get('body'),body);

// Compilar y ejecutar un test REAL del codificador Java utilizado en Android.
// No depende del emulador ni de simulaciones de los métodos del SDK.
const directory = fs.mkdtempSync(path.join(os.tmpdir(),'totemplast-correo-'));
const testJava = `package com.totemplast.prevision;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
public class EmailDraftTest {
  public static void main(String[] args) {
    String subject = "DSM 113 - Previsión de producción - Martes, 13/10/2026";
    String body = "LECTURA: 13/10/2026\\nPEDIDO: 6.048 piezas\\nMATRIZ DE CORTES (06:00 H):\\nS | FALTAN 859 piezas\\nPARADAS & festivos 100%";
    String uri = EmailDraft.mailtoUri(subject,body);
    if (!uri.startsWith("mailto:daniel@totemplast.com?subject=")) throw new AssertionError("Destinatario incorrecto");
    if (!uri.contains("Previsi%C3%B3n") || !uri.contains("%20") || !uri.contains("%0A")
        || !uri.contains("%26") || !uri.contains("%25")) throw new AssertionError("Codificación incorrecta");
    String query = uri.substring(uri.indexOf('?') + 1);
    int divider = query.indexOf("&body=");
    if (divider < 0) throw new AssertionError("Falta el cuerpo");
    String s = URLDecoder.decode(query.substring(8,divider), StandardCharsets.UTF_8);
    String b = URLDecoder.decode(query.substring(divider+6), StandardCharsets.UTF_8);
    if (!s.equals(subject) || !b.equals(body)) throw new AssertionError("Se ha perdido información del correo");
    try { EmailDraft.mailtoUri("",body); throw new AssertionError("Falta rechazo asunto vacío"); }
    catch (IllegalArgumentException expected) {}
    try { EmailDraft.mailtoUri(subject,""); throw new AssertionError("Falta rechazo cuerpo vacío"); }
    catch (IllegalArgumentException expected) {}
    System.out.println("Correo: URI, título, contenido íntegro, acentos y saltos de línea OK.");
  }
}`;
const testPath=path.join(directory,'EmailDraftTest.java');
try{
 fs.writeFileSync(testPath,testJava,'utf8');
 cp.execFileSync('javac',['-encoding','UTF-8','-d',directory,path.join(dir,'java/com/totemplast/prevision/EmailDraft.java'),testPath],{stdio:'inherit'});
 cp.execFileSync('java',['-cp',directory,'com.totemplast.prevision.EmailDraftTest'],{stdio:'inherit'});
}finally{fs.rmSync(directory,{recursive:true,force:true});}
console.log('v1.5: integración JS, datos de asunto/cuerpo y codificación Java comprobados.');
