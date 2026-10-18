import { lstat, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dryRun = process.argv.includes('--dry-run')
const targets = [
  '.next/cache',
  '.next/dev/cache',
  '.playwright-cli',
  'output/playwright',
  'eslint-report.json',
  'tsconfig.tsbuildinfo',
  'tsconfig.check.tsbuildinfo',
]

async function bytesAt(path) {
  const stat = await lstat(path).catch(error => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (!stat) return 0
  if (!stat.isDirectory()) return stat.size
  let bytes = 0
  for (const entry of await readdir(path)) bytes += await bytesAt(join(path, entry))
  return bytes
}

let total = 0
for (const target of targets) {
  const path = join(root, target)
  const bytes = await bytesAt(path)
  if (!bytes) continue
  if (!dryRun) await rm(path, { recursive: true, force: true })
  total += bytes
  console.log(`${dryRun ? 'Disponible' : 'Eliminado'}: ${target} (${(bytes / 1024 ** 2).toFixed(1)} MB)`)
}
console.log(`${dryRun ? 'Se pueden liberar' : 'Liberados'}: ${(total / 1024 ** 2).toFixed(1)} MB`)
