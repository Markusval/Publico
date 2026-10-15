# Casa Radar — Android 1.3.0

Aplicación Android para gestionar fabricantes de viviendas prefabricadas y de madera, modelos, presupuestos desglosados, llamadas, visitas, observaciones y documentación adjunta.

## Accesibilidad en la versión 1.3.0

- Acceso directo **Aa** siempre visible en la barra superior y en el menú lateral.
- Escala global del texto del **80 % al 200 %**, en incrementos del 10 %, con 4 tamaños predefinidos y restauración a 100 %.
- Alto contraste y botones ampliados, activables individualmente.
- Preferencias guardadas en almacenamiento local sin alterar la base de datos del usuario.
- Se respeta además el tamaño tipográfico configurado en Android.

## Funciones

- Directorio inicial con 18 empresas.
- Varios modelos, presupuestos y visitas por cada fabricante.
- Notas ilimitadas y seguimiento de próximos pasos.
- Guardado offline en IndexedDB (WebView, origen HTTPS local fijo).
- Adjuntos PDF y fotografías desde el selector de archivos de Android.
- Exportación de copia JSON y CSV mediante diálogo nativo para guardar archivos.
- Restauración de copia JSON desde el selector de archivos de Android.

**Importante:** la aplicación guarda los datos en el móvil. Al desinstalarla o borrar sus datos, puede perderse toda la información si no se ha exportado previamente un respaldo JSON. Esta versión de prueba se compila con la firma debug de GitHub Actions, que puede variar entre ejecuciones. Si Android rechaza instalar la versión 1.3.0 encima de la 1.2.0, **NO borres la anterior sin antes exportar una copia JSON**. Primero entra en Copias y exportación de la 1.2.0 y guarda el respaldo en Descargas; después desinstala la 1.2.0, instala la 1.3.0 e importa ese respaldo. Para actualizaciones posteriores sin desinstalar hace falta configurar una firma de distribución estable.

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
- Versión: **1.3.0** (`versionCode` 10300)
- Android mínimo: 7.0 (API 24)
- Icono de casita diseñado para Casa Radar

## GitHub Actions

El workflow en `.github/workflows/casa-radar-android.yml` usa Gradle y publica `CasaRadar-v1.3.0-APK` como artefacto descargable. La estructura del repositorio puede ser un repositorio propio de CasaRadar trasladando este directorio a la raíz y actualizando `working-directory` y las rutas del workflow.