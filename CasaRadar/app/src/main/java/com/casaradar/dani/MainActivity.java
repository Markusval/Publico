package com.casaradar.dani;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** WebView offline shell for Casa Radar. No remote web content loads inside the WebView. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + HOST + "/assets/index.html";
    private static final int REQUEST_PICK_FILE = 1001;
    private static final int REQUEST_SAVE_FILE = 1002;
    private WebView webView;
    private ValueCallback<Uri[]> pendingPicker;
    private byte[] pendingDownload;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(11, 48, 59));
        getWindow().setNavigationBarColor(Color.rgb(242, 245, 243));
        if (Build.VERSION.SDK_INT >= 26) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }

        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // Respect the Android system font-size setting in addition to the app control.
        settings.setTextZoom(Math.round(100f * getResources().getConfiguration().fontScale));

        // Exposed only to the trusted local app; external links open in other apps.
        webView.addJavascriptInterface(new NativeBridge(), "CasaRadarNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("https".equalsIgnoreCase(u.getScheme()) && HOST.equalsIgnoreCase(u.getHost())) {
                    if ("/assets/index.html".equals(u.getPath())) {
                        try {
                            InputStream data = getAssets().open("index.html");
                            WebResourceResponse res = new WebResourceResponse("text/html", "UTF-8", data);
                            if (Build.VERSION.SDK_INT >= 21) {
                                Map<String,String> headers = new HashMap<>();
                                headers.put("Cache-Control", "no-store");
                                headers.put("X-Content-Type-Options", "nosniff");
                                res.setResponseHeaders(headers);
                            }
                            return res;
                        } catch (IOException e) {
                            return new WebResourceResponse("text/plain", "UTF-8", 404,
                                "Not Found", null, new java.io.ByteArrayInputStream(new byte[0]));
                        }
                    }
                    return new WebResourceResponse("text/plain", "UTF-8", 404,
                        "Not Found", null, new java.io.ByteArrayInputStream(new byte[0]));
                }
                // No third-party network activity in the application's internal WebView.
                return new WebResourceResponse("text/plain", "UTF-8", 403,
                    "Forbidden", null, new java.io.ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("https".equalsIgnoreCase(u.getScheme()) && HOST.equalsIgnoreCase(u.getHost())) {
                    return false;
                }
                if (request.isForMainFrame()) openExternal(u);
                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri u = Uri.parse(url);
                if ("https".equalsIgnoreCase(u.getScheme()) && HOST.equalsIgnoreCase(u.getHost())) {
                    return false;
                }
                openExternal(u);
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (pendingPicker != null) pendingPicker.onReceiveValue(null);
                pendingPicker = callback;
                try {
                    startActivityForResult(params.createIntent(), REQUEST_PICK_FILE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    pendingPicker = null;
                    Toast.makeText(MainActivity.this, "No hay selector de archivos disponible", Toast.LENGTH_LONG).show();
                    return false;
                }
            }
        });
        webView.loadUrl(APP_URL);
    }

    private void openExternal(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("https") && !scheme.equals("http") && !scheme.equals("mailto")
                && !scheme.equals("tel") && !scheme.equals("geo")) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No hay aplicación para abrir este enlace", Toast.LENGTH_SHORT).show();
        }
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void saveFile(String fileName, String mimeType, String dataBase64) {
            if (dataBase64 == null || dataBase64.length() > 128 * 1024 * 1024) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                    "Archivo demasiado grande para exportar", Toast.LENGTH_LONG).show());
                return;
            }
            try {
                final byte[] bytes = Base64.decode(dataBase64, Base64.DEFAULT);
                String safeName = fileName == null ? "CasaRadar.json" :
                    fileName.replaceAll("[\\/\\r\\n]", "_");
                String type = mimeType == null || mimeType.trim().isEmpty()
                    ? "application/octet-stream" : mimeType.split(";")[0];
                runOnUiThread(() -> {
                    if (pendingDownload != null) {
                        Toast.makeText(MainActivity.this, "Termina de guardar el archivo anterior",
                            Toast.LENGTH_SHORT).show();
                        return;
                    }
                    pendingDownload = bytes;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(type);
                    i.putExtra(Intent.EXTRA_TITLE, safeName);
                    try {
                        startActivityForResult(i, REQUEST_SAVE_FILE);
                    } catch (ActivityNotFoundException e) {
                        pendingDownload = null;
                        Toast.makeText(MainActivity.this, "No hay gestor de archivos disponible",
                            Toast.LENGTH_LONG).show();
                    }
                });
            } catch (IllegalArgumentException e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                    "Datos de exportación no válidos", Toast.LENGTH_LONG).show());
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_PICK_FILE) {
            if (pendingPicker != null) {
                pendingPicker.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingPicker = null;
            }
        } else if (requestCode == REQUEST_SAVE_FILE) {
            byte[] bytes = pendingDownload;
            pendingDownload = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || bytes == null) return;
            Uri uri = data.getData();
            new Thread(() -> {
                try (OutputStream stream = getContentResolver().openOutputStream(uri)) {
                    if (stream == null) throw new IOException("No se puede escribir");
                    stream.write(bytes);
                    stream.flush();
                    runOnUiThread(() -> Toast.makeText(this, "Archivo guardado correctamente",
                        Toast.LENGTH_LONG).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(this, "Error al guardar el archivo",
                        Toast.LENGTH_LONG).show());
                }
            }).start();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (webView != null) {
            webView.getSettings().setTextZoom(Math.round(100f * newConfig.fontScale));
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (pendingPicker != null) pendingPicker.onReceiveValue(null);
        pendingPicker = null;
        if (webView != null) {webView.destroy(); webView = null;}
        super.onDestroy();
    }
}