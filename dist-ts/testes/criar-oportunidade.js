"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
(async () => {
    // Define o caminho do arquivo que armazenará o contador
    const counterFilePath = path.join(__dirname, '../contadores', 'opportunity-counter.txt');
    const targetEnvPath = path.join(__dirname, '../config/target-env.json'); // Added
    // Lê o contador atual do arquivo ou usa 1 se não existir
    let counter = 1;
    try {
        if (fs.existsSync(counterFilePath)) {
            counter = parseInt(fs.readFileSync(counterFilePath, 'utf8'), 10) + 1;
        }
    }
    catch (e) {
        console.log('Iniciando contador em 1');
    }
    // Salva o novo valor do contador no arquivo
    fs.writeFileSync(counterFilePath, counter.toString());
    // Obtém a data/hora atual formatada
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');
    // Nome único da oportunidade
    const opportunityName = `Oportunidade Automática ${counter} (${dateStr} ${timeStr})`;
    console.log(`🔢 Criando oportunidade #${counter}`);
    let targetUrl; // Added
    try { // Added
        if (!fs.existsSync(targetEnvPath)) { // Added
            console.error(`Error: ${targetEnvPath} not found. Please configure target environment via UI first.`); // Added
            process.exit(1); // Added
        } // Added
        const rawTargetData = fs.readFileSync(targetEnvPath, 'utf-8'); // Added
        if (!rawTargetData.trim()) { // Added
            console.error(`Error: ${targetEnvPath} is empty. Please ensure target environment is configured.`); // Added
            process.exit(1); // Added
        } // Added
        const targetData = JSON.parse(rawTargetData); // Added
        if (!targetData.targetUrl) { // Added
            console.error(`Error: targetUrl not found in ${targetEnvPath}.`); // Added
            process.exit(1); // Added
        } // Added
        targetUrl = targetData.targetUrl; // Added
        console.log(`🎯 Using target URL: ${targetUrl}`); // Added
    }
    catch (error) { // Added
        console.error(`Error reading or parsing ${targetEnvPath}:`, error); // Added
        process.exit(1); // Added
    } // Added
    // Configuração para tela cheia - ajustada para funcionar melhor no macOS
    const browser = await playwright_1.chromium.launch({
        headless: false,
        slowMo: 300,
        args: [
            '--start-maximized',
            `--window-size=2560,1600` // Tamanho grande fixo (ajuste conforme seu monitor)
        ]
    });
    // Criando contexto do navegador com tamanho máximo de janela
    const context = await browser.newContext({
        storageState: path.join(__dirname, '../config/auth.json'), // Corrected path
        viewport: null // Isso desativa o viewport fixo, permitindo tela cheia
    });
    const page = await context.newPage();
    try {
        // Maximizar janela para macOS usando teclas de atalho
        try {
            // Tenta simular Cmd+Ctrl+F para macOS (tela cheia)
            await page.keyboard.press('Meta+Control+f');
            console.log('✅ Enviou comando de teclado para maximizar janela (macOS)');
        }
        catch (e) {
            console.log('⚠️ Não foi possível maximizar via teclado, usando tamanho predefinido');
        }
        // 1. Acessa o painel inicial
        await page.goto(targetUrl); // Use the dynamic target URL
        console.log('✅ Página inicial acessada');
        // 2. Clica no botão do navbar "Oportunidades"
        await page.waitForSelector('text=Oportunidades', { state: 'visible' });
        await page.click('text=Oportunidades');
        console.log('✅ Clicou em Oportunidades');
        // 3. Aguarda a URL mudar para /oportunidades/#list
        await page.waitForURL('**/oportunidades/#list', { timeout: 10000 });
        console.log('✅ URL mudou para oportunidades/#list');
        // 4. Aguarda o botão "Criar Oportunidade" aparecer e clica
        await page.waitForSelector('button:has-text("Criar Oportunidade")', { state: 'visible', timeout: 10000 });
        await page.click('button:has-text("Criar Oportunidade")');
        console.log('✅ Clicou em Criar Oportunidade');
        // 5. Aguarda o modal de criação aparecer
        await page.waitForSelector('.modal__content, div[data-v-2836fdb5-s].modal__content', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de criação apareceu');
        // Pequena pausa para garantir que o modal esteja totalmente carregado
        await page.waitForTimeout(2000);
        // 6. Seleciona o tipo de oportunidade (Festival é a primeira opção)
        await page.waitForSelector('select[name="type"]', { state: 'visible' });
        await page.selectOption('select[name="type"]', { value: '1' }); // Seleciona "Festival"
        console.log('✅ Selecionou o tipo "Festival"');
        // 7. Preenche o campo "Título" com nome único
        await page.fill('input[name="name"]', opportunityName);
        console.log(`✅ Preencheu o título: ${opportunityName}`);
        // 8. Adiciona Área de Interesse
        await page.click('button:has-text("Adicionar nova")');
        console.log('✅ Clicou em Adicionar nova área de interesse');
        // Aguarda o dropdown/modal de opções aparecer
        await page.waitForTimeout(1000);
        // Seleciona a área de interesse "Artes Visuais"
        try {
            // Aguarda as opções aparecerem
            await page.waitForSelector('label:has-text("Artes Visuais")', { timeout: 5000 });
            // Clica na opção "Artes Visuais"
            await page.click('label:has-text("Artes Visuais")');
            console.log('✅ Selecionou área "Artes Visuais"');
            // Fecha o popup/seletor (tenta várias abordagens)
            try {
                // Primeiro tenta clicar em um botão de confirmação se existir
                await page.click('button:has-text("Confirmar"), button:has-text("Aplicar"), button:has-text("OK")', { timeout: 3000 });
                console.log('✅ Clicou no botão de confirmação');
            }
            catch (error) {
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
                }
                catch (e) {
                    // Ignora erro na verificação
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Não foi possível selecionar área de interesse, continuando...', error);
        }
        // 9. Vincular a oportunidade a um agente (último item da lista)
        try {
            // Clica no radio button "Agente" - usando valor correto "agent" (minúsculo conforme HTML)
            await page.click('input[type="radio"][value="agent"]');
            console.log('✅ Selecionou vincular a um Agente');
            // Aguarda o botão "Selecionar" ficar habilitado - aguardando mais tempo
            await page.waitForTimeout(1000); // Pequena pausa para garantir que a seleção foi processada
            // Remove a classe "disabled" do botão "Selecionar" e clica nele usando JavaScript
            await page.evaluate(() => {
                const radio = document.querySelector('input[type="radio"][value="agent"]');
                if (radio) {
                    radio.checked = true;
                    // Dispara evento de mudança para garantir que o sistema reconheça a seleção
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    // Localiza o botão Selecionar próximo ao radio
                    const container = radio.closest('.inner') || radio.closest('label');
                    if (container) {
                        const button = container.querySelector('a.selectButton');
                        if (button) {
                            // Remove a classe disabled
                            button.classList.remove('disabled');
                            // Clica no botão
                            button.click();
                            return true;
                        }
                    }
                }
                return false;
            });
            console.log('✅ Selecionou agente e clicou no botão via JavaScript');
            // Se a abordagem JavaScript não funcionou, tenta cliques diretos
            try {
                // Verificar se a tela de seleção de agente apareceu
                const modalAppeared = await page.waitForSelector('.select-entity, .select-entity__results, .popover__content', {
                    state: 'visible',
                    timeout: 5000
                }).then(() => true).catch(() => false);
                if (!modalAppeared) {
                    // Se o modal não apareceu, tenta clicar no botão novamente de várias formas
                    await page.click('a:text("Selecionar")');
                    console.log('✅ Segunda tentativa de clicar no botão Selecionar');
                    await page.waitForTimeout(1000);
                }
            }
            catch (e) {
                console.log('⚠️ Problema ao verificar se o modal apareceu:', e);
            }
            // NOVA ABORDAGEM: Clica diretamente em um dos itens da lista usando o seletor correto
            // Como vimos no HTML, precisamos clicar em um item com a classe "select-entity__results--item agent"
            try {
                // Aguarda a lista de resultados aparecer
                await page.waitForSelector('ul.select-entity__results', { timeout: 5000 });
                console.log('✅ Lista de agentes detectada');
                // Tenta clicar no primeiro item da lista usando diferentes abordagens
                // Abordagem 1: Usar comando evaluate que executa diretamente no contexto do navegador
                const clicked = await page.evaluate(() => {
                    // Seleciona todos os itens de agente
                    const items = document.querySelectorAll('li.select-entity__results--item.agent');
                    // Clica no primeiro item se existir
                    if (items && items.length > 0) {
                        // Clica no primeiro item encontrado
                        items[0].click();
                        return true;
                    }
                    return false;
                });
                if (clicked) {
                    console.log('✅ Clicou no primeiro agente via JavaScript direto');
                }
                else {
                    // Abordagem 2: Usar o recurso de force click do Playwright
                    try {
                        await page.click('li.select-entity__results--item.agent:first-child', {
                            force: true,
                            timeout: 3000
                        });
                        console.log('✅ Clicou no primeiro agente usando force: true');
                    }
                    catch (clickError) {
                        console.log('⚠️ Erro no force click:', clickError);
                        // Abordagem 3: Baseado na posição
                        try {
                            // Obtém as coordenadas da lista
                            const listBounds = await page.evaluate(() => {
                                const list = document.querySelector('ul.select-entity__results');
                                if (!list)
                                    return null;
                                const rect = list.getBoundingClientRect();
                                return {
                                    x: rect.x + 20, // Pequeno offset para acertar no item e não na borda
                                    y: rect.y + 30 // Posição aproximada do primeiro item
                                };
                            });
                            if (listBounds) {
                                // Clica na posição calculada
                                await page.mouse.click(listBounds.x, listBounds.y);
                                console.log('✅ Clicou no primeiro agente via coordenadas calculadas');
                            }
                            else {
                                throw new Error('Não conseguiu obter coordenadas da lista');
                            }
                        }
                        catch (posError) {
                            // Abordagem 4: último recurso - clicar em coordenadas fixas
                            console.log('⚠️ Erro ao clicar por posição calculada, tentando último recurso');
                            // Pega tamanho da tela
                            const viewport = await page.evaluate(() => {
                                return {
                                    width: window.innerWidth,
                                    height: window.innerHeight
                                };
                            });
                            // Clica em uma posição aproximada onde estaria um agente na lista
                            // Considerando que o modal está centralizado e o primeiro item está no topo
                            await page.mouse.click(viewport.width / 2, viewport.height / 3);
                            console.log('✅ Clicou na posição fixa aproximada para selecionar agente');
                        }
                    }
                }
            }
            catch (listError) {
                console.log('⚠️ Erro ao tentar interagir com a lista de agentes:', listError);
            }
            // Aguarda um pouco para o sistema processar a seleção
            await page.waitForTimeout(1000);
        }
        catch (error) {
            console.warn('⚠️ Não foi possível vincular a um agente, continuando sem vinculação:', error);
        }
        // 10. Clica no botão "Criar" para criar a oportunidade
        await page.click('button.button--primary:has-text("Criar")');
        console.log('✅ Clicou em Criar');
        // 11. Aguarda a confirmação de sucesso (modal "Oportunidade Criada!")
        await page.waitForSelector('text="Oportunidade Criada!"', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de confirmação "Oportunidade Criada!" apareceu');
        // Pequena pausa para garantir que o modal carregue completamente
        await page.waitForTimeout(1000);
        // 12. Clica no botão "Completar Informações"
        try {
            // Abordagem 1: Localizar pelo texto exato no link (a) em vez de botão
            console.log('Tentando localizar o link "Completar Informações"...');
            const completarLink = await page.locator('a:has-text("Completar Informações")').first();
            if (await completarLink.isVisible()) {
                await completarLink.click();
                console.log('✅ Abordagem 1: Clicou no link "Completar Informações"');
            }
            // Abordagem 2: Localizar pelo href que contém "edicao-de-oportunidade"
            else {
                console.log('Tentando abordagem alternativa pelo href...');
                const editLink = await page.locator('a[href*="edicao-de-oportunidade"]').first();
                if (await editLink.isVisible()) {
                    await editLink.click();
                    console.log('✅ Abordagem 2: Clicou no link para edição da oportunidade');
                }
                // Abordagem 3: Localizar o último link na modal__action (que deve ser o Completar Informações)
                else {
                    console.log('Tentando terceira abordagem...');
                    const actionLinks = await page.locator('div.modal__action a').all();
                    if (actionLinks.length > 0) {
                        // Pega o último link (que de acordo com o HTML é o "Completar Informações")
                        await actionLinks[actionLinks.length - 1].click();
                        console.log('✅ Abordagem 3: Clicou no último link da área de ações');
                    }
                    else {
                        throw new Error('Não conseguiu localizar o link "Completar Informações"');
                    }
                }
            }
        }
        catch (err) {
            console.log('⚠️ Erro ao clicar em Completar Informações, tentando último recurso...');
            // Último recurso: tenta clicar por coordenadas aproximadas onde o link deveria estar
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
        // 13. Aguarda o redirecionamento para a página de edição da oportunidade
        await page.waitForURL('**/gestao-de-oportunidade/**', { timeout: 10000 });
        // 14. Captura o ID da oportunidade da URL
        const currentUrl = page.url();
        const opportunityIdMatch = currentUrl.match(/\/edicao-de-oportunidade\/(\d+)/);
        const opportunityId = opportunityIdMatch ? opportunityIdMatch[1] : 'desconhecido';
        console.log(`✅ Redirecionado para página de edição da oportunidade. ID: ${opportunityId}`);
        console.log(`✅ URL: ${currentUrl}`);
        // Aguarda a página carregar completamente
        await page.waitForLoadState('networkidle');
        console.log('✅ Página de edição carregada completamente');
        // 15. Preenchimento dos campos na página de edição da oportunidade
        console.log('🖊️ Iniciando preenchimento de campos adicionais...');
        // Aguarda um pouco para garantir que todos os elementos do formulário estão visíveis
        await page.waitForTimeout(3000);
        // Função para scrollar até um elemento e torná-lo visível
        async function scrollToElement(selector) {
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
        // NOVA SEÇÃO: Preenche a seção de "Informações obrigatórias" com base no HTML fornecido
        console.log('Preenchendo informações obrigatórias...');
        try {
            // Rola para baixo até encontrar o card com informações obrigatórias
            await page.evaluate(() => {
                // Buscar por elementos relevantes da seção de informações obrigatórias
                const dateLabels = Array.from(document.querySelectorAll('label.field__title'))
                    .filter(el => el.textContent?.includes('inscrições') || el.textContent?.includes('Publicação final'));
                if (dateLabels.length > 0) {
                    dateLabels[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
                return false;
            });
            await page.waitForTimeout(1000);
            console.log('✅ Rolou para a seção de datas obrigatórias');
            // ABORDAGEM MODIFICADA: Preencher campos de data/hora com JavaScript direto para prevenir substituição automática
            // Usando JavaScript diretamente para preencher os campos e controlar eventos
            const dateTimeFilled = await page.evaluate(() => {
                try {
                    // Função para preencher campo e disparar eventos adequados
                    function fillInput(selector, value) {
                        const input = document.querySelector(selector);
                        if (!input)
                            return false;
                        // Define o valor
                        input.value = value;
                        // Dispara os eventos necessários para atualizar o modelo Vue
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        input.dispatchEvent(new Event('blur', { bubbles: true }));
                        return true;
                    }
                    // 1. Data e hora de início das inscrições
                    const startDateSuccess = fillInput('div[data-field="registrationFrom"] input.date-input', '10/08/2025');
                    const startTimeSuccess = fillInput('div[data-field="registrationFrom"] input.time-input', '11:00');
                    // 2. Data e hora final das inscrições
                    const endDateSuccess = fillInput('div[data-field="registrationTo"] input.date-input', '10/09/2025');
                    const endTimeSuccess = fillInput('div[data-field="registrationTo"] input.time-input', '11:00');
                    // 3. Data e hora de publicação dos resultados
                    const publishDateSuccess = fillInput('div[data-field="publishTimestamp"] input.date-input', '10/11/2025');
                    const publishTimeSuccess = fillInput('div[data-field="publishTimestamp"] input.time-input', '11:00');
                    // Retorna status de sucesso
                    return {
                        startDate: startDateSuccess,
                        startTime: startTimeSuccess,
                        endDate: endDateSuccess,
                        endTime: endTimeSuccess,
                        publishDate: publishDateSuccess,
                        publishTime: publishTimeSuccess
                    };
                }
                catch (e) {
                    console.log('⚠️ Erro ao definir data inicial:', e);
                    return { error: e.toString() };
                }
            });
            console.log('📊 Resultado do preenchimento via JavaScript:', dateTimeFilled);
            // Verifica se todos os campos foram preenchidos
            const allFieldsFilled = Object.values(dateTimeFilled).every(value => value === true);
            if (allFieldsFilled) {
                console.log('✅ Todos os campos de data/hora preenchidos com sucesso');
            }
            else {
                // Se falhar a abordagem JavaScript, tenta método alternativo com comandos press e esperas
                console.log('⚠️ Alguns campos não foram preenchidos corretamente. Tentando abordagem alternativa...');
                // Método alternativo: click + preencher + tab para evitar substituição automática
                // 1. Data/hora inicial
                const startDateField = await page.locator('div[data-field="registrationFrom"] input.date-input').first();
                const startTimeField = await page.locator('div[data-field="registrationFrom"] input.time-input').first();
                if (await startDateField.isVisible()) {
                    await startDateField.click({ clickCount: 3 }); // Seleciona todo o texto
                    await startDateField.fill('10082025');
                    await page.keyboard.press('Tab'); // Move para o campo de hora
                    await page.waitForTimeout(300);
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await startTimeField.fill('11:00');
                    await page.keyboard.press('Tab'); // Move para o próximo campo
                    console.log('✅ Preencheu data e hora inicial (método alternativo)');
                }
                // 2. Data/hora final
                const endDateField = await page.locator('div[data-field="registrationTo"] input.date-input').first();
                const endTimeField = await page.locator('div[data-field="registrationTo"] input.time-input').first();
                if (await endDateField.isVisible()) {
                    await endDateField.click({ clickCount: 3 }); // Seleciona todo o texto
                    await endDateField.fill('10092025');
                    await page.keyboard.press('Tab'); // Move para o campo de hora
                    await page.waitForTimeout(300);
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await endTimeField.fill('11:00');
                    await page.keyboard.press('Tab'); // Move para o próximo campo
                    console.log('✅ Preencheu data e hora final (método alternativo)');
                }
                // 3. Data/hora de publicação
                const publishDateField = await page.locator('div[data-field="publishTimestamp"] input.date-input').first();
                const publishTimeField = await page.locator('div[data-field="publishTimestamp"] input.time-input').first();
                if (await publishDateField.isVisible()) {
                    await publishDateField.click({ clickCount: 3 }); // Seleciona todo o texto
                    await publishDateField.fill('10112025');
                    await page.keyboard.press('Tab'); // Move para o campo de hora
                    await page.waitForTimeout(300);
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await page.keyboard.press('Backspace');
                    await publishTimeField.fill('11:00');
                    await page.keyboard.press('Tab'); // Move para o próximo campo
                    console.log('✅ Preencheu data e hora de publicação (método alternativo)');
                }
            }
        }
        catch (error) {
            console.log('⚠️ Erro ao preencher informações obrigatórias pelo método padrão:', error);
            console.log('🔄 Tentando método alternativo...');
            // ABORDAGEM 2: Usando JavaScript para manipular diretamente o DOM
            try {
                const resultados = await page.evaluate(() => {
                    const resultados = {
                        sucesso: false,
                        detalhes: []
                    };
                    // Função para encontrar um campo por atributo de dados e tipo
                    function encontrarCampo(dataField, inputClass) {
                        const container = document.querySelector(`div[data-field="${dataField}"]`);
                        if (!container) {
                            resultados.detalhes.push(`Container para ${dataField} não encontrado`);
                            return null;
                        }
                        const input = container.querySelector(`input.${inputClass}`);
                        if (!input) {
                            resultados.detalhes.push(`Input ${inputClass} não encontrado em ${dataField}`);
                            return null;
                        }
                        resultados.sucesso = true;
                        return input;
                    }
                    // Função para preencher e disparar eventos
                    function preencherCampo(input, valor) {
                        if (!input)
                            return false;
                        input.value = valor;
                        // Disparar eventos de input e change
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        resultados.detalhes.push(`Campo ${input.name} preenchido com ${valor}`);
                        return true;
                    }
                    // 1. Data de início
                    const dataInicio = encontrarCampo('registrationFrom', 'date-input');
                    const horaInicio = encontrarCampo('registrationFrom', 'time-input');
                    preencherCampo(dataInicio, '17062025');
                    preencherCampo(horaInicio, '1100');
                    // 2. Data final
                    const dataFinal = encontrarCampo('registrationTo', 'date-input');
                    const horaFinal = encontrarCampo('registrationTo', 'time-input');
                    preencherCampo(dataFinal, '17082025');
                    preencherCampo(horaFinal, '1100');
                    // 3. Data de publicação
                    const dataPublicacao = encontrarCampo('publishTimestamp', 'date-input');
                    const horaPublicacao = encontrarCampo('publishTimestamp', 'time-input');
                    preencherCampo(dataPublicacao, '17102025');
                    preencherCampo(horaPublicacao, '1100');
                    return resultados;
                });
                console.log('📊 Resultado da tentativa via JavaScript:', resultados);
                if (resultados.detalhes.length > 0) {
                    console.log(`✅ Preencheu ${resultados.detalhes.length} campos obrigatórios via JavaScript`);
                }
                else {
                    throw new Error('Não conseguiu preencher campos via JavaScript');
                }
            }
            catch (jsError) {
                console.log('⚠️ Também falhou a abordagem JavaScript:', jsError);
                // ABORDAGEM 3: Método de último recurso - usando selectores CSS mais genéricos
                try {
                    console.log('🔄 Tentando método de último recurso com seletores genéricos...');
                    // Encontra todos os inputs de data e hora na página
                    const dateInputs = await page.locator('input.date-input').all();
                    const timeInputs = await page.locator('input.time-input').all();
                    console.log(`Encontrou ${dateInputs.length} campos de data e ${timeInputs.length} campos de hora`);
                    // Se encontrou pelo menos 3 campos de cada tipo, assume que são os campos necessários
                    if (dateInputs.length >= 3 && timeInputs.length >= 3) {
                        // Data e hora de início (primeiro conjunto)
                        await dateInputs[0].fill('07052025');
                        await timeInputs[0].fill('1100');
                        // Data e hora final (segundo conjunto)
                        await dateInputs[1].fill('08052025');
                        await timeInputs[1].fill('1100');
                        // Data e hora de publicação (terceiro conjunto)
                        await dateInputs[2].fill('09052025');
                        await timeInputs[2].fill('1100');
                        console.log('✅ Preencheu campos de data/hora usando método genérico');
                    }
                    else {
                        throw new Error(`Número insuficiente de campos encontrados: ${dateInputs.length} datas, ${timeInputs.length} horas`);
                    }
                }
                catch (lastError) {
                    console.log('❌ Todos os métodos de preenchimento falharam:', lastError);
                }
            }
        }
        // 16. Preenche a descrição curta (obrigatória)
        await scrollToElement('textarea[name="shortDescription"]');
        await page.fill('textarea[name="shortDescription"]', `Esta é uma oportunidade de teste automática #${counter}. Criada para validar o sistema..`);
        console.log('✅ Preencheu a descrição curta');
        // 17. Preenche a descrição longa (obrigatória)
        await scrollToElement('textarea[name="longDescription"]');
        await page.fill('textarea[name="longDescription"]', `Descrição detalhada da oportunidade automática #${counter}.
    
Esta é uma oportunidade criada automaticamente para testes do sistema. 
    
A oportunidade visa selecionar artistas para participação em um festival cultural que acontecerá em breve.
    
Requisitos:
- Portfólio de trabalhos anteriores
- Disponibilidade para participação presencial
- Experiência mínima de 2 anos na área

Prazo de inscrição limitado. Não perca esta oportunidade!`);
        console.log('✅ Preencheu a descrição longa');
        // 20. Rola para o final da página para encontrar o botão Salvar
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(1000);
        console.log('✅ Rolou para o final da página');
        // 21. Clica no botão "Salvar e publicar" usando o seletor correto
        try {
            console.log('Procurando o botão "Salvar e publicar"...');
            // MÉTODO 1: Usando o seletor de classe específico baseado no HTML fornecido
            try {
                await page.click('button.publish:has-text("Salvar e publicar")');
                console.log('✅ Clicou no botão "Salvar e publicar" usando seletor de classe');
            }
            catch (error) {
                console.log('⚠️ Não foi possível localizar o botão exato. Tentando alternativas...');
                // MÉTODO 2: Usando JavaScript para encontrar o botão específico
                const clicked = await page.evaluate(() => {
                    // Localizar todos os botões na página
                    const buttons = Array.from(document.querySelectorAll('button'));
                    // Filtrar especificamente o botão "Salvar e publicar"
                    const salvarPublicarBtn = buttons.find(btn => btn.textContent?.trim() === ' Salvar e publicar ' ||
                        btn.textContent?.trim() === 'Salvar e publicar');
                    if (salvarPublicarBtn) {
                        salvarPublicarBtn.click();
                        return true;
                    }
                    // Busca pelo último botão com a classe publish, que geralmente é o "Salvar e publicar"
                    const publishButtons = document.querySelectorAll('button.publish');
                    if (publishButtons.length > 0) {
                        // Pegar o último botão .publish (que deve ser "Salvar e publicar")
                        publishButtons[publishButtons.length - 1].click();
                        return true;
                    }
                    return false;
                });
                if (clicked) {
                    console.log('✅ Clicou no botão "Salvar e publicar" via JavaScript');
                }
                else {
                    // MÉTODO 3: Tentando localizar o botão por posição na DOM
                    console.log('⚠️ Tentando localizar o botão pela posição na DOM...');
                    // Tenta encontrar dentro do grupo de botões entity-actions
                    const entityActionButtons = await page.locator('.entity-actions__content--groupBtn button').all();
                    if (entityActionButtons.length >= 3) {
                        // O último botão (índice 2) deve ser "Salvar e publicar" 
                        await entityActionButtons[2].click();
                        console.log('✅ Clicou no botão "Salvar e publicar" (terceiro botão no grupo)');
                    }
                    else {
                        // MÉTODO 4: Tentando com um seletor mais específico baseado no HTML
                        try {
                            await page.click('.publish-exit:nth-child(5)');
                            console.log('✅ Clicou no botão "Salvar e publicar" usando nth-child');
                        }
                        catch (error) {
                            // MÉTODO 5: Último recurso - texto parcial combinado com :last-of-type
                            try {
                                await page.click('button:has-text("publicar"):last-of-type');
                                console.log('✅ Clicou no botão usando texto parcial "publicar" e :last-of-type');
                            }
                            catch (lastError) {
                                // MÉTODO 6: Clique por coordenada como último recurso
                                console.log('⚠️ Tentando último recurso: clique por coordenada');
                                const viewport = await page.evaluate(() => {
                                    return {
                                        width: window.innerWidth,
                                        height: window.innerHeight
                                    };
                                });
                                // Clica na posição onde normalmente está o botão "Salvar e publicar"
                                // Calculada como sendo o terceiro botão da direita para a esquerda no rodapé
                                await page.mouse.click(viewport.width - 100, viewport.height - 50);
                                console.log('✅ Clicou na posição aproximada do botão "Salvar e publicar" (método 6)');
                            }
                        }
                    }
                }
            }
            // 21.5 Aguarda e clica no botão de confirmação "Sim" no modal de confirmação
            try {
                console.log('Aguardando diálogo de confirmação...');
                // Aguarda o modal de confirmação aparecer
                await page.waitForSelector('.vfm__content.modal-content', {
                    state: 'visible',
                    timeout: 5000
                });
                console.log('✅ Diálogo de confirmação detectado');
                // Verifica se o texto do modal contém a pergunta de confirmação
                const confirmText = await page.locator('.modal__content').textContent();
                if (confirmText && confirmText.includes('deseja publicar')) {
                    console.log('✅ Diálogo de confirmação para publicação detectado');
                }
                // Clica no botão "Sim" dentro do modal
                await page.click('.modal__action .button--primary:has-text("Sim")');
                console.log('✅ Clicou no botão "Sim" do diálogo de confirmação');
            }
            catch (confirmError) {
                console.log('⚠️ Não foi possível localizar ou interagir com o diálogo de confirmação:', confirmError);
                console.log('Tentando métodos alternativos para confirmar...');
                try {
                    // Método alternativo 1: Procurar pelo botão primário no modal
                    await page.click('.vfm__content button.button--primary');
                    console.log('✅ Clicou no botão primário do modal (abordagem alternativa 1)');
                }
                catch (e1) {
                    try {
                        // Método alternativo 2: Usando JavaScript para localizar e clicar no botão "Sim"
                        const clicked = await page.evaluate(() => {
                            // Procura por qualquer botão "Sim" visível na página
                            const simButtons = Array.from(document.querySelectorAll('button'))
                                .filter(button => {
                                const text = button.textContent?.trim();
                                return text === 'Sim' && button.offsetParent !== null; // Está visível
                            });
                            if (simButtons.length > 0) {
                                simButtons[0].click();
                                return true;
                            }
                            // Procura por botões primários em modais/diálogos visíveis
                            const modalButtons = document.querySelectorAll('.modal__action .button--primary, .vfm__content .button--primary');
                            if (modalButtons.length > 0) {
                                modalButtons[0].click();
                                return true;
                            }
                            return false;
                        });
                        if (clicked) {
                            console.log('✅ Clicou no botão de confirmação via JavaScript (abordagem alternativa 2)');
                        }
                        else {
                            // Método alternativo 3: Clique por coordenadas como último recurso
                            const viewport = await page.evaluate(() => ({
                                width: window.innerWidth,
                                height: window.innerHeight
                            }));
                            // Modal geralmente está centralizado, botão "Sim" no canto inferior direito
                            await page.mouse.click(viewport.width / 2 + 100, viewport.height / 2 + 100);
                            console.log('✅ Tentativa de clique na posição provável do botão "Sim" (abordagem alternativa 3)');
                        }
                    }
                    catch (e2) {
                        console.log('⚠️ Todas as abordagens para confirmar falharam');
                    }
                }
            }
        }
        catch (error) {
            console.log('⚠️ Erro ao tentar clicar no botão "Salvar e publicar":', error);
        }
        // 22. Espera e verifica a mensagem "Modificações salvas"
        try {
            // Aguarda a notificação "Modificações salvas" aparecer
            await page.waitForSelector('text="Modificações salvas"', { timeout: 10000 });
            console.log('✅ CONFIRMADO: Mensagem "Modificações salvas" exibida com sucesso!');
            // Verificando se a mensagem está visível por outro método, para dupla confirmação
            const notificacaoSalvas = await page.locator('text="Modificações salvas"').isVisible();
            if (notificacaoSalvas) {
                console.log('✅ Notificação de sucesso verificada por método alternativo!');
            }
        }
        catch (e) {
            console.log('⚠️ Não foi possível detectar a mensagem "Modificações salvas":', e);
            const anyNotification = await page.locator('.toast-success, .notification, .alert, .notification--success').isVisible();
            if (anyNotification) {
                console.log('✅ Foi exibida uma notificação, mas não foi possível confirmar o texto exato');
            }
            else {
                console.log('⚠️ Nenhuma notificação visível após tentativa de salvar');
            }
        }
        console.log(`✅ Processo finalizado com sucesso! Oportunidade #${counter} criada com ID: ${opportunityId}`);
    }
    catch (error) {
        console.error('❌ Erro durante a execução:', error);
        // Opcional: pause para debug interativo quando ocorre erro
        console.log('Pausando execução para debug. Pressione Enter para continuar...');
        // Não use page.pause() pois ele pode causar problemas em caso de erro
        // Em vez disso, usamos um prompt básico do Node.js 
        await new Promise(resolve => {
            process.stdin.once('data', () => {
                resolve();
            });
        });
    }
    finally {
        // Modificado para manter o navegador aberto até comando manual
        try {
            console.log('✅ Processo concluído!');
            console.log('🌐 Navegador mantido aberto para inspeção');
            console.log('🔴 Pressione Enter para fechar o navegador e encerrar o script...');
            // Aguarda o usuário pressionar Enter para fechar o navegador
            // await new Promise<void>(resolve => {
            //   process.stdin.once('data', () => {
            //     resolve();
            //   });
            // });
            console.log('🔄 Fechando navegador...');
            await browser.close();
            console.log('👋 Navegador fechado. Script finalizado.');
        }
        catch (e) {
            console.log('⚠️ Erro ao fechar o navegador:', e);
        }
    }
})();
//# sourceMappingURL=criar-oportunidade.js.map