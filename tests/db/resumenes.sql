-- Run inside a transaction after migration 056. No business fixture changes persist.
DO $$
DECLARE
  usuarios jsonb;
  usuario jsonb;
  actual jsonb;
  esperado jsonb;
  lista jsonb;
  total_sin_rotacion integer;
  desde date := current_date - 90;
  inicio date := date_trunc('month', current_date)::date;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE oid IN (
      'public.get_estadisticas_ventas(date)'::regprocedure,
      'public.get_estadisticas_inventario(date)'::regprocedure,
      'public.get_productos_sin_rotacion(date,date,date,integer)'::regprocedure
    ) AND (prosecdef OR has_function_privilege('anon', oid, 'EXECUTE'))
  ) THEN RAISE EXCEPTION 'RPC must use invoker privileges and deny anon'; END IF;

  SELECT jsonb_agg(jsonb_build_object('id', u.id, 'empresa', u.empresa_id, 'rol', r.nombre))
  INTO usuarios FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
  WHERE u.activo AND r.nombre IN ('admin', 'contador', 'vendedor');
  IF usuarios IS NULL THEN RAISE EXCEPTION 'No test identities'; END IF;

  FOR usuario IN SELECT value FROM jsonb_array_elements(usuarios) LOOP
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', usuario->>'id', 'role', 'authenticated')::text, true);
    PERFORM set_config('role', 'authenticated', true);
    IF public.get_empresa_id()::text IS DISTINCT FROM usuario->>'empresa' THEN
      RAISE EXCEPTION 'Tenant mismatch';
    END IF;

    actual := public.get_estadisticas_ventas(inicio);
    SELECT jsonb_build_object(
      'total', (SELECT count(*) FROM documentos WHERE tipo = 'factura_venta' AND estado <> 'cancelada'),
      'pendiente', (SELECT COALESCE(sum(total), 0) FROM documentos WHERE tipo = 'factura_venta' AND estado = 'pendiente'),
      'pagada', (SELECT COALESCE(sum(total), 0) FROM documentos WHERE tipo = 'factura_venta' AND estado = 'pagada'),
      'este_mes', (SELECT COALESCE(sum(total), 0) FROM documentos WHERE tipo = 'factura_venta' AND estado <> 'cancelada' AND fecha >= inicio)
    ) INTO esperado;
    IF actual IS DISTINCT FROM esperado THEN RAISE EXCEPTION 'Sales summary mismatch for role %', usuario->>'rol'; END IF;

    actual := public.get_estadisticas_inventario(desde);
    SELECT jsonb_build_object(
      'total', (SELECT count(*) FROM productos),
      'activos', (SELECT count(*) FROM productos WHERE activo),
      'stockBajo', (SELECT count(*) FROM productos p WHERE activo AND (
        NOT EXISTS (SELECT 1 FROM stock s WHERE s.producto_id = p.id)
        OR EXISTS (SELECT 1 FROM stock s WHERE s.producto_id = p.id AND (COALESCE(cantidad, 0) <= 0 OR (cantidad_minima > 0 AND cantidad <= cantidad_minima)))
      )),
      'sinRotacion', (SELECT count(*) FROM productos p WHERE activo
        AND (SELECT sum(cantidad) FROM stock s WHERE s.producto_id = p.id) > 0
        AND COALESCE((SELECT sum(cantidad_total) FROM ventas_producto_diarias v WHERE v.producto_id = p.id AND fecha >= desde), 0) <= 0),
      'unidades', (SELECT floor(COALESCE(sum(cantidad), 0) + 0.5) FROM stock s JOIN productos p ON p.id = s.producto_id WHERE p.activo)
    ) INTO esperado;
    IF actual IS DISTINCT FROM esperado THEN RAISE EXCEPTION 'Inventory summary mismatch for role %: % vs %', usuario->>'rol', actual, esperado; END IF;

    lista := public.get_productos_sin_rotacion(desde, current_date - 730, current_date, 5000);
    total_sin_rotacion := (actual->>'sinRotacion')::integer;
    IF jsonb_array_length(lista) <> LEAST(total_sin_rotacion, 5000) THEN RAISE EXCEPTION 'Rotation count mismatch'; END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(lista) x LEFT JOIN productos p ON p.id = (x->>'id')::uuid
      WHERE p.id IS NULL OR p.empresa_id::text <> usuario->>'empresa'
        OR (x->>'stock_actual')::numeric <= 0 OR (x->>'ventas_periodo')::numeric > 0
    ) THEN RAISE EXCEPTION 'Rotation tenant or stock mismatch'; END IF;
    IF jsonb_array_length(public.get_productos_sin_rotacion(desde, current_date - 730, current_date, 10)) <> LEAST(total_sin_rotacion, 10) THEN
      RAISE EXCEPTION 'Rotation limit mismatch';
    END IF;
    PERFORM set_config('role', 'postgres', true);
    RAISE NOTICE 'Verified summaries: role %, tenant %, products %', usuario->>'rol', usuario->>'empresa', actual->>'total';
  END LOOP;

  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    PERFORM public.get_estadisticas_ventas(inicio);
    RAISE EXCEPTION 'Unauthenticated request was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM set_config('role', 'postgres', true);
END;
$$;

-- Nullable minimums must behave like zero, not like missing stock rows.
-- The fixture updates are rolled back by the inner exception block, even on success.
DO $$
DECLARE
  usuario uuid;
  empresa uuid;
  producto uuid;
  actual bigint;
  esperado bigint;
BEGIN
  SELECT u.id, u.empresa_id, p.id INTO usuario, empresa, producto
  FROM usuarios u JOIN roles r ON r.id = u.rol_id
  JOIN productos p ON p.empresa_id = u.empresa_id AND p.activo
  WHERE u.activo AND r.nombre = 'admin'
    AND EXISTS (SELECT 1 FROM stock s WHERE s.producto_id = p.id)
  LIMIT 1;
  IF producto IS NULL THEN RAISE EXCEPTION 'Missing stock fixture'; END IF;
  BEGIN
    UPDATE stock SET cantidad = 5, cantidad_minima = NULL WHERE producto_id = producto;
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', usuario, 'role', 'authenticated')::text, true);
    PERFORM set_config('role', 'authenticated', true);
    actual := (public.get_estadisticas_inventario(current_date - 90)->>'stockBajo')::bigint;
    SELECT count(*) INTO esperado FROM productos p WHERE activo AND (
      NOT EXISTS (SELECT 1 FROM stock s WHERE s.producto_id = p.id)
      OR EXISTS (SELECT 1 FROM stock s WHERE s.producto_id = p.id AND
        (COALESCE(cantidad, 0) <= 0 OR (cantidad_minima > 0 AND cantidad <= cantidad_minima)))
    );
    IF actual <> esperado THEN RAISE EXCEPTION 'Nullable minimum regression'; END IF;
    RAISE EXCEPTION 'Rollback successful fixture' USING ERRCODE = 'Z0001';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
  PERFORM set_config('role', 'postgres', true);
  RAISE NOTICE 'Verified nullable stock minimum; fixture rolled back';
END;
$$;
