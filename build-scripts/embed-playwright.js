const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Iniciando incorporação dos navegadores do Playwright...');

// Certifique-se de que os navegadores estão instalados
try {
  console.log('Verificando instalação do Playwright...');
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright Chromium instalado com sucesso');
} catch (error) {
  console.error('❌ Erro ao instalar o Playwright:', error);
  process.exit(1);
}

// Caminhos de origem e destino
const sourceDir = path.join(__dirname, '..', 'node_modules', 'playwright', '.local-browsers');
const targetDir = path.join(__dirname, '..', 'dist', 'TesteFrontApp-win32-x64', 'resources', 'playwright-browsers');

// Verificar se o diretório de origem existe
if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Diretório de navegadores não encontrado: ${sourceDir}`);
  console.error('Execute primeiro: npx playwright install chromium');
  process.exit(1);
}

// Verificar se o diretório de destino existe
if (!fs.existsSync(path.dirname(targetDir))) {
  console.error(`❌ Diretório de destino não encontrado: ${path.dirname(targetDir)}`);
  console.error('Execute primeiro a build principal: npm run build:package');
  process.exit(1);
}

// Copiar apenas o Chromium (para economizar espaço)
try {
  console.log('Copiando navegador Chromium...');
  
  // Apenas copiar a pasta chromium
  const chromiumDir = path.join(sourceDir, 'chromium-*');
  
  // Garantir que o diretório de destino existe
  fs.ensureDirSync(targetDir);
  
  // Usar o comando do sistema para copiar (mais eficiente para grandes arquivos)
  if (process.platform === 'win32') {
    execSync(`xcopy "${chromiumDir}" "${targetDir}\\chromium" /E /I /H /Y`);
  } else {
    execSync(`cp -R ${chromiumDir} ${targetDir}/chromium`);
  }
  
  console.log('✅ Navegador Chromium copiado com sucesso');
} catch (error) {
  console.error('❌ Erro ao copiar navegadores:', error);
  process.exit(1);
}

console.log('✅ Incorporação dos navegadores do Playwright concluída!');
