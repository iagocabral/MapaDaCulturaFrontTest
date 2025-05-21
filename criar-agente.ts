import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  // Define o caminho do arquivo que armazenará o contador
  const counterFilePath = path.join(__dirname, 'agent-counter.txt');
  
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
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 // Aumentando a desaceleração para melhor visualização
  });
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();

  try {
    // 1. Acessa o painel inicial
    await page.goto('https://hmg2-mapa.cultura.gov.br/painel');
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

    // 11. Aguarda alguma confirmação (ajuste conforme necessário)
    await page.waitForTimeout(3000);
    
    console.log(`✅ Processo finalizado com sucesso! Agente #${counter} criado.`);
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    
    
    // Opcional: pause para debug interativo quando ocorre erro
    console.log('Pausando execução para debug. Pressione Enter para continuar...');
    await page.pause();
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();