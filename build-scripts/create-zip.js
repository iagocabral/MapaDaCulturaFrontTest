const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Caminho para a pasta dist onde está o app empacotado
const distPath = path.join(__dirname, '..', 'dist');

// Verifica se a pasta dist existe
if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist não encontrada! Execute npm run build primeiro.');
  process.exit(1);
}

// Obtém as pastas dentro de dist (deve conter a pasta do app)
const appFolders = fs.readdirSync(distPath).filter(
  item => fs.statSync(path.join(distPath, item)).isDirectory()
);

if (appFolders.length === 0) {
  console.error('❌ Nenhuma pasta de aplicativo encontrada em dist/');
  process.exit(1);
}

// Usa a primeira pasta encontrada (normalmente deve ter apenas uma)
const appFolder = appFolders[0];
const appPath = path.join(distPath, appFolder);
const outputPath = path.join(distPath, `${appFolder}.zip`);

// Cria um arquivo para escrever o zip
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão
});

// Ouve eventos do stream de saída
output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Arquivo ZIP criado com sucesso: ${outputPath}`);
  console.log(`📦 Tamanho total: ${sizeInMB} MB`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Aviso durante compactação:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

// Conecta o arquivador ao stream de saída
archive.pipe(output);

// Adiciona o diretório do app ao arquivo zip
console.log(`📦 Compactando ${appPath}...`);
archive.directory(appPath, appFolder);

// Finaliza o arquivo
archive.finalize();
