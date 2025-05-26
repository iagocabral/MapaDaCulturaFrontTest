document.addEventListener('DOMContentLoaded', function() {
    // Handle auth form submission
    const authForm = document.getElementById('authForm');
    const authResult = document.getElementById('authResult');
    
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        authResult.innerHTML = '<p>Generating auth.json... Please wait.</p>';
        authResult.classList.add('processing');
        
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
                authResult.classList.remove('processing');
                authResult.classList.add('success');
            } else {
                authResult.innerHTML = `<p class="error">❌ ${data.message}</p>`;
                if (data.error) {
                    authResult.innerHTML += `<pre class="error-details">${data.error}</pre>`;
                }
                authResult.classList.remove('processing');
                authResult.classList.add('error');
            }
        } catch (error) {
            authResult.innerHTML = `<p class="error">❌ Network error: ${error.message}</p>`;
            authResult.classList.remove('processing');
            authResult.classList.add('error');
        }
    });
    
    // Handle test buttons
    const testResult = document.getElementById('testResult');
    const testButtons = document.querySelectorAll('button[data-script]');
    const stopExecutionButton = document.getElementById('stopExecutionButton');
    let currentTestProcess = null;
    
    testButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const testScript = this.getAttribute('data-script');
            
            testResult.innerHTML = '<p>Running test... This may take a while.</p>';
            testResult.classList.add('processing');
            
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
                    testResult.innerHTML = `<p class="success">✅ Test completed successfully!</p>`;
                    testResult.innerHTML += `<pre class="test-output">${data.details}</pre>`;
                    testResult.classList.remove('processing');
                    testResult.classList.add('success');
                } else {
                    testResult.innerHTML = `<p class="error">❌ Test failed: ${data.message}</p>`;
                    if (data.error) {
                        testResult.innerHTML += `<pre class="error-details">${data.error}</pre>`;
                    }
                    testResult.classList.remove('processing');
                    testResult.classList.add('error');
                }
            } catch (error) {
                testResult.innerHTML = `<p class="error">❌ Network error: ${error.message}</p>`;
                testResult.classList.remove('processing');
                testResult.classList.add('error');
            } finally {
                // Re-enable all test buttons
                testButtons.forEach(btn => btn.disabled = false);
                
                // Hide the stop button
                stopExecutionButton.style.display = 'none';
                currentTestProcess = null;
            }
        });
    });
    
    // Optional: Add CSS for styling the status messages
    const style = document.createElement('style');
    style.textContent = `
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
