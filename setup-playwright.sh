#!/bin/bash

echo "Setting up Playwright testing environment..."

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Make the record-session file if it doesn't exist
if [ ! -f "record-session.ts" ]; then
    echo "Creating record-session.ts script..."
    cat > record-session.ts << EOL
import { chromium } from 'playwright';

// Define URL to record (change this to your localhost address)
const urlToRecord = process.argv[2] || 'http://localhost:3000';

async function recordSession() {
  console.log(\`Starting Playwright recording session for: \${urlToRecord}\`);
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
EOL
fi

echo "Setup complete! You can now run:"
echo "npm run record http://localhost:8080"
echo ""
echo "IMPORTANT: The codegen tool opens two windows:"
echo "1. A browser window where you perform your actions"
echo "2. A Playwright Inspector window that shows the generated code"
echo ""
echo "The session is NOT automatically saved to a file."
echo "You need to copy the generated code from the Playwright Inspector"
echo "window and save it to your own test file."
echo ""
echo "Alternatively, use this command to save to a file:"
echo "npm run record http://localhost:8080 -- --output=my-recording.ts"
echo ""
echo "Or use our custom recording script:"
echo "npm run record:url http://localhost:8080"

chmod +x setup-playwright.sh
