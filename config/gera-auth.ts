// gera-auth.ts
import { chromium, Cookie } from 'playwright';
import fs from 'fs';
import path from 'path';

interface CookieInput {
  uid: string;
  phpsessid: string;
  ts01868f16?: string; // Made optional
}

interface TargetEnv {
  targetUrl: string;
}

(async () => {
  const cookieInputPath = path.join(__dirname, 'cookie-input.json');
  const authOutputPath = path.join(__dirname, 'auth.json');
  const targetEnvPath = path.join(__dirname, 'target-env.json');

  if (!fs.existsSync(cookieInputPath)) {
    console.error(`Error: ${cookieInputPath} not found.`);
    console.error('Please create it with the required cookie values or use the UI to generate it.');
    process.exit(1);
  }
  if (!fs.existsSync(targetEnvPath)) {
    console.error(`Error: ${targetEnvPath} not found. Please configure target environment via UI first.`);
    process.exit(1);
  }

  let cookieData: CookieInput;
  let targetData: TargetEnv;

  try {
    const rawCookieData = fs.readFileSync(cookieInputPath, 'utf-8');
    // Add similar check for cookie-input.json if it can also be empty
    if (!rawCookieData.trim()) {
        console.error(`Error: ${cookieInputPath} is empty or contains only whitespace.`);
        process.exit(1);
    }
    cookieData = JSON.parse(rawCookieData);

    const rawTargetData = fs.readFileSync(targetEnvPath, 'utf-8');
    if (!rawTargetData.trim()) { // Check if the file content is empty or just whitespace
      console.error(`Error: ${targetEnvPath} is empty or contains only whitespace. Please ensure target environment is configured correctly via UI and auth.json is generated again.`);
      process.exit(1);
    }
    targetData = JSON.parse(rawTargetData);
  } catch (error) {
    console.error(`Error reading or parsing configuration files:`, error);
    process.exit(1);
  }

  if (!targetData.targetUrl) {
    console.error(`Error: targetUrl not found in ${targetEnvPath}.`);
    process.exit(1);
  }

  let domain;
  try {
    const url = new URL(targetData.targetUrl);
    domain = url.hostname;
  } catch (error) {
    console.error(`Error parsing targetUrl "${targetData.targetUrl}":`, error);
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
      domain: domain, // Use dynamic domain
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
      expires: -1 // Added missing expires property
    },
    {
      name: 'PHPSESSID',
      value: cookieData.phpsessid,
      domain: domain, // Use dynamic domain
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
      domain: domain, // Use dynamic domain
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