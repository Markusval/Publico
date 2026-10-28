# Planificador Producción Totemplast — Android v1.7

Aplicación offline de previsiones de fabricación de TOTEMPLAST.

## Mejora de ergonomía v1.7
- **Cambiar entre «Inyectadas por hora» y «Segundos por inyectada» mantiene exactamente la cifra introducida**, incluso cuando se utiliza coma decimal. No se borra ni convierte automáticamente.
- La vista previa se actualiza con la nueva unidad y las cavidades activas.
- El informe previo se invalida, para evitar conservar una previsión calculada con otra unidad.
- Se mantienen todos los cambios de la v1.6, la accesibilidad, el calendario y el envío de correo.
- Pruebas automáticas del cambio en ambos sentidos, el valor 85 y el decimal 67,2.

## Corrección anterior v1.6
- **Por defecto la máquina se expresa en INYECTADAS POR HORA.** 85 inyectadas/h con 2 cavidades son exactamente 170 piezas/h, con 6 cavidades son 510 piezas/h. El ciclo siempre corresponde a una inyectada de máquina, no a cada pieza.
- El modo alternativo «segundos por inyectada» sigue disponible, con selección explícita y vista previa de la equivalencia.
- **Nuevo modo «Piezas directas»**: permite escribir 6.000 piezas fabricadas, sin consignar cajas ni palets.
- En los modos clásicos, se puede escribir 0 cajas/palets y 6.000 piezas adicionales: el programa ya no aplica el límite arbitrario de piezas por caja.
- Cambiar de modo convierte el mismo total de piezas a las casillas correspondientes, sin cambiar la cifra.
- Palets, cajas y piezas se calculan automáticamente para presentar el informe. El valor registrado nunca se rechaza por ser mayor que la capacidad de una caja.
- Se conserva la fecha, el calendario, la matriz de cortes, el catálogo, el nombre y el icono, y el correo completo.
- Pruebas de regresión adicionales: 1, 2, 6 y 8 cavidades; 85 inyectadas/h, 85 s/inyectada, 6.000 piezas directas, modos de entrada y resultado calculado.

## Mejoras anteriores (v1.5)

- Corregido el botón «Correo a Daniel»: el asunto y el texto completo ya viajan en la dirección `mailto:` y también en los extras del intent de Android.
- Destinatario: `daniel@totemplast.com`.
- El asunto contiene la referencia, «Previsión de producción» y fecha de lectura.
- El cuerpo conserva todo el informe: situación, embalaje, fecha de finalización, matriz S-2/S-1/S/S+1 y calendario.
- Uso del intent `ACTION_SENDTO` para seleccionar aplicaciones compatibles con correo electrónico. No se envía el correo automáticamente: el usuario revisa y pulsa Enviar.
- Pruebas automáticas de enlace, asunto, cuerpo, acentos y saltos de línea.

## Novedades conservadas de la v1.4
- Por defecto, todos los valores escritos en las casillas se muestran en **negrita** y con fuente **20 px**, superior a la original.
- Menú de **Accesibilidad** en la sección «Datos del pedido» para seleccionar 18, 20, 22, 24 o 26 px y activar/desactivar negrita.
- Los ajustes se guardan localmente en el móvil y se recuperan al abrir la aplicación; incluye botón de restablecimiento.
- Los marcadores de posición (placeholder) siguen siendo discretos, para distinguirlos de un dato introducido.
- Se mantienen el calendario, los cálculos, el catálogo de referencias y la validación de obligatorios.

## Novedades que se conservan de la v1.2
- Los campos **obligatorios vacíos** aparecen desde el inicio con un borde **rojo de 2 px**, que desaparece al introducir un valor.
- Al borrar un dato obligatorio, su borde rojo reaparece de inmediato, también si se trata del ciclo actual.
- Obligatorios: referencia, pedido total, cavidades, ciclo/inyectadas por hora, piezas por caja, cajas por palet y avance indicado según modo (cajas totales o palets completos). Para lecturas anteriores, fecha y hora de lectura.
- **Opcionales y nunca marcados por estar vacíos**: cajas adicionales fuera de palets completos, piezas sueltas, motivo de parada, festivos y vacaciones.
- Los valores `0` de cajas o palets son válidos y no se marcan como ausentes.
- Si se intenta calcular con datos obligatorios sin rellenar, se indica el error y se enfoca el primer campo pendiente.
- Sin cambios en las fórmulas del motor ni en el calendario habitual.

## Características conservadas
- Nombre e icono Android: **Planificador Producción Totemplast**, logo PES.
- Cálculos por cavidades y ciclos de inyección, calendario y festivos, matriz de cortes S-2/S-1/S/S+1.
- Catálogo local de embalajes CHH-04 y DSM-117, sin tomar esas cantidades como pedido.
- El ciclo se introduce de nuevo en cada previsión.
- El correo se prepara con asunto y cuerpo completos en la aplicación de correo; el usuario confirma el envío.

## Compilación
GitHub Actions ejecuta las pruebas de validación y genera el APK **TOTEMPLAST-Planificador-Produccion-v1.7-APK**. El archivo instalable se llama `app-debug.apk`.

Paquete conservado: `com.totemplast.prevision`; `versionCode 7`, `versionName 1.7`.

**Nota sobre actualizaciones:** las APK de depuración creadas por ejecuciones distintas pueden estar firmadas con claves diferentes. No desinstales una versión anterior sin guardar primero los datos locales que quieras preservar.
