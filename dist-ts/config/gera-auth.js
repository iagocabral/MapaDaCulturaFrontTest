"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// gera-auth.ts
const playwright_1 = require("playwright");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Determina se estamos no ambiente empacotado ou não
const isElectronApp = typeof process.versions.electron !== 'undefined';
// Define the base path
let basePath;
let app;
// Handle different environments for paths
if (isElectronApp) {
    try {
        // Try to import electron if we're in an Electron context
        const electron = require('electron');
        app = electron.app;
        const isPackaged = app.isPackaged;
        basePath = isPackaged ? path_1.default.dirname(app.getPath('exe')) : path_1.default.join(__dirname, '..');
    }
    catch (e) {
        // Fallback if electron import fails
        basePath = path_1.default.join(__dirname, '..');
    }
}
else {
    // Standard Node.js environment
    basePath = path_1.default.join(__dirname, '..');
}
// Ensure all paths exist
const configDir = path_1.default.join(basePath, 'config');
if (!fs_1.default.existsSync(configDir)) {
    fs_1.default.mkdirSync(configDir, { recursive: true });
    console.log(`Created config directory: ${configDir}`);
}
(async () => {
    const cookieInputPath = path_1.default.join(configDir, 'cookie-input.json');
    const authOutputPath = path_1.default.join(configDir, 'auth.json');
    const targetEnvPath = path_1.default.join(configDir, 'target-env.json');
    if (!fs_1.default.existsSync(cookieInputPath)) {
        console.error(`Error: ${cookieInputPath} not found.`);
        console.error('Please create it with the required cookie values or use the UI to generate it.');
        process.exit(1);
    }
    if (!fs_1.default.existsSync(targetEnvPath)) {
        console.error(`Error: ${targetEnvPath} not found. Please configure target environment via UI first.`);
        process.exit(1);
    }
    let cookieData;
    let targetData;
    try {
        const rawCookieData = fs_1.default.readFileSync(cookieInputPath, 'utf-8');
        // Add similar check for cookie-input.json if it can also be empty
        if (!rawCookieData.trim()) {
            console.error(`Error: ${cookieInputPath} is empty or contains only whitespace.`);
            process.exit(1);
        }
        cookieData = JSON.parse(rawCookieData);
        const rawTargetData = fs_1.default.readFileSync(targetEnvPath, 'utf-8');
        if (!rawTargetData.trim()) { // Check if the file content is empty or just whitespace
            console.error(`Error: ${targetEnvPath} is empty or contains only whitespace. Please ensure target environment is configured correctly via UI and auth.json is generated again.`);
            process.exit(1);
        }
        targetData = JSON.parse(rawTargetData);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error(`Error parsing targetUrl "${targetData.targetUrl}":`, error);
        process.exit(1);
    }
    if (!cookieData.uid || !cookieData.phpsessid) { // Removed check for ts01868f16
        console.error(`Error: Missing one or more required fields (uid, phpsessid) in ${cookieInputPath}.`);
        process.exit(1);
    }
    // Configurar o caminho para os navegadores do Playwright quando empacotado
    const playwrightOptions = {};
    // When we're in a packaged app, use the embedded browsers
    const isPackaged = isElectronApp && app && app.isPackaged;
    if (isPackaged) {
        const browserPath = path_1.default.join(basePath, 'playwright-browsers');
        if (fs_1.default.existsSync(browserPath)) {
            console.log(`Using embedded Playwright browsers at: ${browserPath}`);
            // Use the appropriate path based on the platform
            const platform = process.platform;
            if (platform === 'win32') {
                playwrightOptions.executablePath = path_1.default.join(browserPath, 'chromium/chrome-win/chrome.exe');
            }
            else if (platform === 'darwin') {
                playwrightOptions.executablePath = path_1.default.join(browserPath, 'chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium');
            }
            else if (platform === 'linux') {
                playwrightOptions.executablePath = path_1.default.join(browserPath, 'chromium/chrome-linux/chrome');
            }
        }
        else {
            console.log('Embedded Playwright browsers not found, using system default.');
        }
    }
    const browser = await playwright_1.chromium.launch(playwrightOptions);
    const context = await browser.newContext();
    const cookies = [
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
//# sourceMappingURL=gera-auth.js.map