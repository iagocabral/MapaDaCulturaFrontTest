const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

const execPromise = util.promisify(exec);

// List of test scripts to run
const testScripts = [
  'testes/criar-agente-completo.ts',
  'testes/criar-espaco.ts',
  'testes/criar-evento.ts',
  'testes/criar-oportunidade.ts',
  'testes/criar-projeto.ts'
];

// Define interface for error with stdout property for type checking
interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
}

// Function to run a single test
async function runTest(scriptPath: string): Promise<boolean> { // scriptPath is e.g. 'testes/criar-agente-completo.ts'
  const startTime = Date.now();
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`🚀 Iniciando teste: ${scriptPath}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const testsBaseDir = path.join(__dirname, 'testes'); // Base directory for tests, e.g., PROJECT_ROOT/testes
  const scriptFileToExecute = path.basename(scriptPath); // e.g., 'criar-agente-completo.ts'
  
  try {
    // Execute the test script using ts-node, with 'testes/' as the CWD.
    const { stdout, stderr } = await execPromise(`npx ts-node ${scriptFileToExecute}`, { cwd: testsBaseDir });
    
    // Calculate execution time
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Check for errors in stderr
    if (stderr && !stderr.includes('ExperimentalWarning') && !stderr.includes('Warning:')) {
      console.error(`\n❌ ERRO no teste ${scriptPath}:`);
      console.error(stderr);
      console.log(`\n⏱️ Tempo de execução: ${executionTime} segundos (com erro)`);
      return false;
    }
    
    // Log stdout if needed
    if (stdout) {
      // Optional: uncomment this if you want to see all output
      // console.log(stdout);
    }
    
    console.log(`\n✅ Teste ${scriptPath} completado com sucesso!`);
    console.log(`⏱️ Tempo de execução: ${executionTime} segundos`);
    return true;
  } catch (error) {
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ FALHA no teste ${scriptPath}:`);
    
    // Type checking for error properties
    if (error instanceof Error) {
      console.error(error.message);
      
      // Check if error has stdout property using type assertion
      const execError = error as ExecError;
      if (execError.stdout) {
        console.log("\nDetalhes do teste (stdout):");
        console.log(execError.stdout);
      }
    } else {
      // If it's not an Error object, convert to string
      console.error(String(error));
    }
    
    console.log(`\n⏱️ Tempo de execução: ${executionTime} segundos (com erro)`);
    return false;
  }
}

// Function to verify all test files exist
function verifyTestFiles(): boolean {
  const missingFiles = [];
  
  for (const script of testScripts) {
    const filePath = path.join(__dirname, script);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(script);
    }
  }
  
  if (missingFiles.length > 0) {
    console.error('❌ Os seguintes arquivos de teste não foram encontrados:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    return false;
  }
  
  return true;
}

// Function to check if auth.json exists (required for all tests)
function checkAuthFile(): boolean {
  const authFilePath = path.join(__dirname, 'config/auth.json');
  if (!fs.existsSync(authFilePath)) {
    console.error('❌ Arquivo auth.json não encontrado! Este arquivo é necessário para autenticação.');
    console.error('   Por favor, crie o arquivo auth.json antes de executar os testes.');
    return false;
  }
  
  return true;
}

// Main function to run all tests
async function runAllTests() {
  const targetUrl = process.env.TARGET_URL;
  if (targetUrl) {
    console.log(`\n🎯 Running all tests against: ${targetUrl}`);
  } else {
    console.warn('\n⚠️ TARGET_URL environment variable not set. Tests might use default URLs or fail if they rely on it.');
  }

  console.log(`\n${'*'.repeat(100)}`);
  console.log(`🧪 EXECUTANDO TODOS OS TESTES AUTOMATIZADOS`);
  console.log(`${'*'.repeat(100)}\n`);
  
  // Verify test files exist
  if (!verifyTestFiles()) {
    console.error('\n❌ Abortando execução devido a arquivos ausentes.');
    return;
  }
  
  // Check auth file exists
  if (!checkAuthFile()) {
    console.error('\n❌ Abortando execução devido à falta do arquivo de autenticação.');
    return;
  }
  
  const totalStartTime = Date.now();
  const results = [];
  
  // Run each test in sequence
  for (const script of testScripts) {
    const success = await runTest(script);
    results.push({ script, success });
    
    // Small delay between tests to ensure browser instances don't conflict
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Calculate total execution time
  const totalExecutionTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
  
  // Display summary
  console.log(`\n${'*'.repeat(100)}`);
  console.log(`📊 RESUMO DA EXECUÇÃO DOS TESTES`);
  console.log(`${'*'.repeat(100)}\n`);
  
  const successfulTests = results.filter(r => r.success).length;
  console.log(`✅ Testes bem-sucedidos: ${successfulTests}/${testScripts.length}`);
  
  if (successfulTests < testScripts.length) {
    console.log(`❌ Testes com falha: ${testScripts.length - successfulTests}/${testScripts.length}`);
    
    console.log('\nDetalhes das falhas:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ❌ ${result.script}`);
    });
  }
  
  console.log(`\n⏱️ Tempo total de execução: ${totalExecutionTime} segundos`);
  
  // Exit with appropriate code based on test results
  if (successfulTests < testScripts.length) {
    console.log('\n❌ Alguns testes falharam. Verifique os logs acima para mais detalhes.');
    process.exit(1);
  } else {
    console.log('\n✅ Todos os testes foram executados com sucesso!');
    process.exit(0);
  }
}

// Run the main function
runAllTests().catch(error => {
  console.error('Erro fatal durante a execução dos testes:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
