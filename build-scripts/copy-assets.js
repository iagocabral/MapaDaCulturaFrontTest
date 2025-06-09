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
fs.ensureDirSync(path.join(distDir, 'testes'));

// Copy main.js and preload.js
fs.copySync(
  path.join(sourceDir, 'main.js'),
  path.join(distDir, 'main.js'),
  { overwrite: true }
);
console.log('✅ main.js copiado');

if (fs.existsSync(path.join(sourceDir, 'preload.js'))) {
  fs.copySync(
    path.join(sourceDir, 'preload.js'),
    path.join(distDir, 'preload.js'),
    { overwrite: true }
  );
  console.log('✅ preload.js copiado');
} else {
  // Criar um preload.js mínimo se não existir
  const preloadContent = `
// Minimal preload script
const { contextBridge } = require('electron');

// Expose minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  getVersion: () => process.env.npm_package_version || '1.0.0'
});
`;
  fs.writeFileSync(path.join(distDir, 'preload.js'), preloadContent);
  console.log('✅ preload.js mínimo criado');
}

// Copy public folder
fs.copySync(
  path.join(sourceDir, 'public'),
  path.join(distDir, 'public'),
  { overwrite: true }
);
console.log('✅ Pasta public copiada');

// Create minimal package.json for the packaged app
const packageJson = require(path.join(sourceDir, 'package.json'));
const minimalPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  main: 'main.js',
  author: packageJson.author || '',
  license: packageJson.license || 'ISC',
  dependencies: {
    express: packageJson.dependencies.express,
    playwright: packageJson.dependencies.playwright,
    'ts-node': packageJson.dependencies['ts-node'],
    typescript: packageJson.dependencies.typescript
  }
};

fs.writeFileSync(
  path.join(distDir, 'package.json'), 
  JSON.stringify(minimalPackageJson, null, 2)
);
console.log('✅ package.json minimal criado');

// Create empty config directories for runtime files
fs.ensureDirSync(path.join(distDir, 'config'));
fs.ensureDirSync(path.join(distDir, 'contadores'));

// Create placeholder files for important configuration
const configPlaceholders = [
  { path: 'config/readme.txt', content: 'Este diretório armazena configurações de autenticação e ambiente.\nNão exclua este diretório.' },
  { path: 'contadores/readme.txt', content: 'Este diretório armazena contadores para os vários testes automatizados.\nNão exclua este diretório.' }
];

configPlaceholders.forEach(item => {
  const filePath = path.join(distDir, item.path);
  fs.writeFileSync(filePath, item.content, 'utf8');
});

// Create placeholder icon for Windows if it doesn't exist
const iconPath = path.join(sourceDir, 'public', 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.log('⚠️ Ícone Windows não encontrado. Criando um placeholder...');
  try {
    // Cria um arquivo .ico mínimo
    const defaultIconContent = Buffer.from([
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 
      0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    fs.writeFileSync(iconPath, defaultIconContent);
    console.log('✅ Placeholder de ícone criado');
  } catch (err) {
    console.log('⚠️ Não foi possível criar um ícone: ', err.message);
  }
}

console.log('✅ Todos os assets copiados com sucesso!');
