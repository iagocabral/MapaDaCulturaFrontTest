"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const app = (0, express_1.default)();
const port = 3000;
const execPromise = util_1.default.promisify(child_process_1.exec);
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
const configDir = path_1.default.join(__dirname, 'config');
const cookieInputPath = path_1.default.join(configDir, 'cookie-input.json');
const targetEnvPath = path_1.default.join(configDir, 'target-env.json'); // Path for target-env.json
// Endpoint to generate auth.json
app.post('/api/generate-auth', async (req, res) => {
    // Ensure req.body is correctly populated.
    // uid and phpsessid are expected. ts01868f16 is optional.
    const { uid, phpsessid, ts01868f16, targetUrl } = req.body; // Added targetUrl
    if (!targetUrl) {
        return res.status(400).json({ message: 'Target URL not provided.' });
    }
    // Check if uid or phpsessid are missing or empty strings.
    if (!uid || !phpsessid) {
        // This is the expected error message if uid or phpsessid are not provided.
        return res.status(400).json({ message: 'Missing required cookie data (uid, phpsessid).' });
    }
    try {
        await promises_1.default.mkdir(configDir, { recursive: true });
        // Save targetUrl
        await promises_1.default.writeFile(targetEnvPath, JSON.stringify({ targetUrl }, null, 2));
        console.log(`Target environment saved: ${targetUrl}`);
        const cookiePayload = {
            uid,
            phpsessid
        };
        // Only include ts01868f16 in the payload if it was provided and is not an empty string.
        if (ts01868f16) {
            cookiePayload.ts01868f16 = ts01868f16;
        }
        await promises_1.default.writeFile(cookieInputPath, JSON.stringify(cookiePayload, null, 2));
        console.log('Executing gera-auth.ts...');
        // Pass targetUrl as an env variable if gera-auth.ts needs it directly,
        // but current plan is for gera-auth.ts to read from target-env.json
        const { stdout, stderr } = await execPromise('npx ts-node config/gera-auth.ts');
        if (stderr && !stderr.includes('ExperimentalWarning')) {
            console.error('Error generating auth.json:', stderr);
            return res.status(500).json({ message: 'Error generating auth.json', error: stderr, stdout: stdout });
        }
        console.log('gera-auth.ts output:', stdout);
        res.json({ message: 'auth.json generated successfully.', details: stdout });
    }
    catch (error) {
        console.error('Failed to generate auth.json:', error);
        res.status(500).json({ message: 'Failed to generate auth.json', error: error.message, stdout: error.stdout, stderr: error.stderr });
    }
});
// Endpoint to run tests
app.post('/api/run-test', async (req, res) => {
    const { script, targetUrl } = req.body; // Added targetUrl
    if (!script) {
        return res.status(400).json({ message: 'Test script name not provided.' });
    }
    if (!targetUrl) {
        return res.status(400).json({ message: 'Target URL not provided for test run.' });
    }
    // Basic validation to prevent arbitrary command execution
    const allowedScripts = [
        "test",
        "test:agente",
        "test:espaco",
        "test:evento",
        "test:oportunidade",
        "test:projeto"
    ];
    if (!allowedScripts.includes(script)) {
        return res.status(400).json({ message: 'Invalid or disallowed test script.' });
    }
    try {
        console.log(`Executing npm run ${script} on ${targetUrl}...`);
        const commandOptions = {
            env: {
                ...process.env, // Inherit existing environment variables
                TARGET_URL: targetUrl // Set our custom environment variable
            }
        };
        const { stdout, stderr } = await execPromise(`npm run ${script}`, commandOptions);
        // npm scripts might output to stderr for warnings or progress, so check for actual errors.
        // This logic might need refinement based on typical output.
        if (stderr && !stderr.toLowerCase().includes('deprecated') && !stderr.toLowerCase().includes('warning')) {
            // Heuristic: if stdout is also present, it might not be a fatal error from npm run itself
            // but from the script. The script itself handles exit codes.
            console.warn(`Test execution for ${script} produced stderr:`, stderr);
        }
        console.log(`Test execution stdout for ${script}:`, stdout);
        res.json({ message: `Test script '${script}' executed.`, stdout, stderr });
    }
    catch (error) {
        console.error(`Failed to run test script '${script}' on ${targetUrl}:`, error);
        res.status(500).json({
            message: `Failed to run test script '${script}'`,
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr
        });
    }
});
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
app.listen(port, () => {
    console.log(`UI server running at http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map