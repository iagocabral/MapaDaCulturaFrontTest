const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Iniciando compilação do TypeScript...');

// Caminho para o diretório de saída
const outDir = path.join(__dirname, '..', 'dist-ts');

// Garantir que o diretório existe
fs.ensureDirSync(outDir);

try {
  // Tenta compilar usando o caminho exato para o compilador TypeScript
  const tscPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
  
  if (fs.existsSync(tscPath)) {
    console.log(`✅ Usando compilador TypeScript em: ${tscPath}`);
    
    // No Windows, o caminho para executáveis em node_modules/.bin é diferente
    const isWindows = process.platform === 'win32';
    const tscExecutable = isWindows ? `"${tscPath}.cmd"` : `"${tscPath}"`;
    
    // Executa o comando tsc com as opções desejadas
    execSync(`${tscExecutable} --skipLibCheck --outDir "${outDir}"`, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
  } else {
    console.log('⚠️ TypeScript não encontrado no caminho usual, tentando alternativa...');
    
    // Tenta encontrar TypeScript instalado globalmente
    try {
      execSync('tsc --version', { stdio: 'inherit' });
      console.log('✅ Usando TypeScript instalado globalmente');
      
      // Executa o comando tsc global
      execSync(`tsc --skipLibCheck --outDir "${outDir}"`, { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
    } catch (e) {
      console.error('❌ TypeScript não encontrado. Tentando instalar...');
      
      // Tenta instalar TypeScript
      execSync('npm install typescript --no-save', { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      
      // Tenta novamente após a instalação
      const newTscPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');
      const newTscExecutable = process.platform === 'win32' ? `"${newTscPath}.cmd"` : `"${newTscPath}"`;
      
      execSync(`${newTscExecutable} --skipLibCheck --outDir "${outDir}"`, { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
    }
  }
  
  console.log('✅ Compilação TypeScript concluída com sucesso!');
} catch (error) {
  console.error('❌ Erro durante a compilação do TypeScript:', error);
  process.exit(1);
}
