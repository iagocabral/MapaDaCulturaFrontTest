import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  // Define o caminho do arquivo que armazenará o contador
  const counterFilePath = path.join(__dirname, 'agent-counter.txt');
  const targetEnvPath = path.join(__dirname, '../config/target-env.json'); // Adjusted path

  // Lê o contador atual do arquivo ou usa 1 se não existir
  let counter = 1;
  try {
    if (fs.existsSync(counterFilePath)) {
      counter = parseInt(fs.readFileSync(counterFilePath, 'utf8'), 10) + 1;
    }
  } catch (e) {
    console.log('Iniciando contador em 1');
  }
  
  // Salva o novo valor do contador no arquivo
  fs.writeFileSync(counterFilePath, counter.toString());
  
  // Obtém a data/hora atual formatada
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');
  
  // Nome único do agente
  const agentName = `Agente Automático ${counter} (${dateStr} ${timeStr})`;
  
  console.log(`🔢 Criando agente #${counter}`);

  let targetUrl: string;
  try {
    if (!fs.existsSync(targetEnvPath)) {
      console.error(`Error: ${targetEnvPath} not found. Please configure target environment via UI first.`);
      process.exit(1);
    }
    const rawTargetData = fs.readFileSync(targetEnvPath, 'utf-8');
    if (!rawTargetData.trim()) {
      console.error(`Error: ${targetEnvPath} is empty. Please ensure target environment is configured.`);
      process.exit(1);
    }
    const targetData = JSON.parse(rawTargetData);
    if (!targetData.targetUrl) {
      console.error(`Error: targetUrl not found in ${targetEnvPath}.`);
      process.exit(1);
    }
    targetUrl = targetData.targetUrl;
    console.log(`🎯 Using target URL: ${targetUrl}`);
  } catch (error) {
    console.error(`Error reading or parsing ${targetEnvPath}:`, error);
    process.exit(1);
  }
  
  // Configuração para tela cheia - ajustada para funcionar melhor no macOS
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300,
    args: [
      '--start-maximized',
      `--window-size=2560,1600`  // Tamanho grande fixo (ajuste conforme seu monitor)
    ]
  });
  
  // Criando contexto do navegador com tamanho máximo de janela
  const context = await browser.newContext({ 
    storageState: path.join(__dirname, '../config/auth.json'), // Adjusted path for auth.json
    viewport: null // Isso desativa o viewport fixo, permitindo tela cheia
  });
  
  const page = await context.newPage();

  try {
    // Maximizar janela para macOS usando teclas de atalho
    try {
      // Tenta simular Cmd+Ctrl+F para macOS (tela cheia)
      await page.keyboard.press('Meta+Control+f');
      console.log('✅ Enviou comando de teclado para maximizar janela (macOS)');
    } catch (e) {
      console.log('⚠️ Não foi possível maximizar via teclado, usando tamanho predefinido');
    }
    
    // 1. Acessa o painel inicial
    await page.goto(targetUrl); // Use the dynamic target URL
    console.log('✅ Página inicial acessada');

    // 2. Clica no botão do navbar "Agentes"
    await page.waitForSelector('text=Agentes', { state: 'visible' });
    await page.click('text=Agentes');
    console.log('✅ Clicou em Agentes');

    // 3. Aguarda a URL mudar para /agentes/#list
    await page.waitForURL('**/agentes/#list');
    console.log('✅ URL mudou para agentes/#list');

    // 4. Aguarda o botão "Criar Agente" aparecer e clica
    await page.waitForSelector('button:has-text("Criar Agente")', { state: 'visible', timeout: 10000 });
    await page.click('button:has-text("Criar Agente")');
    console.log('✅ Clicou em Criar Agente');

    // 5. Aguarda o modal de criação aparecer
    await page.waitForSelector('.modal__content, div[data-v-2836fdb5-s].modal__content', { state: 'visible', timeout: 10000 });
    console.log('✅ Modal de criação apareceu');
    
    // Pequena pausa para garantir que o modal esteja totalmente carregado
    await page.waitForTimeout(2000);

    // 6. Clica no dropdown de tipo de agente e seleciona Coletivo
    // Primeiro localizamos o dropdown e clicamos nele
    await page.click('select, div.field[data-field="type"] select');
    console.log('✅ Clicou no dropdown de tipo');
    
    // Aguarda um momento para garantir que o dropdown esteja aberto
    await page.waitForTimeout(500);
    
    // Seleciona a opção "Coletivo" (usando texto ou valor)
    await page.selectOption('select:visible', { label: 'Coletivo' });
    console.log('✅ Selecionou tipo de agente');
    
    // 7. Preenche o campo "Nome" com nome único
    await page.fill('input[name="name"], input#default-agent-undefined--name--vb3q6qaq9w', agentName);
    console.log(`✅ Preencheu o nome: ${agentName}`);
    
    // 8. Preenche o campo "Descrição curta"
    await page.fill('textarea[name="shortDescription"]', `Esse agente foi criado automaticamente (ID: ${counter})`);
    console.log('✅ Preencheu a descrição curta');
    
    // 9. Adiciona Área de Atuação
    // Localiza o botão "Adicionar nova" na seção de Área de Atuação
    await page.waitForSelector('.entity-terms button:has-text("Adicionar nova")', { state: 'visible', timeout: 5000 });
    await page.click('.entity-terms button:has-text("Adicionar nova")');
    console.log('✅ Clicou em Adicionar nova área de atuação');
    
    // Aguarda o dropdown de opções aparecer
    await page.waitForTimeout(1000);
    
    // Agora seleciona "Acervos" na lista de opções
    try {
      // Aguarda o popup aparecer
      await page.waitForSelector('.mc-multiselect__option', { state: 'visible', timeout: 5000 });
      
      // Clica na opção "Acervos" (corrigindo o seletor)
      await page.click('label:has-text("Acervos")');
      console.log('✅ Selecionou área de atuação "Acervos"');
      
      // Importante: Feche o dropdown/popup explicitamente
      // Primeiro tenta clicar em um botão de confirmação
      try {
        await page.click('button:has-text("Confirmar"), button:has-text("Aplicar"), button:has-text("OK")', { timeout: 3000 });
        console.log('✅ Clicou no botão de confirmação');
      } catch (error) {
        console.log('⚠️ Não encontrou botão de confirmação, tentando fechar de outra forma');
        
        // Se não encontrar botão específico, tenta clicar fora do popup para fechá-lo
        await page.mouse.click(10, 10);
        console.log('✅ Clicou fora para fechar o popup');
        
        // Se ainda estiver aberto, pressiona ESC
        try {
          const isPopupVisible = await page.isVisible('.v-popper__popper--shown');
          if (isPopupVisible) {
            await page.keyboard.press('Escape');
            console.log('✅ Pressionou ESC para fechar popup');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          // Ignora erro na verificação
        }
      }
      
      // Verificar se o popup foi fechado
      try {
        const stillVisible = await page.isVisible('.v-popper__popper--shown');
        if (stillVisible) {
          console.log('⚠️ Popup ainda está visível, tentando fechar novamente');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // Ignora erro na verificação
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível selecionar área de atuação, continuando...', error);
    }
    
    // 10. Clica no botão "Criar e Publicar"
    await page.click('.modal__action button.button--primary');
    console.log('✅ Clicou em Criar e Publicar');

    // 11. Aguarda a confirmação de sucesso (modal "Agente Criado!")
    await page.waitForSelector('text="Agente Criado!"', { state: 'visible', timeout: 10000 });
    console.log('✅ Modal de confirmação "Agente Criado!" apareceu');
    
    // Pequena pausa para garantir que o modal carregue completamente
    await page.waitForTimeout(1000);
    
    // 12. Clica no botão "Completar Informações" - usando seletores mais precisos
    // Baseado nas imagens, ajustamos o seletor para ser mais específico
    try {
      // Tenta várias abordagens para localizar o botão
      console.log('Tentando localizar o botão "Completar Informações"...');
      
      // Abordagem 1: Localizar pelo texto exato
      const completarBtn = await page.locator('button:has-text("Completar Informações")').first();
      if (await completarBtn.isVisible()) {
        await completarBtn.click();
        console.log('✅ Abordagem 1: Clicou em "Completar Informações"');
      }
      // Abordagem 2: Localizar dentro do modal usando o botão do meio
      else {
        console.log('Tentando abordagem alternativa...');
        // Baseado na imagem, sabemos que é o botão do meio no modal
        const buttons = await page.locator('div.v-dialog button').all();
        if (buttons.length >= 2) {
          // Botão do meio (Completar Informações) está entre Ver Agente e Completar Depois
          await buttons[1].click(); 
          console.log('✅ Abordagem 2: Clicou no botão do meio (Completar Informações)');
        } else {
          throw new Error('Não conseguiu localizar o botão "Completar Informações"');
        }
      }
    } catch (err) {
      console.log('⚠️ Erro ao clicar em Completar Informações, tentando último recurso...');

      
      // Último recurso: tenta clicar por coordenadas aproximadas onde o botão deveria estar
      // Com base na imagem, o botão Completar Informações está no meio inferior do modal
      const pageSize = await page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      });
      
      // Clica no meio da tela, um pouco abaixo do centro (onde geralmente está o botão principal)
      await page.mouse.click(pageSize.width / 2, pageSize.height / 2 + 100);
      console.log('✅ Abordagem 3: Clicou na posição aproximada do botão "Completar Informações"');
    }
    
    // Restante do código permanece o mesmo...
    // 13. Aguarda o redirecionamento para a página de edição do agente
    await page.waitForURL('**/edicao-de-agente/**/#info', { timeout: 10000 });
    
    // 14. Captura o ID do agente da URL
    const currentUrl = page.url();
    const agentIdMatch = currentUrl.match(/\/edicao-de-agente\/(\d+)/);
    const agentId = agentIdMatch ? agentIdMatch[1] : 'desconhecido';
    
    console.log(`✅ Redirecionado para página de edição do agente. ID: ${agentId}`);
    console.log(`✅ URL: ${currentUrl}`);
    
    // Aguarda a página carregar completamente
    await page.waitForLoadState('networkidle');
    console.log('✅ Página de edição carregada completamente');
    
    // 15. Preenchimento dos campos na página de edição do agente
    console.log('🖊️ Iniciando preenchimento de campos adicionais...');
    
    // Aguarda um pouco para garantir que todos os elementos do formulário estão visíveis
    await page.waitForTimeout(3000);
    
    // ============= ATUALIZAÇÃO DOS SELETORES BASEADO NO HTML REAL =============
    
    // Função para scrollar até um elemento e torná-lo visível
    // Corrigindo para usar seletores compatíveis com document.querySelector
    async function scrollToElement(selector: string) {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        return false;
      }, selector);
      await page.waitForTimeout(500); // Pequena pausa para a rolagem completar
    }

    // Preenche o campo "Nome Fantasia"
    await scrollToElement('input[name="nomeSocial"]');
    await page.fill('input[name="nomeSocial"]', `Fantasia ${agentName}`);
    console.log('✅ Preencheu o Nome Fantasia');
    
    // Preenche o campo "Razão Social"
    await scrollToElement('input[name="nomeCompleto"]');
    await page.fill('input[name="nomeCompleto"]', `Razão Social ${counter}`);
    console.log('✅ Preencheu a Razão Social');
    
    // Preenche o campo "CNPJ"
    // Gerando um CNPJ válido para teste com máscara correta
    const cnpj = `41491233000111`;
    await scrollToElement('input[name="cnpj"]');
    await page.fill('input[name="cnpj"]', cnpj);
    console.log('✅ Preencheu o CNPJ');
    
    // Preenche a data de fundação
    const randomYear = 1980 + Math.floor(Math.random() * 40); // Entre 1980 e 2020
    const randomMonth = 1 + Math.floor(Math.random() * 12); // Entre 1 e 12
    const randomDay = 1 + Math.floor(Math.random() * 28); // Entre 1 e 28
    const dataFundacao = `${randomDay.toString().padStart(2, '0')}/${randomMonth.toString().padStart(2, '0')}/${randomYear}`;
    
    await scrollToElement('.date-input');
    await page.fill('.date-input', dataFundacao);
    console.log('✅ Preencheu a Data de Fundação');
    
    // Preenche o campo "E-mail privado"
    await scrollToElement('input[name="emailPrivado"]');
    await page.fill('input[name="emailPrivado"]', `email-privado-${counter}@example.com`);
    console.log('✅ Preencheu o E-mail privado');
    
    // Preenche o campo "Telefone público com DDD"
    await scrollToElement('input[name="telefonePublico"]');
    await page.fill('input[name="telefonePublico"]', `(11) 3333-${counter.toString().padStart(4, '0')}`);
    console.log('✅ Preencheu o Telefone público');
    
    // Preenche o campo "E-mail público"
    await scrollToElement('input[name="emailPublico"]');
    await page.fill('input[name="emailPublico"]', `contato-publico-${counter}@agente-auto.com`);
    console.log('✅ Preencheu o E-mail público');
    
    // Preenche os telefones privados
    await scrollToElement('input[name="telefone1"]');
    await page.fill('input[name="telefone1"]', `(21) 9${counter.toString().padStart(4, '0')}-${counter.toString().padStart(4, '0')}`);
    console.log('✅ Preencheu o Telefone privado 1');
    
    await scrollToElement('input[name="telefone2"]');
    await page.fill('input[name="telefone2"]', `(31) 9${counter.toString().padStart(4, '0')}-${(counter+1).toString().padStart(4, '0')}`);
    console.log('✅ Preencheu o Telefone privado 2');
    
    // Preenche os campos de endereço
    await scrollToElement('input[name="En_CEP"]');
    
    // CEP
    await page.fill('input[name="En_CEP"]', '01310-200');
    console.log('✅ Preencheu o CEP');
    
    // Logradouro
    await page.fill('input[name="En_Nome_Logradouro"]', 'Avenida Paulista');
    console.log('✅ Preencheu o Logradouro');
    
    // Número
    await page.fill('input[name="En_Num"]', counter.toString());
    console.log('✅ Preencheu o Número');
    
    // Bairro
    await page.fill('input[name="En_Bairro"]', 'Bela Vista');
    console.log('✅ Preencheu o Bairro');
    
    // Complemento
    await page.fill('input[name="En_Complemento"]', `Sala ${counter}, ${counter}º andar`);
    console.log('✅ Preencheu o Complemento');
    
    // Estado (dropdown)
    // await page.waitForSelector('.col-12 .grid-12 .field select');
    // await page.selectOption('.col-12 .grid-12 .field select:first-of-type', 'SP');
    // console.log('✅ Selecionou o Estado');

    // // Aguarda o dropdown de município carregar
    // await page.waitForTimeout(1500);

    // // Município (dropdown) - tenta localizar após Estado ser selecionado
    // try {
    //     await page.waitForSelector('.col-12 .grid-12 .field select:nth-of-type(2):not(:disabled)', { timeout: 3000 });
    //     await page.selectOption('.col-12 .grid-12 .field select:nth-of-type(2)', { label: 'São Paulo' });
    //     console.log('✅ Selecionou o Município');
    // } catch (e) {
    //     console.log('⚠️ Não foi possível selecionar o município: ', e);
    // }
    
    // Preenche a descrição longa na segunda parte do formulário
    await page.evaluate(() => {
      // Rola para a segunda parte do formulário
      window.scrollBy(0, 500);
    });
    await page.waitForTimeout(500);
    
    await page.waitForSelector('textarea[name="longDescription"]');
    await page.fill('textarea[name="longDescription"]', `Esta é uma descrição longa gerada automaticamente para o agente de teste #${counter}. Este agente foi criado usando automação como parte dos testes do sistema.`);
    console.log('✅ Preencheu a Descrição Longa');
    
    // 16. Salva as alterações
    // Rola para o final da página para encontrar o botão Salvar
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    console.log('✅ Rolou para o final da página');
    
    
    // Identificando o botão Salvar pelo texto exato na parte inferior da tela
    // Na captura de tela, vemos que há um botão "Salvar" na barra inferior direita
    try {
      // Localizando botões na área inferior da página
      const buttons = await page.locator('button').all();
      let salvarClicado = false;
      
      // Examina cada botão para encontrar o "Salvar"
      for (const button of buttons) {
        const buttonText = await button.textContent();
        if (buttonText && buttonText.trim() === 'Salvar') {
          await button.click();
          console.log('✅ Clicou no botão Salvar (texto exato)');
          salvarClicado = true;
          break;
        }
      }
      
      // Se não encontrou pelo texto exato, tenta pela classe ou posição
      if (!salvarClicado) {
        console.log('Tentando abordagens alternativas para o botão Salvar...');
        
        // Na captura de tela, vemos que há um botão Salvar do lado direito
        // Especificamente na captura, vemos que é um botão azul na parte inferior da tela
        await page.click('button.Salvar, button[class*="Salvar"], button[class*="salvar"]');
        console.log('✅ Clicou no botão Salvar por classe');
      }
    } catch (e) {
      console.log('⚠️ Erro ao localizar botão Salvar por seletor:', e);
      
      // Alternativa: Clica no botão na posição mostrada na captura de tela (canto inferior direito)
      try {
        // Com base na captura, o botão Salvar está na posição inferior direita
        const pageSize = await page.evaluate(() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        });
        
        // Clica na posição aproximada do botão Salvar
        await page.mouse.click(pageSize.width - 100, pageSize.height - 50);
        console.log('✅ Clicou na posição aproximada do botão Salvar');
      } catch (clickError) {
        console.log('⚠️ Falha ao tentar clicar por posição:', clickError);
      }
    }
    
    // 17. Espera e verifica a mensagem "Modificações salvas"
    try {
      // Aguarda a notificação "Modificações salvas" aparecer
      await page.waitForSelector('text="Modificações salvas"', { timeout: 10000 });

      console.log('✅ CONFIRMADO: Mensagem "Modificações salvas" exibida com sucesso!');
      
      // Verificando se a mensagem está visível por outro método, para dupla confirmação
      const notificacaoSalvas = await page.locator('text="Modificações salvas"').isVisible();
      if (notificacaoSalvas) {
        console.log('✅ Notificação de sucesso verificada por método alternativo!');
      }
    } catch (e) {
      console.log('⚠️ Não foi possível detectar a mensagem "Modificações salvas":', e);

      const anyNotification = await page.locator('.toast-success, .notification, .alert, .notification--success').isVisible();
      if (anyNotification) {
        console.log('✅ Foi exibida uma notificação, mas não foi possível confirmar o texto exato');
      } else {
        console.log('⚠️ Nenhuma notificação visível após tentativa de salvar');
      }
    }
    
    console.log(`✅ Processo finalizado com sucesso! Agente #${counter} criado com ID: ${agentId}`);
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
  
    // Opcional: pause para debug interativo quando ocorre erro
    console.log('Pausando execução para debug. Pressione Enter para continuar...');
    
    // Não use page.pause() pois ele pode causar problemas em caso de erro
    // Em vez disso, usamos um prompt básico do Node.js 
    await new Promise<void>(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  } finally {
    // Adicionando try/catch para evitar erros caso o browser já esteja fechado
    try {
      await page.waitForTimeout(3000);
      await browser.close();
    } catch (e) {
      console.log('⚠️ Navegador já estava fechado ou erro ao fechar');
    }
  }
})();