-- ============================================================
-- MIGRACION 055 - INTEGRIDAD CONTABLE Y AISLAMIENTO EN VENTAS
-- 1. Contabiliza ingresos netos de descuentos para cuadrar el asiento.
-- 2. Valida que todas las referencias de la factura sean de la empresa.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generar_asiento_factura_venta(
  p_documento_id UUID
) RETURNS UUID AS $$
DECLARE
  v_doc                RECORD;
  v_asiento_id         UUID;
  v_num                INTEGER;
  v_cuenta_cobro_id    UUID;
  v_cuenta_ingresos_id UUID;
  v_cuenta_iva_id      UUID;
  v_ejercicio_id       UUID;
  v_desc_db            TEXT;
  v_ingreso_neto       NUMERIC(15,2);
BEGIN
  SELECT d.*, c.prefijo AS serie_codigo, fp.descripcion AS forma_pago_descripcion
  INTO v_doc
  FROM documentos d
  LEFT JOIN consecutivos c ON c.id = d.serie_id
  LEFT JOIN formas_pago fp ON fp.id = d.forma_pago_id
  WHERE d.id = p_documento_id;

  IF v_doc.id IS NULL THEN
    RAISE EXCEPTION 'Factura de venta no encontrada';
  END IF;

  v_ejercicio_id := public.resolver_ejercicio_contable(v_doc.empresa_id, v_doc.fecha, v_doc.ejercicio_id);
  IF v_ejercicio_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro ejercicio contable para la factura %', p_documento_id;
  END IF;

  IF v_doc.ejercicio_id IS NULL THEN
    UPDATE documentos
    SET ejercicio_id = v_ejercicio_id,
        updated_at = NOW()
    WHERE id = p_documento_id;
  END IF;

  v_cuenta_cobro_id := public.obtener_cuenta_cobro_venta(v_doc.empresa_id, v_doc.forma_pago_id);
  IF v_cuenta_cobro_id IS NULL THEN
    RAISE EXCEPTION 'Falta configurar la cuenta de cobro para ventas';
  END IF;

  SELECT ce.cuenta_id
  INTO v_cuenta_ingresos_id
  FROM cuentas_especiales ce
  WHERE ce.empresa_id = v_doc.empresa_id
    AND ce.tipo = 'ingresos';

  IF v_cuenta_ingresos_id IS NULL THEN
    RAISE EXCEPTION 'Falta configurar la cuenta de ingresos por ventas';
  END IF;

  IF COALESCE(v_doc.total_iva, 0) > 0 THEN
    SELECT ce.cuenta_id
    INTO v_cuenta_iva_id
    FROM cuentas_especiales ce
    WHERE ce.empresa_id = v_doc.empresa_id
      AND ce.tipo = 'iva_ventas';

    IF v_cuenta_iva_id IS NULL THEN
      RAISE EXCEPTION 'Falta configurar la cuenta de IVA generado';
    END IF;
  END IF;

  -- El ingreso se reconoce neto del descuento. Usar total - IVA tambien
  -- absorbe de forma exacta el redondeo guardado en la factura.
  v_ingreso_neto := ROUND(COALESCE(v_doc.total, 0) - COALESCE(v_doc.total_iva, 0), 2);

  SELECT numero
  INTO v_num
  FROM siguiente_consecutivo(v_doc.empresa_id, 'asiento');

  INSERT INTO asientos (
    empresa_id, ejercicio_id, numero, tipo, tipo_doc,
    documento_id, concepto, fecha, importe
  ) VALUES (
    v_doc.empresa_id, v_ejercicio_id, v_num,
    'automatico', 'factura_venta', p_documento_id,
    'FV ' || v_doc.prefijo || v_doc.numero::TEXT || ' - ' ||
    COALESCE((SELECT razon_social FROM clientes WHERE id = v_doc.cliente_id), 'CONSUMIDOR'),
    v_doc.fecha, v_doc.total
  ) RETURNING id INTO v_asiento_id;

  v_desc_db := public.descripcion_cobro_venta(v_doc.forma_pago_id, FALSE);

  INSERT INTO asientos_lineas (asiento_id, cuenta_id, descripcion, debe, haber)
  VALUES (v_asiento_id, v_cuenta_cobro_id, v_desc_db, v_doc.total, 0);

  INSERT INTO asientos_lineas (asiento_id, cuenta_id, descripcion, debe, haber)
  VALUES (v_asiento_id, v_cuenta_ingresos_id, 'Ingresos por ventas', 0, v_ingreso_neto);

  IF COALESCE(v_doc.total_iva, 0) > 0 THEN
    INSERT INTO asientos_lineas (asiento_id, cuenta_id, descripcion, debe, haber)
    VALUES (v_asiento_id, v_cuenta_iva_id, 'IVA Generado', 0, v_doc.total_iva);
  END IF;

  RETURN v_asiento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.generar_asiento_factura_venta(UUID) SET search_path = public;
REVOKE ALL ON FUNCTION public.generar_asiento_factura_venta(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generar_asiento_factura_venta(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.secure_crear_factura_venta(
  p_ejercicio_id   UUID,
  p_serie_tipo     TEXT,
  p_cliente_id     UUID,
  p_bodega_id      UUID,
  p_forma_pago_id  UUID,
  p_colaborador_id UUID,
  p_fecha          DATE,
  p_vencimiento    DATE,
  p_observaciones  TEXT,
  p_lineas         JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  v_empresa_id := public.assert_authenticated_empresa(ARRAY['superadmin', 'admin', 'contador', 'vendedor']);

  IF p_lineas IS NULL
     OR jsonb_typeof(p_lineas) <> 'array'
     OR jsonb_array_length(p_lineas) = 0 THEN
    RAISE EXCEPTION 'La factura debe incluir al menos una linea valida'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ejercicios e
    WHERE e.id = p_ejercicio_id AND e.empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Ejercicio fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = p_cliente_id AND c.empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Cliente fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM bodegas b
    WHERE b.id = p_bodega_id AND b.empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Bodega fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM formas_pago fp
    WHERE fp.id = p_forma_pago_id AND fp.empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Forma de pago fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF p_colaborador_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM colaboradores c
    WHERE c.id = p_colaborador_id AND c.empresa_id = v_empresa_id
  ) THEN
    RAISE EXCEPTION 'Colaborador fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_lineas) linea
    WHERE NOT EXISTS (
      SELECT 1
      FROM productos p
      WHERE p.id::TEXT = linea->>'producto_id'
        AND p.empresa_id = v_empresa_id
    )
  ) THEN
    RAISE EXCEPTION 'Producto fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_lineas) linea
    WHERE NULLIF(linea->>'impuesto_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM impuestos i
        WHERE i.id::TEXT = linea->>'impuesto_id'
          AND i.empresa_id = v_empresa_id
      )
  ) THEN
    RAISE EXCEPTION 'Impuesto fuera de la empresa del usuario'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_lineas) linea
    WHERE NULLIF(linea->>'variante_id', '') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM producto_variantes pv
        JOIN productos p ON p.id = pv.producto_id
        WHERE pv.id::TEXT = linea->>'variante_id'
          AND p.id::TEXT = linea->>'producto_id'
          AND p.empresa_id = v_empresa_id
      )
  ) THEN
    RAISE EXCEPTION 'Variante fuera de la empresa o del producto seleccionado'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.crear_factura_venta(
    v_empresa_id,
    p_ejercicio_id,
    p_serie_tipo,
    p_cliente_id,
    p_bodega_id,
    p_forma_pago_id,
    p_colaborador_id,
    p_fecha,
    p_vencimiento,
    p_observaciones,
    p_lineas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.secure_crear_factura_venta(UUID, TEXT, UUID, UUID, UUID, UUID, DATE, DATE, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.secure_crear_factura_venta(UUID, TEXT, UUID, UUID, UUID, UUID, DATE, DATE, TEXT, JSONB)
  TO authenticated, service_role;
