const fs = require('fs-extra');
const path = require('path');

console.log('Copiando arquivos estáticos...');

// Define paths
const sourceDir = path.join(__dirname, '..');
const distDir = path.join(sourceDir, 'dist-ts');

// Ensure the dist directory exists
fs.ensureDirSync(distDir);
fs.ensureDirSync(path.join(distDir, 'config'));
fs.ensureDirSync(path.join(distDir, 'public'));

// Copy public folder
fs.copySync(
  path.join(sourceDir, 'public'),
  path.join(distDir, 'public'),
  { overwrite: true }
);
console.log('✅ Pasta public copiada');

// Copy package.json (for production dependencies)
fs.copySync(
  path.join(sourceDir, 'package.json'),
  path.join(distDir, 'package.json'),
  { overwrite: true }
);
console.log('✅ package.json copiado');

// Create empty config directories for runtime files
fs.ensureDirSync(path.join(distDir, 'config'));
fs.ensureDirSync(path.join(distDir, 'contadores'));

// Create placeholder files for important configuration
const configPlaceholders = [
  { path: 'config/readme.txt', content: 'This directory stores authentication and environment configuration.\nDon\'t delete this directory.' },
  { path: 'contadores/readme.txt', content: 'This directory stores counters for the various automated tests.\nDon\'t delete this directory.' }
];

configPlaceholders.forEach(item => {
  const filePath = path.join(distDir, item.path);
  fs.writeFileSync(filePath, item.content, 'utf8');
});

// Create placeholder icon for Windows if it doesn't exist
const iconPath = path.join(sourceDir, 'public', 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.log('⚠️ Windows icon not found. Creating a placeholder...');
  // Copy a default icon or create an empty one
  try {
    const defaultIconPath = path.join(sourceDir, 'public', 'favicon.ico');
    if (fs.existsSync(defaultIconPath)) {
      fs.copySync(defaultIconPath, iconPath);
    } else {
      // Create a minimal .ico file
      fs.writeFileSync(iconPath, Buffer.from([0,0,1,0,1,0,16,16,0,0,1,0,32,0,68,4,0,0,22,0,0,0]));
    }
    console.log('✅ Placeholder icon criado');
  } catch (err) {
    console.log('⚠️ Não foi possível criar um ícone: ', err.message);
  }
}

console.log('✅ Todos os assets copiados com sucesso!');
