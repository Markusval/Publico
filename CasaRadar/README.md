# Casa Radar — Android 1.2.0

Aplicación Android para gestionar fabricantes de viviendas prefabricadas y de madera, modelos, presupuestos desglosados, llamadas, visitas, observaciones y documentación adjunta.

## Funciones

- Directorio inicial con 18 empresas.
- Varios modelos, presupuestos y visitas por cada fabricante.
- Notas ilimitadas y seguimiento de próximos pasos.
- Guardado offline en IndexedDB (WebView, origen HTTPS local fijo).
- Adjuntos PDF y fotografías desde el selector de archivos de Android.
- Exportación de copia JSON y CSV mediante diálogo nativo para guardar archivos.
- Restauración de copia JSON desde el selector de archivos de Android.

**Importante:** la aplicación guarda los datos en el móvil. Al desinstalarla o borrar sus datos, puede perderse toda la información si no se ha exportado previamente un respaldo JSON. Instalar una nueva versión conservando el mismo package name normalmente mantiene los datos.

## Compilación

Requisitos: JDK 17, Android SDK Platform 35, Build Tools 35.0.0 y Gradle 8.9.

```sh
node tests/smoke.cjs
gradle :app:assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`. Se trata de un APK **debug** instalable, no de una versión de distribución firmada para Play Store.

## Arquitectura

`app/src/main/assets/index.html` contiene la aplicación HTML original adaptada a Android. `MainActivity.java` sirve el contenido en `https://appassets.androidplatform.net/assets/index.html` sin acceder a servidores externos, habilita el almacenamiento local de WebView y abre enlaces externos fuera de la app. `CasaRadarNative.saveFile` conecta los archivos generados por JavaScript con el selector de guardado de Android.

## Versión

- Nombre: Casa Radar
- ID: `com.casaradar.dani`
- Versión: **1.2.0** (`versionCode` 10200)
- Android mínimo: 7.0 (API 24)
- Icono de casita diseñado para Casa Radar

## GitHub Actions

El workflow en `.github/workflows/casa-radar-android.yml` usa Gradle y publica `CasaRadar-v1.2.0-APK` como artefacto descargable. La estructura del repositorio puede ser un repositorio propio de CasaRadar trasladando este directorio a la raíz y actualizando `working-directory` y las rutas del workflow.