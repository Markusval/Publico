# Planificador Producción Totemplast — Android v1.2

Aplicación offline de previsiones de fabricación de TOTEMPLAST.

## Nuevo en la v1.2
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
- El email se prepara en la aplicación de correo; el usuario confirma el envío.

## Compilación
GitHub Actions ejecuta las pruebas de validación y genera el APK **TOTEMPLAST-Planificador-Produccion-v1.2-APK**. El archivo instalable se llama `app-debug.apk`.

Paquete conservado: `com.totemplast.prevision`; `versionCode 3`, `versionName 1.2`.

**Nota sobre actualizaciones:** las APK de depuración creadas por ejecuciones distintas pueden estar firmadas con claves diferentes. No desinstales una versión anterior sin guardar primero los datos locales que quieras preservar.
