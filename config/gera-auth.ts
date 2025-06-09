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

// Determina se estamos no ambiente empacotado ou não
const isElectronApp = typeof process.versions.electron !== 'undefined';

// Define the base path
let basePath: string;
let app: any;

// Handle different environments for paths
if (isElectronApp) {
  try {
    // Try to import electron if we're in an Electron context
    const electron = require('electron');
    app = electron.app;
    const isPackaged = app.isPackaged;
    basePath = isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..');
  } catch (e) {
    // Fallback if electron import fails
    basePath = path.join(__dirname, '..');
  }
} else {
  // Standard Node.js environment
  basePath = path.join(__dirname, '..');
}

// Ensure all paths exist
const configDir = path.join(basePath, 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`Created config directory: ${configDir}`);
}

(async () => {
  const cookieInputPath = path.join(configDir, 'cookie-input.json');
  const authOutputPath = path.join(configDir, 'auth.json');
  const targetEnvPath = path.join(configDir, 'target-env.json');

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
  
  // Configurar o caminho para os navegadores do Playwright quando empacotado
  const playwrightOptions: any = {};
  
  // When we're in a packaged app, use the embedded browsers
  const isPackaged = isElectronApp && app && app.isPackaged;
  if (isPackaged) {
    const browserPath = path.join(basePath, 'playwright-browsers');
    if (fs.existsSync(browserPath)) {
      console.log(`Using embedded Playwright browsers at: ${browserPath}`);
      
      // Use the appropriate path based on the platform
      const platform = process.platform;
      if (platform === 'win32') {
        playwrightOptions.executablePath = path.join(browserPath, 'chromium/chrome-win/chrome.exe');
      } else if (platform === 'darwin') {
        playwrightOptions.executablePath = path.join(browserPath, 'chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium');
      } else if (platform === 'linux') {
        playwrightOptions.executablePath = path.join(browserPath, 'chromium/chrome-linux/chrome');
      }
    } else {
      console.log('Embedded Playwright browsers not found, using system default.');
    }
  }

  const browser = await chromium.launch(playwrightOptions);
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