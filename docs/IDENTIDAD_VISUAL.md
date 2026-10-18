# Identidad visual ClovEnt

Actualizado: 2026-10-14.

## Referencia y activos

La referencia aprobada por el usuario es `Presentacion de marca ClovEnt.png`.
Se conserva el original en `public/brand/clovent-reference.png`.

- `clovent-reference.webp`: copia optimizada de la lamina. `BrandLogo` muestra
  el logo claro mediante una ventana CSS, conservando la tipografia original.
- `clovent-dark.webp`: adaptacion raster sobre fondo oscuro basada en la referencia.
- `clovent-mark.webp`: simbolo aislado con transparencia, adaptado de la referencia.
- Los favicons PNG/ICO, `apple-touch-icon.png` y `src/app/icon.png` usan el simbolo.

Las adaptaciones oscura y del simbolo se prepararon con generacion de imagen
guiada por la referencia. Los recursos usados en pantalla son WebP optimizados;
la lamina PNG original no se descarga para renderizar la interfaz.

## Componentes y alcance

- `src/components/brand/BrandLogo.tsx`: firma completa; `light` usa letras claras
  sobre fondo oscuro. No sustituir los nombres ni logos propios de las empresas.
- `src/components/brand/BrandMark.tsx`: simbolo compartido.
- `src/components/marketing/`: cabecera, pie, demostracion por modulos y estilos.
- Portada, acceso, registro, funciones, planes y contacto comparten identidad.
- Cabecera y navegacion del ERP conservan permisos y comportamiento existentes.

Paleta principal: negro `#020b0e`, esmeralda `#00cd9c`, blanco y gris neutro.
Los estilos publicos se limitan a `.brand-site`, `.brand-auth` y
`.brand-registration`; los tokens generales mantienen modo claro y oscuro.

La demostracion de portada usa datos estaticos identificados como ejemplos.
No consulta ni publica informacion de clientes o empresas. No se promete
conexion o facturacion electronica DIAN en las paginas publicas.

## Verificacion

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
BRAND_BASE_URL=http://127.0.0.1:3107 node scripts/smoke_marca.mjs
```

`smoke_marca.mjs` requiere el wrapper Playwright CLI de Codex instalado en
`~/.codex/skills/playwright/scripts/playwright_cli.sh` y el servidor local activo.
Revisa seis rutas publicas en anchos 320, 390, 768, 1440 y 1920; imagenes,
desbordamiento horizontal, pestanas por teclado, menu movil y errores de acceso.
Comprueba que cada cambio de modulo conserva exactamente sus tres filas,
incluido volver desde Reportes, y falla ante errores de consola de React.
Prueba el cierre del menu en los limites movil/escritorio y Escape tanto desde
el boton como desde sus enlaces, incluyendo la restauracion del foco.

Las respuestas de login y registro se simulan en el navegador: no se crean
cuentas ni se prueban contrasenas reales.
En registro cubre contrasenas diferentes, fallo de red, errores del servidor,
respuesta no JSON, conservacion de campos, reintento y redireccion tras exito.
El formulario permite reintentar los errores y bloquea un nuevo envio despues
de confirmar el registro, mientras redirige al acceso.

La prueba existente `bench_navegacion.mjs`, con `BENCH_SMOKE=1` y
`BENCH_ONLY_SMOKE=1`, verifica administrador y vendedor con sesiones temporales,
APIs, dashboard, productos, facturas, POS y sugeridos. Incluye capturas en modo
oscuro. No crea documentos y revoca sus sesiones al terminar.
La fecha de cabecera se formatea siempre en `America/Bogota`, tanto en servidor
como en navegador, para evitar diferencias de hidratacion cuando UTC ya esta
en el dia siguiente. Las pruebas unitarias cubren cambios de dia y de anio.

Capturas locales en `output/playwright/`. Las capturas autenticadas pueden
contener datos empresariales: no publicarlas ni incorporarlas a la portada.

Esta implementacion visual no aplica migraciones ni despliega automaticamente
en produccion. Antes de publicar, repetir las pruebas sobre el build final.
