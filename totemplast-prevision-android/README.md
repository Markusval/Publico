# TOTEMPLAST - Prevision de produccion Android

Aplicacion de previsiones de fabricacion por inyeccion de plastico, version Android 1.0.0. Calculos locales, sin conexion a Internet ni IA.

## Caracteristicas

- Ritmo expresado en segundos por ciclo o inyectadas por hora; cavidades productivas configurables.
- Prevision exacta con horario continuo de lunes 06:00 a sabado 06:00.
- Calendario de festivos y paradas especiales editable.
- Matriz de cortes S-2, S-1, S y S+1, a las 06:00; piezas, cajas y palets.
- Recuperacion local de referencias, sin fijar el ritmo al recuperar una referencia.
- Correo mediante aplicacion instalada (el usuario confirma el envio).

## APK

La compilacion automatica se ejecuta en GitHub Actions al actualizar el proyecto. Abre la pestaña Actions, selecciona `TOTEMPLAST Android 1.0 - APK` y descarga el artefacto `TOTEMPLAST-Prevision-v1.0-APK` del ultimo workflow correcto. Extrae `app-debug.apk` e instalalo en Android.

El APK de depuracion esta firmado automaticamente por Android Gradle Plugin y es instalable en dispositivos compatibles (Android 6.0+). No es una distribucion firmada para Google Play.

## Version

Version publicada: v1.0; paquete Android `com.totemplast.prevision`. Los datos quedan en el dispositivo. No se precargan datos ficticios de REE 11; DSM 113 es referencia historica de ejemplo, con introduccion manual obligatoria del ciclo actual.
