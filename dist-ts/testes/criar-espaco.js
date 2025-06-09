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
    const counterFilePath = path.join(__dirname, '../contadores', 'space-counter.txt');
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
    // Nome único do espaço
    const spaceName = `Espaço Automático ${counter} (${dateStr} ${timeStr})`;
    console.log(`🔢 Criando espaço #${counter}`);
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
        // 2. Clica no botão do navbar "Espaços"
        await page.waitForSelector('text=Espaços', { state: 'visible' });
        await page.click('text=Espaços');
        console.log('✅ Clicou em Espaços');
        // 3. Aguarda a URL mudar para /espacos/#list
        await page.waitForURL('**/espacos/#list', { timeout: 10000 });
        console.log('✅ URL mudou para espaços/#list');
        // 4. Aguarda o botão "Criar Espaço" aparecer e clica
        await page.waitForSelector('button:has-text("Criar Espaço")', { state: 'visible', timeout: 10000 });
        await page.click('button:has-text("Criar Espaço")');
        console.log('✅ Clicou em Criar Espaço');
        // 5. Aguarda o modal de criação aparecer
        await page.waitForSelector('.modal__content, div[data-v-2836fdb5-s].modal__content', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de criação apareceu');
        // Pequena pausa para garantir que o modal esteja totalmente carregado
        await page.waitForTimeout(2000);
        // 6. Preenche o campo "Nome" com nome único
        await page.fill('input[name="name"], input[placeholder="Nome"]', spaceName);
        console.log(`✅ Preencheu o nome: ${spaceName}`);
        // 7. Seleciona o Tipo de Espaço a partir do dropdown
        try {
            // Seleciona o dropdown de tipo de espaço
            await page.waitForSelector('select[name="type"]', { state: 'visible', timeout: 5000 });
            // Seleciona "Biblioteca Pública" como tipo de espaço (value="20")
            await page.selectOption('select[name="type"]', '20');
            console.log('✅ Selecionou tipo de espaço "Biblioteca Pública"');
            // Opção alternativa: se quiser selecionar pelo texto
            // await page.selectOption('select[name="type"]', { label: 'Biblioteca Pública' });
        }
        catch (error) {
            console.warn('⚠️ Não foi possível selecionar tipo de espaço do dropdown, tentando abordagem alternativa...', error);
            // Abordagem alternativa usando JavaScript
            try {
                await page.evaluate(() => {
                    const select = document.querySelector('select[name="type"]');
                    if (select) {
                        // Procura pela opção "Biblioteca Pública" ou pela primeira opção com "Biblioteca"
                        const options = Array.from(select.options);
                        const bibliotecaOption = options.find(opt => opt.text === 'Biblioteca Pública' ||
                            opt.text.includes('Biblioteca'));
                        if (bibliotecaOption) {
                            select.value = bibliotecaOption.value;
                            // Dispara evento de mudança para atualizar binding
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    }
                    return false;
                });
                console.log('✅ Selecionou tipo de espaço usando JavaScript');
            }
            catch (jsError) {
                console.warn('⚠️ Falha também na abordagem JavaScript:', jsError);
            }
        }
        // 8. Adiciona Área de Atuação
        await page.click('button:has-text("Adicionar nova")');
        console.log('✅ Clicou em Adicionar nova área de atuação');
        // Aguarda o dropdown/modal de opções aparecer
        await page.waitForTimeout(1000);
        // Seleciona a linguagem cultural "Artes Circenses"
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
            console.warn('⚠️ Não foi possível selecionar linguagem cultural, continuando...', error);
        }
        // 9. Preenche o campo "Descrição curta"
        await page.fill('textarea[name="shortDescription"]', `Esse espaço foi criado automaticamente (ID: ${counter})`);
        console.log('✅ Preencheu a descrição curta');
        // 10. Clica no botão "Criar e Publicar"
        await page.click('button:has-text("Criar e Publicar")');
        console.log('✅ Clicou em Criar e Publicar');
        // 11. Aguarda a confirmação de sucesso (modal "Espaço Criado!")
        await page.waitForSelector('text="Espaço Criado!"', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de confirmação "Espaço Criado!" apareceu');
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
            // Abordagem 2: Localizar pelo href que contém "edicao-de-espaco"
            else {
                console.log('Tentando abordagem alternativa pelo href...');
                const editLink = await page.locator('a[href*="edicao-de-espaco"]').first();
                if (await editLink.isVisible()) {
                    await editLink.click();
                    console.log('✅ Abordagem 2: Clicou no link para edição do espaço');
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
            // Abordagem 4: Se não conseguiu clicar pelo texto, tenta clicar na posição aproximada
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
        // 13. Aguarda o redirecionamento para a página de edição do espaço
        await page.waitForURL('**/edicao-de-espaco/**/#info', { timeout: 10000 });
        // 14. Captura o ID do espaço da URL
        const currentUrl = page.url();
        const spaceIdMatch = currentUrl.match(/\/edicao-de-espaco\/(\d+)/);
        const spaceId = spaceIdMatch ? spaceIdMatch[1] : 'desconhecido';
        console.log(`✅ Redirecionado para página de edição do espaço. ID: ${spaceId}`);
        console.log(`✅ URL: ${currentUrl}`);
        // Aguarda a página carregar completamente
        await page.waitForLoadState('networkidle');
        console.log('✅ Página de edição carregada completamente');
        // 15. Preenchimento dos campos na página de edição do espaço
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
        // 16. Preenche os campos de endereço
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
        try {
            await page.selectOption('select:has-text("Acre")', 'SP');
            console.log('✅ Selecionou o Estado SP');
            // Aguarda o dropdown de município carregar
            await page.waitForTimeout(1500);
            // Tenta selecionar o município
            const municipioDropdown = await page.locator('div.field:has-text("Município") select').first();
            if (await municipioDropdown.isVisible()) {
                await municipioDropdown.selectOption('São Paulo');
                console.log('✅ Selecionou o Município São Paulo');
            }
        }
        catch (e) {
            console.log('⚠️ Erro ao selecionar Estado/Município:', e);
        }
        // 17. Preenche campo de acessibilidade
        await scrollToElement('select[name="acessibilidade"]');
        await page.selectOption('select[name="acessibilidade"]', 'Sim');
        console.log('✅ Selecionou acessibilidade "Sim"');
        // 18. Preenche campo de capacidade
        await scrollToElement('input[name="capacidade"]');
        await page.fill('input[name="capacidade"]', `${100 + counter}`);
        console.log('✅ Preencheu capacidade');
        // 19. Preenche horário de funcionamento
        await scrollToElement('input[name="horario"]');
        await page.fill('input[name="horario"]', 'Segunda a sexta das 8h às 18h. Sábado das 9h às 13h.');
        console.log('✅ Preencheu horário de funcionamento');
        // 20. Preenche informações sobre o espaço
        // Email Público
        await scrollToElement('input[name="emailPublico"]');
        await page.fill('input[name="emailPublico"]', `espaco-publico-${counter}@example.com`);
        console.log('✅ Preencheu o E-mail público');
        // Email Privado
        await page.fill('input[name="emailPrivado"]', `espaco-privado-${counter}@example.com`);
        console.log('✅ Preencheu o E-mail privado');
        // Telefone Público
        await page.fill('input[name="telefonePublico"]', `(11) 3333-${counter.toString().padStart(4, '0')}`);
        console.log('✅ Preencheu o Telefone público');
        // Telefone Privado 1
        await page.fill('input[name="telefone1"]', `(21) 9${counter.toString().padStart(4, '0')}-${counter.toString().padStart(4, '0')}`);
        console.log('✅ Preencheu o Telefone privado 1');
        // Telefone Privado 2
        await page.fill('input[name="telefone2"]', `(31) 9${counter.toString().padStart(4, '0')}-${(counter + 1).toString().padStart(4, '0')}`);
        console.log('✅ Preencheu o Telefone privado 2');
        // 21. Preenche a descrição longa
        await scrollToElement('textarea[name="longDescription"]');
        await page.fill('textarea[name="longDescription"]', `Este é um espaço cultural criado automaticamente para testes (espaço #${counter}). 
    Localizado na Avenida Paulista, o espaço oferece uma biblioteca completa com acervo diversificado. 
    Possui acessibilidade para pessoas com deficiência e capacidade para ${100 + counter} pessoas.`);
        console.log('✅ Preencheu a descrição longa');
        // 22. Rola para o final da página para encontrar o botão Salvar
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(1000);
        console.log('✅ Rolou para o final da página');
        // 23. Clica no botão Salvar
        try {
            // Localiza e clica no botão salvar usando várias abordagens
            const salvarButton = await page.locator('button:has-text("Salvar")').first();
            if (await salvarButton.isVisible()) {
                await salvarButton.click();
                console.log('✅ Clicou no botão Salvar');
            }
            else {
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
                }
                else {
                    // Alternativa: posição aproximada
                    const pageSize = await page.evaluate(() => {
                        return { width: window.innerWidth, height: window.innerHeight };
                    });
                    await page.mouse.click(pageSize.width - 100, pageSize.height - 50);
                    console.log('✅ Clicou na posição aproximada do botão Salvar');
                }
            }
        }
        catch (error) {
            console.log('⚠️ Erro ao clicar no botão Salvar:', error);
        }
        // 24. Espera e verifica a mensagem "Modificações salvas"
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
        console.log(`✅ Processo finalizado com sucesso! Espaço #${counter} criado com ID: ${spaceId}`);
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
        // Adicionando try/catch para evitar erros caso o browser já esteja fechado
        try {
            await page.waitForTimeout(3000);
            await browser.close();
        }
        catch (e) {
            console.log('⚠️ Navegador já estava fechado ou erro ao fechar');
        }
    }
})();
//# sourceMappingURL=criar-espaco.js.map