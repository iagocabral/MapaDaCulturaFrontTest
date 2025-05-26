const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');
const AdmZip = require('adm-zip');

console.log('📦 Iniciando incorporação do Node.js...');

// Versão do Node.js a ser incorporada (deve corresponder ao que você está usando)
const NODE_VERSION = process.versions.node;
const PLATFORM = os.platform() === 'win32' ? 'win' : os.platform();
const ARCH = os.arch() === 'x64' ? 'x64' : 'x86';

// Caminho para o diretório de destino
const targetDir = path.join(__dirname, '..', 'dist', 'TesteFrontApp-win32-x64');
const nodeDir = path.join(targetDir, 'node');
const tempZipPath = path.join(os.tmpdir(), `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.zip`);

// URL para download do Node.js
const nodeUrl = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.zip`;

// Função para baixar o arquivo
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Baixando Node.js de: ${url}`);
    
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao baixar, código de status: ${response.statusCode}`));
        return;
      }
      
      const totalBytes = parseInt(response.headers['content-length'] || '0');
      let downloadedBytes = 0;
      
      response.pipe(file);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          process.stdout.write(`Progresso: ${percent}%\r`);
        }
      });
      
      file.on('finish', () => {
        file.close();
        console.log('\nDownload completo!');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

// Função para extrair arquivos
function extractZip(zipPath, destination) {
  console.log(`Extraindo ${zipPath} para ${destination}...`);
  
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destination, true);
  
  console.log('Extração concluída!');
}

// Função principal
async function embedNode() {
  try {
    // Verificar se o diretório de destino existe
    if (!fs.existsSync(targetDir)) {
      console.error(`❌ Diretório de destino não encontrado: ${targetDir}`);
      console.error('Execute primeiro: npm run build:package');
      process.exit(1);
    }
    
    // Criar diretório para o Node.js
    fs.ensureDirSync(nodeDir);
    
    // Baixar o Node.js
    await downloadFile(nodeUrl, tempZipPath);
    
    // Extrair o Node.js
    extractZip(tempZipPath, os.tmpdir());
    
    // Copiar os arquivos necessários para o diretório de destino
    const extractedDir = path.join(os.tmpdir(), `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}`);
    
    // Copiar apenas node.exe e bibliotecas necessárias
    fs.copySync(path.join(extractedDir, 'node.exe'), path.join(nodeDir, 'node.exe'));
    
    // Copiar as DLLs necessárias se existirem
    const dllFiles = fs.readdirSync(extractedDir)
      .filter(file => file.endsWith('.dll'));
      
    for (const dllFile of dllFiles) {
      fs.copySync(
        path.join(extractedDir, dllFile),
        path.join(nodeDir, dllFile)
      );
    }
    
    console.log('✅ Node.js incorporado com sucesso!');
    
    // Limpar arquivos temporários
    fs.unlinkSync(tempZipPath);
    fs.removeSync(extractedDir);
    console.log('✅ Arquivos temporários removidos');
    
  } catch (error) {
    console.error('❌ Erro ao incorporar Node.js:', error);
    process.exit(1);
  }
}

// Executar
embedNode();
