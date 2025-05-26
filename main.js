const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');

// Determinando se a aplicação está empacotada (em produção) ou não
const isPackaged = app.isPackaged;

// Define caminhos base
const basePath = isPackaged ? path.dirname(app.getPath('exe')) : __dirname;

// Garantindo que os diretórios necessários existam
const configDir = path.join(basePath, 'config');
const contadoresDir = path.join(basePath, 'contadores');

// Criar diretórios se não existirem
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}
if (!fs.existsSync(contadoresDir)) {
  fs.mkdirSync(contadoresDir, { recursive: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  const server = express();
  
  // Middleware para processar JSON
  server.use(express.json());
  server.use(express.static(path.join(basePath, 'public'))); // Use basePath
  
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
      
      // Executar script gera-auth.ts
      let cmd = isPackaged 
        ? `npx ts-node "${path.join(basePath, 'config', 'gera-auth.ts')}"`
        : 'npx ts-node config/gera-auth.ts';
      
      const result = execSync(cmd, { encoding: 'utf8' });
      
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
      
      // Executar o teste
      const npmCmd = isPackaged ? 
        `cd "${basePath}" && npm run ${testScript}` : 
        `npm run ${testScript}`;
        
      const result = execSync(npmCmd, { encoding: 'utf8' });
      
      res.json({ 
        success: true, 
        message: 'Teste executado com sucesso!',
        details: result
      });
    } catch (error) {
      console.error('Erro ao executar teste:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao executar teste',
        error: error.message
      });
    }
  });

  server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
    createWindow();
  });
});

// Adicionando tratamento para quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});