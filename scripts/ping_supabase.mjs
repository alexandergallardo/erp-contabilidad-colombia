#!/usr/bin/env node
/**
 * Script de ping de mantenimiento y verificación de salud de Supabase
 * Ejecución: npm run ping:supabase [URL_OPCIONAL]
 */

const targetUrl = process.argv[2] || process.env.PING_TARGET_URL || 'https://www.clovent.co/api/health'

async function ping() {
  console.log(`📡 Enviando ping de mantenimiento a: ${targetUrl}`)
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Clovent-ERP-Ping/1.0',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const roundtripMs = Date.now() - startTime
    const text = await res.text()
    let data = null
    try {
      data = JSON.parse(text)
    } catch {
      // not JSON
    }

    if (!res.ok) {
      console.error(`❌ Error HTTP ${res.status}:`, data || text)
      process.exit(1)
    }

    if (data?.ok && data?.checks?.db) {
      console.log(`✅ Supabase ACTIVO y conectado`)
      console.log(`   - Latencia BD: ${data.checks.latency_ms} ms`)
      console.log(`   - Tiempo de ida y vuelta HTTP: ${roundtripMs} ms`)
      console.log(`   - Timestamp servidor: ${data.checks.timestamp || 'N/A'}`)
      process.exit(0)
    } else {
      console.error(`⚠️ Respuesta inesperada del healthcheck:`, data || text)
      process.exit(1)
    }
  } catch (error) {
    console.error(`❌ Falló la conexión al endpoint:`, error.message)
    process.exit(1)
  }
}

ping()
