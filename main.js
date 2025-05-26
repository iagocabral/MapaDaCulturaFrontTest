const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, exec, spawn } = require('child_process');

// Defina variáveis globais
let mainWindow = null;
let server = null;
let serverPort = 3000;

// Verifica se o aplicativo está empacotado
const isPackaged = app.isPackaged;
const appPath = isPackaged 
  ? path.dirname(app.getPath('exe'))
  : __dirname;

// Define diretórios importantes
const configDir = path.join(appPath, 'config');
const contadoresDir = path.join(appPath, 'contadores');
const publicDir = isPackaged
  ? path.join(process.resourcesPath, 'app', 'public')
  : path.join(__dirname, 'public');

// Caminho para o Node.js embutido (apenas para versão empacotada)
const embeddedNodePath = isPackaged
  ? path.join(appPath, 'node', 'node.exe')
  : null;

// Função para verificar e criar diretórios
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório criado: ${dir}`);
    } catch (err) {
      console.error(`Erro ao criar diretório ${dir}:`, err);
    }
  }
}

// Certifique-se de que os diretórios necessários existam
ensureDirectoryExists(configDir);
ensureDirectoryExists(contadoresDir);

// Função para executar comandos usando Node.js embutido (quando empacotado)
function runWithEmbeddedNode(command, options = {}) {
  if (isPackaged && fs.existsSync(embeddedNodePath)) {
    // Divide o comando em programa e argumentos
    const parts = command.split(' ');
    const program = parts[0];
    const args = parts.slice(1);
    
    // Se o programa for 'node', substitui pelo caminho do node embutido
    if (program === 'node') {
      return spawn(embeddedNodePath, args, options);
    }
    
    // Se for 'npm', executa via node embutido
    if (program === 'npm') {
      const npmPath = path.join(appPath, 'node_modules', 'npm', 'bin', 'npm-cli.js');
      if (fs.existsSync(npmPath)) {
        return spawn(embeddedNodePath, [npmPath, ...args], options);
      }
    }
  }
  
  // Fallback para execução padrão
  return spawn(command, options);
}

// Função para verificar e instalar dependências necessárias
async function checkAndInstallDependencies() {
  try {
    // Tenta importar express para verificar se está instalado
    require.resolve('express');
    console.log('✅ Express já está instalado');
    
    // Se chegou aqui, o express está disponível e podemos iniciar o servidor
    startServer();
  } catch (error) {
    // Express não encontrado, mostra diálogo e instala
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Instalando dependências',
        message: 'Instalando dependências necessárias. Por favor, aguarde...',
        buttons: ['OK']
      });
    }
    
    console.log('⚠️ Express não encontrado. Instalando dependências...');
    
    try {
      // Verifica se temos um package.json no diretório do app
      const packageJsonPath = path.join(appPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        // Se não existir, copia do resources para o appPath
        const resourcePackageJson = path.join(process.resourcesPath, 'app', 'package.json');
        if (fs.existsSync(resourcePackageJson)) {
          fs.copyFileSync(resourcePackageJson, packageJsonPath);
          console.log('✅ package.json copiado para o diretório do aplicativo');
        }
      }
      
      // Todas as dependências já devem estar no pacote, apenas precisamos garantir
      // que os módulos node estão no lugar certo
      const nodeModulesPath = path.join(appPath, 'node_modules');
      const resourceNodeModulesPath = path.join(process.resourcesPath, 'app', 'node_modules');
      
      if (!fs.existsSync(nodeModulesPath) && fs.existsSync(resourceNodeModulesPath)) {
        // Criar link simbólico para node_modules se não existir
        try {
          fs.symlinkSync(resourceNodeModulesPath, nodeModulesPath, 'junction');
          console.log('✅ Link simbólico para node_modules criado');
        } catch (linkError) {
          console.error('❌ Erro ao criar link simbólico:', linkError);
        }
      }
      
      console.log('✅ Dependências disponíveis');
      
      // Agora que as dependências estão instaladas, inicia o servidor
      startServer();
    } catch (installError) {
      console.error('❌ Erro ao verificar dependências:', installError);
      
      // Mostra erro no diálogo
      if (mainWindow) {
        dialog.showErrorBox(
          'Erro ao verificar dependências',
          `Não foi possível verificar as dependências necessárias: ${installError.message}\n\nO aplicativo pode não funcionar corretamente.`
        );
      }
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(publicDir, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);
  
  // Mostra o DevTools apenas em modo de desenvolvimento
  if (!isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Prepare window to be garbage collected when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  // Agora podemos importar express com segurança
  const express = require('express');
  
  server = express();
  
  // Middleware para processar JSON
  server.use(express.json());
  server.use(express.static(publicDir));
  
  // API endpoint para gerar auth.json
  server.post('/api/generate-auth', (req, res) => {
    try {
      const { uid, phpsessid, targetUrl } = req.body;
      
      if (!uid || !phpsessid || !targetUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parâmetros obrigatórios não fornecidos' 
        });
      }
      
      // Salvar configurações de ambiente
      const targetEnvPath = path.join(configDir, 'target-env.json');
      fs.writeFileSync(targetEnvPath, JSON.stringify({ targetUrl }, null, 2));
      
      // Salvar cookies para gera-auth.ts
      const cookieInputPath = path.join(configDir, 'cookie-input.json');
      fs.writeFileSync(cookieInputPath, JSON.stringify({ uid, phpsessid }, null, 2));
      
      // Caminho para o script gera-auth.ts
      const geraAuthPath = isPackaged
        ? path.join(process.resourcesPath, 'app', 'dist-ts', 'config', 'gera-auth.js')
        : path.join(__dirname, 'config', 'gera-auth.ts');
      
      // Executa script gera-auth
      let result;
      if (isPackaged) {
        // No modo empacotado, executa o JS compilado usando Node embutido se disponível
        const nodePath = fs.existsSync(embeddedNodePath) ? embeddedNodePath : 'node';
        result = execSync(`"${nodePath}" "${geraAuthPath}"`, { encoding: 'utf8' });
      } else {
        // Em desenvolvimento, usa ts-node
        result = execSync('npx ts-node "' + geraAuthPath + '"', { encoding: 'utf8' });
      }
      
      res.json({ 
        success: true, 
        message: 'Auth.json gerado com sucesso!',
        details: result
      });
    } catch (error) {
      console.error('Erro ao gerar auth.json:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao gerar auth.json',
        error: error.message
      });
    }
  });
  
  // API endpoint para executar testes
  server.post('/api/run-test', (req, res) => {
    try {
      const { testScript } = req.body;
      
      if (!testScript) {
        return res.status(400).json({ 
          success: false, 
          message: 'Teste não especificado' 
        });
      }
      
      const validTests = ['test', 'test:agente', 'test:espaco', 'test:evento', 
                         'test:oportunidade', 'test:projeto'];
      
      if (!validTests.includes(testScript)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Teste inválido' 
        });
      }
      
      let testProcess;
      
      if (isPackaged) {
        // No ambiente empacotado, executa os testes compilados
        const scriptBase = testScript.replace('test:', '');
        const scriptName = scriptBase === 'test' ? 'run-all-tests.js' : `testes/criar-${scriptBase}.js`;
        const scriptPath = path.join(process.resourcesPath, 'app', 'dist-ts', scriptName);
        
        // Usa Node.js embutido se disponível
        const nodePath = fs.existsSync(embeddedNodePath) ? embeddedNodePath : 'node';
        
        testProcess = exec(`"${nodePath}" "${scriptPath}"`, (error, stdout, stderr) => {
          if (error) {
            res.status(500).json({
              success: false,
              message: 'Erro ao executar teste',
              error: error.message,
              details: stderr || stdout
            });
            return;
          }
          
          res.json({
            success: true,
            message: 'Teste executado com sucesso!',
            details: stdout
          });
        });
      } else {
        // Em desenvolvimento, usa o npm run
        testProcess = exec(`npm run ${testScript}`, (error, stdout, stderr) => {
          if (error) {
            res.status(500).json({
              success: false,
              message: 'Erro ao executar teste',
              error: error.message,
              details: stderr || stdout
            });
            return;
          }
          
          res.json({
            success: true,
            message: 'Teste executado com sucesso!',
            details: stdout
          });
        });
      }
      
      // Add process to global to allow cancellation
      global.currentTestProcess = testProcess;
      
    } catch (error) {
      console.error('Erro ao executar teste:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste',
        error: error.message
      });
    }
  });
  
  // API endpoint para cancelar teste em execução
  server.post('/api/cancel-test', (req, res) => {
    if (global.currentTestProcess) {
      try {
        // No Windows é mais eficaz usar taskkill
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${global.currentTestProcess.pid} /T /F`);
        } else {
          global.currentTestProcess.kill('SIGTERM');
        }
        
        global.currentTestProcess = null;
        res.json({ success: true, message: 'Teste cancelado com sucesso' });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          message: 'Erro ao cancelar teste',
          error: error.message 
        });
      }
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Nenhum teste em execução' 
      });
    }
  });

  // Inicia o servidor Express
  server.listen(serverPort, () => {
    console.log(`Servidor rodando em http://localhost:${serverPort}`);
    createWindow();
  });
}

// Quando o Electron estiver pronto
app.whenReady().then(async () => {
  // Mostra uma janela de carregamento inicial
  const loadingWin = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  // Cria o HTML de carregamento dinâmico
  const loadingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #f5f5f5;
          flex-direction: column;
          color: #333;
        }
        h2 {
          margin-bottom: 20px;
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-radius: 50%;
          border-top: 4px solid #3498db;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <h2>Iniciando aplicação...</h2>
      <div class="loader"></div>
      <p>Por favor aguarde enquanto verificamos as dependências</p>
    </body>
    </html>
  `;
  
  loadingWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`);
  
  loadingWin.once('ready-to-show', () => {
    loadingWin.show();
    
    // Verificar e instalar as dependências
    checkAndInstallDependencies()
      .then(() => {
        // Quando terminar, fecha a janela de carregamento
        if (loadingWin && !loadingWin.isDestroyed()) {
          loadingWin.close();
        }
      })
      .catch((error) => {
        console.error('Erro durante inicialização:', error);
        if (loadingWin && !loadingWin.isDestroyed()) {
          loadingWin.close();
        }
      });
  });
  
  // No macOS, recria a janela ao clicar no ícone
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Finaliza a aplicação quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Garante que o servidor seja encerrado quando o app for fechado
app.on('will-quit', () => {
  if (server) {
    server.close();
  }
});