const path = require('path');
const { MSICreator } = require('electron-wix-msi');
const fs = require('fs-extra');
const os = require('os');
const { execSync } = require('child_process');

// Verifica se estamos no Windows
if (os.platform() !== 'win32') {
  console.error('❌ A criação de instalador MSI só está disponível no Windows.');
  console.log('✅ Alternativa: Gerando arquivo ZIP para distribuição...');
  execSync('npm run build:zip', { stdio: 'inherit' });
  process.exit(0);
}

async function createInstaller() {
  console.log('📦 Iniciando criação do instalador...');
  
  const rootPath = path.join(__dirname, '..');
  const distPath = path.join(rootPath, 'dist');
  const appFolder = path.join(distPath, 'TesteFrontApp-win32-x64');
  const outputDirectory = path.join(distPath, 'installer');
  
  // Verifica se o diretório da aplicação existe
  if (!fs.existsSync(appFolder)) {
    console.error(`❌ Diretório da aplicação não encontrado: ${appFolder}`);
    console.error('Execute primeiro: npm run build:package');
    process.exit(1);
  }
  
  // Lê informações do package.json
  const packageJson = require(path.join(rootPath, 'package.json'));
  
  // Configurações do instalador
  const msiCreator = new MSICreator({
    appDirectory: appFolder,
    outputDirectory: outputDirectory,
    description: packageJson.description,
    exe: 'TesteFrontApp',
    name: 'Teste Front App MinC',
    manufacturer: 'Ministério da Cultura',
    version: packageJson.version,
    arch: 'x64',
    ui: {
      chooseDirectory: true,
      images: {
        background: path.join(rootPath, 'public', 'installer-bg.png'),
        banner: path.join(rootPath, 'public', 'installer-banner.png')
      }
    }
  });
  
  // Cria diretórios de destino
  fs.ensureDirSync(outputDirectory);
  
  // Cria imagens padrão para o instalador se não existirem
  const defaultBgPath = path.join(rootPath, 'public', 'installer-bg.png');
  const defaultBannerPath = path.join(rootPath, 'public', 'installer-banner.png');
  
  if (!fs.existsSync(defaultBgPath)) {
    console.log('⚠️ Imagem de fundo do instalador não encontrada, criando uma imagem padrão...');
    createDefaultImage(defaultBgPath, 493, 312);
  }
  
  if (!fs.existsSync(defaultBannerPath)) {
    console.log('⚠️ Banner do instalador não encontrado, criando uma imagem padrão...');
    createDefaultImage(defaultBannerPath, 493, 58);
  }
  
  // Compile o instalador
  console.log('Compilando arquivo do instalador...');
  await msiCreator.create();
  
  console.log('Criando o instalador MSI...');
  await msiCreator.compile();
  
  console.log('✅ Instalador criado com sucesso!');
  console.log(`📁 Instalador disponível em: ${outputDirectory}`);
}

// Função para criar uma imagem padrão para o instalador (necessário apenas para Windows)
function createDefaultImage(filePath, width, height) {
  // No Windows, podemos criar um arquivo PNG simples
  // Em produção, você provavelmente terá imagens reais para isto
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Desenha um fundo gradiente
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(1, '#2980b9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Adiciona texto
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Teste Front App MinC', width / 2, height / 2);
  
  // Salva a imagem
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Imagem padrão criada: ${filePath}`);
}

// Executa a função principal
createInstaller().catch(err => {
  console.error('❌ Erro ao criar instalador:', err);
  process.exit(1);
});
