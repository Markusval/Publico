package com.totemplast.prevision;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
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
 private static final Set<String> ASSETS=new HashSet<>(Arrays.asList("index.html","styles.css","app.js","catalogo-referencias.js"));
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
 public final class AndroidActions {
  @JavascriptInterface public void prepareMail(String subject,String body) {
   runOnUiThread(()->{
    Intent i=new Intent(Intent.ACTION_SENDTO);
    i.setData(Uri.parse("mailto:daniel@totemplast.com"));
    i.putExtra(Intent.EXTRA_EMAIL,new String[]{"daniel@totemplast.com"});
    i.putExtra(Intent.EXTRA_SUBJECT,subject);
    i.putExtra(Intent.EXTRA_TEXT,body);
    try{startActivity(i);}catch(ActivityNotFoundException e){Toast.makeText(MainActivity.this,"No hay aplicación de correo configurada",Toast.LENGTH_LONG).show();}
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
