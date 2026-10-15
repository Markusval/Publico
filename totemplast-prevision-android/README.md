# Planificador Producción Totemplast — Android v1.1

Aplicación Android autónoma de planificación de producción para inyección de plásticos, sin IA ni conexión a Internet.

## Identidad y actualización v1.1
- Nombre visible en Android: **Planificador Producción Totemplast**.
- Icono de la aplicación: logo **PES Planificador Producción** proporcionado por TOTEMPLAST.
- VersionName: **1.1** y versionCode: **2**.
- Paquete conservado: `com.totemplast.prevision` para no alterar la identidad de la instalación.

## Funciones
- Ciclo en segundos o inyectadas por hora; cavidades productivas configurables por pedido.
- Calendario por defecto: lunes 06:00 a sábado 06:00, 24 h continuas, fin de semana parado.
- Festivos, puentes y vacaciones editables.
- Finalización teórica y escenarios de corte S−2, S−1, S y S+1 a las 06:00.
- Resultado en piezas, cajas y palets completos o parciales.
- Catálogo local de embalajes CHH-04 y DSM-117 (sin asignar automáticamente pedidos o cantidades fabricadas).
- El ritmo debe introducirse cada vez; una medición anterior se muestra solo como orientación.
- Envío asistido por la app de correo del dispositivo; el usuario confirma el mensaje.

## Compilar APK
Cada `push` al proyecto dispara GitHub Actions. El resultado se publica en la ejecución correcta del workflow **TOTEMPLAST Android 1.1 - APK**, como artefacto **TOTEMPLAST-Planificador-Produccion-v1.1-APK**. Descarga el ZIP, extrae `app-debug.apk` e instálalo en Android.

**Advertencia al actualizar:** las APK de depuración de GitHub Actions pueden utilizar una firma distinta en cada ejecución. Si Android rechaza la actualización, no desinstales la versión anterior hasta guardar los datos locales que quieras conservar. Una versión de distribución requiere una clave de firma persistente.
