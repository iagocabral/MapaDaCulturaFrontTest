document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const authResultDiv = document.getElementById('authResult');
    const testResultDiv = document.getElementById('testResult');
    const targetUrlSelect = document.getElementById('targetUrl');

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authResultDiv.innerHTML = 'Processing...';

        const formData = new FormData(authForm);
        const data = Object.fromEntries(formData.entries());
        data.targetUrl = targetUrlSelect.value; // Add targetUrl to the payload

        try {
            const response = await fetch('/api/generate-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                authResultDiv.innerHTML = `<p class="success">${result.message}</p><pre>${result.details || ''}</pre>`;
            } else {
                authResultDiv.innerHTML = `<p class="error">${result.message}</p><pre>${result.error || ''}\n${result.stdout || ''}\n${result.stderr || ''}</pre>`;
            }
        } catch (error) {
            authResultDiv.innerHTML = `<p class="error">Request failed: ${error.message}</p>`;
        }
    });

    document.querySelectorAll('button[data-script]').forEach(button => {
        button.addEventListener('click', async () => {
            const scriptName = button.getAttribute('data-script');
            const targetUrl = targetUrlSelect.value; // Get selected target URL
            testResultDiv.innerHTML = `Running ${scriptName} on ${targetUrl}...`;

            try {
                const response = await fetch('/api/run-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ script: scriptName, targetUrl: targetUrl }) // Send targetUrl
                });
                const result = await response.json();
                let outputHtml = `<p class="${response.ok ? 'success' : 'error'}">${result.message}</p>`;
                if (result.stdout) {
                    outputHtml += `<h3>Stdout:</h3><pre>${escapeHtml(result.stdout)}</pre>`;
                }
                if (result.stderr) {
                    outputHtml += `<h3>Stderr:</h3><pre>${escapeHtml(result.stderr)}</pre>`;
                }
                 if (result.error && typeof result.error === 'string') {
                    outputHtml += `<h3>Error Detail:</h3><pre>${escapeHtml(result.error)}</pre>`;
                } else if (result.error && typeof result.error === 'object') {
                     outputHtml += `<h3>Error Detail:</h3><pre>${escapeHtml(JSON.stringify(result.error, null, 2))}</pre>`;
                 }
                testResultDiv.innerHTML = outputHtml;
            } catch (error) {
                testResultDiv.innerHTML = `<p class="error">Request to run test failed: ${error.message}</p>`;
            }
        });
    });

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
