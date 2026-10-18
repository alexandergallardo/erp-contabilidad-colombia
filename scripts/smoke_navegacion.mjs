import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

export async function smokeNavigation({ base, role, cookies }) {
  const cookie = Array.from(cookies, ([k, v]) => `${k}=${v}`).join('; ')
  for (const path of ['/api/ventas/facturas', '/api/ventas/productos-selector', '/api/productos']) {
    const response = await fetch(`${base}${path}`, { headers: { Cookie: cookie } })
    if (!response.ok) throw new Error(`${role} ${path}: ${response.status}`)
    await response.json()
  }
  const restricted = await fetch(`${base}/api/configuracion/empresa`, { headers: { Cookie: cookie } })
  if (restricted.status !== (role === 'admin' ? 200 : 403)) throw new Error('Company API permission regression')
  const anonymous = await fetch(`${base}/api/ventas/facturas`)
  if (anonymous.status !== 401) throw new Error('Anonymous access regression')

  const dir = await mkdtemp(join(tmpdir(), 'clovent-qa-'))
  const state = join(dir, 'state.json')
  const cli = join(homedir(), '.codex/skills/playwright/scripts/playwright_cli.sh')
  const session = `clovent-speed-${role}`
  const run = (...args) => {
    const output = execFileSync(cli, [`-s=${session}`, ...args], { encoding: 'utf8', timeout: 120000 })
    if (output.includes('### Error')) throw new Error(output)
    return output
  }
  try {
    // Auth state is private, temporary, and never included in benchmark artifacts.
    await writeFile(state, JSON.stringify({ cookies: Array.from(cookies, ([name, value]) => ({
      name, value, domain: new URL(base).hostname, path: '/', expires: -1,
      httpOnly: false, secure: base.startsWith('https:'), sameSite: 'Lax',
    })), origins: [] }), { mode: 0o600 })
    await mkdir('output/playwright', { recursive: true })
    run('open', `${base}/login`)
    run('state-load', state)
    run('goto', `${base}/dashboard`)
    run('snapshot')
    run('run-code', `async (page) => {
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      const requests = [];
      let oldRoute;
      let arrived;
      const oldArrived = new Promise(resolve => { arrived = resolve; });
      await page.route('**/api/busqueda?*', route => {
        const term = new URL(route.request().url()).searchParams.get('q');
        requests.push(term);
        if (term === 'qa-anterior') {
          oldRoute = route;
          arrived();
          return;
        }
        if (term === 'qa-error') return route.abort('failed');
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{
          tipo:'producto',id:'qa-local',titulo:'Resultado actual de prueba',detalle:'Simulado',href:'/productos',
        }]})});
      });
      await page.getByRole('button', {name:'Buscar',exact:true}).click();
      const input = page.getByRole('textbox', {name:'Buscar clientes, productos, facturas, proveedores',exact:true});
      await input.fill('qa-anterior');
      await oldArrived;
      const aborted = page.waitForEvent('requestfailed', request => new URL(request.url()).searchParams.get('q') === 'qa-anterior');
      await input.fill('qa-actual');
      await aborted;
      await page.getByRole('button').filter({hasText:'Resultado actual de prueba'}).waitFor();
      await oldRoute.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{
        tipo:'producto',id:'qa-viejo',titulo:'Resultado obsoleto de prueba',detalle:'Simulado',href:'/productos',
      }]})}).catch(() => {});
      if (await page.getByText('Resultado obsoleto de prueba', {exact:true}).count()) throw new Error('Search accepted stale response');
      const hiddenRequest = page.waitForRequest(request => new URL(request.url()).searchParams.get('q') === 'qa-cerrada', {timeout:700})
        .then(() => true, () => false);
      await input.fill('qa-cerrada');
      await input.press('Escape');
      if (await hiddenRequest) throw new Error('Closed search sent a request');
      await page.getByRole('button', {name:'Buscar',exact:true}).click();
      await input.fill('qa-error');
      await page.getByText('Sin resultados para "qa-error"', {exact:true}).waitFor();
      await input.fill('qa-reintento');
      await page.getByRole('button').filter({hasText:'Resultado actual de prueba'}).waitFor();
      await page.getByRole('button', {name:'Limpiar búsqueda',exact:true}).click();
      await page.getByText('Ir a', {exact:true}).waitFor();
      await input.press('ArrowDown');
      await input.press('ArrowUp');
      await input.press('Escape');
      if (JSON.stringify(requests) !== JSON.stringify(['qa-anterior','qa-actual','qa-error','qa-reintento'])) throw new Error('Unexpected search requests: ' + JSON.stringify(requests));
      await page.unroute('**/api/busqueda?*');
      page.off('pageerror', onError);
      if (errors.length) throw new Error(errors.join('; '));
    }`)
    console.log(JSON.stringify({ search: role, canceledOldRequest: true, requestsWhileClosed: 0, retry: 'OK' }))
    run('run-code', `async (page) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.reload();
      await page.getByRole('heading', { name: 'Resumen General', exact: true }).waitFor();
      await page.getByText('Facturado', { exact: true }).waitFor();
      await page.getByRole('heading', { name: /^Alertas/ }).waitFor();
      await page.screenshot({ path: 'output/playwright/dashboard-${role}.png', fullPage: true, animations: 'disabled' });
      if (await page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }).count()) {
        await page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Cambiar a modo oscuro', exact: true }).click();
      await page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }).waitFor();
      await page.screenshot({ path: 'output/playwright/dashboard-dark-${role}.png', fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }).click();
      for (const [path, heading] of [
        ['/productos', 'Artículos / Productos'],
        ['/ventas/facturas', 'Facturas de venta'],
        ['/ventas/facturas/nueva', 'Nueva factura de venta']
      ]) {
        const response = await page.goto(${JSON.stringify(base)} + path);
        if (response.status() !== 200) throw new Error(path + ': ' + response.status());
        await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      }
      await page.getByRole('button', { name: 'Crear factura', exact: true }).waitFor();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: 'output/playwright/factura-mobile-${role}.png', fullPage: true });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)) throw new Error('Mobile overflow');
      await page.goto(${JSON.stringify(base + '/pos')});
      await page.getByRole('heading', { name: 'POS móvil', exact: true }).waitFor();
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.getByPlaceholder('Buscar por codigo o nombre...', { exact: true }).filter({ visible: true }).waitFor();
      if (await page.getByText('No se pudo cargar', { exact: false }).count()) throw new Error('POS error');
      ${role === 'admin' ? `await page.goto(${JSON.stringify(base + '/compras/sugeridos')}); await page.getByRole('heading', {name: 'Sugeridos de compra', exact: true}).waitFor();` : ''}
      if (errors.length) throw new Error(errors.join('; '));
      return { role: ${JSON.stringify(role)}, status: 'OK' };
    }`)
    console.log(JSON.stringify({ smoke: role, api: 'OK', browser: 'OK' }))
  } finally {
    try { run('close') } finally { await rm(dir, { recursive: true, force: true }) }
  }
}
