package com.totemplast.prevision;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;

public class MainActivity extends Activity {
 private static final String BASE="https://appassets.androidplatform.net/assets/";
 private static final String HOST="appassets.androidplatform.net";
 private static final Set<String> ASSETS=new HashSet<>(Arrays.asList("index.html","styles.css","app.js","catalogo-referencias.js","validacion-obligatorios.js","captura-produccion.js","accesibilidad.js","respaldo.js","catalogo-moldes-v23.js"));
 private static final int EXPORT_BACKUP_REQUEST=4301;
 private static final int IMPORT_BACKUP_REQUEST=4302;
 private static final int MAX_BACKUP_BYTES=4000000;
 private String pendingBackupJson=null;
 private WebView web;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  web=new WebView(this);
  setContentView(web);
  WebSettings s=web.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);
  s.setAllowContentAccess(false);
  s.setAllowFileAccessFromFileURLs(false);
  s.setAllowUniversalAccessFromFileURLs(false);
  s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.addJavascriptInterface(new AndroidActions(),"Android");
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request) {
    Uri u=request.getUrl();
    if ("https".equals(u.getScheme())&&HOST.equals(u.getHost())) {
     String p=u.getPath();
     if(p!=null&&p.startsWith("/assets/")) {
      String f=p.substring(8);
      if(ASSETS.contains(f)) {
       try {
        InputStream stream=getAssets().open(f);
        return new WebResourceResponse(f.endsWith(".css")?"text/css":f.endsWith(".js")?"text/javascript":"text/html","UTF-8",stream);
       }catch(IOException ignored){}
      }
     }
    }
    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
    return !request.getUrl().toString().equals(BASE+"index.html");
   }
  });
  if(state!=null&&web.restoreState(state)!=null) return;
  web.loadUrl(BASE+"index.html");
 }
 private void backupJsCallback(String expression) {
  runOnUiThread(()->{if(web!=null) web.evaluateJavascript(expression,null);});
 }
 private void backupExportStatus(boolean ok,String message) {
  backupJsCallback("window.TotemplastBackup.onAndroidExportResult("+
    (ok?"true":"false")+","+JSONObject.quote(message)+")");
 }
 private void backupImportError(String message) {
  backupJsCallback("window.TotemplastBackup.onAndroidImportError("+JSONObject.quote(message)+")");
 }
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
  super.onActivityResult(requestCode,resultCode,data);
  if(requestCode==EXPORT_BACKUP_REQUEST) {
   final String payload=pendingBackupJson;
   pendingBackupJson=null;
   if(resultCode!=RESULT_OK || data==null || data.getData()==null) {
    backupExportStatus(false,"Guardado cancelado. No se ha exportado la copia.");
    return;
   }
   if(payload==null) {backupExportStatus(false,"No hay datos pendientes de guardar.");return;}
   final Uri target=data.getData();
   new Thread(()->{
    try(OutputStream output=getContentResolver().openOutputStream(target,"w")) {
     if(output==null)throw new IOException("No se pudo abrir el archivo de destino.");
     byte[] bytes=payload.getBytes(StandardCharsets.UTF_8);
     if(bytes.length>MAX_BACKUP_BYTES)throw new IOException("La copia supera el tamaño máximo.");
     output.write(bytes);
     output.flush();
     backupExportStatus(true,"Copia de seguridad guardada correctamente en la ubicación seleccionada.");
    } catch(Exception e) {
     backupExportStatus(false,"No se pudo guardar la copia: "+e.getMessage());
    }
   }).start();
   return;
  }
  if(requestCode==IMPORT_BACKUP_REQUEST) {
   if(resultCode!=RESULT_OK || data==null || data.getData()==null) {
    backupImportError("Selección de archivo cancelada.");
    return;
   }
   final Uri source=data.getData();
   new Thread(()->{
    try(java.io.InputStream stream=getContentResolver().openInputStream(source)) {
     if(stream==null)throw new IOException("No se pudo abrir el archivo seleccionado.");
     ByteArrayOutputStream buffer=new ByteArrayOutputStream();
     byte[] bytes=new byte[8192];
     int read;
     while((read=stream.read(bytes))!=-1) {
      if(buffer.size()+read>MAX_BACKUP_BYTES)
       throw new IOException("La copia supera el límite de 4 MB.");
      buffer.write(bytes,0,read);
     }
     String json=new String(buffer.toByteArray(),StandardCharsets.UTF_8);
     backupJsCallback("window.TotemplastBackup.acceptFile("+JSONObject.quote(json)+")");
    } catch(Exception e) {backupImportError("No se pudo leer la copia: "+e.getMessage());}
   }).start();
  }
 }
 public final class AndroidActions {
  @JavascriptInterface public void exportBackup(String json,String filename) {
   runOnUiThread(()->{
    if(json==null || json.isEmpty() || json.length()>MAX_BACKUP_BYTES) {
     backupExportStatus(false,"La copia no es válida o supera el tamaño permitido.");
     return;
    }
    String safeName=filename==null?"TOTEMPLAST_Copia.json":filename.replaceAll("[^A-Za-z0-9_.-]","_");
    if(!safeName.endsWith(".json"))safeName+=".json";
    pendingBackupJson=json;
    try {
     Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);
     i.addCategory(Intent.CATEGORY_OPENABLE);
     i.setType("application/json");
     i.putExtra(Intent.EXTRA_TITLE,safeName);
     startActivityForResult(i,EXPORT_BACKUP_REQUEST);
    } catch(Exception e) {
     pendingBackupJson=null;
     backupExportStatus(false,"No se pudo abrir el selector de guardado: "+e.getMessage());
    }
   });
  }
  @JavascriptInterface public void importBackup() {
   runOnUiThread(()->{
    try {
     Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);
     i.addCategory(Intent.CATEGORY_OPENABLE);
     i.setType("*/*");
     i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
     startActivityForResult(i,IMPORT_BACKUP_REQUEST);
    } catch(Exception e) {
     backupImportError("No se pudo abrir el selector de archivos: "+e.getMessage());
    }
   });
  }
  @JavascriptInterface public void prepareMail(String subject,String body) {
   runOnUiThread(()->{
    // v1.5: tanto la URI mailto como los extras contienen el asunto y el informe.
    // Algunos clientes de correo ignoran EXTRA_SUBJECT/EXTRA_TEXT al usar SENDTO;
    // otros los necesitan. Incluir ambas vías conserva la información en ambos.
    if (subject == null || subject.trim().isEmpty() || body == null || body.trim().isEmpty()) {
     Toast.makeText(MainActivity.this,"No se puede abrir un correo sin asunto o informe",Toast.LENGTH_LONG).show();
     return;
    }
    final Intent email = new Intent(Intent.ACTION_SENDTO);
    email.setData(Uri.parse(EmailDraft.mailtoUri(subject,body)));
    email.putExtra(Intent.EXTRA_EMAIL,new String[]{EmailDraft.RECIPIENT});
    email.putExtra(Intent.EXTRA_SUBJECT,subject);
    email.putExtra(Intent.EXTRA_TEXT,body);
    try {
     startActivity(Intent.createChooser(email,"Enviar informe de producción"));
    } catch (ActivityNotFoundException e) {
     Toast.makeText(MainActivity.this,"No hay aplicación de correo configurada",Toast.LENGTH_LONG).show();
    } catch (SecurityException e) {
     Toast.makeText(MainActivity.this,"No se puede abrir la aplicación de correo",Toast.LENGTH_LONG).show();
    }
   });
  }
  @JavascriptInterface public void shareText(String text) {
   runOnUiThread(()->{
    Intent i=new Intent(Intent.ACTION_SEND);
    i.setType("text/plain");
    i.putExtra(Intent.EXTRA_TEXT,text);
    startActivity(Intent.createChooser(i,"Compartir previsión"));
   });
  }
  @JavascriptInterface public void copyText(String text) {
   runOnUiThread(()->{
    ClipboardManager c=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);
    c.setPrimaryClip(ClipData.newPlainText("Previsión TOTEMPLAST",text));
    Toast.makeText(MainActivity.this,"Informe copiado",Toast.LENGTH_SHORT).show();
   });
  }
 }
 @Override protected void onSaveInstanceState(Bundle out){
  web.saveState(out);
  super.onSaveInstanceState(out);
 }
 @Override protected void onDestroy(){
  if(web!=null){web.removeJavascriptInterface("Android");web.destroy();}
  super.onDestroy();
 }
}
