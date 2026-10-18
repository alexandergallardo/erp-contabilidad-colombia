# Operacion y Verificacion

## 1. Entorno local

```bash
npm install
npm run dev
```

## 2. Calidad obligatoria

```bash
npm run lint
npm run typecheck
npm run build
```

## 3. Checklist funcional rapida

- Login por rol (admin, contador, vendedor, superadmin).
- Dashboard principal carga sin errores.
- Modulos base: ventas, compras, productos, contabilidad.
- APIs principales responden correctamente.
- `/compras/sugeridos` muestra recomendaciones.

## 4. Checklist Vercel

- Variables de entorno completas.
- Los archivos `.env*` son solo locales y quedan excluidos del paquete de deploy mediante `.vercelignore`.
- Verificar producción con `vercel env ls production` antes de desplegar cambios de entorno.
- Build en Vercel sin fallos.
- Rutas criticas operativas post deploy.
- Logs sin excepciones server-side.

## 5. Checklist Supabase

- Migraciones aplicadas.
- RLS activa en tablas de negocio.
- RPC criticas con permisos correctos.
- service role solo en contexto server.

## 6. Mantenimiento y Keepalive de Supabase

- Workflow automático en la nube: `.github/workflows/supabase-keepalive.yml` se ejecuta cada 12 horas (05:00 UTC y 17:00 UTC -> 00:00 y 12:00 Colombia).
- Realiza una consulta directa a la base de datos a través de `/api/health` para evitar que el tier gratuito de Supabase pause el proyecto por inactividad (umbral de 7 días).
- En caso de falla en la conexión o caída de la base de datos, GitHub Actions genera una alerta y envía un correo al propietario del repositorio.
- Verificación manual en cualquier momento desde terminal: `npm run ping:supabase`.

