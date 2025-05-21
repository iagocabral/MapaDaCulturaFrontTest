// gera-auth.ts
import { chromium, Cookie } from 'playwright';
import fs from 'fs';
import path from 'path';

interface CookieInput {
  uid: string;
  phpsessid: string;
  ts01868f16?: string; // Made optional
}

(async () => {
  const cookieInputPath = path.join(__dirname, 'cookie-input.json');
  const authOutputPath = path.join(__dirname, 'auth.json');

  if (!fs.existsSync(cookieInputPath)) {
    console.error(`Error: ${cookieInputPath} not found.`);
    console.error('Please create it with the required cookie values or use the UI to generate it.');
    process.exit(1);
  }

  let cookieData: CookieInput;
  try {
    const rawData = fs.readFileSync(cookieInputPath, 'utf-8');
    cookieData = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing ${cookieInputPath}:`, error);
    process.exit(1);
  }

  if (!cookieData.uid || !cookieData.phpsessid) { // Removed check for ts01868f16
    console.error(`Error: Missing one or more required fields (uid, phpsessid) in ${cookieInputPath}.`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();

  const cookies: Cookie[] = [
    {
      name: 'mapasculturais.uid',
      value: cookieData.uid,
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
      expires: -1 // Added missing expires property
    },
    {
      name: 'PHPSESSID',
      value: cookieData.phpsessid,
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    }
  ];

  // Conditionally add TS01868f16 cookie if present
  if (cookieData.ts01868f16) {
    cookies.push({
      name: 'TS01868f16',
      value: cookieData.ts01868f16,
      domain: 'hmg2-mapa.cultura.gov.br',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      expires: -1
    });
  }

  await context.addCookies(cookies);
  await context.storageState({ path: authOutputPath });
  console.log(`Authentication state saved to ${authOutputPath}`);

  await browser.close();
})();