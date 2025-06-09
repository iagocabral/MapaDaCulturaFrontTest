const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuração
const distDir = path.join(__dirname, '..', 'dist');
const zipFilename = 'TesteFrontApp-win32-x64.zip';
const zipFilePath = path.join(distDir, zipFilename);

console.log(`📦 Iniciando criação do arquivo ${zipFilename}...`);

// Verificar se o diretório de origem existe
const appDir = path.join(distDir, 'TesteFrontApp-win32-x64');
if (!fs.existsSync(appDir)) {
  console.error(`❌ Diretório da aplicação não encontrado: ${appDir}`);
  console.error('Execute primeiro: npm run build:package');
  process.exit(1);
}

// Criar stream de arquivo
const output = fs.createWriteStream(zipFilePath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

// Ouvir eventos do arquivo e do arquivador
output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Arquivo ${zipFilename} criado com sucesso (${sizeInMB} MB)`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Aviso:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

// Vincular o arquivador ao arquivo de saída
archive.pipe(output);

// Adicionar todos os arquivos do diretório da aplicação
archive.directory(appDir, false);

// Finalizar
archive.finalize();

console.log('Por favor, aguarde enquanto o arquivo é comprimido...');
