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
    const counterFilePath = path.join(__dirname, '../contadores', 'project-counter.txt');
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
    // Nome único do projeto
    const projectName = `Projeto Automático ${counter} (${dateStr} ${timeStr})`;
    console.log(`🔢 Criando projeto #${counter}`);
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
        // 2. Clica no botão do navbar "Projetos"
        await page.waitForSelector('text=Projetos', { state: 'visible' });
        await page.click('text=Projetos');
        console.log('✅ Clicou em Projetos');
        // 3. Aguarda a URL mudar para /projetos/#list
        await page.waitForURL('**/projetos/#list', { timeout: 10000 });
        console.log('✅ URL mudou para projetos/#list');
        // 4. Aguarda o botão "Criar Projeto" aparecer e clica
        await page.waitForSelector('button:has-text("Criar Projeto")', { state: 'visible', timeout: 10000 });
        await page.click('button:has-text("Criar Projeto")');
        console.log('✅ Clicou em Criar Projeto');
        // 5. Aguarda o modal de criação aparecer
        await page.waitForSelector('.modal__content, div[data-v-2836fdb5-s].modal__content', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de criação apareceu');
        // Pequena pausa para garantir que o modal esteja totalmente carregado
        await page.waitForTimeout(2000);
        // 6. Preenche o campo "Nome" com nome único
        await page.fill('input[name="name"], input[placeholder="Nome"]', projectName);
        console.log(`✅ Preencheu o nome: ${projectName}`);
        // 7. Preenche o campo "Descrição curta"
        await page.fill('textarea[name="shortDescription"]', `Esse projeto foi criado automaticamente (ID: ${counter})`);
        console.log('✅ Preencheu a descrição curta');
        // 9. Clica no botão "Criar e Publicar"
        await page.click('button:has-text("Criar e Publicar")');
        console.log('✅ Clicou em Criar e Publicar');
        // 10. Aguarda a confirmação de sucesso (modal "Projeto Criado!")
        await page.waitForSelector('text="Projeto Criado!"', { state: 'visible', timeout: 10000 });
        console.log('✅ Modal de confirmação "Projeto Criado!" apareceu');
        // Pequena pausa para garantir que o modal carregue completamente
        await page.waitForTimeout(1000);
        // 11. Clica no botão "Completar Informações"
        try {
            // Abordagem 1: Localizar pelo texto exato no link (a) em vez de botão
            console.log('Tentando localizar o link "Completar Informações"...');
            const completarLink = await page.locator('a:has-text("Completar Informações")').first();
            if (await completarLink.isVisible()) {
                await completarLink.click();
                console.log('✅ Abordagem 1: Clicou no link "Completar Informações"');
            }
            // Abordagem 2: Localizar pelo href que contém "edicao-de-projeto"
            else {
                console.log('Tentando abordagem alternativa pelo href...');
                const editLink = await page.locator('a[href*="edicao-de-projeto"]').first();
                if (await editLink.isVisible()) {
                    await editLink.click();
                    console.log('✅ Abordagem 2: Clicou no link para edição do projeto');
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
        // 12. Aguarda o redirecionamento para a página de edição do projeto
        await page.waitForURL('**/edicao-de-projeto/**/#info', { timeout: 10000 });
        // 13. Captura o ID do projeto da URL
        const currentUrl = page.url();
        const projectIdMatch = currentUrl.match(/\/edicao-de-projeto\/(\d+)/);
        const projectId = projectIdMatch ? projectIdMatch[1] : 'desconhecido';
        console.log(`✅ Redirecionado para página de edição do projeto. ID: ${projectId}`);
        console.log(`✅ URL: ${currentUrl}`);
        // Aguarda a página carregar completamente
        await page.waitForLoadState('networkidle');
        console.log('✅ Página de edição carregada completamente');
        // 14. Preenchimento dos campos na página de edição do projeto
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
        // 15. Preenche período de execução do projeto
        console.log('Preenchendo período de execução do projeto...');
        // Data inicial - usando o formato simplificado (apenas números)
        try {
            await scrollToElement('div[data-field="startsOn"] input.date-input');
            await page.fill('div[data-field="startsOn"] input.date-input', '01012025');
            // Preenche o horário inicial
            await page.fill('div[data-field="startsOn"] input.time-input', '1000');
            console.log('✅ Preencheu data/hora inicial do período de execução');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher data inicial de execução:', e);
        }
        // Data final - usando o formato simplificado (apenas números)
        try {
            await scrollToElement('div[data-field="endsOn"] input.date-input');
            await page.fill('div[data-field="endsOn"] input.date-input', '01012026');
            // Preenche o horário final 
            await page.fill('div[data-field="endsOn"] input.time-input', '1800');
            console.log('✅ Preencheu data/hora final do período de execução');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher data final de execução:', e);
        }
        // 16. Preenche contatos do projeto
        console.log('Preenchendo contatos do projeto...');
        // Email Público
        try {
            await scrollToElement('input[name="emailPublico"]');
            await page.fill('input[name="emailPublico"]', `projeto-publico-${counter}@cultura.gov.br`);
            console.log('✅ Preencheu email público do projeto');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher email público:', e);
        }
        // Email Privado
        try {
            await scrollToElement('input[name="emailPrivado"]');
            await page.fill('input[name="emailPrivado"]', `projeto-privado-${counter}@cultura.gov.br`);
            console.log('✅ Preencheu email privado do projeto');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher email privado:', e);
        }
        // Telefone Público
        try {
            await scrollToElement('input[name="telefonePublico"]');
            await page.fill('input[name="telefonePublico"]', `(61) 3333-${counter.toString().padStart(4, '0')}`);
            console.log('✅ Preencheu telefone público do projeto');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher telefone público:', e);
        }
        // Telefone Privado 1
        try {
            await scrollToElement('input[name="telefone1"]');
            await page.fill('input[name="telefone1"]', `(11) 9${counter.toString().padStart(4, '0')}-${counter.toString().padStart(4, '0')}`);
            console.log('✅ Preencheu telefone privado 1 do projeto');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher telefone privado 1:', e);
        }
        // Telefone Privado 2
        try {
            await scrollToElement('input[name="telefone2"]');
            await page.fill('input[name="telefone2"]', `(21) 9${counter.toString().padStart(4, '0')}-${(counter + 1).toString().padStart(4, '0')}`);
            console.log('✅ Preencheu telefone privado 2 do projeto');
        }
        catch (e) {
            console.log('⚠️ Erro ao preencher telefone privado 2:', e);
        }
        // // 17. Preenche os campos de data
        // // Início da inscrição
        // const hoje = new Date();
        // const dataInicioInscricao = hoje.toLocaleDateString('pt-BR');
        // await scrollToElement('input.date-input[name="registrationFrom"]');
        // await page.fill('input.date-input[name="registrationFrom"]', '1000'); // Formato simplificado
        // console.log('✅ Preencheu data de início da inscrição');
        // // Término da inscrição (hoje + 30 dias)
        // const dataTerminoInscricao = new Date(hoje);
        // dataTerminoInscricao.setDate(dataTerminoInscricao.getDate() + 30);
        // await scrollToElement('input.date-input[name="registrationTo"]');
        // await page.fill('input.date-input[name="registrationTo"]', '2000'); // Formato simplificado
        // console.log('✅ Preencheu data de término da inscrição');
        // // Data de publicação
        // await scrollToElement('input.date-input[name="publishTimestamp"]');
        // await page.fill('input.date-input[name="publishTimestamp"]', '3000'); // Formato simplificado
        // console.log('✅ Preencheu data de publicação');
        // // Início do projeto
        // const dataInicioProjeto = new Date(hoje);
        // dataInicioProjeto.setDate(dataInicioProjeto.getDate() + 45);
        // await scrollToElement('input.date-input[name="startDate"]');
        // await page.fill('input.date-input[name="startDate"]', '4000'); // Formato simplificado
        // console.log('✅ Preencheu data de início do projeto');
        // // Término do projeto
        // const dataTerminoProjeto = new Date(dataInicioProjeto);
        // dataTerminoProjeto.setMonth(dataTerminoProjeto.getMonth() + 12);
        // await scrollToElement('input.date-input[name="endDate"]');
        // await page.fill('input.date-input[name="endDate"]', '5000'); // Formato simplificado
        // console.log('✅ Preencheu data de término do projeto');
        // 18. Preenche a descrição longa
        await scrollToElement('textarea[name="longDescription"]');
        await page.fill('textarea[name="longDescription"]', `Este é um projeto cultural criado automaticamente para testes (projeto #${counter}). 
    O projeto tem como objetivo fomentar a cultura local através de diversas ações e eventos.
    Duração prevista: 12 meses.
    
    Objetivos principais:
    - Promover a cultura local
    - Democratizar o acesso à cultura
    - Formar novos artistas
    - Preservar o patrimônio cultural
    
    Este projeto atenderá principalmente comunidades em situação de vulnerabilidade social com atividades culturais gratuitas e acessíveis.`);
        console.log('✅ Preencheu a descrição longa com conteúdo mais detalhado');
        // // 19. Preenche o site do projeto
        // await scrollToElement('input[name="site"]');
        // await page.fill('input[name="site"]', `https://projeto${counter}.cultura.gov.br`);
        // console.log('✅ Preencheu site do projeto');
        // // 20. Preenche o valor solicitado
        // await scrollToElement('input[name="projectRequestedFunding"]');
        // await page.fill('input[name="projectRequestedFunding"]', `${100000 + (counter * 1000)}`);
        // console.log('✅ Preencheu valor solicitado');
        // // 21. Preenche o valor aprovado
        // await scrollToElement('input[name="projectApprovedFunding"]');
        // await page.fill('input[name="projectApprovedFunding"]', `${90000 + (counter * 500)}`);
        // console.log('✅ Preencheu valor aprovado');
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
            // Tentando encontrar texto semelhante, caso a mensagem tenha variação
            const anyNotification = await page.locator('.toast-success, .notification, .alert, .notification--success').isVisible();
            if (anyNotification) {
                console.log('✅ Foi exibida uma notificação, mas não foi possível confirmar o texto exato');
            }
            else {
                console.log('⚠️ Nenhuma notificação visível após tentativa de salvar');
            }
        }
        console.log(`✅ Processo finalizado com sucesso! Projeto #${counter} criado com ID: ${projectId}`);
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
//# sourceMappingURL=criar-projeto.js.map