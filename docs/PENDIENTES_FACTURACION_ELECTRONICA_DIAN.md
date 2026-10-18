# Pendientes de Facturacion Electronica DIAN

## Estado actual

ClovEnt genera y consulta documentos comerciales internos, pero no emite ni transmite facturas electronicas o documentos equivalentes electronicos a la DIAN.

Esta limitacion es intencional mientras la operacion no cuente con firma o certificado digital y con la configuracion de un proveedor tecnologico. No se debe habilitar parcialmente el envio a la DIAN ni presentar la validacion local como validacion oficial.

Comportamiento que debe conservarse por ahora:

- `/api/configuracion/facturacion-electronica` responde `410`.
- `/api/ventas/facturas/[id]/dian` responde `410`.
- Las facturas se almacenan y contabilizan dentro de ClovEnt.
- El QR impreso abre la consulta local `/validar/factura/[id]`.
- La consulta local confirma que el documento existe en ClovEnt; no confirma aceptacion por la DIAN.

## Hallazgos aplazados

### Integracion DIAN

La configuracion actual no tiene resolucion, rango autorizado, software habilitado, certificado digital ni credenciales de produccion. Los campos `cufe`, `dian_estado` y `qr_url` deben permanecer vacios hasta recibir una respuesta real del proveedor o de la DIAN.

### Mensaje de validacion local

La pagina publica usa actualmente el texto `Factura validada`. Cuando se implemente la integracion electronica debe distinguir claramente entre estos estados:

- Documento encontrado en ClovEnt.
- Documento transmitido.
- Documento validado o rechazado por la DIAN.

El QR local debe reemplazarse por el QR fiscal entregado por el proveedor cuando exista una validacion oficial.

## Requisitos antes de implementar

1. Confirmar obligacion y modalidad de facturacion con el contador de cada empresa.
2. Seleccionar proveedor tecnologico autorizado o integracion directa.
3. Completar habilitacion DIAN, software, PIN, certificado digital y ambiente de pruebas.
4. Registrar por empresa las resoluciones, prefijos, rangos y fechas de vigencia.
5. Mapear clientes, productos, unidades de medida, medios de pago e impuestos al formato UBL requerido.
6. Generar y almacenar XML, CUFE, QR fiscal, AttachedDocument y respuestas de validacion.
7. Implementar envio idempotente, reintentos, webhooks y trazabilidad de errores.
8. Separar credenciales y configuracion de pruebas y produccion.
9. Probar notas credito/debito, contingencia, documento equivalente POS y anulaciones.
10. Actualizar textos, PDF, correo y consulta publica para mostrar el estado DIAN real.

## Criterio de activacion

La funcionalidad solo puede habilitarse cuando una factura de prueba complete el ciclo de generacion, firma, transmision, validacion, almacenamiento y consulta sin depender de datos simulados. La activacion debe ser individual por `empresa_id`.
