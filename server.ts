import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const app = express();
const port = 3000;
const execPromise = util.promisify(exec);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const configDir = path.join(__dirname, 'config');
const cookieInputPath = path.join(configDir, 'cookie-input.json');

// Endpoint to generate auth.json
app.post('/api/generate-auth', async (req, res) => {
  // Ensure req.body is correctly populated.
  // uid and phpsessid are expected. ts01868f16 is optional.
  const { uid, phpsessid, ts01868f16 } = req.body;

  // Check if uid or phpsessid are missing or empty strings.
  if (!uid || !phpsessid) {
    // This is the expected error message if uid or phpsessid are not provided.
    return res.status(400).json({ message: 'Missing required cookie data (uid, phpsessid).' });
  }

  try {
    await fs.mkdir(configDir, { recursive: true }); 
    
    const cookiePayload: { uid: string; phpsessid: string; ts01868f16?: string } = {
        uid,
        phpsessid
    };
    // Only include ts01868f16 in the payload if it was provided and is not an empty string.
    if (ts01868f16) { 
        cookiePayload.ts01868f16 = ts01868f16;
    }

    await fs.writeFile(cookieInputPath, JSON.stringify(cookiePayload, null, 2));
    
    console.log('Executing gera-auth.ts...');
    const { stdout, stderr } = await execPromise('npx ts-node config/gera-auth.ts');
    
    if (stderr && !stderr.includes('ExperimentalWarning')) {
      console.error('Error generating auth.json:', stderr);
      return res.status(500).json({ message: 'Error generating auth.json', error: stderr, stdout: stdout });
    }
    console.log('gera-auth.ts output:', stdout);
    res.json({ message: 'auth.json generated successfully.', details: stdout });
  } catch (error: any) {
    console.error('Failed to generate auth.json:', error);
    res.status(500).json({ message: 'Failed to generate auth.json', error: error.message, stdout: error.stdout, stderr: error.stderr });
  }
});

// Endpoint to run tests
app.post('/api/run-test', async (req, res) => {
  const { script } = req.body; // e.g., "test", "test:agente"

  if (!script) {
    return res.status(400).json({ message: 'Test script name not provided.' });
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
    console.log(`Executing npm run ${script}...`);
    // Note: `npm run` changes CWD to package.json location, which is __dirname here.
    // The individual test scripts in package.json already handle `cd testes`.
    const { stdout, stderr } = await execPromise(`npm run ${script}`);
    
    // npm scripts might output to stderr for warnings or progress, so check for actual errors.
    // This logic might need refinement based on typical output.
    if (stderr && !stderr.toLowerCase().includes('deprecated') && !stderr.toLowerCase().includes('warning')) {
        // Heuristic: if stdout is also present, it might not be a fatal error from npm run itself
        // but from the script. The script itself handles exit codes.
        console.warn(`Test execution for ${script} produced stderr:`, stderr);
    }
    console.log(`Test execution stdout for ${script}:`, stdout);
    res.json({ message: `Test script '${script}' executed.`, stdout, stderr });

  } catch (error: any) {
    console.error(`Failed to run test script '${script}':`, error);
    res.status(500).json({ 
        message: `Failed to run test script '${script}'`, 
        error: error.message, 
        stdout: error.stdout, 
        stderr: error.stderr 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`UI server running at http://localhost:${port}`);
});
