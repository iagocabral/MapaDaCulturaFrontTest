document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos no Electron
    const isElectron = window.electronAPI && window.electronAPI.isElectron;
    
    // Se estiver no Electron, exibe a versão
    if (isElectron) {
        const versionEl = document.createElement('div');
        versionEl.className = 'version-info';
        versionEl.textContent = `Versão: ${window.electronAPI.getVersion()}`;
        document.body.appendChild(versionEl);
    }
    
    // Handle auth form submission
    const authForm = document.getElementById('authForm');
    const authResult = document.getElementById('authResult');
    
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            authResult.innerHTML = '<p>Gerando auth.json... Aguarde.</p>';
            authResult.className = 'processing';
            
            const uid = document.getElementById('uid').value;
            const phpsessid = document.getElementById('phpsessid').value;
            const targetUrl = document.getElementById('targetUrl').value;
            
            try {
                const response = await fetch('/api/generate-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uid, phpsessid, targetUrl })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authResult.innerHTML = `<p class="success">✅ ${data.message}</p>`;
                    authResult.className = 'success';
                } else {
                    authResult.innerHTML = `<p class="error">❌ ${data.message}</p>`;
                    if (data.error) {
                        authResult.innerHTML += `<pre class="error-details">${data.error}</pre>`;
                    }
                    authResult.className = 'error';
                }
            } catch (error) {
                authResult.innerHTML = `<p class="error">❌ Erro de rede: ${error.message}</p>`;
                authResult.className = 'error';
            }
        });
    }
    
    // Handle test buttons
    const testResult = document.getElementById('testResult');
    const testButtons = document.querySelectorAll('button[data-script]');
    const stopExecutionButton = document.getElementById('stopExecutionButton');
    
    testButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const testScript = this.getAttribute('data-script');
            
            testResult.innerHTML = '<p>Executando teste... Isso pode levar alguns minutos.</p>';
            testResult.className = 'processing';
            
            // Disable all test buttons during execution
            testButtons.forEach(btn => btn.disabled = true);
            
            // Show the stop button
            stopExecutionButton.style.display = 'block';
            
            try {
                const response = await fetch('/api/run-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ testScript })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    testResult.innerHTML = `<p class="success">✅ Teste concluído com sucesso!</p>`;
                    testResult.innerHTML += `<pre class="test-output">${data.details}</pre>`;
                    testResult.className = 'success';
                } else {
                    testResult.innerHTML = `<p class="error">❌ Teste falhou: ${data.message}</p>`;
                    if (data.error) {
                        testResult.innerHTML += `<pre class="error-details">${data.error}</pre>`;
                    }
                    testResult.className = 'error';
                }
            } catch (error) {
                testResult.innerHTML = `<p class="error">❌ Erro de rede: ${error.message}</p>`;
                testResult.className = 'error';
            } finally {
                // Re-enable all test buttons
                testButtons.forEach(btn => btn.disabled = false);
                
                // Hide the stop button
                stopExecutionButton.style.display = 'none';
            }
        });
    });
    
    // Handle stop execution button
    if (stopExecutionButton) {
        stopExecutionButton.addEventListener('click', async function() {
            try {
                // Se estiver no electron, use a API do Electron
                if (isElectron) {
                    const result = await window.electronAPI.cancelTest();
                    if (result.success) {
                        testResult.innerHTML += '<p>⚠️ Teste cancelado pelo usuário.</p>';
                    }
                } else {
                    // Versão web
                    const response = await fetch('/api/cancel-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        testResult.innerHTML += '<p>⚠️ Teste cancelado pelo usuário.</p>';
                    }
                }
            } catch (error) {
                testResult.innerHTML += `<p class="error">❌ Erro ao cancelar teste: ${error.message}</p>`;
            }
        });
    }
    
    // Adicionar CSS dinâmico para a versão
    const style = document.createElement('style');
    style.textContent = `
        .version-info {
            position: fixed;
            bottom: 5px;
            right: 5px;
            background: #f1f1f1;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            color: #666;
            z-index: 9999;
        }
        .processing { color: #f39c12; }
        .success { color: #2ecc71; }
        .error { color: #e74c3c; }
        .test-output, .error-details {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
        .error-details {
            background-color: #ffeeee;
        }
    `;
    document.head.appendChild(style);
});
