# Rendimiento y regresiones

## Limpieza local y busqueda, octubre de 2026

- Se eliminaron las caches acumuladas de Next.js, las capturas de pruebas y
  el informe antiguo `eslint-report.json`. Se conservan fuentes, datos,
  migraciones, historial Git y trabajos pendientes.
- Se retiraron nueve dependencias sin referencias en el codigo, scripts ni
  pruebas: `pdf-parse`, `recharts`, `@tanstack/react-table` y los paquetes Radix
  avatar, dropdown-menu, label, select, separator y toast. El gestor elimino
  107 paquetes en total. El parser PDF activo sigue usando `pdfjs-dist` y canvas.
- La busqueda global cancela la solicitud anterior cuando cambia el termino o
  se cierra, mantiene el debounce de 300 ms y solo consulta con el buscador abierto.
  Una respuesta antigua no sustituye los resultados del termino actual.
- La prueba de navegador por rol simula una respuesta lenta, comprueba su
  cancelacion, cero consultas al cerrar antes del debounce, errores y reintentos.

Medicion local del 15 de octubre de 2026: el proyecto paso de 5.158.020 KiB
(4,92 GiB) a 693.460 KiB (677 MiB), conservando `node_modules` y el build
verificado. Ahorro aproximado: 4,26 GiB. Se limpio de nuevo la cache generada
durante la validacion. No se actualizaron versiones de los paquetes conservados.
Lint, TypeScript, 30 pruebas unitarias, compilacion completa y navegador con
administrador/vendedor pasaron; el test de lectura de PDF sigue funcionando.

Para liberar caches de nuevo, detener primero procesos de desarrollo,
compilacion y pruebas, y ejecutar:

```bash
npm run clean:cache -- --dry-run
npm run clean:cache
```

El comando tiene una lista fija de carpetas y archivos generados. No borra el
codigo, `node_modules`, `.env`, `.git`, documentos de empresas ni la compilacion
de produccion. Las siguientes compilaciones regeneran las caches que necesiten;
la primera compilacion tras la limpieza puede tardar mas.

La reduccion de dependencias ahorra disco e instalacion. No equivale por si sola
a una reduccion del JavaScript servido, porque Next.js ya descarta imports no
usados. La mejora funcional medible es evitar peticiones de busqueda obsoletas.

## Optimizaciones de septiembre de 2026

- Facturas: una RPC devuelve los cuatro indicadores, en vez de descargar documentos con cuatro peticiones. Las sumas no dependen del limite de filas de PostgREST.
- Inventario y productos sin rotacion: PostgreSQL agrega existencias e historiales; la aplicacion recibe solo los indicadores o la lista limitada que necesita.
- Sesion: usuario y membresias se consultan en paralelo. El proxy omite las membresias que no utiliza. Se sigue verificando el usuario con Supabase Auth.
- Los maestros de pago, ejercicio y la sesion se reutilizan dentro del render mediante React.cache. No hay cache global de datos de empresas ni TTL que pueda mostrar stock antiguo.
- Dashboard: encabezado y accesos aparecen antes; las cifras principales y la actividad se resuelven en limites Suspense independientes. Un fallo muestra una accion de reintento, no un mensaje de carga permanente.
- PDF: los archivos de pdfjs/canvas se incluyen explicitamente solo en `/api/import/factura-electronica/parse`. La traza local de dashboard y productos contiene cero archivos PDF; la de importacion conserva 397 archivos, unos 35 MB.

## Base de datos

Aplicar `056_resumenes_ventas_inventario.sql` antes de publicar el codigo que usa las nuevas RPC. Las funciones son `SECURITY INVOKER`, requieren usuario autenticado, toman la empresa de la sesion y mantienen RLS. No aceptan un identificador de otra empresa.

No ejecutar a ciegas todas las migraciones locales: comprobar primero el historial remoto. Esta entrega agrega solo la 056 y no modifica registros de negocio.

`tests/db/resumenes.sql` compara las RPC contra consultas independientes bajo cada usuario activo admin, contador y vendedor. Verifica permisos anonimos, aislamiento y limite de resultados. Una prueba de minimos de stock nulos modifica una fila temporalmente dentro de una subtransaccion que siempre se revierte. Ejecutar con psql y `ON_ERROR_STOP=1`, dentro de una transaccion que termine en ROLLBACK para una verificacion sin cambios persistentes. Puede incluirse despues de la migracion dentro de esa misma transaccion.

Para revertir la aplicacion, restaurar el despliegue anterior; las nuevas funciones pueden permanecer porque son aditivas y compatibles con el codigo previo.

## Verificacion repetible

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
node --env-file=.env.local scripts/bench_navegacion.mjs output/performance/current.json
BENCH_SMOKE=1 BENCH_ONLY_SMOKE=1 BENCH_SUPERADMIN=1 node --env-file=.env.local scripts/bench_navegacion.mjs
```

El benchmark realiza tres peticiones HTML autenticadas por ruta y rol. Guarda tiempo hasta cabeceras, tiempo total y bytes; no mide por si solo LCP ni interacciones de usuario. Comparar el mismo entorno y considerar variaciones de red y arranques en frio. `BENCH_BASE_URL` permite apuntar a una compilacion local y `BENCH_EMPRESA` elegir la empresa.

Las pruebas de humo usan el CLI de Playwright de la skill local. Comprueban APIs, rechazo anonimo, restricciones de vendedor, dashboard, productos, facturas, nueva factura, POS y sugeridos (admin). Capturan escritorio y movil sin guardar ninguna venta. `BENCH_SUPERADMIN=1` verifica adicionalmente las paginas de superadmin.

Los scripts requieren credenciales locales autorizadas. Crean enlaces de acceso con la API administrativa sin enviar correos, mantienen las sesiones en memoria y las revocan al terminar. El estado temporal de Playwright tiene permisos privados y se elimina. Nunca publicar credenciales, cookies ni archivos de sesion. Los artefactos de `output/` no se suben a Vercel.

No se cambiaron tarifas de IVA, el comportamiento de DIAN ni las reglas contables en esta optimizacion.

## Resultado de la entrega

Publicada en `https://www.clovent.co`, despliegue Vercel `dpl_66K3J9wGLKygTcSVk8bXLJ78uFK3`, estado READY. La inspeccion del despliegue muestra 3.11 MB para la funcion `index`, frente a 40.12 MB en el despliegue anterior `dpl_DCPHZtYD1pgrgb5u9MubFRvUXkHi`. Son paquetes de servidor, no megabytes descargados por el navegador.

Verificaciones completadas: lint, typecheck, build local y de Vercel, 28 pruebas automatizadas, SQL bajo siete identidades de dos empresas, caso de stock minimo nulo con rollback, APIs y navegador admin/vendedor (incluido POS movil/escritorio), sugeridos admin y tres paginas superadmin. Martha Jurado aparece en Bella y Saludable. El parser de produccion pudo leer el PDF sintetico y lo rechazo correctamente por no contener lineas de factura; no se guardaron documentos de prueba.

Medianas del tiempo total de respuesta HTML en milisegundos, tres peticiones por celda:

| Rol | Ruta | Antes | Despues, muestra 1 | Despues, muestra 2 |
| --- | --- | ---: | ---: | ---: |
| admin | dashboard | 1684 | 693 | 611 |
| admin | productos | 1026 | 404 | 421 |
| admin | facturas | 654 | 606 | 414 |
| admin | nueva factura | 519 | 397 | 375 |
| admin | POS | 869 | 1234 | 408 |
| vendedor | dashboard | 1201 | 3069 | 1078 |
| vendedor | productos | 718 | 554 | 623 |
| vendedor | facturas | 1037 | 821 | 740 |
| vendedor | nueva factura | 446 | 1669 | 302 |
| vendedor | POS | 425 | 470 | 379 |

Artefactos: `output/performance/before.json`, `after.json`, `after-repeat.json` y capturas en `output/playwright/`. Las muestras son pequenas y presentan picos; no permiten prometer un porcentaje de aceleracion uniforme ni atribuir cada variacion a una causa concreta. La segunda muestra mejoro en las diez combinaciones, pero se conservan las dos para no ocultar variabilidad. Para una evaluacion sostenida, medir percentiles de latencia y Web Vitals con mas trafico real.
