-- Permite que un vendedor vea facturas que creó aunque se hayan guardado
-- sin colaborador asociado. Mantiene aislamiento por empresa.

DROP POLICY IF EXISTS "ver documentos por rol" ON documentos;
CREATE POLICY "ver documentos por rol" ON documentos
  FOR SELECT
  USING (
    empresa_id = get_empresa_id()
    AND (
      get_rol_nombre() IN ('admin', 'contador', 'solo_lectura')
      OR (
        get_rol_nombre() = 'vendedor'
        AND (
          colaborador_id = ANY(public.get_colaborador_ids_for_user())
          OR created_by = auth.uid()
        )
      )
    )
  );
