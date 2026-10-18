-- Resumenes en PostgreSQL: una respuesta pequena, sin truncar filas de PostgREST.
-- SECURITY INVOKER conserva RLS, incluido el alcance del vendedor.
CREATE OR REPLACE FUNCTION public.get_estadisticas_ventas(p_inicio_mes date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_empresa uuid := public.get_empresa_id();
BEGIN
  IF auth.uid() IS NULL OR v_empresa IS NULL THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT jsonb_build_object(
      'total', count(*) FILTER (WHERE estado <> 'cancelada'),
      'pendiente', COALESCE(sum(total) FILTER (WHERE estado = 'pendiente'), 0),
      'pagada', COALESCE(sum(total) FILTER (WHERE estado = 'pagada'), 0),
      'este_mes', COALESCE(sum(total) FILTER (WHERE estado <> 'cancelada' AND fecha >= p_inicio_mes), 0)
    ) FROM public.documentos
    WHERE empresa_id = v_empresa AND tipo = 'factura_venta'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_estadisticas_inventario(p_desde date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_empresa uuid := public.get_empresa_id();
BEGIN
  IF auth.uid() IS NULL OR v_empresa IS NULL THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  RETURN (
    WITH existencias AS (
      SELECT s.producto_id, sum(COALESCE(s.cantidad, 0)) AS cantidad,
        bool_or(COALESCE(s.cantidad, 0) <= 0 OR
          (COALESCE(s.cantidad_minima, 0) > 0 AND s.cantidad <= s.cantidad_minima)) AS bajo
      FROM public.stock s
      JOIN public.productos p ON p.id = s.producto_id
      WHERE p.empresa_id = v_empresa AND p.activo = true
      GROUP BY s.producto_id
    ), ventas AS (
      SELECT producto_id, sum(cantidad_total) AS cantidad
      FROM public.ventas_producto_diarias
      WHERE empresa_id = v_empresa AND fecha >= p_desde
      GROUP BY producto_id
    )
    SELECT jsonb_build_object(
      'total', count(*),
      'activos', count(*) FILTER (WHERE p.activo = true),
      'stockBajo', count(*) FILTER (WHERE p.activo = true AND COALESCE(s.bajo, true)),
      'sinRotacion', count(*) FILTER (WHERE p.activo = true AND s.cantidad > 0 AND COALESCE(v.cantidad, 0) <= 0),
      'unidades', floor(COALESCE(sum(s.cantidad) FILTER (WHERE p.activo = true), 0) + 0.5)
    )
    FROM public.productos p
    LEFT JOIN existencias s ON s.producto_id = p.id
    LEFT JOIN ventas v ON v.producto_id = p.id
    WHERE p.empresa_id = v_empresa
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_productos_sin_rotacion(
  p_desde date, p_historico date, p_hoy date, p_limite integer DEFAULT 200
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_empresa uuid := public.get_empresa_id();
BEGIN
  IF auth.uid() IS NULL OR v_empresa IS NULL THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  RETURN (
    WITH existencias AS (
      SELECT s.producto_id, sum(COALESCE(s.cantidad, 0)) AS cantidad,
        sum(COALESCE(s.cantidad_minima, 0)) AS minimo
      FROM public.stock s
      JOIN public.productos p ON p.id = s.producto_id
      WHERE p.empresa_id = v_empresa AND p.activo = true
      GROUP BY s.producto_id
    ), ventas AS (
      SELECT producto_id, max(fecha) AS ultima,
        COALESCE(sum(cantidad_total) FILTER (WHERE fecha >= p_desde), 0) AS cantidad
      FROM public.ventas_producto_diarias
      WHERE empresa_id = v_empresa AND fecha >= LEAST(p_historico, p_desde)
      GROUP BY producto_id
    ), resultados AS (
      SELECT p.id, p.codigo, p.descripcion,
        CASE WHEN f.id IS NULL THEN NULL ELSE jsonb_build_object('nombre', f.nombre) END AS familia,
        s.cantidad AS stock_actual, s.minimo AS stock_minimo,
        COALESCE(v.cantidad, 0) AS ventas_periodo, v.ultima AS ultima_venta,
        CASE WHEN v.ultima IS NULL THEN NULL ELSE GREATEST(0, p_hoy - v.ultima) END AS dias_sin_venta,
        COALESCE(p.precio_compra, 0) AS precio_compra, COALESCE(p.precio_venta, 0) AS precio_venta,
        floor(s.cantidad * GREATEST(COALESCE(p.precio_compra, 0), 0) + 0.5) AS valor_stock
      FROM public.productos p
      JOIN existencias s ON s.producto_id = p.id
      LEFT JOIN ventas v ON v.producto_id = p.id
      LEFT JOIN public.familias f ON f.id = p.familia_id AND f.empresa_id = v_empresa
      WHERE p.empresa_id = v_empresa AND p.activo = true
        AND s.cantidad > 0 AND COALESCE(v.cantidad, 0) <= 0
      ORDER BY valor_stock DESC, stock_actual DESC, p.descripcion, p.id
      LIMIT GREATEST(10, LEAST(COALESCE(p_limite, 200), 5000))
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.valor_stock DESC, r.stock_actual DESC, r.descripcion, r.id), '[]'::jsonb)
    FROM resultados r
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_estadisticas_ventas(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_estadisticas_inventario(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_productos_sin_rotacion(date, date, date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_estadisticas_ventas(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_estadisticas_inventario(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_productos_sin_rotacion(date, date, date, integer) TO authenticated;
NOTIFY pgrst, 'reload schema';
