import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function saveRecording() {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputFileName = process.argv[3] || `playwright-recording-${Date.now()}.ts`;
  
  console.log(`Starting Playwright recording session for: ${url}`);
  console.log(`Recording will be saved to: ${outputFileName}`);
  console.log('Press Ctrl+C to stop recording and save the file.');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Start recording
  await context.tracing.start({ screenshots: true, snapshots: true });
  
  // Navigate to the URL
  await page.goto(url);
  
  // Keep the session running until interrupted
  try {
    await new Promise(() => {});
  } catch (e) {
    console.log('Recording session ended.');
  } finally {
    // Stop tracing and save to file
    await context.tracing.stop({ path: 'trace.zip' });
    
    console.log(`Trace saved to trace.zip`);
    console.log(`To view the recording: npx playwright show-trace trace.zip`);
    
    await browser.close();
  }
}

saveRecording().catch(error => {
  console.error('Error during recording:', error);
  process.exit(1);
});
