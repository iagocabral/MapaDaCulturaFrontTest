// login-manual.ts
import { chromium, Cookie } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const cookies: Cookie[] = [
    {
      name: 'mapasculturais.uid',
      value: '515900',
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    },
    {
      name: 'PHPSESSID',
      value: 'ab8ae0828ad978ea62ae17fce0245b3f',
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    },
    {
      name: 'TS01868f16',
      value: '01ad235981414f779ac0d634313c3c68afaea0b3820',
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    }
  ];

  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto('https://hmg2-mapa.cultura.gov.br/painel/');

  console.log('✅ A página autenticada foi carregada!');
  await page.waitForTimeout(10000); // Tempo para visualizar o resultado
  await browser.close();
})();