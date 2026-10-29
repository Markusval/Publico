# Planificador Producción Totemplast — Android v2.0

Herramienta TOTEMPLAST de planificación de producción por inyección: trabaja sin Internet y conserva los datos localmente.

## Novedad principal: copias de seguridad completas
La sección **«Copias de seguridad»**, visible aunque todavía no se haya calculado un informe, incluye:
- **Exportar base de datos (.json)**: crea un archivo JSON portable con todas las fichas guardadas (referencias y embalajes, cantidades, última lectura y ritmo histórico), calendario compartido (festivos y paradas), y preferencias de letra.
- **Importar base de datos (.json)**: abre el selector nativo de archivos de Android, valida formato, datos y fecha, muestra el número de fichas y solicita confirmación.
- **Fusionar** (predeterminado): conserva los registros locales no repetidos y los del archivo; en referencias coincidentes prevalece el archivo. Une festivos y paradas sin duplicados.
- **Sustituir**: reemplaza todo lo local por el respaldo, tras dos confirmaciones expresas.
- La escritura utiliza recuperación del almacenamiento anterior si hay un error de espacio.
- **Formato identificable:** `format: totemplast-production-backup`, `schemaVersion: 1`. Se conserva compatibilidad con este esquema en futuras versiones.
- Ninguna copia se envía a un servidor. Android permite seleccionar una carpeta local o un proveedor de documentos que el usuario elija.
- El archivo JSON puede importarse en otra instalación que incluya la función de importar, siempre que sea compatible con el esquema.

## Compatibilidad con versiones anteriores y firmas
La v2.0 se publica con el identificador **`com.totemplast.planificador.v2`**, separado de las versiones anteriores, porque las APK de GitHub Actions han utilizado claves de depuración diferentes. **Puede instalarse sin desinstalar la v1.7.**

**Importante:** la v1.7 no incorporaba exportación de base de datos. Por el aislamiento de datos de Android, la v2.0 **no puede leer directamente la base de datos de otra aplicación instalada**. Si tus datos permanecen exclusivamente en la v1.7, conserva esa aplicación y no la desinstales. Las copias creadas en v2.0 sí se podrán importar en una instalación posterior con el mismo formato.

Para poder actualizar versiones futuras sobre la misma aplicación sin perder datos, se debe configurar una clave de firma permanente y privada en GitHub Actions; el export/import brinda una vía adicional de migración.

## Funciones existentes
- Ritmo por máquina: inyectadas/hora × cavidades = piezas/hora; cambio explícito a segundos por inyectada.
- Registro por palets, cajas o piezas totales directas, sin límite artificial de piezas sueltas.
- Previsión de finalización, cuatro escenarios de corte S−2/S−1/S/S+1, embalaje, pausas y calendario.
- Bordes rojos para los campos obligatorios vacíos y menú de accesibilidad con tamaño y negrita.
- Preparación del informe íntegro para el correo empresarial.

## Compilación Android
GitHub Actions ejecuta las pruebas de la aplicación y la nueva batería de respaldo; entrega el artefacto **TOTEMPLAST-Planificador-Produccion-v2.0-APK** que contiene `app-debug.apk`. Android 6.0 o posterior, sin permisos de almacenamiento generales.

`versionCode 20`, `versionName 2.0`. Mantiene el logo PES y la identidad TOTEMPLAST.
