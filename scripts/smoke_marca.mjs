import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const base = process.env.BRAND_BASE_URL || 'http://127.0.0.1:3107'
const cli = join(homedir(), '.codex/skills/playwright/scripts/playwright_cli.sh')
const session = 'clovent-brand-qa'
function run(...args) {
  const output = execFileSync(cli, [`-s=${session}`, ...args], { encoding: 'utf8', timeout: 120000 })
  if (output.includes('### Error')) throw new Error(output)
  return output
}
mkdirSync('output/playwright', { recursive: true })
try {
  run('open', base)
  run('snapshot')
  run('run-code', `async (page) => {
    const errors = [];
    const onError = error => errors.push(error.message);
    const onConsole = message => { if (message.type() === 'error') errors.push(message.text()); };
    page.on('pageerror', onError);
    page.on('console', onConsole);
    const expected = {
      Ventas: ['FV-00128', 'FV-00127', 'FV-00126'],
      Inventario: ['PR-001', 'PR-002', 'PR-003'],
      Compras: ['FC-00042', 'FC-00041', 'FC-00040'],
      Contabilidad: ['AS-00085', 'AS-00084', 'AS-00083'],
      POS: ['PR-001', 'PR-002', 'PR-003'],
      Usuarios: ['Usuario de ejemplo A', 'Usuario de ejemplo B', 'Usuario de ejemplo C'],
      Reportes: ['Octubre', 'Octubre', 'Octubre'],
    };
    for (const width of [320, 701, 1440]) {
      await page.setViewportSize({width,height:900});
      for (const name of [...Object.keys(expected), 'Ventas', 'Reportes', 'Inventario', 'Reportes', 'Ventas']) {
        await page.getByRole('tab', { name, exact: true }).click();
        const panel = page.getByRole('tabpanel', { name, exact: true });
        await panel.waitFor();
        const rows = await panel.locator('tbody tr td:first-child').allTextContents();
        if (JSON.stringify(rows) !== JSON.stringify(expected[name])) throw new Error(name + ': stale or duplicated rows at ' + width);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error(name + ': horizontal overflow');
      }
    }
    await page.getByRole('tab', { name: 'Reportes', exact: true }).click();
    await page.getByRole('tab', { name: 'Reportes', exact: true }).press('Home');
    if (await page.getByRole('tab', {name:'Ventas',exact:true}).getAttribute('aria-selected') !== 'true') throw new Error('Tab keyboard navigation failed');
    await page.setViewportSize({width:390,height:844});
    const openMenu = page.getByRole('button', {name:'Abrir menú',exact:true});
    const mobileNav = page.getByRole('navigation', {name:'Navegación móvil'});
    for (const source of ['button', 'link']) {
      await openMenu.click();
      const target = source === 'button'
        ? page.getByRole('button', {name:'Cerrar menú',exact:true})
        : mobileNav.getByRole('link', {name:'Plataforma',exact:true});
      await target.focus();
      await target.press('Escape');
      await mobileNav.waitFor({state:'hidden'});
      if (!(await openMenu.evaluate(element => element === document.activeElement))) throw new Error('Escape lost focus from ' + source);
    }
    for (const width of [701, 1440]) {
      await openMenu.click();
      await mobileNav.getByRole('link', {name:'Plataforma',exact:true}).focus();
      await page.setViewportSize({width,height:900});
      await mobileNav.waitFor({state:'hidden'});
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'ClovEnt, inicio');
      await page.setViewportSize({width:390,height:844});
      await openMenu.waitFor();
      if (await openMenu.getAttribute('aria-expanded') !== 'false' || await mobileNav.count()) throw new Error('Menu reopened after resize');
    }
    await page.getByRole('button', {name:'Abrir menú'}).click();
    await page.getByRole('navigation', {name:'Navegación móvil'}).getByRole('link', {name:'Planes'}).click();
    await page.getByRole('heading', {name:'Planes e implementación'}).waitFor();
    if (await page.getByRole('navigation', {name:'Navegación móvil'}).count()) throw new Error('Menu did not close');
    page.off('pageerror', onError);
    page.off('console', onConsole);
    if (errors.length) throw new Error(errors.join('; '));
  }`)
  console.log('Tab contents, console errors, mobile/desktop menu, Escape and focus: OK')
  for (const path of ['/', '/login', '/registro', '/funciones', '/precios', '/contacto']) {
    run('goto', base + path)
    run('snapshot')
    run('run-code', `async (page) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const [width,height] of [[320,740],[390,844],[768,1024],[1440,900],[1920,1080]]) {
        await page.setViewportSize({width,height});
        await page.evaluate(() => scrollTo(0,0));
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          broken: [...document.images].filter(i => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().top < innerHeight && i.complete && !i.naturalWidth).length,
          heroNextTop: document.querySelector('.module-band')?.getBoundingClientRect().top,
        }));
        if (state.overflow || state.broken) throw new Error(${JSON.stringify(path)} + ' at ' + width + ': ' + JSON.stringify(state));
        if (state.heroNextTop !== undefined && state.heroNextTop >= height) throw new Error('Hero hides next section at ' + width);
        if (width === 390 || width === 1440) await page.screenshot({path:'output/playwright/brand-${path.slice(1) || 'home'}-' + width + '.png',fullPage:true,animations:'disabled'});
      }
      if (errors.length) throw new Error(errors.join('; '));
    }`)
    console.log(`${path}: desktop/mobile, overflow, images OK`)
  }
  run('goto', base + '/login')
  run('snapshot')
  run('run-code', `async (page) => {
    await page.getByLabel('Email o cédula', {exact:true}).fill('qa@example.invalid');
    await page.getByLabel('Contraseña', {exact:true}).fill('NotARealPassword');
    await page.getByRole('button', {name:'Mostrar contraseña',exact:true}).click();
    if (await page.getByLabel('Contraseña', {exact:true}).getAttribute('type') !== 'text') throw new Error('Reveal failed');
    await page.getByRole('button', {name:'Ocultar contraseña',exact:true}).click();
    await page.route('**/api/auth/login', route => route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Credenciales de prueba inválidas'})}));
    await page.getByRole('button', {name:'Entrar',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Credenciales de prueba inválidas'}).waitFor();
    await page.unroute('**/api/auth/login');
    await page.route('**/api/auth/login', route => route.abort('failed'));
    await page.getByRole('button', {name:'Entrar',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'No se pudo conectar'}).waitFor();
    if (await page.getByRole('button', {name:'Entrar',exact:true}).isDisabled()) throw new Error('Retry blocked');
    await page.unroute('**/api/auth/login');
  }`)
  console.log('Mocked login error/retry: OK')
  run('goto', base + '/registro')
  run('snapshot')
  run('run-code', `async (page) => {
    const errors = [];
    const onError = error => errors.push(error.message);
    page.on('pageerror', onError);
    let mode = 'network';
    let requests = 0;
    await page.route('**/api/auth/register', route => {
      requests++;
      if (mode === 'network') return route.abort('failed');
      if (mode === 'server') return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'La empresa de prueba ya existe'})});
      if (mode === 'invalid') return route.fulfill({status:503,contentType:'text/html',body:'Service unavailable'});
      return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true})});
    });
    await page.getByLabel('Empresa', {exact:true}).fill('Empresa QA sin envio');
    await page.getByLabel('NIT', {exact:true}).fill('900000000');
    await page.getByLabel('Administrador', {exact:true}).fill('Prueba QA');
    await page.getByLabel('Correo administrador', {exact:true}).fill('qa@example.invalid');
    await page.getByLabel('Contraseña', {exact:true}).fill('NotARealPassword');
    await page.getByLabel('Confirmar contraseña', {exact:true}).fill('DifferentPassword');
    const submit = page.getByRole('button', {name:'Crear empresa',exact:true});
    await submit.click();
    await page.getByRole('alert').filter({hasText:'Las contraseñas no coinciden'}).waitFor();
    if (requests !== 0) throw new Error('Password mismatch reached server');
    await page.getByLabel('Confirmar contraseña', {exact:true}).fill('NotARealPassword');
    for (const [nextMode,message] of [
      ['network','No se pudo conectar'],
      ['server','La empresa de prueba ya existe'],
      ['invalid','No fue posible registrar la empresa'],
    ]) {
      mode = nextMode;
      await submit.click();
      await page.getByRole('alert').filter({hasText:message}).waitFor();
      if (await submit.isDisabled()) throw new Error('Register retry blocked: ' + mode);
      if (await page.getByLabel('Empresa', {exact:true}).inputValue() !== 'Empresa QA sin envio'
        || await page.getByLabel('Contraseña', {exact:true}).inputValue() !== 'NotARealPassword') throw new Error('Register lost form values');
    }
    await page.screenshot({path:'output/playwright/brand-register-retry.png',fullPage:true,animations:'disabled'});
    mode = 'success';
    await submit.click();
    await page.getByRole('status').filter({hasText:'Empresa creada correctamente'}).waitFor();
    if (!(await submit.isDisabled())) throw new Error('Register allows duplicate submit after success');
    await page.waitForURL(url => url.pathname === '/login' && url.searchParams.get('registered') === '1');
    await page.getByRole('status').filter({hasText:'Registro completado'}).waitFor();
    if (await page.getByLabel('Email o cédula', {exact:true}).inputValue() !== 'qa@example.invalid') throw new Error('Register redirect lost email');
    if (requests !== 4) throw new Error('Unexpected registration requests: ' + requests);
    await page.unroute('**/api/auth/register');
    page.off('pageerror', onError);
    if (errors.length) throw new Error(errors.join('; '));
  }`)
  console.log('Mocked registration validation, network/server errors, preserved inputs, retry and success redirect: OK; no account or business writes')
} finally {
  run('close')
}
