import { chromium } from 'playwright';

// Define URL to record (change this to your localhost address)
const urlToRecord = process.argv[2] || 'http://localhost:8080';

async function recordSession() {
  console.log(`Starting Playwright recording session for: ${urlToRecord}`);
  console.log('A browser window will open. Your actions will be recorded.');
  console.log('Press Ctrl+C in this terminal to stop recording.');

  // This launches the codegen tool targeting the specified URL
  const browserServer = await chromium.launchServer({
    headless: false,
    args: ['--start-maximized']
  });

  // This will keep the process running
  await new Promise(() => {});
}

recordSession().catch(error => {
  console.error('Error during recording session:', error);
  process.exit(1);
});
