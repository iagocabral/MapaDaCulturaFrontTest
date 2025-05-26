const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Get current platform
const platform = os.platform();

console.log(`Detected platform: ${platform}`);

// Check for Wine if on macOS and trying to build for Windows
if (platform === 'darwin') {
  try {
    // Check if Wine is installed
    execSync('which wine64', { stdio: 'ignore' });
    console.log('✅ Wine is installed, can build for Windows');
  } catch (error) {
    console.log('⚠️ Wine is not installed. Installing Wine is recommended for building Windows packages on macOS.');
    console.log('   Run: brew install --cask wine-stable');
    console.log('   Continuing with macOS build only...');
    
    // Build only for macOS
    execSync('npm run build:package:mac', { stdio: 'inherit' });
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const targetPlatform = args[0] || 'current';

// Determine which platform to build for
switch (targetPlatform) {
  case 'mac':
    console.log('Building package for macOS only...');
    execSync('npm run build:package:mac', { stdio: 'inherit' });
    break;
  case 'win':
    if (platform === 'darwin' || platform === 'linux') {
      console.log('Building package for Windows from non-Windows platform...');
      // Ensure icon exists
      const iconPath = path.join(__dirname, '../public/icon.ico');
      if (!fs.existsSync(iconPath)) {
        console.log('⚠️ Windows icon not found. Creating a default one...');
        // Create an empty file as a placeholder
        fs.writeFileSync(iconPath, '');
      }
    }
    console.log('Building package for Windows only...');
    execSync('npm run build:package:win', { stdio: 'inherit' });
    break;
  case 'all':
    console.log('Building packages for all supported platforms...');
    execSync('npm run build:package', { stdio: 'inherit' });
    break;
  default:
    console.log(`Building package for current platform (${platform})...`);
    if (platform === 'darwin') {
      execSync('npm run build:package:mac', { stdio: 'inherit' });
    } else if (platform === 'win32') {
      execSync('npm run build:package:win', { stdio: 'inherit' });
    } else {
      console.log('Building generic package...');
      execSync('npm run build:package', { stdio: 'inherit' });
    }
}

console.log('✅ Build completed successfully!');
