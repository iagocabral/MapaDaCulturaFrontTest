// gera-auth.ts
import { chromium, Cookie } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
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
      value: '5305469ebfc914312d66b68f34e4c0f6',
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    },
    {
      name: 'TS01868f16',
      value: '01ad23598118ad3d470cd5171262aacdba621e89b9b8f11af0653ce742ffcdb4d7277a1336ad4aaa44d1ae00be9abbb2f2eb9c08879cc2bd292bbe44899f54cd4d771814b3f742a6240ed5f330d54d120c2c65cb55414dabf026803dad1cbf62ee7bfd9bff',
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    }
  ];

  await context.addCookies(cookies);
  await context.storageState({ path: 'auth.json' });

  await browser.close();
})();