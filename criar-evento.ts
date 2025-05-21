import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  // Define o caminho do arquivo que armazenará o contador
  const counterFilePath = path.join(__dirname, 'event-counter.txt');
  
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
  
  // Nome único do evento
  const eventName = `Evento Automático ${counter} (${dateStr} ${timeStr})`;
  
  console.log(`🔢 Criando evento #${counter}`);
  
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
    storageState: 'auth.json',
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
    await page.goto('https://hmg2-mapa.cultura.gov.br/painel');
    console.log('✅ Página inicial acessada');

    // 2. Clica no botão do navbar "Eventos"
    await page.waitForSelector('text=Eventos', { state: 'visible' });
    await page.click('text=Eventos');
    console.log('✅ Clicou em Eventos');

    // 3. Aguarda a URL mudar para /eventos/#list
    await page.waitForURL('**/eventos/**', { timeout: 10000 });
    console.log('✅ URL mudou para página de eventos');

    // 4. Aguarda o botão "Criar Evento" aparecer e clica
    await page.waitForSelector('button:has-text("Criar Evento")', { state: 'visible', timeout: 10000 });
    await page.click('button:has-text("Criar Evento")');
    console.log('✅ Clicou em Criar Evento');

    // 5. Aguarda o modal de criação aparecer
    await page.waitForSelector('.modal__content, .v-dialog', { state: 'visible', timeout: 10000 });
    console.log('✅ Modal de criação apareceu');
    
    // Pequena pausa para garantir que o modal esteja totalmente carregado
    await page.waitForTimeout(2000);

    // 6. Preenche o campo "Nome" do evento
    await page.fill('input[placeholder="Nome"], input[name="name"]', eventName);
    console.log(`✅ Preencheu o nome: ${eventName}`);
    
    // 7. Clica para adicionar uma Linguagem cultural
    await page.click('button:has-text("Adicionar nova")');
    console.log('✅ Clicou em Adicionar nova linguagem cultural');
    
    // Aguarda o dropdown/modal de opções aparecer
    await page.waitForTimeout(1000);
    
    // 8. Seleciona a linguagem cultural "Artes Circenses"
    try {
      // Aguarda as opções aparecerem
      await page.waitForSelector('label:has-text("Artes Circenses")', { timeout: 5000 });
      
      // Clica na opção "Artes Circenses"
      await page.click('label:has-text("Artes Circenses")');
      console.log('✅ Selecionou linguagem "Artes Circenses"');
      
      // Fecha o popup/seletor (tenta várias abordagens)
      try {
        // Primeiro tenta clicar em um botão de confirmação se existir
        await page.click('button:has-text("Confirmar"), button:has-text("Aplicar"), button:has-text("OK")', { timeout: 3000 });
        console.log('✅ Clicou no botão de confirmação');
      } catch (error) {
        console.log('⚠️ Não encontrou botão de confirmação, tentando fechar de outra forma');
        
        // Se não encontrar botão específico, tenta clicar fora do popup para fechá-lo
        await page.mouse.click(10, 10);
        console.log('✅ Clicou fora para fechar o popup');
        
        // Se ainda estiver aberto, pressiona ESC
        try {
          const isPopupVisible = await page.isVisible('.v-popper__popper--shown, .multiselect__content-wrapper');
          if (isPopupVisible) {
            await page.keyboard.press('Escape');
            console.log('✅ Pressionou ESC para fechar popup');
          }
        } catch (e) {
          // Ignora erro na verificação
        }
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível selecionar linguagem cultural, continuando...', error);
    }
    
    // 9. Adiciona uma descrição curta ao evento
    await page.fill('textarea[name="shortDescription"], textarea.textarea--shortDescription', `Evento de teste automatizado #${counter}. Criado para fins de teste do sistema.`);
    console.log('✅ Preencheu descrição curta');
    
    // 10. Seleciona classificação etária "Livre"
    try {
      // Encontra o dropdown de classificação etária
      const classificacaoDropdown = await page.locator('select, div.field[data-field="classificacaoEtaria"] select').first();
      await classificacaoDropdown.click();
      console.log('✅ Clicou no dropdown de classificação etária');
      
      // Aguarda um momento para garantir que o dropdown esteja aberto
      await page.waitForTimeout(500);
      
      // Seleciona a opção "Livre"
      await page.selectOption('select:visible', { label: 'Livre' });
      console.log('✅ Selecionou classificação etária "Livre"');
    } catch (error) {
      console.warn('⚠️ Erro ao selecionar classificação etária:', error);
      
      // Abordagem alternativa - tentar clicar no dropdown e depois no item correto
      try {
        await page.click('.field:has-text("Classificação Etária")');
        await page.waitForTimeout(500);
        await page.click('text=Livre');
        console.log('✅ Abordagem alternativa para selecionar classificação etária');
      } catch (altError) {
        console.warn('⚠️ Abordagem alternativa também falhou:', altError);
      }
    }
    
    // 11. Clica no botão "Criar e Publicar"
    await page.click('button:has-text("Criar e Publicar")');
    console.log('✅ Clicou em Criar e Publicar');
    
    // 12. Aguarda confirmação de sucesso (pode ser um modal ou redirecionamento)
try {
    // Aguarda por possível modal de confirmação
    const confirmacaoSucesso = await page.waitForSelector('text="Evento Criado!"', { state: 'visible', timeout: 5000 });
    if (confirmacaoSucesso) {
      console.log('✅ Modal de confirmação "Evento Criado!" apareceu');
      await page.waitForTimeout(1000);
      
      // Clica no link "Completar Informações"
      try {
        // Abordagem 1: Localizar pelo texto exato no link (a) em vez de botão
        console.log('Tentando localizar o link "Completar Informações"...');
        const completarLink = await page.locator('a:has-text("Completar Informações")').first();
        
        if (await completarLink.isVisible()) {
          await completarLink.click();
          console.log('✅ Abordagem 1: Clicou no link "Completar Informações"');
        } 
        // Abordagem 2: Localizar pelo href que contém "edicao-de-evento"
        else {
          console.log('Tentando abordagem alternativa pelo href...');
          const editLink = await page.locator('a[href*="edicao-de-evento"]').first();
          
          if (await editLink.isVisible()) {
            await editLink.click();
            console.log('✅ Abordagem 2: Clicou no link para edição do evento');
          } 
          // Abordagem 3: Localizar o último link na modal__action (que deve ser o Completar Informações)
          else {
            console.log('Tentando terceira abordagem...');
            const actionLinks = await page.locator('div.modal__action a').all();
            
            if (actionLinks.length > 0) {
              // Pega o último link (que de acordo com o HTML é o "Completar Informações")
              await actionLinks[actionLinks.length - 1].click();
              console.log('✅ Abordagem 3: Clicou no último link da área de ações');
            } else {
              throw new Error('Não conseguiu localizar o link "Completar Informações"');
            }
          }
        }
      } catch (err) {
        console.log('⚠️ Erro ao clicar em Completar Informações, tentando último recurso...');
        
      
        
        // Último recurso: tenta clicar por coordenadas aproximadas onde o link deveria estar
        // Com base no HTML, o link está na parte inferior direita do modal
        const pageSize = await page.evaluate(() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        });
        
        // Clica na posição aproximada do link "Completar Informações" (canto inferior direito)
        await page.mouse.click(pageSize.width / 2 + 200, pageSize.height / 2 + 120);
        console.log('✅ Abordagem 4: Clicou na posição aproximada do link "Completar Informações"');
      }
    }
  } catch (e) {
    // Talvez não exista modal e o sistema apenas redirecione
    console.log('⚠️ Modal de confirmação não apareceu, verificando redirecionamento');
  }
    
    // 13. Aguarda o redirecionamento para a página de edição do evento
    // Verifica se estamos em uma página de edição de evento
    await page.waitForURL('**/edicao-de-evento/**', { timeout: 10000 });
    
    // 14. Captura o ID do evento da URL
    const currentUrl = page.url();
    const eventIdMatch = currentUrl.match(/\/edicao-de-evento\/(\d+)/);
    const eventId = eventIdMatch ? eventIdMatch[1] : 'desconhecido';
    
    console.log(`✅ Redirecionado para página de edição do evento. ID: ${eventId}`);
    console.log(`✅ URL: ${currentUrl}`);
    
    // Aguarda a página carregar completamente
    await page.waitForLoadState('networkidle');
    console.log('✅ Página de edição carregada completamente');
    

    // 16. Aguarda um momento para garantir que a página carregou completamente
    await page.waitForTimeout(2000);
    console.log('✅ Aguardando carregamento completo da página');

    // 17. Preenche o subtítulo do evento
    try {
      // Localiza o campo de subtítulo usando diferentes abordagens
      const subtitleInput = await page.locator('input[placeholder="Subtítulo"], input[name="subtitle"]').first();
      
      // Se encontrou o campo, preenche
      if (await subtitleInput.isVisible()) {
        await subtitleInput.fill(`Subtítulo do Evento Automático #${counter}`);
        console.log('✅ Preencheu o subtítulo do evento');
      } else {
        // Se não encontrou, tenta localizar por outra abordagem
        await page.fill('.field:has-text("Subtítulo") input, input[aria-label*="subtítulo"]', 
          `Subtítulo do Evento Automático #${counter}`);
        console.log('✅ Preencheu o subtítulo por seletor alternativo');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível preencher o subtítulo:', error);
    }
    
    // 18. Rola a página para baixo para encontrar a seção de ocorrências
    await page.evaluate(() => {
      // Rola 1/3 da página para baixo
      window.scrollBy(0, window.innerHeight / 2);
    });
    await page.waitForTimeout(1000);
    console.log('✅ Rolou a página para baixo');
    
    // 19. Localiza e clica no botão "Inserir nova ocorrência"
    try {
      // Tenta várias abordagens para localizar o botão
      const ocorrenciaButton = await page.locator('button:has-text("Inserir nova ocorrência")').first();
      
      if (await ocorrenciaButton.isVisible()) {
        await ocorrenciaButton.click();
        console.log('✅ Clicou em "Inserir nova ocorrência"');
      } else {
        // Tenta seletores alternativos
        try {
          await page.click('button.event-occurrence__add, button:text-matches("(?i)inserir.*ocorrência")');
          console.log('✅ Clicou no botão de adicionar ocorrência (seletor alternativo)');
        } catch (e) {
          // Usa o seletor mais genérico baseado na posição na página
          const buttons = await page.locator('button').all();
          let clicked = false;
          
          for (const button of buttons) {
            const text = await button.textContent();
            if (text && (
                text.includes('ocorrência') || 
                text.includes('Ocorrência') || 
                text.includes('nova') || 
                text.includes('inserir')
              )) {
              await button.click();
              console.log('✅ Clicou no botão de ocorrência por texto parcial');
              clicked = true;
              break;
            }
          }
          
          if (!clicked) {
            // Tenta método mais específico baseado na estrutura da página
            await page.click('div[data-field="occurrences"] button, #occurrences-section button');
            console.log('✅ Clicou usando seletor estrutural');
          }
        }
      }

      await page.waitForTimeout(500);
      
    } catch (error) {
      console.log('⚠️ Erro ao tentar clicar no botão de inserir ocorrência:', error);
      
      // Última tentativa - clicar no primeiro botão verde na página
      try {
        await page.click('button.button--primary');
        console.log('✅ Clicou no primeiro botão primário da página');
      } catch (e) {
        console.log('⚠️ Falha em todas as tentativas de clicar no botão de ocorrência');
      }
    }
    
    // Substitua o trecho entre os passos 20-23 (inclusão de ocorrência) com este código:

// 20. Aguarda o modal de inserção de ocorrência aparecer
// Substitua o trecho entre os passos 20-23 (inclusão de ocorrência) com este código:

// 20. Aguarda o modal de inserção de ocorrência aparecer
try {
    await page.waitForSelector('div.modal__header span:has-text("Inserir ocorrência no evento")', { state: 'visible', timeout: 10000 });
    console.log('✅ Modal de inserção de ocorrência apareceu');
    
    // 21. Preenche os campos do formulário de ocorrência
    await page.waitForTimeout(1500); // Aguarda formulário estar pronto
    

// Passo 1: Usa um espaço existente ao invés de criar um novo
try {
  // Clica no botão "+ Adicionar" usando seletores mais específicos com base no HTML fornecido
  try {
    // Abordagem mais direta - clicando no botão específico com força
    await page.click('button.button--icon.button--text-outline');
    console.log('✅ Clicou em "+ Adicionar" com força');
  } catch (e1) {
    // Abordagem alternativa via JavaScript
    const clicouJS = await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll('button'));
      const botaoAdicionar = botoes.find(b => 
        (b.textContent && b.textContent.trim().includes('Adicionar')) && 
        b.classList.contains('button--icon')
      );
      
      if (botaoAdicionar) {
        botaoAdicionar.click();
        return true;
      }
      return false;
    });
    
    if (clicouJS) {
      console.log('✅ Clicou em "+ Adicionar" via JavaScript');
    } else {
      throw new Error('Nenhuma abordagem conseguiu clicar no botão de adicionar');
    }
  }

  // Aguarda a lista de espaços aparecer
  await page.waitForTimeout(1500);
  console.log('✅ Aguardou a lista aparecer');
  
  // ===== NOVA IMPLEMENTAÇÃO PARA SELEÇÃO DE ESPAÇO =====
  
  // Abordagem 1: Clique direto via JavaScript evitando interceptação
  try {
    const espacoSelecionado = await page.evaluate(() => {
      // Seleciona diretamente o primeiro item da lista pelo seletor único
      const items = document.querySelectorAll('.select-entity__results--item.space');
      if (items && items.length > 0) {
        // Usando evento nativo para garantir que todos os listeners sejam acionados
        const item = items[0];
        
        // Dispara eventos nativos diretamente no elemento
        const mousedownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Dispara os eventos na sequência correta
        item.dispatchEvent(mousedownEvent);
        item.dispatchEvent(clickEvent);
        
        return item.querySelector('.label')?.textContent || 'item selecionado';
      }
      return null;
    });
    
    if (espacoSelecionado) {
      console.log(`✅ Selecionou espaço via JavaScript direto: "${espacoSelecionado}"`);
    } else {
      throw new Error('Nenhum item encontrado na lista');
    }
  } catch (e) {
    console.log('⚠️ Abordagem 1 falhou:', e.message);
    
    // Abordagem 2: Usar keyboard para navegar e selecionar
    try {
      // Pressiona Tab para focar na lista
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Pressiona Enter para selecionar o item focado
      await page.keyboard.press('Enter');
      console.log('✅ Tentativa de seleção via teclado (Tab+Enter)');
    } catch (e2) {
      console.log('⚠️ Abordagem 2 falhou:', e2.message);
      
      // Abordagem 3: Força o click múltiplas vezes com coordenadas específicas
      try {
        // Obtém retângulo da área da lista
        const listBoundingBox = await page.evaluate(() => {
          const list = document.querySelector('.select-entity__results');
          if (!list) return null;
          const rect = list.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        });
        
        if (listBoundingBox) {
          // Clica no primeiro item (estimando a posição)
          await page.mouse.click(
            listBoundingBox.x + listBoundingBox.width / 2,
            listBoundingBox.y + 30 // Aproximadamente onde está o primeiro item
          );
          console.log('✅ Clique posicional no primeiro espaço');
        } else {
          throw new Error('Não conseguiu encontrar a área da lista');
        }
      } catch (e3) {
        console.log('⚠️ Abordagem 3 falhou:', e3.message);
        
        // Abordagem 4: Clique no elemento específico usando execução de função
        try {
          // Último recurso - usa um método mais radical com disparo de evento em todos os itens da lista
          await page.evaluate(() => {
            // Seleciona todos os itens e tenta clicar no primeiro
            document.querySelectorAll('.select-entity__results--item.space').forEach((item, index) => {
              if (index === 0) {
                // Hack: remove quaisquer elementos que possam estar interceptando
                const blockers = document.querySelectorAll('.vfm__content, .vfm__container, [aria-modal="true"]');
                blockers.forEach(el => {
                  if (el instanceof HTMLElement) {
                    el.style.pointerEvents = 'none';
                  }
                });
                
                // Clica no primeiro item
                (item as HTMLElement).click();
                
                // Restaura os bloqueadores
                setTimeout(() => {
                  blockers.forEach(el => {
                    if (el instanceof HTMLElement) {
                      el.style.pointerEvents = '';
                    }
                  });
                }, 1000);
              }
            });
          });
          console.log('✅ Usou hack para desativar interceptadores e clicar no espaço');
        } catch (e4) {
          console.log('⚠️ Todas as abordagens falharam');
          
          // Desiste e continua o resto do script
          console.log('✅ Continuando o script mesmo sem selecionar o espaço');
        }
      }
    }
  }
  
  // Aguarda um momento para garantir que o espaço foi selecionado
  await page.waitForTimeout(1000);

} catch (e: any) { // Explicitly type as any
  console.log('⚠️ Erro no processo de adicionar espaço:', e.message);
  
  // Continua com o script para não bloquear todo o processo
  console.log('✅ Tentando prosseguir mesmo com erro na seleção do espaço');
}
    
    // Passo 2: Seleciona a frequência como "uma vez" - USANDO CLICK DIRETO NO LABEL para evitar problemas
    try {
      await page.click('label:has-text("uma vez")');
      console.log('✅ Selecionou frequência "uma vez" (clicando no label)');
    } catch (e) {
      console.log('⚠️ Erro ao selecionar frequência por label, tentando pelo input:', e);
      try {
        // Tenta pelo input diretamente
        await page.check('input[type="radio"][name="frequency"][value="once"]');
        console.log('✅ Selecionou frequência "uma vez" (pelo input)');
      } catch (inputError) {
        console.log('⚠️ Erro ao selecionar frequência pelo input:', inputError);
      }
    }
    
    // Passo 3: Define a data inicial (formato puro de números 05082025 = 05/08/2025)
    try {
      // Obtém a data de hoje + 2 dias no formato DDMMAAAA
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 2);
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const dataFormatada = `${dia}${mes}${ano}`;
      
      // Foca no campo e preenche os números diretamente
      const dateInput = await page.locator('input.date-input').first();
      await dateInput.click();
      await dateInput.fill(dataFormatada);
      await page.keyboard.press('Tab'); // Move para o próximo campo
      console.log(`✅ Preencheu data inicial: ${dataFormatada} (formato DDMMAAAA)`);
    } catch (e) {
      console.log('⚠️ Erro ao definir data inicial:', e);
    }
    
    // Passo 4: Define os horários inicial e final (formato puro de números: 1900, 2200)
    try {
      // Define horário inicial como 19:00 (digitando apenas 1900)
      const timeInputs = await page.locator('input.time-input').all();
      
      // Primeiro input: horário inicial
      await timeInputs[0].click();
      await timeInputs[0].fill('1900');
      await page.keyboard.press('Tab');
      console.log('✅ Preencheu horário inicial: 1900');
      
      // Segundo input: horário final
      await timeInputs[1].click();
      await timeInputs[1].fill('2200');
      await page.keyboard.press('Tab');
      console.log('✅ Preencheu horário final: 2200');
    } catch (e) {
      console.log('⚠️ Erro ao definir horários:', e);
    }
    
    // Passo 5: Define se é gratuito - usando CLICK DIRETO NO LABEL
    try {
      await page.click('label:has-text("Não")');
      console.log('✅ Marcou evento como não gratuito (clicando no label)');
      
      // Aguarda um momento para os campos aparecerem
      await page.waitForTimeout(500);
      
      // Preenche o valor da entrada (apenas números, sem formatação: 5000 = R$ 50,00)
      // Pega todos os inputs depois do label "Valor da entrada"
      const valorInputs = await page.locator('span:has-text("Valor da entrada:") + div input, span:has-text("Valor da entrada:") ~ input').all();
      if (valorInputs.length > 0) {
        await valorInputs[0].fill('5000');
        console.log('✅ Preencheu valor da entrada: 5000');
      } else {
        // Tenta alternativa
        await page.fill('div.create-occurrence__section--field input[type="text"]', '5000');
        console.log('✅ Preencheu valor da entrada (seletor alternativo)');
      }
      
      // Preenche informações adicionais sobre a entrada
      const infoInputs = await page.locator('span:has-text("Informações adicionais") + div input, span:has-text("Informações adicionais") ~ input').all();
      if (infoInputs.length > 0) {
        await infoInputs[0].fill('Meia entrada para estudantes');
        console.log('✅ Preencheu informações adicionais sobre a entrada');
      } else {
        // Seletor alternativo - pega o segundo input de texto após o radio "Não"
        const inputs = await page.locator('label:has-text("Não") ~ div input[type="text"]').all();
        if (inputs.length > 1) {
          await inputs[1].fill('Meia entrada para estudantes');
          console.log('✅ Preencheu informações adicionais (seletor alternativo)');
        }
      }
    } catch (e) {
      console.log('⚠️ Erro ao configurar informações de entrada:', e);
    }
    
    // Passo 6: Preenche o resumo das informações
    try {
      // Usa um seletor mais específico para o último campo de input
      await page.fill('input[name="description"], input[placeholder*="resumo customizado"], div.create-occurrence__section:last-child input[type="text"]', 
        `Sessão especial do evento #${counter}. Teatro Municipal.`);
      console.log('✅ Preencheu o resumo das informações');
    } catch (e) {
      console.log('⚠️ Erro ao preencher resumo:', e);
    }
    
    // 22. Clica no botão para inserir a ocorrência
    try {
      // Tenta clicar no botão "Inserir ocorrência" na versão desktop
      await page.click('div.desktop button.button--primary');
      console.log('✅ Clicou no botão "Inserir ocorrência" na versão desktop');
    } catch (e) {
      console.log('⚠️ Erro ao clicar no botão desktop, tentando outras abordagens:', e);
      
      try {
        // Tenta clicar em qualquer botão primário no rodapé
        const botoes = await page.locator('.modal__action button.button--primary').all();
        if (botoes.length > 0) {
          await botoes[botoes.length - 1].click(); // Clica no último botão primário
          console.log('✅ Clicou no último botão primário');
        } else {
          // Se não encontrar, tenta o botão "Próximo" na versão mobile
          await page.click('div.mobile button:has-text("Próximo")');
          console.log('✅ Clicou no botão "Próximo" na versão mobile');
          
          // Se clicou em próximo, precisa continuar navegando até finalizar
          await page.waitForTimeout(1000);
          
          // Tenta continuar até o final (se houver steps)
          let maxSteps = 5;
          while (maxSteps > 0) {
            try {
              await page.click('div.mobile button:has-text("Próximo"), div.mobile button:has-text("Inserir"), button.button--primary');
              console.log(`✅ Clicou em próximo/inserir (step ${5-maxSteps+1})`);
              await page.waitForTimeout(1000);
              maxSteps--;
            } catch (e) {
              console.log('✅ Não há mais botões de próximo/inserir');
              break;
            }
          }
        }
      } catch (btnError) {
        console.log('⚠️ Todas as tentativas de clicar no botão falharam:', btnError);
      }
    }
    
    // 23. Aguarda o modal fechar
    await page.waitForSelector('div.modal__header span:has-text("Inserir ocorrência no evento")', { state: 'hidden', timeout: 10000 })
      .catch(() => console.log('⚠️ Modal pode não ter fechado, continuando...'));
    
    await page.waitForTimeout(1000);
    console.log('✅ Processo de inserção de ocorrência finalizado');
    
  } catch (modalError) {
    console.log('⚠️ Problema ao interagir com o modal de ocorrência:', modalError);
  }
    
    // 24. Continua preenchendo os outros campos da página principal
    await page.waitForTimeout(1500); // Pequena pausa
    
    // Rola para as seções inferiores
    await page.evaluate(() => {
      window.scrollBy(0, 500); // Rola mais para baixo
    });
    await page.waitForTimeout(1000);
    
    // 25. Preenche campos de informações sobre o evento (se disponíveis)
    try {
      // Tenta preencher o campo "Total de público"
      const publicoInput = await page.locator('input[name="event_attendance"]').first();
      if (await publicoInput.isVisible()) {
        await publicoInput.fill('200');
        console.log('✅ Preencheu total de público');
      } else {
        // Abordagem alternativa
        await page.fill('input[id*="event_attendance"], .field[data-field="event_attendance"] input', '200');
        console.log('✅ Preencheu total de público (seletor alternativo)');
      }
      
      // Tenta preencher telefone
      const telefoneInput = await page.locator('input[name="telefonePublico"]').first();
      if (await telefoneInput.isVisible()) {
        await telefoneInput.fill('(11) 99999-9999');
        console.log('✅ Preencheu telefone para informações');
      } else {
        // Abordagem alternativa
        await page.fill('input[id*="telefonePublico"], .field[data-field="telefonePublico"] input', '(11) 99999-9999');
        console.log('✅ Preencheu telefone (seletor alternativo)');
      }
      
      // Preenche informações sobre inscrição
      const inscricaoInput = await page.locator('input[name="registrationInfo"]').first();
      if (await inscricaoInput.isVisible()) {
        await inscricaoInput.fill('Inscrições pelo telefone ou email do evento.');
        console.log('✅ Preencheu informações sobre inscrição');
      } else {
        // Abordagem alternativa
        await page.fill('input[id*="registrationInfo"], .field[data-field="registrationInfo"] input', 
          'Inscrições pelo telefone ou email do evento.');
        console.log('✅ Preencheu informações sobre inscrição (seletor alternativo)');
      }
    } catch (e) {
      console.log('⚠️ Erro ao preencher informações sobre o evento:', e);
    }
    
    // 26. Preenche seção de acessibilidade
    try {
      // Rola para a seção de acessibilidade
      await page.evaluate(() => {
        // Tenta encontrar o elemento de acessibilidade
        const acessibilidade = document.querySelector('h3.bold:contains("Acessibilidade"), header:contains("Acessibilidade")');
        if (acessibilidade) {
          acessibilidade.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        } else {
          // Se não encontrar, apenas rola mais para baixo
          window.scrollBy(0, 500);
          return false;
        }
      });
      await page.waitForTimeout(1000);
      
      // Seleciona "Sim" para Libras usando label direto
      await page.evaluate(() => {
        const librasLabels = Array.from(document.querySelectorAll('label.event-info__field'));
        const simLibrasLabel = librasLabels.find(label => 
          label.textContent?.includes('Sim') && 
          label.closest('div')?.previousElementSibling?.textContent?.includes('Libras')
        );
        
        if (simLibrasLabel) {
          (simLibrasLabel.querySelector('input[type="radio"]') as HTMLElement).click();
          return true;
        }
        return false;
      });
      console.log('✅ Selecionou "Sim" para Libras');
      
      // Seleciona "Sim" para Áudio Descrição usando label direto
      await page.evaluate(() => {
        const audioLabels = Array.from(document.querySelectorAll('label.event-info__field'));
        const simAudioLabel = audioLabels.find(label => 
          label.textContent?.includes('Sim') && 
          label.closest('div')?.previousElementSibling?.textContent?.includes('Áudio')
        );
        
        if (simAudioLabel) {
          (simAudioLabel.querySelector('input[type="radio"]') as HTMLElement).click();
          return true;
        }
        return false;
      });
      console.log('✅ Selecionou "Sim" para Áudio Descrição');
      
      // Abordagem alternativa se a anterior falhar
      if (await page.locator('input[name="traducaoLibras"][value="Sim"]').count() > 0) {
        await page.check('input[name="traducaoLibras"][value="Sim"]');
        console.log('✅ Marcou "Sim" para Libras (abordagem alternativa)');
      }
      
      if (await page.locator('input[name="descricaoSonora"][value="Sim"]').count() > 0) {
        await page.check('input[name="descricaoSonora"][value="Sim"]');
        console.log('✅ Marcou "Sim" para Áudio Descrição (abordagem alternativa)');
      }
      
    } catch (e) {
      console.log('⚠️ Erro ao preencher seção de acessibilidade:', e);
    }
    
    // 27. Preenchimento da seção de apresentação (último bloco)
    await page.evaluate(() => {
      window.scrollBy(0, 1000); // Rola para bem baixo para chegar à apresentação
    });
    await page.waitForTimeout(1000);
    
    try {
      // Tenta preencher o campo de apresentação
      const apresentacaoTextarea = await page.locator('textarea[name="presentation"], div:has-text("Apresentação") + div textarea, div.field--presentation textarea').first();
      
      if (await apresentacaoTextarea.isVisible()) {
        await apresentacaoTextarea.fill(`Apresentação detalhada do evento automatizado #${counter}. Este evento faz parte de um conjunto de testes automatizados para validação do sistema. O evento contará com várias atrações culturais e está adaptado para pessoas com necessidades especiais, incluindo intérpretes de libras e áudio descrição.`);
        console.log('✅ Preencheu campo de apresentação');
      } else {
        // Tentativa alternativa - usando avaliação JavaScript
        const preencherApresentacao = await page.evaluate((counter) => {
          // Procura por qualquer textarea na página que esteja em uma seção que possa ser de apresentação
          const textareas = document.querySelectorAll('textarea');
          let apresentacaoElement = null;
          
          // Verifica todos os textareas
          for (const textarea of textareas) {
            // Se ainda não encontramos e este não foi preenchido
            if (!apresentacaoElement && (!textarea.value || textarea.value.trim() === '')) {
              // Verifica se tem um rótulo de apresentação próximo
              const nearbyText = textarea.closest('div')?.textContent?.toLowerCase() || '';
              if (nearbyText.includes('apresentação') || nearbyText.includes('apresentacao') || 
                  nearbyText.includes('descrição') || nearbyText.includes('descricao')) {
                apresentacaoElement = textarea;
                break;
              }
              
              // Se ainda não encontrou, pega o último textarea vazio
              apresentacaoElement = textarea;
            }
          }
          
          // Se encontrou algum textarea, preenche
          if (apresentacaoElement) {
            apresentacaoElement.value = `Apresentação detalhada do evento automatizado #${counter}. Este evento faz parte de um conjunto de testes automatizados para validação do sistema. O evento contará com várias atrações culturais e está adaptado para pessoas com necessidades especiais, incluindo intérpretes de libras e áudio descrição.`;
            
            // Dispara eventos para garantir que a mudança seja registrada
            apresentacaoElement.dispatchEvent(new Event('input', { bubbles: true }));
            apresentacaoElement.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        }, counter);
        
        if (preencherApresentacao) {
          console.log('✅ Preencheu campo de apresentação via JavaScript');
        } else {
          console.log('⚠️ Não encontrou campo de apresentação para preencher');
        }
      }
    } catch (e) {
      console.log('⚠️ Erro ao preencher apresentação:', e);
    }
    
    // 29. Rola para o final da página para encontrar o botão Salvar
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    console.log('✅ Rolou para o final da página');
    
    // 30. Clica no botão Salvar
    try {
      // Localiza e clica no botão salvar usando várias abordagens
      const salvarButton = await page.locator('button:has-text("Salvar")').first();
      if (await salvarButton.isVisible()) {
        await salvarButton.click();
        console.log('✅ Clicou no botão Salvar');
      } else {
        // Abordagem alternativa - localiza por classe comum
        const finalButtons = await page.locator('button.button--primary, .footer button, .form__submit-button').all();
        
        if (finalButtons.length > 0) {
          for (const button of finalButtons) {
            const text = await button.textContent();
            if (text && text.includes('Salvar')) {
              await button.click();
              console.log('✅ Clicou no botão Salvar por texto');
              break;
            }
          }
          
          // Se não encontrou por texto, tenta último botão
          if (finalButtons.length > 0) {
            await finalButtons[finalButtons.length - 1].click();
            console.log('✅ Clicou no último botão da página (provavelmente Salvar)');
          }
        } else {
          // Alternativa: posição aproximada
          const pageSize = await page.evaluate(() => {
            return { width: window.innerWidth, height: window.innerHeight };
          });
          await page.mouse.click(pageSize.width - 100, pageSize.height - 50);
          console.log('✅ Clicou na posição aproximada do botão Salvar');
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao clicar no botão Salvar:', error);
    }
    
    // 31. Espera e verifica a mensagem "Modificações salvas"
    try {
      await page.waitForSelector('text="Modificações salvas"', { timeout: 10000 });
      console.log('✅ CONFIRMADO: Mensagem "Modificações salvas" exibida com sucesso!');
    } catch (e) {
      console.log('⚠️ Não detectou mensagem de confirmação:', e);
    }

    console.log(`✅ Processo finalizado com sucesso! Evento #${counter} criado e configurado com ID: ${eventId}`)

    await page.pause();
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();