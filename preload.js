const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Métodos que você pode precisar expor para o frontend
  isElectron: true,
  platform: process.platform,
  getVersion: () => process.env.npm_package_version || '1.0.0',
  
  // Exemplo: cancelar um teste
  cancelTest: () => {
    return fetch('/api/cancel-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  }
});
