"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clickWithRetry = clickWithRetry;
exports.selectDropdownItemByText = selectDropdownItemByText;
exports.closeModalIfExists = closeModalIfExists;
/**
 * Tenta clicar em um elemento usando várias estratégias
 */
async function clickWithRetry(page, selector) {
    try {
        // Tenta método padrão de clique
        await page.click(selector);
        return true;
    }
    catch (e) {
        console.log(`⚠️ Clique padrão falhou em ${selector}: ${e.message}`);
        // Segunda tentativa: localizar e clicar
        try {
            const element = await page.locator(selector).first();
            if (await element.isVisible()) {
                await element.click();
                console.log(`✅ Clique via locator bem sucedido em ${selector}`);
                return true;
            }
        }
        catch { }
        // Terceira tentativa: clique via JavaScript
        try {
            await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (element) {
                    // Add type assertion to tell TypeScript this element has a click method
                    element.click();
                }
            }, selector);
            console.log(`✅ Clique via JavaScript bem sucedido em ${selector}`);
            return true;
        }
        catch (e) {
            console.log(`⚠️ Clique via JavaScript falhou em ${selector}: ${e.message}`);
        }
        return false;
    }
}
/**
 * Seleciona um item de dropdown pelo texto visível
 */
async function selectDropdownItemByText(page, dropdownSelector, itemText) {
    try {
        // Primeiro clique no dropdown para abrir
        await clickWithRetry(page, dropdownSelector);
        await page.waitForTimeout(500);
        // Tenta encontrar o item pelo texto
        const itemSelector = `li:has-text("${itemText}"), .dropdown-item:has-text("${itemText}")`;
        // Espera o dropdown abrir e mostrar os itens
        await page.waitForSelector(itemSelector, { timeout: 5000 });
        // Clica no item
        return await clickWithRetry(page, itemSelector);
    }
    catch (e) {
        console.log(`⚠️ Erro ao selecionar item do dropdown: ${e.message}`);
        return false;
    }
}
/**
 * Verifica se há um modal aberto e fecha se necessário
 */
async function closeModalIfExists(page) {
    try {
        // Verifica se há algum modal visível
        const modalVisible = await page.locator('.modal, .modal__dialog, [data-modal="true"]').isVisible();
        if (modalVisible) {
            // Tenta fechar clicando no botão de fechar
            const closeButtons = [
                '.modal__close',
                '.modal-close',
                '.close-button',
                '.modal button:has-text("Fechar")',
                '.modal button:has-text("Cancel")',
                '.modal button:has-text("Cancelar")'
            ];
            for (const buttonSelector of closeButtons) {
                const buttonVisible = await page.locator(buttonSelector).isVisible();
                if (buttonVisible) {
                    await clickWithRetry(page, buttonSelector);
                    await page.waitForTimeout(500);
                    return true;
                }
            }
        }
        return false;
    }
    catch (e) {
        console.log(`⚠️ Erro ao verificar/fechar modal: ${e.message}`);
        return false;
    }
}
//# sourceMappingURL=utils.js.map